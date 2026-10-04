import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anonClient, type TaxonomyLabels } from "@/lib/portfolio.functions";

/*
 * Read-only catalog content from the database: studios, opportunities and marketplace listings,
 * each with the owner's public profile fields. Screens combine these with their static demo data.
 * Money is integer paise; *_note holds price text that is not an amount ("Royalties Split").
 * Schema: supabase/migrations/20260914180000_catalog.sql.
 */

export type OwnerSummary = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  is_verified: boolean;
};

/**
 * A seller's profile with its public standing. rating and review_count are kept by the database
 * from reviews, followers_count from follows (20260918240000_missing_data.sql); absent before then.
 */
export type SellerOwnerSummary = OwnerSummary & {
  rating?: number | null;
  review_count?: number;
  followers_count?: number;
};

/** A studio's extra, priced per unit when it has a price ("Engineer", ₹800, "hour"). */
export type BookableAddOn = { name: string; price_paise: number | null; unit: string | null };

export type BookableRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  location: string | null;
  hourly_rate_paise: number | null;
  rating: number | null;
  review_count: number;
  verified_gold: boolean;
  console_type: string | null;
  amenities: string[];
  cancellation_policy: string | null;
  operating_hours: string | null;
  image_url: string | null;
  images: string[];
  /** How soon the studio usually replies ("within 2 hours"); null before the column exists. */
  response_time?: string | null;
  add_ons?: BookableAddOn[];
  owner: SellerOwnerSummary | null;
  equipment: {
    id: string;
    name: string;
    category: string | null;
    quantity: number | null;
    included: boolean;
    sort_order: number;
  }[];
  reviews: {
    id: string;
    author_name: string;
    rating: number;
    body: string;
    created_at: string;
    author_org?: string | null;
    context?: string | null;
    response?: string | null;
    tags?: string[];
  }[];
};

export type OpportunityRow = {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  work_mode?: string | null;
  date_window?: string | null;
  requirements?: string[];
  role_required: string | null;
  genres: string[];
  budget_paise: number | null;
  budget_unit: string | null;
  budget_note: string | null;
  collaboration_type: string | null;
  location: string | null;
  status: "open" | "closed" | "filled";
  applicant_count: number;
  created_at: string;
  creator: OwnerSummary | null;
};

export type ListingRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  item_category: string | null;
  item_category_kind: "equipment" | "instrument" | null;
  condition: "new" | "like_new" | "used" | null;
  price_paise: number | null;
  price_unit: string | null;
  price_note: string | null;
  image_url: string | null;
  created_at: string;
  seller_name: string | null;
  /** Where a rental is picked up, when the owner said. */
  video_url?: string | null;
  photos?: string[] | null;
  pickup_location: string | null;
  brand: string | null;
  model: string | null;
  listing_description: string | null;
  specs: { label: string; value: string }[] | null;
  included: string[] | null;
  // Rentals only.
  weekly_price_paise: number | null;
  monthly_price_paise: number | null;
  deposit_paise: number | null;
  quantity_available: number | null;
  pickup_available: boolean | null;
  delivery_available: boolean | null;
  delivery_fee_paise: number | null;
  delivery_note: string | null;
  min_days: number | null;
  max_days: number | null;
  notice_period: string | null;
  seller: SellerOwnerSummary | null;
};

const OWNER = "id, username, display_name, avatar_url, city, is_verified, visibility";

/** Leaves out anything whose owner has deactivated their account. */
function fromLiveOwners<T>(rows: T[], owner: "seller" | "creator"): T[] {
  return rows.filter(
    (r) =>
      (r as Record<string, { visibility?: string } | null>)[owner]?.visibility !== "deactivated",
  );
}
const SELLER = `${OWNER}, rating, review_count, followers_count`;
const STUDIO_FIELDS = `id, slug, name, description, location, hourly_rate_paise, rating, review_count, verified_gold,
  console_type, amenities, cancellation_policy, operating_hours, image_url, images,
  owner:profiles!studios_owner_profile_id_fkey(${SELLER}),
  equipment:bookable_equipment(id, name, category, quantity, included, sort_order)`;
const STUDIO = `${STUDIO_FIELDS}, response_time, add_ons,
  reviews(id, author_name, author_org, context, response, rating, body, created_at, tags)`;
/** The studio read before 20260918240000_missing_data.sql, while its columns are not there yet. */
const STUDIO_BEFORE = `${STUDIO_FIELDS},
  reviews(id, author_name, rating, body, created_at)`;
const OPPORTUNITY = `id, slug, title, role_required, genres, budget_paise, budget_unit, budget_note, summary, work_mode, date_window, requirements,
  collaboration_type, location, status, applicant_count, created_at,
  creator:profiles!opportunities_creator_profile_id_fkey(${OWNER})`;
const LISTING_FIELDS = `id, slug, title, category, item_category, item_category_kind, condition, price_paise,
  price_unit, price_note, image_url, created_at, seller_name, pickup_location, brand, model,
  listing_description, specs, included, weekly_price_paise, monthly_price_paise, deposit_paise,
  quantity_available, pickup_available, delivery_available, delivery_fee_paise, delivery_note,
  min_days, max_days, notice_period, photos, video_url`;
const LISTING = `${LISTING_FIELDS},
  seller:profiles!marketplace_listings_seller_profile_id_fkey(${SELLER})`;
/** The seller without the standing columns, while 20260918240000_missing_data.sql is not applied. */
const LISTING_BEFORE = `${LISTING_FIELDS},
  seller:profiles!marketplace_listings_seller_profile_id_fkey(${OWNER})`;

type Result = { data: unknown; error: { message: string } | null };

/** Runs the read with the full select, and again with the earlier one if that one errors. */
async function withFallback(run: (select: string) => PromiseLike<Result>, selects: string[]) {
  let result: Result = { data: null, error: { message: "Nothing to read." } };
  for (const select of selects) {
    result = await run(select);
    if (!result.error) break;
  }
  return result;
}

/**
 * Public studio reads skip archived studios (a deleted business archives its studio; see
 * 20260921200000_partials_complete.sql). Before that column exists the read runs unfiltered.
 */
async function liveOnly(run: (live: boolean) => PromiseLike<Result>) {
  const result = await run(true);
  if (!result.error || !result.error.message.includes("archived_at")) return result;
  return run(false);
}

type Sorted = { sort_order?: number };
const bySort = (a: Sorted, b: Sorted) => (a.sort_order ?? 0) - (b.sort_order ?? 0);

function shapeStudio(raw: BookableRow): BookableRow {
  return {
    ...raw,
    rating: raw.rating == null ? null : Number(raw.rating),
    add_ons: Array.isArray(raw.add_ons) ? raw.add_ons : [],
    equipment: [...(raw.equipment ?? [])].sort(bySort),
    reviews: (raw.reviews ?? [])
      .map((r) => ({ ...r, rating: Number(r.rating), tags: r.tags ?? [] }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
  };
}

export const listBookables = createServerFn({ method: "GET" }).handler(async () => {
  const client = await anonClient();
  const { data, error } = await withFallback(
    (select) =>
      liveOnly((live) => {
        const query = client.from("bookables").select(select);
        return (live ? query.is("archived_at" as never, null) : query).order("rating", {
          ascending: false,
          // A studio with no reviews yet goes after the rated ones, not before them.
          nullsFirst: false,
        });
      }),
    [STUDIO, STUDIO_BEFORE],
  );
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as BookableRow[]).map(shapeStudio);
});

export const getBookableBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const client = await anonClient();
    const { data: row, error } = await withFallback(
      (select) =>
        liveOnly((live) => {
          const query = client.from("bookables").select(select).eq("slug", data.slug);
          return (live ? query.is("archived_at" as never, null) : query).maybeSingle();
        }),
      [STUDIO, STUDIO_BEFORE],
    );
    if (error) throw new Error(error.message);
    return row ? shapeStudio(row as unknown as BookableRow) : null;
  });

export const listOpportunities = createServerFn({ method: "GET" }).handler(async () => {
  const client = await anonClient();
  const { data, error } = await client
    .from("opportunities")
    .select(OPPORTUNITY)
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return fromLiveOwners((data ?? []) as unknown as OpportunityRow[], "creator");
});

/** Opportunities the signed-in user created, every status, newest first. */
export const listMyOpportunities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const client = context.supabase as unknown as SupabaseClient;
    const { data, error } = await client
      .from("opportunities")
      .select(OPPORTUNITY)
      .eq("creator_profile_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as OpportunityRow[];
  });

export const getOpportunityRow = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const client = await anonClient();
    const { data: row, error } = await client
      .from("opportunities")
      .select(OPPORTUNITY)
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row ?? null) as unknown as OpportunityRow | null;
  });

/** The poster closes, fills or reopens their own listing. There is no "paused" status in the schema. */
export const setOpportunityStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), status: z.enum(["open", "closed", "filled"]) }).parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const client = context.supabase as unknown as SupabaseClient;
    const { error } = await client
      .from("opportunities")
      .update({ status: data.status } as never)
      .eq("id", data.id)
      .eq("creator_profile_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * How many listings a seller has open for browsing, goods and services alike, counted by the
 * database rather than from a list that leaves services out (the listing page's own catalog).
 */
export const countSellerListings = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ profileId: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<number> => {
    const client = await anonClient();
    const base = () =>
      client
        .from("marketplace_listings")
        .select("id", { count: "exact", head: true })
        .eq("seller_profile_id", data.profileId);
    const browsing = await base().not("listing_status", "in", "(unavailable,archived)");
    // Before listing_status exists, every listing is open.
    const { count, error } = browsing.error ? await base() : browsing;
    if (error) throw new Error(error.message);
    return count ?? 0;
  });

/**
 * Every listing open for browsing, newest first. An owner can take a listing out of browsing
 * (listing_status unavailable or archived, 20260918230000_section_sources.sql); before that column
 * exists every listing is read as before.
 */
export const listListings = createServerFn({ method: "GET" }).handler(async () => {
  const client = await anonClient();
  const browsing = await withFallback(
    (select) =>
      client
        .from("marketplace_listings")
        .select(select)
        .not("listing_status", "in", "(unavailable,archived)")
        .order("created_at", { ascending: false }),
    [LISTING, LISTING_BEFORE],
  );
  if (!browsing.error)
    return fromLiveOwners((browsing.data ?? []) as unknown as ListingRow[], "seller");
  const { data, error } = await withFallback(
    (select) =>
      client.from("marketplace_listings").select(select).order("created_at", { ascending: false }),
    [LISTING, LISTING_BEFORE],
  );
  if (error) throw new Error(error.message);
  return fromLiveOwners((data ?? []) as unknown as ListingRow[], "seller");
});

/** Listings the signed-in user is selling, newest first. */
export const listMyListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const client = context.supabase as unknown as SupabaseClient;
    const { data, error } = await withFallback(
      (select) =>
        client
          .from("marketplace_listings")
          .select(select)
          .eq("seller_profile_id", context.userId)
          .order("created_at", { ascending: false }),
      [LISTING, LISTING_BEFORE],
    );
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as ListingRow[];
  });

export const getListing = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const client = await anonClient();
    const { data: row, error } = await withFallback(
      (select) =>
        client.from("marketplace_listings").select(select).eq("slug", data.slug).maybeSingle(),
      [LISTING, LISTING_BEFORE],
    );
    if (error) throw new Error(error.message);
    const listing = (row ?? null) as unknown as ListingRow | null;
    return listing && fromLiveOwners([listing], "seller").length ? listing : null;
  });

/** One seller's public listings (any category), newest first — for their profile page. */
export const getSellerListings = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ sellerProfileId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const client = await anonClient();
    const { data: rows, error } = await withFallback(
      (select) =>
        client
          .from("marketplace_listings")
          .select(select)
          .eq("seller_profile_id", data.sellerProfileId)
          .order("created_at", { ascending: false }),
      [LISTING, LISTING_BEFORE],
    );
    if (error) throw new Error(error.message);
    return fromLiveOwners((rows ?? []) as unknown as ListingRow[], "seller");
  });

const listingSlug = (title: string) =>
  `${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80)}-${Math.random().toString(36).slice(2, 7)}`;

/** The fields a listing is written with, on create and on edit. */
const listingInput = z.object({
  category: z.enum(["gear_sale", "gear_rental", "creative_services"]),
  itemCategoryKind: z.enum(["instrument", "equipment"]).optional(),
  itemCategory: z.string().max(60).optional(),
  title: z.string().trim().min(1).max(200),
  brand: z.string().trim().max(100).optional(),
  model: z.string().trim().max(100).optional(),
  description: z.string().trim().max(2000).optional(),
  pricePaise: z.number().int().min(0),
  priceUnit: z.string().max(20).optional(),
  condition: z.enum(["new", "like_new", "used"]).optional(),
  // Rentals only.
  weeklyPricePaise: z.number().int().min(0).optional(),
  monthlyPricePaise: z.number().int().min(0).optional(),
  depositPaise: z.number().int().min(0).optional(),
  pickupAvailable: z.boolean().optional(),
  deliveryAvailable: z.boolean().optional(),
  minDays: z.number().int().min(1).optional(),
  maxDays: z.number().int().min(1).optional(),
  noticePeriod: z.string().max(60).optional(),
  // "City PIN", as every place is stored (src/lib/place.ts).
  pickupLocation: z.string().trim().max(120).optional(),
  videoUrl: z.string().trim().url().max(500).optional(),
  // Uploaded photo URLs in order; the first is the cover.
  photos: z.array(z.string().url().max(1000)).max(5).optional(),
  included: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  specs: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(40),
        value: z.string().trim().min(1).max(80),
      }),
    )
    .max(12)
    .optional(),
});

type ListingInput = z.infer<typeof listingInput>;

/** The columns listingInput writes, shared by create and edit. */
function listingColumns(data: ListingInput) {
  return {
    title: data.title,
    category: data.category,
    item_category_kind: data.itemCategoryKind ?? null,
    item_category: data.itemCategory ?? null,
    brand: data.brand ?? null,
    model: data.model ?? null,
    condition: data.condition ?? null,
    price_paise: data.pricePaise,
    price_unit: data.priceUnit ?? null,
    listing_description: data.description ?? null,
    ...(data.weeklyPricePaise != null ? { weekly_price_paise: data.weeklyPricePaise } : {}),
    ...(data.monthlyPricePaise != null ? { monthly_price_paise: data.monthlyPricePaise } : {}),
    ...(data.depositPaise != null ? { deposit_paise: data.depositPaise } : {}),
    ...(data.pickupAvailable != null ? { pickup_available: data.pickupAvailable } : {}),
    ...(data.deliveryAvailable != null ? { delivery_available: data.deliveryAvailable } : {}),
    ...(data.minDays != null ? { min_days: data.minDays } : {}),
    ...(data.maxDays != null ? { max_days: data.maxDays } : {}),
    ...(data.noticePeriod ? { notice_period: data.noticePeriod } : {}),
    ...(data.pickupLocation ? { pickup_location: data.pickupLocation } : {}),
    video_url: data.videoUrl ?? null,
    ...(data.photos?.length ? { photos: data.photos, image_url: data.photos[0] } : {}),
    ...(data.included ? { included: data.included } : {}),
    ...(data.specs ? { specs: data.specs } : {}),
  };
}

/** Sell, rent out or offer a service. "Studio" isn't here — a studio is its own richer entity. */
export const createListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => listingInput.parse(d))
  .handler(async ({ context, data }): Promise<{ slug: string }> => {
    const client = context.supabase as unknown as SupabaseClient;
    const slug = listingSlug(data.title);
    const { error } = await client.from("marketplace_listings").insert({
      slug,
      seller_profile_id: context.userId,
      ...listingColumns(data),
    } as never);
    if (error) throw new Error(error.message);
    return { slug };
  });

/** What the seller's own listings screen and the edit flow read: every status, not just live. */
export type MyListing = {
  id: string;
  slug: string;
  title: string;
  category: string;
  item_category: string | null;
  item_category_kind: "instrument" | "equipment" | null;
  condition: "new" | "like_new" | "used" | null;
  price_paise: number | null;
  price_unit: string | null;
  image_url: string | null;
  brand: string | null;
  model: string | null;
  listing_description: string | null;
  pickup_location: string | null;
  pickup_available: boolean | null;
  delivery_available: boolean | null;
  video_url: string | null;
  photos: string[] | null;
  included: string[] | null;
  specs: { label: string; value: string }[] | null;
  listing_status: string | null;
  created_at: string;
};

export const listMyManagedListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyListing[]> => {
    const client = context.supabase as unknown as SupabaseClient;
    const { data, error } = await client
      .from("marketplace_listings")
      .select(
        "id, slug, title, category, item_category, item_category_kind, condition, price_paise, price_unit, image_url, brand, model, listing_description, pickup_location, pickup_available, delivery_available, video_url, photos, included, specs, listing_status, created_at",
      )
      .eq("seller_profile_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as MyListing[];
  });

/** The seller edits one of their own listings. */
export const updateListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => listingInput.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ slug: string }> => {
    const client = context.supabase as unknown as SupabaseClient;
    const { data: row, error } = await client
      .from("marketplace_listings")
      .update(listingColumns(data) as never)
      .eq("id", data.id)
      .eq("seller_profile_id", context.userId)
      .select("slug")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Listing not found");
    return { slug: (row as { slug: string }).slug };
  });

/**
 * The seller deletes one of their own listings. Its offers and bookings go with it (the foreign
 * keys cascade), so a listing someone has a confirmed or running rental on can't be deleted —
 * unpublish it instead.
 */
export const deleteListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const client = context.supabase as unknown as SupabaseClient;
    const { count: live } = await client
      .from("rental_bookings")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", data.id)
      .in("status", ["confirmed", "active"]);
    if (live) throw new Error("booked");
    const { error, count } = await client
      .from("marketplace_listings")
      .delete({ count: "exact" })
      .eq("id", data.id)
      .eq("seller_profile_id", context.userId);
    if (error) throw new Error(error.message);
    if (!count) throw new Error("Listing not found");
    return { deleted: true };
  });

/** Label for a taxonomy slug, or the slug when the label is not loaded. */
export function taxonomyLabel(labels: TaxonomyLabels | undefined, category: string, slug: string) {
  return labels?.[category]?.[slug] ?? slug;
}
