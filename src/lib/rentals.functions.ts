import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anonClient } from "@/lib/portfolio.functions";
import type { Equipment, Provider, RentalStatus } from "@/data/rentals";

/*
 * Renting equipment: a request against one marketplace_listings row (category gear_rental),
 * moved along by the listing's own seller. One renter can have several bookings against the
 * same listing (different date ranges), unlike opportunity_applications' one-per-person rule.
 * Schema: supabase/migrations/20260918100000_rental_bookings.sql
 */

const db = (client: unknown) => client as unknown as SupabaseClient;

/** DB status (snake_case, matches the CHECK constraint) → the frontend's RentalStatus label. */
const STATUS_LABEL: Record<string, RentalStatus> = {
  requested: "Requested",
  offer_sent: "Offer sent",
  confirmed: "Confirmed",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
  declined: "Declined",
};
const STATUS_DB: Record<RentalStatus, string> = {
  Requested: "requested",
  "Offer sent": "offer_sent",
  Confirmed: "confirmed",
  Active: "active",
  Completed: "completed",
  Cancelled: "cancelled",
  Declined: "declined",
};

export type RentalBookingRow = {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  quantity: number;
  fulfilment: string;
  total_paise: number | null;
  deposit_paise: number | null;
  note: string | null;
  created_at: string;
  listing: {
    id: string;
    slug: string;
    title: string;
    image_url: string | null;
    seller_profile_id: string;
  } | null;
};

export type MyRentalBooking = {
  id: string;
  status: RentalStatus;
  startDate: string;
  endDate: string;
  quantity: number;
  fulfilment: string;
  totalPaise: number | null;
  depositPaise: number | null;
  note: string | null;
  listingId: string | null;
  listingSlug: string | null;
  listingTitle: string | null;
  listingPhoto: string | null;
};

function toMyBooking(row: RentalBookingRow): MyRentalBooking {
  return {
    id: row.id,
    status: STATUS_LABEL[row.status] ?? "Requested",
    startDate: row.start_date,
    endDate: row.end_date,
    quantity: row.quantity,
    fulfilment: row.fulfilment,
    totalPaise: row.total_paise,
    depositPaise: row.deposit_paise,
    note: row.note,
    listingId: row.listing?.slug ?? null,
    listingSlug: row.listing?.slug ?? null,
    listingTitle: row.listing?.title ?? null,
    listingPhoto: row.listing?.image_url ?? null,
  };
}

const BOOKING_SELECT =
  "id, status, start_date, end_date, quantity, fulfilment, total_paise, deposit_paise, note, created_at, listing:marketplace_listings(id, slug, title, image_url, seller_profile_id)";

/** The rental screens address a listing by its slug — resolve to the real row id for the FK. */
async function listingIdFor(client: SupabaseClient, slug: string) {
  const { data, error } = await client
    .from("marketplace_listings")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = data as { id: string } | null;
  if (!row) throw new Error("That listing is not available to rent.");
  return row.id;
}

/** Request a booking against a listing. */
export const requestRentalBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        listingSlug: z.string().min(1).max(120),
        startDate: z.string().min(1),
        endDate: z.string().min(1),
        quantity: z.number().int().min(1).max(99).optional(),
        fulfilment: z.enum(["pickup", "provider_delivery", "courier"]).optional(),
        note: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const client = db(context.supabase);
    const listingId = await listingIdFor(client, data.listingSlug);
    const { data: row, error } = await client
      .from("rental_bookings")
      .insert({
        listing_id: listingId,
        renter_profile_id: context.userId,
        start_date: data.startDate,
        end_date: data.endDate,
        quantity: data.quantity ?? 1,
        fulfilment: data.fulfilment ?? "pickup",
        note: data.note ?? null,
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row as { id: string };
  });

/** Everything this account has requested to rent, newest first. */
export const listMyRentalBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyRentalBooking[]> => {
    const { data, error } = await db(context.supabase)
      .from("rental_bookings")
      .select(BOOKING_SELECT)
      .eq("renter_profile_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as RentalBookingRow[]).map(toMyBooking);
  });

/** One booking this account made, for a detail screen. */
export const getMyRentalBooking = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<MyRentalBooking | null> => {
    const { data: row, error } = await db(context.supabase)
      .from("rental_bookings")
      .select(BOOKING_SELECT)
      .eq("id", data.id)
      .eq("renter_profile_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? toMyBooking(row as unknown as RentalBookingRow) : null;
  });

/** The requests against one of this account's own listings. */
export const listIncomingRentalRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ listingSlug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ context, data }): Promise<MyRentalBooking[]> => {
    const client = db(context.supabase);
    const listingId = await listingIdFor(client, data.listingSlug);
    const { data: rows, error } = await client
      .from("rental_bookings")
      .select(BOOKING_SELECT)
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((rows ?? []) as unknown as RentalBookingRow[]).map(toMyBooking);
  });

/** Requests against every listing this account owns, newest first — the owner's inbox. */
export const listMyIncomingRentalRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyRentalBooking[]> => {
    const { data: rows, error } = await db(context.supabase)
      .from("rental_bookings")
      .select(BOOKING_SELECT)
      .eq("listing.seller_profile_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((rows ?? []) as unknown as RentalBookingRow[]).map(toMyBooking);
  });

/** The listing owner moves a request along: offer sent, confirmed, active, completed, declined. */
export const setRentalBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["offer_sent", "confirmed", "active", "completed", "declined"]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("rental_bookings")
      .update({ status: data.status } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { status: STATUS_LABEL[data.status] };
  });

/** The renter cancels their own booking. The row stays, so the owner sees what happened. */
export const cancelRentalBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("rental_bookings")
      .update({ status: "cancelled" } as never)
      .eq("id", data.id)
      .eq("renter_profile_id", context.userId);
    if (error) throw new Error(error.message);
    return { status: "Cancelled" as const };
  });

export { STATUS_DB as rentalStatusToDb };

/*
 * A real listing and its provider, for the request wizard (rent/request.$id.tsx). RentalCalendar,
 * FulfilmentPicker and PriceBreakdown (rental.tsx) all require a fully-populated Equipment object
 * — see 20260918110000_rental_equipment_fields.sql for the columns that complete it.
 *
 * Provider is deliberately NOT the full data/rentals.ts Provider type: badges, responseRate,
 * responseTime and years-as-a-provider aren't tracked anywhere (not just for rentals — nowhere in
 * the schema), and this doesn't fabricate them. rating/reviews/completedRentals ARE real, computed
 * from the reviews and rental_bookings tables rather than stored redundantly. Whether the provider
 * is a business or talent account is read from whether a profile_business row exists for them —
 * the same signal profile-groups.functions.ts uses ("an account is a business when it has a
 * profile_business row").
 */

const RENTAL_LISTING = `id, slug, title, item_category, condition, price_paise, price_unit, price_note,
  image_url, brand, model, weekly_price_paise, monthly_price_paise, deposit_paise,
  quantity_available, pickup_available, delivery_available, delivery_fee_paise, delivery_note,
  pickup_location, min_days, max_days, notice_period, unavailable_dates, listing_description,
  specs, included, seller_profile_id`;

type RentalListingRow = {
  id: string;
  slug: string;
  title: string;
  item_category: string | null;
  condition: "new" | "like_new" | "used" | null;
  price_paise: number | null;
  price_unit: string | null;
  price_note: string | null;
  image_url: string | null;
  brand: string | null;
  model: string | null;
  weekly_price_paise: number | null;
  monthly_price_paise: number | null;
  deposit_paise: number | null;
  quantity_available: number;
  pickup_available: boolean;
  delivery_available: boolean;
  delivery_fee_paise: number | null;
  delivery_note: string | null;
  pickup_location: string | null;
  min_days: number;
  max_days: number;
  notice_period: string | null;
  unavailable_dates: string[];
  listing_description: string | null;
  specs: { label: string; value: string }[] | null;
  included: string[];
  seller_profile_id: string;
};

const CONDITION_LABEL: Record<string, Equipment["condition"]> = {
  new: "New",
  like_new: "Like New",
  used: "Used",
};

function equipmentFromRow(row: RentalListingRow): Equipment {
  return {
    id: row.slug,
    name: row.title,
    brand: row.brand ?? "",
    model: row.model ?? "",
    category: "other",
    subcategory: row.item_category ?? "",
    condition: (row.condition && CONDITION_LABEL[row.condition]) || "Good",
    daily: row.price_unit === "day" ? Math.round((row.price_paise ?? 0) / 100) : 0,
    weekly: Math.round((row.weekly_price_paise ?? 0) / 100),
    monthly: Math.round((row.monthly_price_paise ?? 0) / 100),
    deposit: Math.round((row.deposit_paise ?? 0) / 100),
    quantity: row.quantity_available,
    location: row.pickup_location ?? "",
    distance: "",
    availability: "Available",
    unavailableDates: row.unavailable_dates,
    minDays: row.min_days,
    maxDays: row.max_days,
    noticePeriod: row.notice_period ?? "None",
    pickup: row.pickup_available,
    delivery: row.delivery_available,
    ...(row.delivery_fee_paise != null
      ? { deliveryFee: Math.round(row.delivery_fee_paise / 100) }
      : {}),
    ...(row.delivery_note ? { deliveryNote: row.delivery_note } : {}),
    listingStatus: "Active",
    // Not tracked per-listing: honest zeros, not fabricated numbers.
    rentals: 0,
    saves: 0,
    views: 0,
    enquiries: 0,
    photos: row.image_url ? [row.image_url] : [],
    description: row.listing_description ?? "",
    specs: row.specs ?? [],
    included: row.included,
    providerId: row.seller_profile_id,
  };
}

/** A real listing, mapped to the same Equipment shape the request wizard already renders. */
export const getRentalListingDetail = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }): Promise<Equipment | null> => {
    const client = await anonClient();
    const { data: row, error } = await client
      .from("marketplace_listings")
      .select(RENTAL_LISTING)
      .eq("slug", data.slug)
      .eq("category", "gear_rental")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? equipmentFromRow(row as unknown as RentalListingRow) : null;
  });

/** Real, not the full seed Provider — see the file comment above for exactly what's omitted. */
export type RealProvider = Pick<Provider, "id" | "name" | "location" | "verified" | "photo"> & {
  role: string;
  bio: string;
  isBusiness: boolean;
  rating?: number;
  reviews?: number;
  completedRentals: number;
};

export const getRentalProvider = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ profileId: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<RealProvider | null> => {
    const client = await anonClient();
    const [profileRes, businessRes, reviewsRes, completedRes] = await Promise.all([
      client
        .from("profiles")
        .select("id, display_name, headline, bio, city, avatar_url, is_verified")
        .eq("id", data.profileId)
        .maybeSingle(),
      client
        .from("profile_business")
        .select("profile_id")
        .eq("profile_id", data.profileId)
        .maybeSingle(),
      client.from("reviews").select("rating").eq("target_profile_id", data.profileId),
      client
        .from("rental_bookings")
        .select("id, listing:marketplace_listings!inner(seller_profile_id)")
        .eq("status", "completed")
        .eq("listing.seller_profile_id", data.profileId),
    ]);
    if (profileRes.error) throw new Error(profileRes.error.message);
    const profile = profileRes.data as {
      id: string;
      display_name: string | null;
      headline: string | null;
      bio: string | null;
      city: string | null;
      avatar_url: string | null;
      is_verified: boolean;
    } | null;
    if (!profile) return null;
    const reviewRows = (reviewsRes.data ?? []) as { rating: number }[];
    const rating = reviewRows.length
      ? Math.round(
          (reviewRows.reduce((s, r) => s + Number(r.rating), 0) / reviewRows.length) * 10,
        ) / 10
      : undefined;
    return {
      id: profile.id,
      name: profile.display_name ?? "MusicLinkd member",
      role: profile.headline ?? "",
      bio: profile.bio ?? "",
      location: profile.city ?? "",
      verified: profile.is_verified,
      photo: profile.avatar_url ?? "",
      isBusiness: Boolean(businessRes.data),
      ...(rating != null ? { rating } : {}),
      ...(reviewRows.length ? { reviews: reviewRows.length } : {}),
      completedRentals: (completedRes.data ?? []).length,
    };
  });

/*
 * How often each rental is booked, for "Popular rentals". rental_bookings is readable only by the
 * renter and the owner, so the count comes from a database function that returns nothing else.
 * Schema: supabase/migrations/20260918230000_section_sources.sql
 */
export const getRentalBookingCounts = createServerFn({ method: "GET" }).handler(
  async (): Promise<Record<string, number>> => {
    const client = await anonClient();
    const rpc = client.rpc as unknown as (fn: string) => Promise<{
      data: { listing_id: string; bookings: number }[] | null;
      error: { message: string } | null;
    }>;
    const { data, error } = await rpc.call(client, "rental_booking_counts");
    if (error) return {};
    return Object.fromEntries((data ?? []).map((r) => [r.listing_id, Number(r.bookings)]));
  },
);

/** Where one of the owner's own rental listings stands, for the My listings buckets. */
export type ListingStanding = {
  /** What the owner set: active, unavailable or archived. */
  stored: string;
  /** Rented right now: a booking is active. */
  rented: boolean;
  /** Promised to someone: a booking is confirmed. */
  reserved: boolean;
  /** Rentals of this listing that have finished. */
  completed: number;
};

/**
 * The owner's rental listings' standing, keyed by row id. Currently Rented and Reserved are read
 * from the listing's bookings, since that is what actually happened; Unavailable and Archived are
 * the owner's own choice (marketplace_listings.listing_status). Before that column exists every
 * listing reads as active.
 */
export const listMyListingStandings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Record<string, ListingStanding>> => {
    const client = db(context.supabase);
    const [statusRes, bookingRes] = await Promise.all([
      client
        .from("marketplace_listings")
        .select("id, listing_status")
        .eq("seller_profile_id", context.userId),
      client
        .from("rental_bookings")
        .select("status, listing:marketplace_listings!inner(id, seller_profile_id)")
        .eq("listing.seller_profile_id", context.userId)
        .in("status", ["confirmed", "active", "completed"]),
    ]);
    const standings: Record<string, ListingStanding> = {};
    const of = (id: string) =>
      (standings[id] ??= { stored: "active", rented: false, reserved: false, completed: 0 });
    if (!statusRes.error) {
      for (const r of (statusRes.data ?? []) as { id: string; listing_status: string | null }[]) {
        of(r.id).stored = r.listing_status ?? "active";
      }
    }
    if (bookingRes.error) throw new Error(bookingRes.error.message);
    for (const b of (bookingRes.data ?? []) as unknown as {
      status: string;
      listing: { id: string } | null;
    }[]) {
      if (!b.listing) continue;
      const s = of(b.listing.id);
      if (b.status === "active") s.rented = true;
      else if (b.status === "confirmed") s.reserved = true;
      else s.completed += 1;
    }
    return standings;
  });

/** The owner takes a listing out of browsing (unavailable, archived) or puts it back (active). */
export const setMyListingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["active", "unavailable", "archived"]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("marketplace_listings")
      .update({ listing_status: data.status } as never)
      .eq("id", data.id)
      .eq("seller_profile_id", context.userId);
    if (error) throw new Error(error.message);
    return { status: data.status };
  });
