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
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  is_verified: boolean;
};

export type StudioRow = {
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
  services: string[];
  amenities: string[];
  cancellation_policy: string | null;
  operating_hours: string | null;
  image_url: string | null;
  images: string[];
  owner: OwnerSummary | null;
  rooms: {
    id: string;
    name: string;
    capacity: number | null;
    hourly_rate_paise: number | null;
    amenities: string[];
    sort_order: number;
  }[];
  equipment: {
    id: string;
    name: string;
    category: string | null;
    quantity: number | null;
    included: boolean;
    sort_order: number;
  }[];
  reviews: { id: string; author_name: string; rating: number; body: string; created_at: string }[];
};

export type OpportunityRow = {
  id: string;
  slug: string;
  title: string;
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
  seller: OwnerSummary | null;
};

const OWNER = "username, display_name, avatar_url, city, is_verified";
const STUDIO = `id, slug, name, description, location, hourly_rate_paise, rating, review_count, verified_gold,
  console_type, services, amenities, cancellation_policy, operating_hours, image_url, images,
  owner:profiles!studios_owner_profile_id_fkey(${OWNER}),
  rooms:studio_rooms(id, name, capacity, hourly_rate_paise, amenities, sort_order),
  equipment:studio_equipment(id, name, category, quantity, included, sort_order),
  reviews(id, author_name, rating, body, created_at)`;
const OPPORTUNITY = `id, slug, title, role_required, genres, budget_paise, budget_unit, budget_note,
  collaboration_type, location, status, applicant_count, created_at,
  creator:profiles!opportunities_creator_profile_id_fkey(${OWNER})`;
const LISTING = `id, slug, title, category, item_category, item_category_kind, condition, price_paise,
  price_unit, price_note, image_url, created_at, seller_name,
  seller:profiles!marketplace_listings_seller_profile_id_fkey(${OWNER})`;

type Sorted = { sort_order?: number };
const bySort = (a: Sorted, b: Sorted) => (a.sort_order ?? 0) - (b.sort_order ?? 0);

function shapeStudio(raw: StudioRow): StudioRow {
  return {
    ...raw,
    rating: raw.rating == null ? null : Number(raw.rating),
    rooms: [...(raw.rooms ?? [])].sort(bySort),
    equipment: [...(raw.equipment ?? [])].sort(bySort),
    reviews: (raw.reviews ?? [])
      .map((r) => ({ ...r, rating: Number(r.rating) }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
  };
}

export const listStudios = createServerFn({ method: "GET" }).handler(async () => {
  const client = await anonClient();
  const { data, error } = await client.from("studios").select(STUDIO).order("rating", {
    ascending: false,
  });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as StudioRow[]).map(shapeStudio);
});

export const getStudio = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const client = await anonClient();
    const { data: row, error } = await client
      .from("studios")
      .select(STUDIO)
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? shapeStudio(row as unknown as StudioRow) : null;
  });

export const listOpportunities = createServerFn({ method: "GET" }).handler(async () => {
  const client = await anonClient();
  const { data, error } = await client
    .from("opportunities")
    .select(OPPORTUNITY)
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as OpportunityRow[];
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

export const listListings = createServerFn({ method: "GET" }).handler(async () => {
  const client = await anonClient();
  const { data, error } = await client
    .from("marketplace_listings")
    .select(LISTING)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ListingRow[];
});

/** Listings the signed-in user is selling, newest first. */
export const listMyListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const client = context.supabase as unknown as SupabaseClient;
    const { data, error } = await client
      .from("marketplace_listings")
      .select(LISTING)
      .eq("seller_profile_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as ListingRow[];
  });

export const getListing = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const client = await anonClient();
    const { data: row, error } = await client
      .from("marketplace_listings")
      .select(LISTING)
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row ?? null) as unknown as ListingRow | null;
  });

/** Label for a taxonomy slug, or the slug when the label is not loaded. */
export function taxonomyLabel(labels: TaxonomyLabels | undefined, category: string, slug: string) {
  return labels?.[category]?.[slug] ?? slug;
}
