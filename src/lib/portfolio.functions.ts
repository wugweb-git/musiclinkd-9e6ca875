import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ListingRow } from "@/lib/catalog.functions";

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
  city: z.string().max(80).optional().nullable(),
  state: z.string().max(80).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
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
  availability: z.string().max(40).optional().nullable(),
  avatar_url: z.string().max(500).optional().nullable(),
  cover_url: z.string().max(500).optional().nullable(),
  links: z.record(z.string(), z.string().max(300)).optional(),
  discovery_prefs: z.record(z.string(), z.unknown()).optional(),
  onboarding_step: z.string().max(40).optional().nullable(),
  onboarding_draft: z.record(z.string(), z.unknown()).optional(),
  onboarding_complete: z.boolean().optional(),
});

export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => profilePatchSchema.parse(d))

  .handler(async ({ context, data }) => {
    const patch = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    ) as Record<string, unknown>;
    const { data: row, error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, ...patch } as never, { onConflict: "id" })
      .select()
      .single();
    if (error) throw new Error(usernameError(error) ?? error.message);
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

/** Public profile read — anon key, safe columns only, no session. */
export const getPublicProfile = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ username: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data }) => {
    const client = await anonClient();

    const { data: row } = await client
      .from("profiles")
      .select(
        "id, username, display_name, headline, bio, city, state, country, roles, instruments, genres, languages, specialisations, work_modes, experience_level, availability, avatar_url, cover_url, links, visibility",
      )
      .eq("username", data.username)
      .maybeSingle();

    if (!row || (row as { visibility?: string }).visibility === "private") return null;
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
  }[];
  portfolio: {
    id: string;
    title: string;
    kind: string;
    description: string | null;
    role: string | null;
    collaborators: string[];
    cover_url: string | null;
    release_year: number | null;
  }[];
  trust_badges: string[];
  is_verified: boolean;
  hourly_rate_paise: number | null;
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
  ] = await Promise.all([
    client
      .from("profile_services")
      .select(
        "id, name, description, price_paise, price_unit, price_note, turnaround, mode, availability",
      )
      .eq("profile_id", profileId)
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
    client
      .from("reviews")
      .select("id, author_name, author_org, context, rating, body, response")
      .eq("target_profile_id", profileId)
      .order("created_at", { ascending: false }),
    client
      .from("portfolio_items")
      .select("id, title, kind, description, role, collaborators, cover_url, release_year")
      .eq("user_id", profileId)
      .eq("published", true)
      .order("sort_order")
      .order("created_at", { ascending: false }),
    client
      .from("profiles")
      .select("roles, trust_badges, is_verified, hourly_rate_paise, budget_tier, persona_badges")
      .eq("id", profileId)
      .maybeSingle(),
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
    reviews: ((reviews.data ?? []) as ProfileSections["reviews"]).map((r) => ({
      ...r,
      rating: Number(r.rating),
    })),
    portfolio: (portfolio.data ?? []) as ProfileSections["portfolio"],
    trust_badges: flags?.trust_badges ?? [],
    is_verified: flags?.is_verified ?? false,
    hourly_rate_paise: flags?.hourly_rate_paise ?? null,
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
