import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { FEATURED_LIMIT } from "@/data/portfolio";
import type { ListingRow } from "@/lib/catalog.functions";
import { placeLine } from "@/lib/place";
import { CITY_PATTERN, DEFAULT_COUNTRY, INDIAN_STATES, NAME_PATTERN } from "@/lib/validation";

export type PortfolioKind = "track" | "ep" | "album" | "video" | "credit" | "live";

const itemSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(120),
  kind: z.string().min(1).max(24),
  description: z.string().max(1200).optional().nullable(),
  role: z.string().max(120).optional().nullable(),
  collaborators: z.array(z.string().max(80)).max(20).default([]),
  cover_url: z.string().url().max(500).optional().nullable().or(z.literal("")),
  media_url: z.string().url().max(500).optional().nullable().or(z.literal("")),
  release_year: z.number().int().min(1900).max(2100).optional().nullable(),
  published: z.boolean().default(true),
});

/** Owner view: every item including drafts. */
export const listMyPortfolio = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("portfolio_items")
      .select("*")
      .eq("user_id", context.userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/**
 * Plays per work, for the account's own performance screen. The database counts a play when
 * somebody opens the work (record_portfolio_play). Views, shares and clicks are counted apart,
 * in myPortfolioEvents.
 */
export const myPortfolioPlays = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Record<string, number>> => {
    const client = context.supabase as unknown as SupabaseClient;
    const { data: mine, error: mineError } = await client
      .from("portfolio_items")
      .select("id")
      .eq("user_id", context.userId);
    if (mineError) throw new Error(mineError.message);
    const ids = ((mine ?? []) as { id: string }[]).map((m) => m.id);
    if (!ids.length) return {};

    const { data, error } = await client
      .from("portfolio_item_plays")
      .select("item_id")
      .in("item_id", ids);
    if (error) throw new Error(error.message);
    const counts: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
    for (const row of (data ?? []) as { item_id: string }[]) {
      counts[row.item_id] = (counts[row.item_id] ?? 0) + 1;
    }
    return counts;
  });

/**
 * What leads the account's profile and what follows it. Both live on each work
 * (portfolio_items.sort_order and .featured), so saving writes every work in the list its new
 * position and whether it is featured. At most FEATURED_LIMIT works can lead.
 */
export const reorderPortfolio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        ids: z.array(z.string().uuid()).max(200),
        featured: z.array(z.string().uuid()).max(FEATURED_LIMIT).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const client = context.supabase as unknown as SupabaseClient;
    const leads = new Set(data.featured ?? []);
    // One update per work, and only ever the account's own: the user_id filter is the guard.
    const writes = data.ids.map((id, index) =>
      client
        .from("portfolio_items")
        .update({ sort_order: index, featured: leads.has(id) })
        .eq("id", id)
        .eq("user_id", context.userId),
    );
    const results = await Promise.all(writes);
    const failed = results.find((r) => r.error);
    if (failed?.error) throw new Error(failed.error.message);
    return { ordered: data.ids.length, featured: leads.size };
  });

export const getMyPortfolioItem = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("portfolio_items")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

/**
 * One published work, for anybody holding its link (the Share button sends /portfolio/$id).
 * Drafts stay the owner's: only a published row comes back.
 */
export const getPublicPortfolioItem = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const client = await anonClient();
    const { data: row, error } = await client
      .from("portfolio_items")
      .select("*")
      .eq("id", data.id)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const savePortfolioItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => itemSchema.parse(d))
  .handler(async ({ context, data }) => {
    const payload = {
      user_id: context.userId,
      title: data.title,
      kind: data.kind,
      description: data.description || null,
      role: data.role || null,
      collaborators: data.collaborators,
      cover_url: data.cover_url || null,
      media_url: data.media_url || null,
      release_year: data.release_year ?? null,
      published: data.published,
    };

    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("portfolio_items")
        .update(payload)
        .eq("id", data.id)
        .eq("user_id", context.userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row;
    }

    const { data: row, error } = await context.supabase
      .from("portfolio_items")
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

/** Publish or hide one work. A hidden work stays in the account's list but leaves the profile. */
export const setPortfolioPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), published: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("portfolio_items")
      .update({ published: data.published })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { published: data.published };
  });

export const deletePortfolioItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("portfolio_items")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Onboarding + profile edit persistence. */
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

/**
 * Fill a profile's name and photo from the identity provider when they are still empty.
 *
 * The signup trigger copies full_name and avatar_url from raw_user_meta_data, but only on the
 * INSERT of a brand-new auth user: anyone who signed up by email and linked Google afterwards, or
 * whose profile row already existed, keeps an empty name. This reads the provider's own metadata
 * on the current session and writes only the fields that are still blank — never over anything the
 * person typed themselves. Returns the fields it filled, so callers can tell whether to refresh.
 */
export const syncIdentityFromProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ filled: string[] }> => {
    const { data: auth } = await context.supabase.auth.getUser();
    const meta = (auth.user?.user_metadata ?? {}) as Record<string, unknown>;
    const str = (key: string) => {
      const v = meta[key];
      return typeof v === "string" && v.trim() ? v.trim() : null;
    };

    const { data: row } = await context.supabase
      .from("profiles")
      .select("display_name,avatar_url")
      .eq("id", context.userId)
      .maybeSingle();

    const name =
      str("full_name") ??
      str("name") ??
      [str("given_name"), str("family_name")].filter(Boolean).join(" ") ??
      null;
    const photo = str("avatar_url") ?? str("picture");

    const patch: Record<string, string> = {};
    if (!row?.display_name?.trim() && name) patch["display_name"] = name.slice(0, 80);
    if (!row?.avatar_url?.trim() && photo) patch["avatar_url"] = photo.slice(0, 500);
    if (!Object.keys(patch).length) return { filled: [] };

    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, ...patch } as never, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { filled: Object.keys(patch) };
  });

/** What a profile's rate is per (profiles.rate_unit). */
export const RATE_UNITS = [
  "hour",
  "song",
  "show",
  "night",
  "day",
  "session",
  "track",
  "feature",
] as const;
export type RateUnit = (typeof RATE_UNITS)[number];

const strList = (max: number, len = 40) => z.array(z.string().max(len)).max(max).optional();

const profilePatchSchema = z.object({
  username: z
    .string()
    .regex(/^[a-z0-9._]{3,30}$/)
    .optional()
    .nullable(),
  display_name: z.string().max(80).optional().nullable(),
  headline: z.string().max(160).optional().nullable(),
  bio: z.string().max(1200).optional().nullable(),
  city: z.string().trim().max(60).regex(CITY_PATTERN).optional().nullable(),
  state: z
    .string()
    .refine((v) => (INDIAN_STATES as readonly string[]).includes(v), "Pick a state from the list")
    .optional()
    .nullable(),
  // India only for now: any country sent is stored as India.
  country: z
    .string()
    .max(80)
    .transform(() => DEFAULT_COUNTRY)
    .optional()
    .nullable(),
  roles: strList(12),
  instruments: strList(20),
  genres: strList(20),
  languages: strList(20),
  specialisations: strList(30, 60),
  work_modes: strList(10),
  intents: strList(12, 60),
  contact_channels: strList(10),
  experience_level: z.string().max(40).optional().nullable(),
  visibility: z.string().max(24).optional(),
  qr_style: z.enum(["light", "dark", "branded", "minimal"]).optional(),
  availability: z.string().max(40).optional().nullable(),
  avatar_url: z.string().max(500).optional().nullable(),
  cover_url: z.string().max(500).optional().nullable(),
  first_name: z.string().trim().max(40).regex(NAME_PATTERN).optional().nullable(),
  last_name: z.string().trim().max(40).regex(NAME_PATTERN).optional().nullable(),
  links: z.record(z.string(), z.string().max(300)).optional(),
  discovery_prefs: z.record(z.string(), z.unknown()).optional(),
  onboarding_step: z.string().max(40).optional().nullable(),
  onboarding_draft: z.record(z.string(), z.unknown()).optional(),
  onboarding_complete: z.boolean().optional(),
  pin_code: z
    .string()
    .regex(/^[1-9]\d{5}$/)
    .optional()
    .nullable(),
  influences: strList(20, 80),
  hourly_rate_paise: z.number().int().min(0).max(1_000_000_000).optional().nullable(),
  rate_paise: z.number().int().min(0).max(1_000_000_000).optional().nullable(),
  rate_unit: z.enum(RATE_UNITS).optional().nullable(),
});

/** Columns the missing-data migration adds; a save before it lands drops them and keeps the rest. */
const PENDING_COLUMNS = ["pin_code", "influences", "rate_paise", "rate_unit"];

export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => profilePatchSchema.parse(d))

  .handler(async ({ context, data }) => {
    const patch = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    ) as Record<string, unknown>;
    // India only for now: a place saved without a country is in India.
    if (("city" in patch || "state" in patch) && !("country" in patch))
      patch["country"] = DEFAULT_COUNTRY;
    // discovery_prefs holds keys from several screens (onboarding's topics and instrument
    // experience, Privacy's appear/who_can_message/show_phone, QR sharing), so a save merges into
    // what is stored instead of replacing it and dropping the other screens' keys.
    if (patch["discovery_prefs"]) {
      const { data: current } = await context.supabase
        .from("profiles")
        .select("discovery_prefs")
        .eq("id", context.userId)
        .maybeSingle();
      const stored = (current as { discovery_prefs?: unknown } | null)?.discovery_prefs;
      patch["discovery_prefs"] = {
        ...(stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {}),
        ...(patch["discovery_prefs"] as Record<string, unknown>),
      };
    }
    const write = (values: Record<string, unknown>) =>
      context.supabase
        .from("profiles")
        .upsert({ id: context.userId, ...values } as never, { onConflict: "id" })
        .select()
        .single();
    let { data: row, error } = await write(patch);
    // first_name / last_name and the missing-data columns arrive with their migrations; until then
    // display_name carries the name and hourly_rate_paise the rate.
    const pending = ["first_name", "last_name", ...PENDING_COLUMNS];
    if (error?.code === "PGRST204" && pending.some((k) => k in patch)) {
      const rest = Object.fromEntries(Object.entries(patch).filter(([k]) => !pending.includes(k)));
      ({ data: row, error } = await write(rest));
    }
    if (error) throw new Error(usernameError(error) ?? error.message);

    // A business's address and its studio's location are its city and PIN code, so they follow
    // the profile when either changes. Accounts with no business row are untouched.
    if ("city" in patch || "pin_code" in patch) {
      const saved = row as { city?: string | null; pin_code?: string | null } | null;
      const place = placeLine(saved?.city, saved?.pin_code) || null;
      const client = context.supabase as unknown as import("@supabase/supabase-js").SupabaseClient;
      await client
        .from("profile_business")
        .update({ business_address: place } as never)
        .eq("profile_id", context.userId);
      await client
        .from("studios")
        .update({ location: place } as never)
        .eq("owner_profile_id", context.userId);
    }
    return row;
  });

export type UsernameClaim = "claimed" | "taken" | "reserved" | "locked" | "invalid";

/** Database username rules (20260914200000_username_rules.sql) as a short reason, or null. */
function usernameError(error: {
  code?: string;
  message?: string;
}): Exclude<UsernameClaim, "claimed"> | null {
  const message = error.message ?? "";
  if (error.code === "23505" && message.includes("profiles_username_key")) return "taken";
  if (error.code === "23514" && message.includes("profiles_username_format")) return "invalid";
  if (message.includes("username_reserved")) return "reserved";
  if (message.includes("username_locked")) return "locked";
  return null;
}

/**
 * Claim a username for the signed-in profile. Onboarding calls this on Continue from About you;
 * autosave never sends the username. Once set, the database refuses changes ("locked").
 */
export const claimMyUsername = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ username: z.string().min(1).max(30) }).parse(d))
  .handler(async ({ context, data }): Promise<{ status: UsernameClaim }> => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, username: data.username } as never, { onConflict: "id" });
    if (!error) return { status: "claimed" };
    const reason = usernameError(error);
    if (!reason) throw new Error(error.message);
    return { status: reason };
  });

/** Anon-key client with no session, for public reads that RLS already scopes. */
export async function anonClient() {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/**
 * A read that names columns the missing-data migration adds (20260918240000_missing_data.sql).
 * Until the database has them the read fails, and the same read runs again with the columns it
 * already has, so a screen shows what is stored instead of an error.
 */
export async function softSelect<R extends { error: unknown }>(
  read: (columns: string) => PromiseLike<R>,
  columns: string,
  fallback: string,
): Promise<R> {
  const first = await read(columns);
  return first.error ? read(fallback) : first;
}

const PUBLIC_PROFILE =
  "id, username, display_name, headline, bio, city, state, country, roles, instruments, genres, languages, specialisations, work_modes, experience_level, availability, avatar_url, cover_url, links, visibility";

/** Public profile read — anon key, safe columns only, no session. */
export const getPublicProfile = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ username: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data }) => {
    const client = await anonClient();

    const { data: row } = await softSelect(
      (columns) =>
        client.from("profiles").select(columns).eq("username", data.username).maybeSingle(),
      `${PUBLIC_PROFILE}, pin_code, influences, rating, review_count, followers_count`,
      PUBLIC_PROFILE,
    );

    const visibility = (row as { visibility?: string } | null)?.visibility;
    // A deactivated account is hidden like a private one.
    if (!row || visibility === "private" || visibility === "deactivated") return null;
    return row;
  });

/**
 * slug → label per taxonomy category. Profiles store slugs; screens show these labels. The names
 * of the categories themselves ("DAW Tools") are under CATEGORY_LABELS.
 */
export type TaxonomyLabels = Record<string, Record<string, string>>;

/** Key in TaxonomyLabels holding category key → category label. No category uses this key. */
export const CATEGORY_LABELS = "taxonomy_categories";

/**
 * Published labels for every taxonomy category. Unpublished slugs are absent, so callers fall
 * back to the slug rather than rendering blank.
 */
export const getTaxonomyLabels = createServerFn({ method: "GET" }).handler(async () => {
  const client = await anonClient();
  const [options, categories] = await Promise.all([
    client.from("taxonomy_options" as never).select("category_key, slug, label"),
    client.from("taxonomy_categories" as never).select("key, label"),
  ]);
  if (options.error) throw new Error(options.error.message);
  if (categories.error) throw new Error(categories.error.message);

  const labels: TaxonomyLabels = {};
  for (const r of (options.data ?? []) as { category_key: string; slug: string; label: string }[]) {
    (labels[r.category_key] ??= {})[r.slug] = r.label;
  }
  const names: Record<string, string> = {};
  for (const r of (categories.data ?? []) as { key: string; label: string }[]) {
    names[r.key] = r.label;
  }
  labels[CATEGORY_LABELS] = names;
  return labels;
});

/** A profile's sections as stored, before they are shaped for the profile screen. */
export type ProfileSections = {
  services: {
    id: string;
    name: string;
    description: string | null;
    price_paise: number | null;
    price_unit: string | null;
    price_note: string | null;
    turnaround: string | null;
    mode: string | null;
    availability: string | null;
    /** service_categories slug. */
    category: string | null;
    /** pricing_models slug. */
    pricing_model: string | null;
    /** work_modes slugs. */
    work_modes: string[];
  }[];
  experience: {
    id: string;
    title: string;
    org: string | null;
    start_year: number | null;
    end_year: number | null;
    detail: string | null;
  }[];
  gallery: { id: string; image_url: string }[];
  reviews: {
    id: string;
    author_name: string;
    author_org: string | null;
    context: string | null;
    rating: number;
    body: string;
    response: string | null;
    /** Short labels the reviewer picked ("On time"). */
    tags: string[];
  }[];
  portfolio: {
    id: string;
    title: string;
    kind: string;
    description: string | null;
    role: string | null;
    collaborators: string[];
    cover_url: string | null;
    media_url: string | null;
    release_year: number | null;
    /** Running time as stored, "3:42". */
    duration: string | null;
  }[];
  trust_badges: string[];
  is_verified: boolean;
  hourly_rate_paise: number | null;
  /** The rate and what it is per; an hourly rate alone reads as rate_unit "hour". */
  rate_paise: number | null;
  rate_unit: string | null;
  /** Measured from messages when there are enough replies (profile_response_time), else as stored. */
  response_time: string | null;
  /** budget_type slug. */
  budget_tier: string | null;
  persona_badges: string[];
  /** Per role, in the order of the profile's roles. Detail values are taxonomy slugs or numbers. */
  role_details: {
    role_slug: string;
    details: Record<string, string | number | boolean | string[] | null>;
  }[];
  /** Open opportunities this profile posted. */
  opportunities: {
    id: string;
    slug: string;
    title: string;
    role_required: string | null;
    budget_paise: number | null;
    budget_unit: string | null;
    budget_note: string | null;
    location: string | null;
  }[];
  /** Marketplace listings this profile sells, newest first. */
  listings: ListingRow[];
  /** Studios this profile owns. */
  studios: {
    slug: string;
    name: string;
    location: string | null;
    hourly_rate_paise: number | null;
  }[];
};

const REVIEW = "id, author_name, author_org, context, rating, body, response";
const WORK =
  "id, title, kind, description, role, collaborators, cover_url, media_url, release_year";
const FLAGS = "roles, trust_badges, is_verified, hourly_rate_paise, budget_tier, persona_badges";

/**
 * How fast this profile replies, measured from its messages (median over the last 90 days). Null
 * with fewer than three replies, or before the function exists.
 */
async function measuredResponseTime(client: SupabaseClient, profileId: string) {
  const rpc = client.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: string | null; error: unknown }>;
  const { data, error } = await rpc.call(client, "profile_response_time", { p: profileId });
  return error || !data ? null : data;
}

/** Every section for one profile. RLS decides what the client may see. */
async function loadSections(client: SupabaseClient, profileId: string): Promise<ProfileSections> {
  const [
    services,
    experience,
    gallery,
    reviews,
    portfolio,
    profile,
    roleDetails,
    opportunities,
    listings,
    studios,
    measured,
  ] = await Promise.all([
    client
      .from("profile_services")
      .select(
        "id, name, description, price_paise, price_unit, price_note, turnaround, mode, availability, category, pricing_model, work_modes",
      )
      .eq("profile_id", profileId)
      // Profile cards show live services only: drafts are the owner's, paused ones take no enquiries.
      .eq("status", "active")
      .order("sort_order"),
    client
      .from("profile_experience")
      .select("id, title, org, start_year, end_year, detail")
      .eq("profile_id", profileId)
      .order("sort_order"),
    client
      .from("profile_gallery")
      .select("id, image_url")
      .eq("profile_id", profileId)
      .order("sort_order"),
    softSelect(
      (columns) =>
        client
          .from("reviews")
          .select(columns)
          .eq("target_profile_id", profileId)
          .order("created_at", { ascending: false }),
      `${REVIEW}, tags`,
      REVIEW,
    ),
    softSelect(
      (columns) =>
        client
          .from("portfolio_items")
          .select(columns)
          .eq("user_id", profileId)
          .eq("published", true)
          // Featured work leads the profile, which is what the Reorder screen promises.
          .order("featured", { ascending: false })
          .order("sort_order")
          .order("created_at", { ascending: false }),
      `${WORK}, duration`,
      WORK,
    ),
    softSelect(
      (columns) => client.from("profiles").select(columns).eq("id", profileId).maybeSingle(),
      `${FLAGS}, rate_paise, rate_unit, response_time`,
      FLAGS,
    ),
    client.from("profile_role_details").select("role_slug, details").eq("profile_id", profileId),
    client
      .from("opportunities")
      .select("id, slug, title, role_required, budget_paise, budget_unit, budget_note, location")
      .eq("creator_profile_id", profileId)
      .eq("status", "open")
      .order("created_at", { ascending: false }),
    client
      .from("marketplace_listings")
      .select(
        "id, slug, title, category, item_category, item_category_kind, condition, price_paise, price_unit, price_note, image_url, created_at, seller_name",
      )
      .eq("seller_profile_id", profileId)
      .order("created_at", { ascending: false }),
    client
      .from("studios")
      .select("slug, name, location, hourly_rate_paise")
      .eq("owner_profile_id", profileId)
      .order("created_at"),
    measuredResponseTime(client, profileId),
  ]);
  const failed = [
    services,
    experience,
    gallery,
    reviews,
    portfolio,
    profile,
    roleDetails,
    opportunities,
    listings,
    studios,
  ].find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  const flags = profile.data as {
    roles?: string[] | null;
    trust_badges?: string[];
    is_verified?: boolean;
    hourly_rate_paise?: number | null;
    rate_paise?: number | null;
    rate_unit?: string | null;
    response_time?: string | null;
    budget_tier?: string | null;
    persona_badges?: string[];
  } | null;
  const roleOrder = flags?.roles ?? [];
  const rank = (slug: string) => {
    const i = roleOrder.indexOf(slug);
    return i < 0 ? roleOrder.length : i;
  };
  return {
    services: (services.data ?? []) as ProfileSections["services"],
    experience: (experience.data ?? []) as ProfileSections["experience"],
    gallery: (gallery.data ?? []) as ProfileSections["gallery"],
    reviews: ((reviews.data ?? []) as Partial<ProfileSections["reviews"][number]>[]).map(
      (r) =>
        ({
          ...r,
          rating: Number(r.rating),
          tags: r.tags ?? [],
        }) as ProfileSections["reviews"][number],
    ),
    portfolio: ((portfolio.data ?? []) as Partial<ProfileSections["portfolio"][number]>[]).map(
      (w) => ({ ...w, duration: w.duration ?? null }) as ProfileSections["portfolio"][number],
    ),
    trust_badges: flags?.trust_badges ?? [],
    is_verified: flags?.is_verified ?? false,
    hourly_rate_paise: flags?.hourly_rate_paise ?? null,
    // Before rate_paise exists, or where it was never set, the hourly rate is the rate.
    ...(flags?.rate_paise != null
      ? { rate_paise: flags.rate_paise, rate_unit: flags.rate_unit ?? null }
      : {
          rate_paise: flags?.hourly_rate_paise ?? null,
          rate_unit: flags?.hourly_rate_paise != null ? "hour" : null,
        }),
    response_time: measured ?? flags?.response_time ?? null,
    budget_tier: flags?.budget_tier ?? null,
    persona_badges: flags?.persona_badges ?? [],
    role_details: ((roleDetails.data ?? []) as ProfileSections["role_details"]).sort(
      (a, b) => rank(a.role_slug) - rank(b.role_slug),
    ),
    opportunities: (opportunities.data ?? []) as ProfileSections["opportunities"],
    listings: ((listings.data ?? []) as Omit<ListingRow, "seller">[]).map((l) => ({
      ...l,
      seller: null,
    })),
    studios: (studios.data ?? []) as ProfileSections["studios"],
  };
}

/** Sections of a public profile, read with the anon key. */
export const getPublicProfileSections = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ profileId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => loadSections(await anonClient(), data.profileId));

/** The signed-in user's own sections. */
export const getMyProfileSections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) =>
    loadSections(context.supabase as unknown as SupabaseClient, context.userId),
  );

/**
 * The owner's experience list, as Edit profile shows it: the whole list is written back in order
 * (rows not sent are removed). Years are whole years; an open role has no end year.
 */
export const saveMyExperience = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        items: z
          .array(
            z.object({
              title: z.string().trim().min(1).max(120),
              org: z.string().trim().max(120).optional(),
              startYear: z.number().int().min(1950).max(2100).nullable().optional(),
              endYear: z.number().int().min(1950).max(2100).nullable().optional(),
              detail: z.string().trim().max(500).optional(),
            }),
          )
          .max(30),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const client = context.supabase as unknown as SupabaseClient;
    const del = await client.from("profile_experience").delete().eq("profile_id", context.userId);
    if (del.error) throw new Error(del.error.message);
    if (!data.items.length) return { count: 0 };
    const { error } = await client.from("profile_experience").insert(
      data.items.map((e, i) => ({
        profile_id: context.userId,
        title: e.title,
        org: e.org || null,
        start_year: e.startYear ?? null,
        end_year: e.endYear ?? null,
        detail: e.detail || null,
        sort_order: i,
      })) as never,
    );
    if (error) throw new Error(error.message);
    return { count: data.items.length };
  });

/** One role's professional details (turnaround, setup…), as Edit profile shows them. */
export const saveMyRoleDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        roleSlug: z.string().min(1).max(80),
        details: z.record(
          z.string().max(80),
          z.union([
            z.string().max(300),
            z.number(),
            z.boolean(),
            z.array(z.string().max(80)).max(30),
            z.null(),
          ]),
        ),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const client = context.supabase as unknown as SupabaseClient;
    const { error } = await client
      .from("profile_role_details")
      .update({ details: data.details, updated_at: new Date().toISOString() } as never)
      .eq("profile_id", context.userId)
      .eq("role_slug", data.roleSlug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type WorkEventCounts = {
  views: number;
  shares: number;
  profileClicks: number;
  linkClicks: number;
  saves: number;
};

/**
 * Views, shares, profile clicks and link clicks per work, for the account's own performance
 * screen (portfolio_item_events, readable only by the work's owner). Null when the events cannot
 * be read — before the table exists — so the figures show a dash, not a zero.
 * Schema: supabase/migrations/20260918230000_section_sources.sql
 */
export const myPortfolioEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<WorkEventCounts | null> => {
    const client = context.supabase as unknown as SupabaseClient;
    const { data: rows, error } = await client
      .from("portfolio_item_events")
      .select("kind")
      .eq("item_id", data.id);
    if (error) return null;
    // Saves live in saved_items; only the owner gets the count back (portfolio_save_count).
    const rpc = client.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: number | null; error: unknown }>;
    const saved = await rpc.call(client, "portfolio_save_count", { p_item: data.id });
    const counts: WorkEventCounts = {
      views: 0,
      shares: 0,
      profileClicks: 0,
      linkClicks: 0,
      saves: saved.error ? 0 : Number(saved.data ?? 0),
    };
    for (const row of (rows ?? []) as { kind: string }[]) {
      if (row.kind === "view") counts.views += 1;
      else if (row.kind === "share") counts.shares += 1;
      else if (row.kind === "profile_click") counts.profileClicks += 1;
      else if (row.kind === "link_click") counts.linkClicks += 1;
    }
    return counts;
  });
