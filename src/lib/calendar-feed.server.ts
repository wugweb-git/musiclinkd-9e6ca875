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

/** "20261005T043000Z" from a date and an India-time "HH:MM". */
function utc(date: string, time: string, addMs = 0) {
  const ms = new Date(`${date}T${time}:00+05:30`).getTime() + addMs;
  return new Date(ms)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

const ymd = (date: string, addDays = 0) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + addDays);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
};

function bookingEvent(b: Row, stamp: string): string[] {
  const date = String(b["session_date"]);
  const start = (b["start_time"] as string | null)?.slice(0, 5);
  const end = (b["end_time"] as string | null)?.slice(0, 5);
  const hours = (b["hours"] as number | null) ?? 1;
  const title = [b["bookable_name"], b["purpose"]].filter(Boolean).join(" · ") || "Session";
  let when: string[];
  if (!start) {
    when = [`DTSTART;VALUE=DATE:${ymd(date)}`, `DTEND;VALUE=DATE:${ymd(date, 1)}`];
  } else {
    const from = utc(date, start);
    let to = end ? utc(date, end) : utc(date, start, hours * 3_600_000);
    if (end && end <= start) to = utc(date, end, 86_400_000);
    when = [`DTSTART:${from}`, `DTEND:${to}`];
  }
  return [
    "BEGIN:VEVENT",
    `UID:booking-${String(b["id"])}@musiclinkd`,
    `DTSTAMP:${stamp}`,
    ...when,
    `SUMMARY:${esc(String(title))}`,
    `URL:${PUBLIC_ORIGIN}/booking/confirmed/${String(b["id"])}`,
    "END:VEVENT",
  ];
}

function rentalEvent(r: Row, stamp: string): string[] {
  const listing = (r["listing"] as Row | null) ?? null;
  return [
    "BEGIN:VEVENT",
    `UID:rental-${String(r["id"])}@musiclinkd`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd(String(r["start_date"]))}`,
    `DTEND;VALUE=DATE:${ymd(String(r["end_date"]), 1)}`,
    `SUMMARY:${esc(`Rental · ${String(listing?.["title"] ?? "Gear")}`)}`,
    ...(listing?.["pickup_location"]
      ? [`LOCATION:${esc(String(listing["pickup_location"]))}`]
      : []),
    "END:VEVENT",
  ];
}

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

  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MusicLinkd//Bookings//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:MusicLinkd",
    "X-WR-TIMEZONE:Asia/Kolkata",
    ...((bookings.data ?? []) as Row[]).flatMap((b) => bookingEvent(b, stamp)),
    ...((rentals.data ?? []) as Row[]).flatMap((r) => rentalEvent(r, stamp)),
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}
