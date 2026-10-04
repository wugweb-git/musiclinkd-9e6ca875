import type { SupabaseClient } from "@supabase/supabase-js";
import { sha256Hex } from "@/lib/calendar-feed.functions";
import { PUBLIC_ORIGIN } from "@/lib/site";

/*
 * The calendar feed behind /cal/<token>.ics (queue item 5d, 4 Oct 2026): what a subscribed
 * calendar app polls. Only what both sides already see on the booking page: confirmed bookings
 * with a date (as the requester, or as the place, the service's owner or a manager of the band
 * that offers it) and confirmed or active rentals (as renter or seller). Times are India time.
 * Answered with the service role after the token's hash matches one profile_private row.
 */

type Row = Record<string, unknown>;

const esc = (t: string) =>
  t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** One confirmed booking or rental, as both the feed and the device calendar sync carry it. */
export type CalendarItem = {
  /** "booking-<id>" or "rental-<id>": stable, so an update replaces rather than duplicates. */
  key: string;
  title: string;
  /** Epoch ms. */
  start: number;
  end: number;
  allDay: boolean;
  location: string;
  url: string;
};

/** Raw rows of a profile's confirmed bookings (either side) and confirmed or active rentals. */
async function confirmedRows(db: SupabaseClient, me: string) {
  const [places, services, bands, listings] = await Promise.all([
    db.from("bookables").select("id").eq("owner_profile_id", me),
    db.from("profile_services").select("id").eq("profile_id", me),
    db
      .from("collab_members")
      .select("collab_id")
      .eq("profile_id", me)
      .eq("status", "active")
      .in("role", ["owner", "admin"]),
    db.from("marketplace_listings").select("id").eq("seller_profile_id", me),
  ]);
  const ids = (r: { data: unknown }, k = "id") =>
    ((r.data ?? []) as Row[]).map((x) => String(x[k]));
  const serviceIds = ids(services);
  const bandIds = ids(bands, "collab_id");
  if (bandIds.length) {
    const band = await db.from("profile_services").select("id").in("collab_id", bandIds);
    if (!band.error) serviceIds.push(...ids(band));
  }
  const scope = [
    `requester_profile_id.eq.${me}`,
    ...(ids(places).length ? [`bookable_id.in.(${ids(places).join(",")})`] : []),
    ...(serviceIds.length ? [`service_id.in.(${serviceIds.join(",")})`] : []),
  ].join(",");
  const listingIds = ids(listings);
  const [bookings, rentals] = await Promise.all([
    db
      .from("booking_requests")
      .select("id, session_date, start_time, end_time, hours, purpose, bookable_name")
      .or(scope)
      .eq("status", "confirmed")
      .not("session_date", "is", null),
    db
      .from("rental_bookings")
      .select("id, start_date, end_date, listing:marketplace_listings(title, pickup_location)")
      .or(
        [
          `renter_profile_id.eq.${me}`,
          ...(listingIds.length ? [`listing_id.in.(${listingIds.join(",")})`] : []),
        ].join(","),
      )
      .in("status", ["confirmed", "active"]),
  ]);

  return { bookings: (bookings.data ?? []) as Row[], rentals: (rentals.data ?? []) as Row[] };
}

const IST = 19_800_000;

function bookingItem(b: Row): CalendarItem {
  const date = String(b["session_date"]);
  const start = (b["start_time"] as string | null)?.slice(0, 5);
  const end = (b["end_time"] as string | null)?.slice(0, 5);
  const hours = (b["hours"] as number | null) ?? 1;
  const day = new Date(`${date}T00:00:00+05:30`).getTime();
  let from = day;
  let to = day + 86_400_000;
  if (start) {
    from = new Date(`${date}T${start}:00+05:30`).getTime();
    to = end ? new Date(`${date}T${end}:00+05:30`).getTime() : from + hours * 3_600_000;
    if (to <= from) to += 86_400_000;
  }
  return {
    key: `booking-${String(b["id"])}`,
    title: [b["bookable_name"], b["purpose"]].filter(Boolean).join(" · ") || "Session",
    start: from,
    end: to,
    allDay: !start,
    location: "",
    url: `${PUBLIC_ORIGIN}/booking/confirmed/${String(b["id"])}`,
  };
}

function rentalItem(r: Row): CalendarItem {
  const listing = (r["listing"] as Row | null) ?? null;
  const from = new Date(`${String(r["start_date"])}T00:00:00+05:30`).getTime();
  const to = new Date(`${String(r["end_date"])}T00:00:00+05:30`).getTime() + 86_400_000;
  return {
    key: `rental-${String(r["id"])}`,
    title: `Rental · ${String(listing?.["title"] ?? "Gear")}`,
    start: from,
    end: to,
    allDay: true,
    location: String(listing?.["pickup_location"] ?? ""),
    url: PUBLIC_ORIGIN,
  };
}

/** A profile's calendar items: confirmed bookings and rentals, either side. */
export async function calendarItemsOf(db: SupabaseClient, me: string): Promise<CalendarItem[]> {
  const { bookings, rentals } = await confirmedRows(db, me);
  return [...bookings.map(bookingItem), ...rentals.map(rentalItem)];
}

const icsStamp = (ms: number) =>
  new Date(ms)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
const icsDate = (ms: number) => new Date(ms + IST).toISOString().slice(0, 10).replace(/-/g, "");

/** The feed for a token, or null when no link has that token (or it was replaced). */
export async function calendarFeed(token: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as unknown as SupabaseClient;
  const { data: owner } = await db
    .from("profile_private")
    .select("id")
    .eq("calendar_feed_token_hash", await sha256Hex(token))
    .maybeSingle();
  const me = (owner as { id: string } | null)?.id;
  if (!me) return null;

  const stamp = icsStamp(Date.now());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MusicLinkd//Bookings//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:MusicLinkd",
    "X-WR-TIMEZONE:Asia/Kolkata",
    ...(await calendarItemsOf(db, me)).flatMap((i) => [
      "BEGIN:VEVENT",
      `UID:${i.key}@musiclinkd`,
      `DTSTAMP:${stamp}`,
      ...(i.allDay
        ? [`DTSTART;VALUE=DATE:${icsDate(i.start)}`, `DTEND;VALUE=DATE:${icsDate(i.end)}`]
        : [`DTSTART:${icsStamp(i.start)}`, `DTEND:${icsStamp(i.end)}`]),
      `SUMMARY:${esc(i.title)}`,
      ...(i.location ? [`LOCATION:${esc(i.location)}`] : []),
      `URL:${i.url}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}
