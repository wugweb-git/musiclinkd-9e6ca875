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
};

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
): Soft<SearchHit> {
  let query = client
    .from("bookables")
    .select(
      "id, slug, name, description, location, image_url, rating, review_count, verified_gold, owner:profiles!studios_owner_profile_id_fkey(username)",
      { count: "exact" },
    );
  query = everyWord(query, words, ["name", "location", "description", "console_type"]);
  if (verified) query = query.eq("verified_gold", true);
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
): Soft<SearchHit> {
  let query = client
    .from("collabs")
    .select("id, slug, name, tagline, city, avatar_url, is_verified, type", { count: "exact" })
    .eq("visibility", "public")
    .neq("status", "archived");
  query = everyWord(query, words, ["name", "tagline", "bio", "city"]);
  if (verified) query = query.eq("is_verified", true);
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
): Soft<OpportunityRow> {
  const creator = `creator:profiles!opportunities_creator_profile_id_fkey${verified ? "!inner" : ""}(${OWNER})`;
  let query = client
    .from("opportunities")
    .select(`${OPPORTUNITY}, ${creator}`, { count: "exact" })
    .eq("status", "open");
  query = everyWord(query, words, ["title", "role_required", "location"]);
  if (verified) query = query.eq("creator.is_verified", true);
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

export const SEARCH_GROUPS = [
  "businesses",
  "studios",
  "collabs",
  "opportunities",
  "gear",
  "services",
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
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<EverythingResults> => {
    const client = (await anonClient()) as unknown as SupabaseClient;
    const words = searchWords(data.q);
    const verified = Boolean(data.verifiedOnly);
    const limit = data.limit ?? 20;
    const want = new Set<SearchGroup>(data.groups ?? SEARCH_GROUPS);
    const skip = <T>(): Promise<Found<T>> => Promise.resolve(none<T>());
    const [b, s, c, o, g, sl, sv] = await Promise.all([
      want.has("businesses") ? businesses(client, words, verified, limit) : skip<SearchHit>(),
      want.has("studios") ? studios(client, words, verified, limit) : skip<SearchHit>(),
      want.has("collabs") ? collabs(client, words, verified, limit) : skip<SearchHit>(),
      want.has("opportunities")
        ? opportunities(client, words, verified, limit)
        : skip<OpportunityRow>(),
      want.has("gear") ? listings(client, words, verified, limit, true) : skip<ListingRow>(),
      want.has("services") ? listings(client, words, verified, limit, false) : skip<ListingRow>(),
      want.has("services") ? services(client, words, verified, limit) : skip<SearchHit>(),
    ]);
    return {
      businesses: b,
      studios: s,
      collabs: c,
      opportunities: o,
      gear: g,
      serviceListings: sl,
      services: sv,
    };
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
