import { createServerFn } from "@tanstack/react-start";
import { collabTypeCopy } from "@/data/collab-types";
import { isCollabType } from "@/lib/collab-types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anonClient, getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { taxonomyLabel, type ListingRow, type OpportunityRow } from "@/lib/catalog.functions";
import { shownPlace } from "@/lib/place";
import { toolLabel } from "@/lib/listing-category";
import { workTypes } from "@/data/portfolio";

/*
 * /search: one box over everything public. People come from searchPeople
 * (profile-groups.functions.ts); this file answers the rest — businesses, studios, collabs (bands
 * are a kind of collab), open opportunities, Market listings (gear for sale and for rent) and
 * services (a person's services, and Market's service listings, which are Discover's).
 *
 * Every word typed has to appear somewhere in the result (name, description, city…), so
 * "tabla mumbai" finds a tabla player in Mumbai. Counts are what the database returns. The order
 * is stated, never hidden: see ORDER below, which /search/why/$id shows back to the person.
 */

export type ResultKind =
  "person" | "business" | "studio" | "collab" | "opportunity" | "listing" | "service";

/** How each kind is ordered, in the words the "Why" screen uses. */
export const ORDER: Record<ResultKind, string> = {
  person: "Verified profiles come first.",
  business: "Verified businesses come first, then by name.",
  studio: "Studios with the best rating come first.",
  collab: "Verified collabs come first, then by name.",
  opportunity: "Open opportunities, newest first.",
  listing: "Listings open for browsing, newest first.",
  service: "Services people offer, newest first.",
};

export type SearchHit = {
  kind: ResultKind;
  /** The row id: what feedback and "Why" refer to. */
  id: string;
  title: string;
  subtitle: string | null;
  place: string | null;
  photo: string | null;
  verified: boolean;
  /** Where it opens. */
  link:
    | { to: "/profile/$username"; params: { username: string } }
    | { to: "/booking/$id"; params: { id: string } }
    | { to: "/bands/$id"; params: { id: string } }
    | { to: "/collab/$id"; params: { id: string } }
    | { to: "/services/$id"; params: { id: string } };
};

export type Found<T> = { items: T[]; total: number };

/** One piece of published portfolio work, for Search → Work. */
export type WorkHit = {
  id: string;
  title: string;
  kind: string;
  cover_url: string | null;
  display_name: string | null;
};

export type EverythingResults = {
  businesses: Found<SearchHit>;
  studios: Found<SearchHit>;
  collabs: Found<SearchHit>;
  opportunities: Found<OpportunityRow>;
  /** Gear for sale and for rent. */
  gear: Found<ListingRow>;
  /** Market's service listings. */
  serviceListings: Found<ListingRow>;
  /** Services on people's profiles. */
  services: Found<SearchHit>;
  /** Published portfolio work, music and video. */
  work: Found<WorkHit>;
};

/**
 * What a tab narrows by (owner, 10 Oct 2026: filters on every tab, not only People). Each list is
 * "any of these"; values are what the rows store, except cities, which come as labels because
 * that column holds text ("Mumbai 400053").
 */
export type SearchFilters = {
  /** Business type: person_types values (flow business) in profiles.roles. */
  types?: string[] | undefined;
  /** Market tool category: item_category (instruments, equipment_categories, daw_tools). */
  categories?: string[] | undefined;
  /** City labels. */
  cities?: string[] | undefined;
  /** Work: music and/or video. */
  media?: ("music" | "video")[] | undefined;
  /** Work: the owner's genres (portfolio items carry none of their own). */
  genres?: string[] | undefined;
};

const filtersSchema = z
  .object({
    types: z.array(z.string().max(60)).max(30).optional(),
    roleLabels: z.array(z.string().max(60)).max(30).optional(),
    categories: z.array(z.string().max(80)).max(40).optional(),
    cities: z.array(z.string().max(60)).max(10).optional(),
    media: z
      .array(z.enum(["music", "video"]))
      .max(2)
      .optional(),
    genres: z.array(z.string().max(60)).max(20).optional(),
  })
  .optional();

/** Work kinds by what they play: audio is music, video is video (src/data/portfolio.ts). */
const WORK_KINDS = {
  music: workTypes.filter((t) => t.media === "audio").map((t): string => t.kind),
  video: workTypes.filter((t) => t.media === "video").map((t): string => t.kind),
};

/** A label safe inside a PostgREST or(): no comma, bracket, quote, backslash or wildcard. */
const clean = (v: string) => v.replace(/[,()"'\\%*]/g, " ").trim();

/** Any of the labels inside the column, as one or(). Null when there is nothing to match. */
function anyLike(column: string, labels: string[] | undefined): string | null {
  const parts = (labels ?? []).map(clean).filter(Boolean);
  return parts.length ? parts.map((l) => `${column}.ilike.%${l}%`).join(",") : null;
}

const OWNER = "id, username, display_name, avatar_url, city, is_verified";
const OPPORTUNITY = `id, slug, title, role_required, genres, budget_paise, budget_unit, budget_note,
  location, status, applicant_count, created_at`;
const LISTING = `id, slug, title, category, item_category, item_category_kind, condition, price_paise,
  price_unit, price_note, image_url, created_at, seller_name, pickup_location, brand, model,
  listing_description, specs, included, weekly_price_paise, monthly_price_paise, deposit_paise,
  quantity_available, pickup_available, delivery_available, delivery_fee_paise, delivery_note,
  min_days, max_days, notice_period`;
const GEAR = ["gear_sale", "gear_rental"];

/** The words to look for. A comma, bracket, quote or backslash would break the filter, so none survives. */
export function searchWords(q: string | undefined): string[] {
  return (q ?? "")
    .replace(/[,()"'\\%*]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0)
    .slice(0, 4);
}

/** Every word in at least one of the columns: one or() per word, and PostgREST ANDs them. */
type Filterable<Q> = { or: (filters: string, options?: { referencedTable?: string }) => Q };
function everyWord<Q extends Filterable<Q>>(
  query: Q,
  words: string[],
  columns: string[],
  referencedTable?: string,
): Q {
  let out = query;
  for (const w of words) {
    const filter = columns.map((c) => `${c}.ilike.%${w}%`).join(",");
    out = referencedTable ? out.or(filter, { referencedTable }) : out.or(filter);
  }
  return out;
}

type Soft<T> = Promise<Found<T>>;
const none = <T>(): Found<T> => ({ items: [], total: 0 });

type BusinessRow = {
  profile: {
    id: string;
    username: string | null;
    display_name: string | null;
    headline: string | null;
    city: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
  };
  logo_url: string | null;
};

async function businesses(
  client: SupabaseClient,
  words: string[],
  verified: boolean,
  limit: number,
  f: SearchFilters,
): Soft<SearchHit> {
  let query = client
    .from("profile_business")
    .select(
      "logo_url, profile:profiles!inner(id, username, display_name, headline, city, avatar_url, is_verified, visibility)",
      { count: "exact" },
    )
    .eq("profile.visibility", "public");
  query = everyWord(
    query,
    words,
    ["display_name", "username", "headline", "city", "bio"],
    "profile",
  );
  if (verified) query = query.eq("profile.is_verified", true);
  if (f.types?.length) query = query.overlaps("profile.roles", f.types);
  const city = anyLike("city", f.cities);
  if (city) query = query.or(city, { referencedTable: "profile" });
  const { data, count, error } = await query.limit(limit);
  if (error) return none();
  const items = ((data ?? []) as unknown as BusinessRow[])
    .filter((r) => r.profile.username)
    .sort(
      (a, b) =>
        Number(Boolean(b.profile.is_verified)) - Number(Boolean(a.profile.is_verified)) ||
        (a.profile.display_name ?? "").localeCompare(b.profile.display_name ?? ""),
    )
    .map((r): SearchHit => ({
      kind: "business",
      id: r.profile.id,
      title: r.profile.display_name ?? r.profile.username ?? "",
      subtitle: r.profile.headline,
      place: r.profile.city,
      photo: r.logo_url ?? r.profile.avatar_url,
      verified: Boolean(r.profile.is_verified),
      link: { to: "/profile/$username", params: { username: r.profile.username ?? "" } },
    }));
  return { items, total: count ?? items.length };
}

type StudioHitRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  location: string | null;
  image_url: string | null;
  rating: number | null;
  review_count: number | null;
  verified_gold: boolean | null;
  owner: { username: string | null } | null;
};

async function studios(
  client: SupabaseClient,
  words: string[],
  verified: boolean,
  limit: number,
  f: SearchFilters,
): Soft<SearchHit> {
  let query = client
    .from("bookables")
    .select(
      "id, slug, name, description, location, image_url, rating, review_count, verified_gold, owner:profiles!studios_owner_profile_id_fkey(username)",
      { count: "exact" },
    );
  query = everyWord(query, words, ["name", "location", "description", "console_type"]);
  if (verified) query = query.eq("verified_gold", true);
  const city = anyLike("location", f.cities);
  if (city) query = query.or(city);
  const { data, count, error } = await query
    .order("rating", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) return none();
  const items = ((data ?? []) as unknown as StudioHitRow[]).map((r): SearchHit => ({
    kind: "studio",
    id: r.id,
    title: r.name,
    subtitle:
      r.rating != null && r.review_count
        ? `${Number(r.rating).toFixed(1)} out of 5 · ${r.review_count} ${r.review_count === 1 ? "review" : "reviews"}`
        : "Studio",
    place: shownPlace(r.location),
    photo: r.image_url,
    verified: Boolean(r.verified_gold),
    // The same link the studio card uses: the owner's page, or the booking page without one.
    link: r.owner?.username
      ? { to: "/profile/$username", params: { username: r.owner.username } }
      : { to: "/booking/$id", params: { id: r.slug } },
  }));
  return { items, total: count ?? items.length };
}

type CollabHitRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  city: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  type: string;
};

async function collabs(
  client: SupabaseClient,
  words: string[],
  verified: boolean,
  limit: number,
  f: SearchFilters,
): Soft<SearchHit> {
  let query = client
    .from("collabs")
    .select("id, slug, name, tagline, city, avatar_url, is_verified, type", { count: "exact" })
    .eq("visibility", "public")
    .neq("status", "archived");
  query = everyWord(query, words, ["name", "tagline", "bio", "city"]);
  if (verified) query = query.eq("is_verified", true);
  const city = anyLike("city", f.cities);
  if (city) query = query.or(city);
  const { data, count, error } = await query
    .order("is_verified", { ascending: false })
    .order("name")
    .limit(limit);
  if (error) return none();
  const items = ((data ?? []) as unknown as CollabHitRow[]).map((r): SearchHit => ({
    kind: "collab",
    id: r.id,
    title: r.name,
    subtitle: r.tagline ?? (isCollabType(r.type) ? collabTypeCopy[r.type].label : "Collab"),
    place: r.city,
    photo: r.avatar_url,
    verified: Boolean(r.is_verified),
    link: isCollabType(r.type)
      ? { to: "/bands/$id", params: { id: r.slug } }
      : { to: "/collab/$id", params: { id: r.id } },
  }));
  return { items, total: count ?? items.length };
}

async function opportunities(
  client: SupabaseClient,
  words: string[],
  verified: boolean,
  limit: number,
  f: SearchFilters,
): Soft<OpportunityRow> {
  const creator = `creator:profiles!opportunities_creator_profile_id_fkey${verified ? "!inner" : ""}(${OWNER})`;
  let query = client
    .from("opportunities")
    .select(`${OPPORTUNITY}, ${creator}`, { count: "exact" })
    .eq("status", "open");
  query = everyWord(query, words, ["title", "role_required", "location"]);
  if (verified) query = query.eq("creator.is_verified", true);
  const city = anyLike("location", f.cities);
  if (city) query = query.or(city);
  const { data, count, error } = await query.order("created_at", { ascending: false }).limit(limit);
  if (error) return none();
  const items = (data ?? []) as unknown as OpportunityRow[];
  return { items, total: count ?? items.length };
}

async function listings(
  client: SupabaseClient,
  words: string[],
  verified: boolean,
  limit: number,
  gear: boolean,
  f: SearchFilters,
): Soft<ListingRow> {
  const seller = `seller:profiles!marketplace_listings_seller_profile_id_fkey${verified ? "!inner" : ""}(${OWNER}, rating, review_count, followers_count)`;
  let query = client
    .from("marketplace_listings")
    .select(`${LISTING}, ${seller}`, { count: "exact" })
    .not("listing_status", "in", "(unavailable,archived)");
  query = gear ? query.in("category", GEAR) : query.not("category", "in", `(${GEAR.join(",")})`);
  query = everyWord(query, words, [
    "title",
    "brand",
    "model",
    "item_category",
    "listing_description",
    "pickup_location",
    "seller_name",
  ]);
  if (verified) query = query.eq("seller.is_verified", true);
  if (gear && f.categories?.length) query = query.in("item_category", f.categories);
  const city = anyLike("pickup_location", f.cities);
  if (city) query = query.or(city);
  const { data, count, error } = await query.order("created_at", { ascending: false }).limit(limit);
  if (error) return none();
  const items = (data ?? []) as unknown as ListingRow[];
  return { items, total: count ?? items.length };
}

type ServiceHitRow = {
  id: string;
  name: string;
  description: string | null;
  profile: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    city: string | null;
    is_verified: boolean | null;
  };
};

async function services(
  client: SupabaseClient,
  words: string[],
  verified: boolean,
  limit: number,
  f: SearchFilters,
): Soft<SearchHit> {
  let query = client
    .from("profile_services")
    .select(
      "id, name, description, profile:profiles!inner(username, display_name, avatar_url, city, is_verified, visibility)",
      { count: "exact" },
    )
    .eq("status", "active")
    .eq("profile.visibility", "public");
  query = everyWord(query, words, ["name", "description"]);
  if (verified) query = query.eq("profile.is_verified", true);
  const city = anyLike("city", f.cities);
  if (city) query = query.or(city, { referencedTable: "profile" });
  const { data, count, error } = await query.order("created_at", { ascending: false }).limit(limit);
  if (error) return none();
  const items = ((data ?? []) as unknown as ServiceHitRow[]).map((r): SearchHit => ({
    kind: "service",
    id: r.id,
    title: r.name,
    subtitle: r.profile.display_name ?? r.profile.username,
    place: r.profile.city,
    photo: r.profile.avatar_url,
    verified: Boolean(r.profile.is_verified),
    link: { to: "/services/$id", params: { id: r.id } },
  }));
  return { items, total: count ?? items.length };
}

type WorkRow = {
  id: string;
  title: string;
  kind: string;
  cover_url: string | null;
  owner: { display_name: string | null; username: string | null; genres: string[] };
};

const PAGE = 1000;

/**
 * Every published music and video item matching the words and filters, newest first, from public
 * profiles. portfolio_items has no link to profiles the API can join on, so owners are read
 * separately and the rows are counted here, page by page to the last one: the count is every
 * matching row, never a sample (owner, 10 Oct 2026). Null when a read fails.
 */
async function workRows(
  client: SupabaseClient,
  words: string[],
  verified: boolean,
  f: SearchFilters,
): Promise<WorkRow[] | null> {
  const media = f.media?.length ? f.media : (["music", "video"] as const);
  const kinds = media.flatMap((m) => WORK_KINDS[m]);
  type Item = Omit<WorkRow, "owner"> & { user_id: string };
  const items: Item[] = [];
  for (let from = 0; ; from += PAGE) {
    let query = client
      .from("portfolio_items")
      .select("id, title, kind, cover_url, user_id")
      .eq("published", true)
      .in("kind", kinds);
    query = everyWord(query, words, ["title", "description", "role"]);
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) return null;
    const page = (data ?? []) as Item[];
    items.push(...page);
    if (page.length < PAGE) break;
  }
  const ownerIds = [...new Set(items.map((i) => i.user_id))];
  const owners = new Map<string, WorkRow["owner"]>();
  // In batches, so the id list stays well inside a request's length.
  for (let i = 0; i < ownerIds.length; i += 150) {
    let query = client
      .from("profiles")
      .select("id, display_name, username, genres")
      .in("id", ownerIds.slice(i, i + 150))
      .eq("visibility", "public");
    if (verified) query = query.eq("is_verified", true);
    if (f.genres?.length) query = query.overlaps("genres", f.genres);
    const { data, error } = await query;
    if (error) return null;
    for (const o of (data ?? []) as {
      id: string;
      display_name: string | null;
      username: string | null;
      genres: string[] | null;
    }[])
      owners.set(o.id, {
        display_name: o.display_name,
        username: o.username,
        genres: o.genres ?? [],
      });
  }
  return items.flatMap(({ user_id, ...i }) => {
    const owner = owners.get(user_id);
    return owner ? [{ ...i, owner }] : [];
  });
}

async function work(
  client: SupabaseClient,
  words: string[],
  verified: boolean,
  limit: number,
  f: SearchFilters,
): Soft<WorkHit> {
  const rows = await workRows(client, words, verified, f);
  if (!rows) return none();
  return {
    items: rows.slice(0, limit).map((r) => ({
      id: r.id,
      title: r.title,
      kind: r.kind,
      cover_url: r.cover_url,
      display_name: r.owner.display_name ?? r.owner.username,
    })),
    total: rows.length,
  };
}

export const SEARCH_GROUPS = [
  "businesses",
  "studios",
  "collabs",
  "opportunities",
  "gear",
  "services",
  "work",
] as const;
export type SearchGroup = (typeof SEARCH_GROUPS)[number];

/**
 * Everything but people, for one search. `groups` limits the read to what the screen shows; a
 * group not asked for, or one whose read fails, comes back empty rather than failing the rest.
 */
export const searchEverything = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        q: z.string().trim().max(80).optional(),
        verifiedOnly: z.boolean().optional(),
        groups: z.array(z.enum(SEARCH_GROUPS)).min(1).max(SEARCH_GROUPS.length).optional(),
        limit: z.number().int().min(1).max(40).optional(),
        filters: filtersSchema,
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<EverythingResults> => {
    const client = (await anonClient()) as unknown as SupabaseClient;
    const words = searchWords(data.q);
    const verified = Boolean(data.verifiedOnly);
    const limit = data.limit ?? 20;
    const want = new Set<SearchGroup>(data.groups ?? SEARCH_GROUPS);
    const f: SearchFilters = data.filters ?? {};
    const skip = <T>(): Promise<Found<T>> => Promise.resolve(none<T>());
    const [b, s, c, o, g, sl, sv, w] = await Promise.all([
      want.has("businesses") ? businesses(client, words, verified, limit, f) : skip<SearchHit>(),
      want.has("studios") ? studios(client, words, verified, limit, f) : skip<SearchHit>(),
      want.has("collabs") ? collabs(client, words, verified, limit, f) : skip<SearchHit>(),
      want.has("opportunities")
        ? opportunities(client, words, verified, limit, f)
        : skip<OpportunityRow>(),
      want.has("gear") ? listings(client, words, verified, limit, true, f) : skip<ListingRow>(),
      want.has("services")
        ? listings(client, words, verified, limit, false, f)
        : skip<ListingRow>(),
      want.has("services") ? services(client, words, verified, limit, f) : skip<SearchHit>(),
      want.has("work") ? work(client, words, verified, limit, f) : skip<WorkHit>(),
    ]);
    return {
      businesses: b,
      studios: s,
      collabs: c,
      opportunities: o,
      gear: g,
      serviceListings: sl,
      services: sv,
      work: w,
    };
  });

/** Counts per filter option: dimension → stored value (cities: the shown city) → rows. */
export type SearchFacets = Partial<
  Record<"type" | "role" | "category" | "city" | "media" | "genre", Record<string, number>>
>;

function tally(out: Record<string, number>, value: string | null | undefined) {
  const v = value?.trim();
  if (v) out[v] = (out[v] ?? 0) + 1;
}

/**
 * The counts beside each option in a tab's Filters panel: every public row of that kind, read
 * once and counted here, so an option shows only when something has it. Cities are counted by the
 * city part of the stored place.
 */
export const searchFacets = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ group: z.enum(SEARCH_GROUPS) }).parse(d))
  .handler(async ({ data }): Promise<SearchFacets> => {
    const client = (await anonClient()) as unknown as SupabaseClient;
    const city: Record<string, number> = {};
    switch (data.group) {
      case "businesses": {
        const { data: rows, error } = await client
          .from("profile_business")
          .select("profile:profiles!inner(roles, city, visibility)")
          .eq("profile.visibility", "public")
          .limit(5000);
        if (error) throw new Error(error.message);
        const type: Record<string, number> = {};
        for (const r of (rows ?? []) as unknown as {
          profile: { roles: string[] | null; city: string | null };
        }[]) {
          for (const t of r.profile.roles ?? []) tally(type, t);
          tally(city, shownPlace(r.profile.city));
        }
        return { type, city };
      }
      case "opportunities": {
        const { data: rows, error } = await client
          .from("opportunities")
          .select("location")
          .eq("status", "open")
          .limit(5000);
        if (error) throw new Error(error.message);
        for (const r of (rows ?? []) as { location: string | null }[])
          tally(city, shownPlace(r.location));
        return { city };
      }
      case "gear":
      case "services": {
        const gear = data.group === "gear";
        let query = client
          .from("marketplace_listings")
          .select("item_category, pickup_location")
          .not("listing_status", "in", "(unavailable,archived)");
        query = gear
          ? query.in("category", GEAR)
          : query.not("category", "in", `(${GEAR.join(",")})`);
        const { data: rows, error } = await query.limit(5000);
        if (error) throw new Error(error.message);
        const category: Record<string, number> = {};
        for (const r of (rows ?? []) as {
          item_category: string | null;
          pickup_location: string | null;
        }[]) {
          tally(category, r.item_category);
          tally(city, shownPlace(r.pickup_location));
        }
        if (gear) return { category, city };
        const { data: offered, error: offeredError } = await client
          .from("profile_services")
          .select("profile:profiles!inner(city, visibility)")
          .eq("status", "active")
          .eq("profile.visibility", "public")
          .limit(5000);
        if (offeredError) throw new Error(offeredError.message);
        for (const r of (offered ?? []) as unknown as { profile: { city: string | null } }[])
          tally(city, shownPlace(r.profile.city));
        return { city };
      }
      case "studios": {
        const { data: rows, error } = await client.from("bookables").select("location").limit(5000);
        if (error) throw new Error(error.message);
        for (const r of (rows ?? []) as { location: string | null }[])
          tally(city, shownPlace(r.location));
        return { city };
      }
      case "collabs": {
        const { data: rows, error } = await client
          .from("collabs")
          .select("city")
          .eq("visibility", "public")
          .neq("status", "archived")
          .limit(5000);
        if (error) throw new Error(error.message);
        for (const r of (rows ?? []) as { city: string | null }[]) tally(city, shownPlace(r.city));
        return { city };
      }
      case "work": {
        const rows = await workRows(client, [], false, {});
        if (!rows) throw new Error("Work could not be read");
        const media: Record<string, number> = {};
        const genre: Record<string, number> = {};
        for (const r of rows) {
          tally(media, WORK_KINDS.music.includes(r.kind) ? "music" : "video");
          for (const g of r.owner.genres) tally(genre, g);
        }
        return { media, genre };
      }
    }
  });

/*
 * "Why am I seeing this": for one result and the words it came up for, which of its fields hold
 * those words, and how its kind is ordered. Read from the row itself, so it can only say what is
 * true of it.
 */

export type WhySignal = { label: string; detail: string; weight: "strong" | "medium" | "light" };

export type WhyResult = {
  kind: ResultKind;
  title: string;
  signals: WhySignal[];
};

type Field = { label: string; value: string | null | undefined; strong?: boolean };

async function subjectFields(
  client: SupabaseClient,
  kind: ResultKind,
  id: string,
): Promise<{ title: string; fields: Field[]; verified: boolean; extra: WhySignal[] } | null> {
  const one = async <T>(table: string, columns: string, key = "id") => {
    const { data, error } = await client.from(table).select(columns).eq(key, id).maybeSingle();
    return error ? null : (data as T | null);
  };
  switch (kind) {
    case "person":
    case "business": {
      const p = await one<{
        display_name: string | null;
        username: string | null;
        headline: string | null;
        city: string | null;
        bio: string | null;
        is_verified: boolean | null;
        visibility: string | null;
      }>("profiles", "display_name, username, headline, city, bio, is_verified, visibility");
      if (!p || p.visibility !== "public") return null;
      return {
        title: p.display_name ?? p.username ?? "",
        verified: Boolean(p.is_verified),
        fields: [
          { label: "name", value: p.display_name, strong: true },
          { label: "username", value: p.username, strong: true },
          { label: "headline", value: p.headline },
          { label: "city", value: p.city },
          ...(kind === "business" ? [{ label: "about", value: p.bio }] : []),
        ],
        extra: [],
      };
    }
    case "studio": {
      const s = await one<{
        name: string;
        location: string | null;
        description: string | null;
        console_type: string | null;
        rating: number | null;
        review_count: number | null;
        verified_gold: boolean | null;
      }>(
        "studios",
        "name, location, description, console_type, rating, review_count, verified_gold",
      );
      if (!s) return null;
      return {
        title: s.name,
        verified: Boolean(s.verified_gold),
        fields: [
          { label: "name", value: s.name, strong: true },
          { label: "location", value: shownPlace(s.location) },
          { label: "description", value: s.description },
          { label: "console", value: s.console_type },
        ],
        extra: [
          {
            label: "Rating",
            detail:
              s.rating != null && s.review_count
                ? `${Number(s.rating).toFixed(1)} out of 5 from ${s.review_count} ${s.review_count === 1 ? "review" : "reviews"}`
                : "No reviews yet, so it comes after rated studios",
            weight: "medium",
          },
        ],
      };
    }
    case "collab": {
      const c = await one<{
        name: string;
        tagline: string | null;
        bio: string | null;
        city: string | null;
        is_verified: boolean | null;
        type: string;
      }>("collabs", "name, tagline, bio, city, is_verified, type");
      if (!c) return null;
      return {
        title: c.name,
        verified: Boolean(c.is_verified),
        fields: [
          { label: "name", value: c.name, strong: true },
          { label: "tagline", value: c.tagline },
          { label: "about", value: c.bio },
          { label: "city", value: c.city },
        ],
        extra: [],
      };
    }
    case "opportunity": {
      const o = await one<{
        title: string;
        role_required: string | null;
        location: string | null;
        created_at: string;
      }>("opportunities", "title, role_required, location, created_at");
      if (!o) return null;
      // A person-type slug reads as its label; older free text as stored (owner, 10 Oct 2026).
      const labels = await getTaxonomyLabels().catch((): TaxonomyLabels => ({}));
      return {
        title: o.title,
        verified: false,
        fields: [
          { label: "title", value: o.title, strong: true },
          {
            label: "role wanted",
            value: o.role_required ? taxonomyLabel(labels, "person_types", o.role_required) : null,
          },
          { label: "location", value: o.location },
        ],
        extra: [{ label: "Posted", detail: postedOn(o.created_at), weight: "light" }],
      };
    }
    case "listing": {
      const l = await one<{
        title: string;
        brand: string | null;
        model: string | null;
        item_category: string | null;
        listing_description: string | null;
        pickup_location: string | null;
        seller_name: string | null;
        created_at: string;
      }>(
        "marketplace_listings",
        "title, brand, model, item_category, listing_description, pickup_location, seller_name, created_at",
      );
      if (!l) return null;
      // The category is the tool listed, labelled from the Tools lists (owner, 10 Oct 2026).
      const tools = await getTaxonomyLabels().catch((): TaxonomyLabels => ({}));
      return {
        title: l.title,
        verified: false,
        fields: [
          { label: "title", value: l.title, strong: true },
          { label: "brand", value: l.brand, strong: true },
          { label: "model", value: l.model, strong: true },
          { label: "category", value: l.item_category ? toolLabel(tools, l.item_category) : null },
          { label: "description", value: l.listing_description },
          { label: "pickup place", value: shownPlace(l.pickup_location) },
          { label: "seller", value: l.seller_name },
        ],
        extra: [{ label: "Listed", detail: postedOn(l.created_at), weight: "light" }],
      };
    }
    case "service": {
      const s = await one<{
        name: string;
        description: string | null;
        created_at: string;
      }>("profile_services", "name, description, created_at");
      if (!s) return null;
      return {
        title: s.name,
        verified: false,
        fields: [
          { label: "name", value: s.name, strong: true },
          { label: "description", value: s.description },
        ],
        extra: [{ label: "Added", detail: postedOn(s.created_at), weight: "light" }],
      };
    }
  }
}

function postedOn(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** A few words either side of where the word was found, so the person sees it in place. */
function snippet(value: string, word: string) {
  const at = value.toLowerCase().indexOf(word.toLowerCase());
  if (value.length <= 60 || at < 0) return value.length <= 60 ? value : `${value.slice(0, 57)}…`;
  const start = Math.max(0, at - 24);
  const end = Math.min(value.length, at + word.length + 24);
  return `${start ? "…" : ""}${value.slice(start, end).trim()}${end < value.length ? "…" : ""}`;
}

export const explainResult = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        kind: z.enum([
          "person",
          "business",
          "studio",
          "collab",
          "opportunity",
          "listing",
          "service",
        ]),
        id: z.string().min(1).max(120),
        q: z.string().trim().max(80).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<WhyResult | null> => {
    const client = (await anonClient()) as unknown as SupabaseClient;
    const subject = await subjectFields(client, data.kind, data.id);
    if (!subject) return null;
    const words = searchWords(data.q);
    const signals: WhySignal[] = [];
    for (const f of subject.fields) {
      const value = f.value?.trim();
      if (!value) continue;
      const hits = words.filter((w) => value.toLowerCase().includes(w.toLowerCase()));
      if (!hits.length) continue;
      signals.push({
        label: `Your ${hits.length === 1 ? "word" : "words"} in the ${f.label}`,
        detail: `${hits.map((w) => `“${w}”`).join(", ")} · ${snippet(value, hits[0]!)}`,
        weight: f.strong ? "strong" : "medium",
      });
    }
    if (!words.length)
      signals.push({
        label: "No words typed",
        detail: "It is public and fits the filters you picked",
        weight: "medium",
      });
    signals.push({ label: "Order", detail: ORDER[data.kind], weight: "light" });
    if (subject.verified)
      signals.push({ label: "Verified", detail: "Its identity has been checked", weight: "light" });
    signals.push(...subject.extra);
    return { kind: data.kind, title: subject.title, signals };
  });

/*
 * "Not a good match" answers. Written from the browser (src/lib/search-feedback.ts) so the
 * database knows who; read back here, own rows only, so /search can move those results down.
 * Schema: supabase/migrations/20260921170000_search.sql. Empty before it is applied.
 */
export const listMySearchFeedback = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<string[]> => {
    const { data, error } = await (context.supabase as unknown as SupabaseClient)
      .from("search_feedback")
      .select("subject_kind, subject_id")
      .eq("profile_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) return [];
    return [
      ...new Set(
        ((data ?? []) as { subject_kind: string; subject_id: string }[]).map(
          (r) => `${r.subject_kind}:${r.subject_id}`,
        ),
      ),
    ];
  });
