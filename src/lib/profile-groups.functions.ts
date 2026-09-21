import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anonClient, softSelect } from "@/lib/portfolio.functions";
import { GOOGLE_MAPS, placeLine } from "@/lib/place";
import { CITY_PATTERN, INDIAN_STATES } from "@/lib/validation";
import { createBusinessPage } from "@/lib/pages.functions";

/*
 * Business accounts. MusicLinkd has two account kinds, talent and business, in one username
 * namespace; an account is a business when it has a profile_business row. Every business screen
 * reads these functions. Private profiles return null. Schema:
 * supabase/migrations/20260914170000_profile_sections.sql, 20260914180000_catalog.sql and
 * 20260915120000_business_accounts.sql.
 */

const username = z.object({ username: z.string().min(1).max(60) });

type ProfileBase = {
  id: string;
  username: string | null;
  display_name: string | null;
  headline: string | null;
  bio: string | null;
  city: string | null;
  roles: string[] | null;
  genres: string[] | null;
  avatar_url: string | null;
  cover_url: string | null;
  is_verified: boolean;
  hourly_rate_paise: number | null;
  visibility: string | null;
  /** Website and socials by platform key ("website", "instagram"). */
  links?: Record<string, string> | null;
  /** Neighbourhood within the city. The columns below arrive with 20260918240000_missing_data.sql. */
  pin_code?: string | null;
  /** Kept from reviews by the database; null while there are none. */
  rating?: number | string | null;
  review_count?: number;
  followers_count?: number;
};

export type BusinessRecord = {
  profile: ProfileBase;
  business: {
    business_address: string | null;
    operating_hours: string | null;
    logo_url: string | null;
    hero_banner_url: string | null;
    founded_year: number | null;
    /** The Google Maps link the business added (20260921290000_pin_codes_and_maps.sql). */
    maps_url?: string | null;
    /** Its rules, one per entry (20260922180000_amenities_equipment_policies.sql). */
    policies?: string[] | null;
    /** The registered name ("SoundHouse Studio LLP"). */
    legal_name?: string | null;
  };
  /** Drafts are the owner's only, so a public read has active and paused services. */
  services: {
    id: string;
    name: string;
    price_paise: number | null;
    price_unit: string | null;
    price_note: string | null;
    /** service_categories slug. */
    category: string | null;
    status: "active" | "paused" | "draft";
  }[];
  team: {
    id: string;
    name: string;
    role: string | null;
    experience: string | null;
    photo_url: string | null;
    since_year: number | null;
    status: "active" | "invited";
  }[];
  gallery: { id: string; image_url: string }[];
  /** Published portfolio items, shown as credits. */
  credits: { id: string; title: string; role: string | null; release_year: number | null }[];
  /** Reviews of the business account and of its studio, newest first. */
  reviews: {
    id: string;
    author_name: string;
    author_org: string | null;
    context: string | null;
    rating: number;
    body: string;
    response: string | null;
    tags: string[];
  }[];
  studio: {
    rating: number | null;
    review_count: number;
    rooms: {
      id: string;
      name: string;
      kind: string | null;
      capacity: number | null;
      hourly_rate_paise: number | null;
      gear: string[];
      photo_url: string | null;
      sort_order: number;
    }[];
  } | null;
};

/** A business account in a list: enough for a row that links to its page. */
export type BusinessSummary = {
  username: string;
  display_name: string | null;
  headline: string | null;
  city: string | null;
};

/** Private and deactivated profiles are left out of every public read. */
const isHidden = (visibility: string | null) =>
  visibility === "private" || visibility === "deactivated";

const PROFILE =
  "id, username, display_name, headline, bio, city, roles, genres, avatar_url, cover_url, is_verified, hourly_rate_paise, visibility, links";
/** PROFILE with the missing-data columns; reads fall back to PROFILE until they exist. */
const PROFILE_FULL = `${PROFILE}, pin_code, rating, review_count, followers_count`;

const BUSINESS =
  "business_address, operating_hours, logo_url, hero_banner_url, founded_year, maps_url, policies";
const REVIEW = "id, author_name, author_org, context, rating, body, response, created_at";
const REVIEW_FULL = `${REVIEW}, tags`;
const STUDIO = (review: string) =>
  `id, rating, review_count, rooms:studio_rooms(id, name, kind, capacity, hourly_rate_paise, gear, photo_url, sort_order), reviews(${review})`;

async function businessRecord(
  client: SupabaseClient,
  profile: ProfileBase,
): Promise<BusinessRecord | null> {
  const [business, services, team, gallery, credits, reviews, studios] = await Promise.all([
    softSelect(
      (columns) =>
        client.from("profile_business").select(columns).eq("profile_id", profile.id).maybeSingle(),
      `${BUSINESS}, legal_name`,
      BUSINESS,
    ),
    client
      .from("profile_services")
      .select("id, name, price_paise, price_unit, price_note, category, status")
      .eq("profile_id", profile.id)
      .order("sort_order"),
    client
      .from("profile_members")
      .select("id, name, role, experience, photo_url, since_year, status")
      .eq("profile_id", profile.id)
      .eq("kind", "team")
      .order("sort_order"),
    client
      .from("profile_gallery")
      .select("id, image_url")
      .eq("profile_id", profile.id)
      .order("sort_order"),
    client
      .from("portfolio_items")
      .select("id, title, role, release_year")
      .eq("user_id", profile.id)
      .eq("published", true)
      .order("sort_order")
      .order("created_at", { ascending: false }),
    softSelect(
      (columns) => client.from("reviews").select(columns).eq("target_profile_id", profile.id),
      REVIEW_FULL,
      REVIEW,
    ),
    softSelect(
      (columns) =>
        client
          .from("studios")
          .select(columns)
          .eq("owner_profile_id", profile.id)
          .order("created_at")
          .limit(1),
      STUDIO(REVIEW_FULL),
      STUDIO(REVIEW),
    ),
  ]);
  const failed = [business, services, team, gallery, credits, reviews, studios].find(
    (r) => r.error,
  );
  if (failed?.error) throw new Error(failed.error.message);
  if (!business.data) return null;

  type StoredReview = Partial<BusinessRecord["reviews"][number]> & {
    id: string;
    author_name: string;
    rating: number;
    body: string;
    created_at: string;
  };
  const studio = (studios.data?.[0] ?? null) as
    | (Omit<NonNullable<BusinessRecord["studio"]>, "rooms"> & {
        rooms: NonNullable<BusinessRecord["studio"]>["rooms"] | null;
        reviews: StoredReview[] | null;
      })
    | null;
  const allReviews = [
    ...((reviews.data ?? []) as unknown as StoredReview[]),
    ...(studio?.reviews ?? []),
  ]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(({ created_at: _created, ...r }) => ({
      ...r,
      author_org: r.author_org ?? null,
      context: r.context ?? null,
      response: r.response ?? null,
      rating: Number(r.rating),
      tags: r.tags ?? [],
    }));

  return {
    profile,
    business: business.data as unknown as BusinessRecord["business"],
    services: (services.data ?? []) as BusinessRecord["services"],
    team: (team.data ?? []) as BusinessRecord["team"],
    gallery: (gallery.data ?? []) as BusinessRecord["gallery"],
    credits: (credits.data ?? []) as BusinessRecord["credits"],
    reviews: allReviews,
    studio: studio
      ? {
          rating: studio.rating == null ? null : Number(studio.rating),
          review_count: studio.review_count,
          rooms: [...(studio.rooms ?? [])]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((room) => ({ ...room, gear: room.gear ?? [] })),
        }
      : null,
  };
}

/** The business account with this username, or null for talent, a private profile or no one. */
export const getPublicBusiness = createServerFn({ method: "GET" })
  .inputValidator((d) => username.parse(d))
  .handler(async ({ data }): Promise<BusinessRecord | null> => {
    const client = await anonClient();
    const { data: row, error } = await softSelect(
      (columns) =>
        client.from("profiles").select(columns).eq("username", data.username).maybeSingle(),
      PROFILE_FULL,
      PROFILE,
    );
    if (error) throw new Error(error.message);
    const profile = row as unknown as ProfileBase | null;
    if (!profile || isHidden(profile.visibility)) return null;
    return businessRecord(client as unknown as SupabaseClient, profile);
  });

/** The signed-in account, when it is a business. */
export const getMyBusiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BusinessRecord | null> => {
    const client = context.supabase as unknown as SupabaseClient;
    const { data: row, error } = await softSelect(
      (columns) => client.from("profiles").select(columns).eq("id", context.userId).maybeSingle(),
      PROFILE_FULL,
      PROFILE,
    );
    if (error) throw new Error(error.message);
    return row ? businessRecord(client, row as unknown as ProfileBase) : null;
  });

/** The signed-in business updates its own profile_business row (e.g. operating hours). */
export const updateMyBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        operating_hours: z.string().max(500).nullable().optional(),
        maps_url: z
          .string()
          .trim()
          .max(500)
          .refine((v) => v === "" || GOOGLE_MAPS.test(v), "Use a Google Maps link")
          .nullable()
          .optional(),
        /** The business's rules, one per line (20260922180000_amenities_equipment_policies.sql). */
        policies: z.array(z.string().trim().min(1).max(200)).min(1).max(12).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const client = context.supabase as unknown as SupabaseClient;
    const patch: Record<string, string | string[] | null> = {};
    if (data.policies !== undefined) patch["policies"] = data.policies;
    if (data.operating_hours !== undefined) patch["operating_hours"] = data.operating_hours;
    if (data.maps_url !== undefined) patch["maps_url"] = data.maps_url || null;
    const { error } = await client
      .from("profile_business")
      .update(patch as never)
      .eq("profile_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Add a row to the signed-in business's own team roster (profile_members, kind 'team'). */
export const addTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        name: z.string().trim().min(1).max(80),
        role: z.string().trim().max(60).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    const client = context.supabase as unknown as SupabaseClient;
    const { data: row, error } = await client
      .from("profile_members")
      .insert({
        profile_id: context.userId,
        kind: "team",
        name: data.name,
        role: data.role ?? null,
        status: "active",
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row as { id: string };
  });

/** Change a team roster row's part. Owner only, via RLS. */
export const updateTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), role: z.string().trim().max(60) }).parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const client = context.supabase as unknown as SupabaseClient;
    const { error } = await client
      .from("profile_members")
      .update({ role: data.role } as never)
      .eq("id", data.id)
      .eq("profile_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Remove someone from the team roster. */
export const removeTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const client = context.supabase as unknown as SupabaseClient;
    const { error } = await client
      .from("profile_members")
      .delete()
      .eq("id", data.id)
      .eq("profile_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Public business accounts with a username, by name. */
export const listPublicBusinesses = createServerFn({ method: "GET" }).handler(
  async (): Promise<BusinessSummary[]> => {
    const client = await anonClient();
    const { data, error } = await client
      .from("profile_business")
      .select("profile:profiles!inner(username, display_name, headline, city, visibility)");
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as { profile: BusinessSummary & { visibility: string } }[])
      .map((r) => r.profile)
      .filter((p) => p.username && !isHidden(p.visibility))
      .map(({ visibility: _visibility, ...p }) => p)
      .sort((a, b) => (a.display_name ?? "").localeCompare(b.display_name ?? ""));
  },
);

/*
 * Bands and the category directory. These read the same profiles table as the business
 * functions above but answer different screens: /bands/$id and /categories/$slug.
 */

async function publicProfile(client: Awaited<ReturnType<typeof anonClient>>, name: string) {
  const { data, error } = await softSelect(
    (columns) => client.from("profiles").select(columns).eq("username", name).maybeSingle(),
    PROFILE_FULL,
    PROFILE,
  );
  if (error) throw new Error(error.message);
  const row = data as unknown as ProfileBase | null;
  return row && !isHidden(row.visibility) ? row : null;
}

export type BandRecord = {
  profile: ProfileBase;
  lineup: { id: string; name: string; role: string | null }[];
  events: { id: string; title: string; event_date: string | null; venue_name: string | null }[];
};

export const getPublicBand = createServerFn({ method: "GET" })
  .inputValidator((d) => username.parse(d))
  .handler(async ({ data }): Promise<BandRecord | null> => {
    const client = await anonClient();
    const profile = await publicProfile(client, data.username);
    if (!profile) return null;

    const [lineup, events] = await Promise.all([
      client
        .from("profile_members")
        .select("id, name, role")
        .eq("profile_id", profile.id)
        .eq("kind", "lineup")
        .order("sort_order"),
      client
        .from("profile_events")
        .select("id, title, event_date, venue_name")
        .eq("profile_id", profile.id)
        .order("event_date")
        .order("sort_order"),
    ]);
    const failed = [lineup, events].find((r) => r.error);
    if (failed?.error) throw new Error(failed.error.message);
    if (!lineup.data?.length && !events.data?.length) return null;

    return {
      profile,
      lineup: (lineup.data ?? []) as BandRecord["lineup"],
      events: (events.data ?? []) as BandRecord["events"],
    };
  });

export type DirectoryPerson = {
  id: string;
  username: string;
  name: string;
  headline: string | null;
  city: string | null;
  roles: string[];
  genres: string[];
  avatarUrl: string | null;
  verified: boolean;
  /** Neighbourhood within the city. */
  pin_code: string | null;
  /** Null while the person has no reviews. */
  rating: number | null;
  reviewCount: number;
};

/**
 * Settings > Privacy > "Appear in Discover": No stores discovery_prefs.appear = false, and those
 * people drop out of the directory and search. Unset (the default) means they appear.
 */
const APPEARS_IN_DISCOVER = "discovery_prefs->>appear.is.null,discovery_prefs->>appear.neq.false";

/** A stored profile as a directory entry. */
function directoryPerson(r: ProfileBase): DirectoryPerson {
  const reviewCount = r.review_count ?? 0;
  return {
    id: r.id,
    username: r.username ?? "",
    name: r.display_name ?? r.username ?? "",
    headline: r.headline,
    city: r.city,
    roles: r.roles ?? [],
    genres: r.genres ?? [],
    avatarUrl: r.avatar_url,
    verified: Boolean(r.is_verified),
    pin_code: r.pin_code ?? null,
    rating: reviewCount && r.rating != null ? Number(r.rating) : null,
    reviewCount,
  };
}

/*
 * Everyone in one category, for /categories/$slug. Public profiles only (RLS keeps the rest out of
 * an anonymous read, and "limited" is filtered here too). No counts are invented: the screen shows
 * what the query returns.
 */
export const listPeopleByRole = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        role: z.string().min(1).max(60).optional(),
        limit: z.number().int().min(1).max(60).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<DirectoryPerson[]> => {
    const client = await anonClient();
    const { data: rows, error } = await softSelect(
      (columns) => {
        let query = client
          .from("profiles")
          .select(columns)
          .eq("visibility", "public")
          .or(APPEARS_IN_DISCOVER);
        if (data.role) query = query.contains("roles", [data.role]);
        return query.order("is_verified", { ascending: false }).limit(data.limit ?? 40);
      },
      PROFILE_FULL,
      PROFILE,
    );
    if (error) throw new Error(error.message);
    return ((rows ?? []) as unknown as ProfileBase[]).map(directoryPerson);
  });

/*
 * Search across people. The text runs over the name, username, headline and city; a role or a
 * genre narrows it by taxonomy slug. Public profiles only, and the count is the count the
 * database gives — nothing here estimates.
 */
export const searchPeople = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        q: z.string().trim().max(80).optional(),
        role: z.string().max(60).optional(),
        genre: z.string().max(60).optional(),
        verifiedOnly: z.boolean().optional(),
        limit: z.number().int().min(1).max(60).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ people: DirectoryPerson[]; total: number }> => {
    const client = await anonClient();
    // A comma or a bracket would be read as another condition, so neither survives the text.
    const text = (data.q ?? "").replace(/[,()]/g, " ").trim();
    const search = (columns: string) => {
      let query = client
        .from("profiles")
        .select(columns, { count: "exact" })
        .eq("visibility", "public")
        .or(APPEARS_IN_DISCOVER);
      // Every word has to appear somewhere, so "tabla mumbai" finds a tabla player in Mumbai.
      for (const word of text.split(/\s+/).filter(Boolean).slice(0, 4)) {
        const like = `%${word}%`;
        query = query.or(
          `display_name.ilike.${like},username.ilike.${like},headline.ilike.${like},city.ilike.${like}`,
        );
      }
      if (data.role) query = query.contains("roles", [data.role]);
      if (data.genre) query = query.contains("genres", [data.genre]);
      if (data.verifiedOnly) query = query.eq("is_verified", true);
      return query.order("is_verified", { ascending: false }).limit(data.limit ?? 40);
    };

    const { data: rows, count, error } = await softSelect(search, PROFILE_FULL, PROFILE);
    if (error) throw new Error(error.message);
    return {
      people: ((rows ?? []) as unknown as ProfileBase[]).map(directoryPerson),
      total: count ?? 0,
    };
  });

/**
 * Whether the signed-in account is a business — the same signal this file's own comment
 * establishes ("an account is a business when it has a profile_business row"), as a cheap
 * boolean instead of the full getMyBusiness() record. For gating business-only screens
 * (business.bookings.*, business.availability/pricing/policies) — see contextual-profile-rule.
 */
export const isMyAccountBusiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<boolean> => {
    const client = context.supabase as unknown as SupabaseClient;
    const { data, error } = await client
      .from("profile_business")
      .select("profile_id")
      .eq("profile_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return Boolean(data);
  });

/**
 * The company line on the signed-in account's share card: a business's registered name
 * (profile_business.legal_name) or its name; for talent, the org of their current experience
 * (profile_experience with no end year), if any. Null when there is none.
 */
export const getMyCompany = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<string | null> => {
    const client = context.supabase as unknown as SupabaseClient;
    const [business, profile, current] = await Promise.all([
      client
        .from("profile_business")
        .select("legal_name")
        .eq("profile_id", context.userId)
        .maybeSingle(),
      client.from("profiles").select("display_name").eq("id", context.userId).maybeSingle(),
      client
        .from("profile_experience")
        .select("org")
        .eq("profile_id", context.userId)
        .is("end_year", null)
        .not("org", "is", null)
        .order("sort_order")
        .limit(1)
        .maybeSingle(),
    ]);
    if (business.error) throw new Error(business.error.message);
    if (business.data) {
      const legal = (business.data as { legal_name: string | null }).legal_name?.trim();
      const name = (profile.data as { display_name: string | null } | null)?.display_name?.trim();
      return legal || name || null;
    }
    if (current.error) throw new Error(current.error.message);
    return (current.data as { org: string | null } | null)?.org?.trim() || null;
  });

/*
 * Create Business extends a business account's own profile (owner's call): the name, tagline and
 * place go on the profile, the address on its profile_business row — and that row is what makes
 * the account a business. The type is a business person type from the taxonomy (Recording Studio,
 * Music Label, Venue…) and becomes the profile's role when it has none yet.
 */

/** The business person types (taxonomy_options metadata.flow business / business_user). */
async function businessTypeSlugs(client: SupabaseClient) {
  const { data, error } = await client
    .from("taxonomy_options")
    .select("slug")
    .eq("category_key", "person_types")
    .in("metadata->>flow", ["business", "business_user"]);
  if (error) throw new Error(error.message);
  return new Set((data as { slug: string }[] | null)?.map((o) => o.slug) ?? []);
}

/** True when the account already has talent roles: any person type that isn't a business type. */
async function isTalentAccount(
  client: SupabaseClient,
  roles: readonly string[] | null | undefined,
) {
  if (!roles?.length) return false;
  const business = await businessTypeSlugs(client);
  return roles.some((r) => !business.has(r));
}

export const createMyBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        type: z.string().regex(/^[a-z_]{2,40}$/),
        name: z.string().trim().min(1).max(80),
        tagline: z.string().trim().max(160).optional(),
        city: z.string().trim().regex(CITY_PATTERN),
        pinCode: z.string().regex(/^[1-9]\d{5}$/),
        state: z
          .string()
          .refine((v) => (INDIAN_STATES as readonly string[]).includes(v))
          .optional(),
        mapsUrl: z.string().trim().max(500).regex(GOOGLE_MAPS).optional(),
        /** Taxonomy slugs: languages, genres, studio_amenities and equipment_categories. */
        policies: z.array(z.string().trim().min(1).max(200)).min(1).max(12),
        genres: z
          .array(z.string().regex(/^[a-z0-9_]{2,40}$/))
          .max(10)
          .optional(),
        languages: z
          .array(z.string().regex(/^[a-z0-9_]{2,40}$/))
          .max(20)
          .optional(),
        amenities: z
          .array(z.string().regex(/^[a-z0-9_]{2,40}$/))
          .max(40)
          .optional(),
        equipment: z
          .array(z.string().regex(/^[a-z0-9_]{2,40}$/))
          .max(20)
          .optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<CreatedBusiness> => {
    const client = context.supabase as unknown as SupabaseClient;
    const { data: me, error: readError } = await client
      .from("profiles")
      .select("username, roles")
      .eq("id", context.userId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    const current = (me as { username: string | null; roles: string[] | null } | null) ?? null;
    if (!(await businessTypeSlugs(client)).has(data.type)) {
      throw new Error("Pick a business type from the list.");
    }
    // A talent login gets a business page it owns (owner, 22 Sep 2026), so its own profile is
    // never touched. A login that signed up as a business is the business itself, as before.
    if (await isTalentAccount(client, current?.roles)) {
      const page = await createBusinessPage(context.userId, data.name, (admin, pageId, username) =>
        setUpBusiness(admin, pageId, data, { username, roles: null }, false),
      );
      return { username: page.username, pageId: page.pageId };
    }
    // One account, one business profile. A studio whose studio row failed last time may retry,
    // which finishes the setup instead of leaving it without one.
    const [{ data: owned, error: ownedError }, { data: existing, error: existingError }] =
      await Promise.all([
        client
          .from("profile_business")
          .select("profile_id")
          .eq("profile_id", context.userId)
          .maybeSingle(),
        client.from("studios").select("id").eq("owner_profile_id", context.userId).limit(1),
      ]);
    if (ownedError) throw new Error(ownedError.message);
    if (existingError) throw new Error(existingError.message);
    const hasStudio = Boolean(existing?.length);
    if (owned && (data.type !== "studio" || hasStudio)) {
      throw new Error("This account already has a business profile.");
    }

    await setUpBusiness(client, context.userId, data, current, hasStudio);
    return { username: current?.username ?? null, pageId: null };
  });

export type CreatedBusiness = {
  username: string | null;
  /** Set when a talent login got a business page; the owner is switched into it next. */
  pageId: string | null;
};

/** Writes a business onto a profile row: its name and place, business details, and its studio. */
async function setUpBusiness(
  client: SupabaseClient,
  profileId: string,
  data: {
    type: string;
    name: string;
    tagline?: string | undefined;
    city: string;
    pinCode: string;
    state?: string | undefined;
    mapsUrl?: string | undefined;
    languages?: string[] | undefined;
    genres?: string[] | undefined;
    policies?: string[] | undefined;
    amenities?: string[] | undefined;
    equipment?: string[] | undefined;
  },
  current: { username: string | null; roles: string[] | null } | null,
  hasStudio: boolean,
) {
  const role = data.type;
  const { error } = await client
    .from("profiles")
    .update({
      display_name: data.name,
      city: data.city,
      ...(data.state ? { state: data.state, country: "India" } : {}),
      ...(data.languages?.length ? { languages: data.languages } : {}),
      ...(data.genres?.length ? { genres: data.genres } : {}),
      ...(data.pinCode ? { pin_code: data.pinCode } : {}),
      ...(data.tagline ? { headline: data.tagline } : {}),
      ...(role && !current?.roles?.length ? { roles: [role] } : {}),
      // Creating the business is the end of a business account's onboarding; without this the
      // next sign-in would send it back to /onboarding.
      onboarding_complete: true,
      onboarding_step: null,
    } as never)
    .eq("id", profileId);
  if (error) throw new Error(error.message);

  const { error: businessError } = await client.from("profile_business").upsert({
    profile_id: profileId,
    // The address is the city and PIN code; Directions opens the Maps link.
    business_address: placeLine(data.city, data.pinCode) || null,
    maps_url: data.mapsUrl ?? null,
    ...(data.policies?.length ? { policies: data.policies } : {}),
    updated_at: new Date().toISOString(),
  } as never);
  if (businessError) throw new Error(businessError.message);

  // A studio business gets its studio too, so weekly hours, the calendar, equipment and proof
  // photos work from day one. Its slug follows the account's username when that is free.
  if (data.type === "studio") {
    if (!hasStudio) {
      const base =
        current?.username?.replace(/[._]+/g, "-") ||
        data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .slice(0, 60) ||
        "studio";
      const { data: taken } = await client.from("studios").select("id").eq("slug", base).limit(1);
      const slug = taken?.length ? `${base}-${Math.random().toString(36).slice(2, 7)}` : base;
      const { data: studio, error: studioError } = await client
        .from("studios")
        .insert({
          owner_profile_id: profileId,
          slug,
          name: data.name,
          location: placeLine(data.city, data.pinCode) || null,
          amenities: data.amenities ?? [],
        } as never)
        .select("id")
        .single();
      if (studioError) throw new Error(studioError.message);
      // Equipment starts as the categories picked (Microphones, Studio Monitors…); the owner adds
      // makes and models later under Manage → Equipment.
      const studioId = (studio as { id: string }).id;
      if (data.equipment?.length) {
        const { data: labels } = await client
          .from("taxonomy_options")
          .select("slug, label")
          .eq("category_key", "equipment_categories")
          .in("slug", data.equipment);
        const byslug = new Map(
          ((labels ?? []) as { slug: string; label: string }[]).map((l) => [l.slug, l.label]),
        );
        const { error: equipmentError } = await client.from("studio_equipment").insert(
          data.equipment
            .filter((e) => byslug.has(e))
            .map((e, i) => ({
              studio_id: studioId,
              name: byslug.get(e)!,
              category: e,
              sort_order: i,
            })) as never,
        );
        if (equipmentError) throw new Error(equipmentError.message);
      }
    }
  }
}
