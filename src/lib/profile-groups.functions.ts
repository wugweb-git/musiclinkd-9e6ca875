import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anonClient } from "@/lib/portfolio.functions";

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
};

export type BusinessRecord = {
  profile: ProfileBase;
  business: {
    business_address: string | null;
    operating_hours: string | null;
    logo_url: string | null;
    hero_banner_url: string | null;
    founded_year: number | null;
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
    rating: number;
    body: string;
    response: string | null;
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

const PROFILE =
  "id, username, display_name, headline, bio, city, roles, genres, avatar_url, cover_url, is_verified, hourly_rate_paise, visibility";

async function businessRecord(
  client: SupabaseClient,
  profile: ProfileBase,
): Promise<BusinessRecord | null> {
  const [business, services, team, gallery, credits, reviews, studios] = await Promise.all([
    client
      .from("profile_business")
      .select("business_address, operating_hours, logo_url, hero_banner_url, founded_year")
      .eq("profile_id", profile.id)
      .maybeSingle(),
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
    client
      .from("reviews")
      .select("id, author_name, rating, body, response, created_at")
      .eq("target_profile_id", profile.id),
    client
      .from("studios")
      .select(
        "id, rating, review_count, rooms:studio_rooms(id, name, kind, capacity, hourly_rate_paise, gear, photo_url, sort_order), reviews(id, author_name, rating, body, response, created_at)",
      )
      .eq("owner_profile_id", profile.id)
      .order("created_at")
      .limit(1),
  ]);
  const failed = [business, services, team, gallery, credits, reviews, studios].find(
    (r) => r.error,
  );
  if (failed?.error) throw new Error(failed.error.message);
  if (!business.data) return null;

  type StoredReview = BusinessRecord["reviews"][number] & { created_at: string };
  const studio = (studios.data?.[0] ?? null) as
    | (Omit<NonNullable<BusinessRecord["studio"]>, "rooms"> & {
        rooms: NonNullable<BusinessRecord["studio"]>["rooms"] | null;
        reviews: StoredReview[] | null;
      })
    | null;
  const allReviews = [...((reviews.data ?? []) as StoredReview[]), ...(studio?.reviews ?? [])]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(({ created_at: _created, ...r }) => ({ ...r, rating: Number(r.rating) }));

  return {
    profile,
    business: business.data as BusinessRecord["business"],
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
    const { data: row, error } = await client
      .from("profiles")
      .select(PROFILE)
      .eq("username", data.username)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const profile = row as ProfileBase | null;
    if (!profile || profile.visibility === "private") return null;
    return businessRecord(client as unknown as SupabaseClient, profile);
  });

/** The signed-in account, when it is a business. */
export const getMyBusiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BusinessRecord | null> => {
    const client = context.supabase as unknown as SupabaseClient;
    const { data: row, error } = await client
      .from("profiles")
      .select(PROFILE)
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? businessRecord(client, row as ProfileBase) : null;
  });

/** The signed-in business updates its own profile_business row (e.g. operating hours). */
export const updateMyBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ operating_hours: z.string().max(500).nullable() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const client = context.supabase as unknown as SupabaseClient;
    const { error } = await client
      .from("profile_business")
      .update({ operating_hours: data.operating_hours } as never)
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
      .filter((p) => p.username && p.visibility !== "private")
      .map(({ visibility: _visibility, ...p }) => p)
      .sort((a, b) => (a.display_name ?? "").localeCompare(b.display_name ?? ""));
  },
);

/*
 * Bands and the category directory. These read the same profiles table as the business
 * functions above but answer different screens: /bands/$id and /categories/$slug.
 */

async function publicProfile(client: Awaited<ReturnType<typeof anonClient>>, name: string) {
  const { data, error } = await client
    .from("profiles")
    .select(PROFILE)
    .eq("username", name)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = data as ProfileBase | null;
  return row && row.visibility !== "private" ? row : null;
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
};

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
    let query = client.from("profiles").select(PROFILE).eq("visibility", "public");
    if (data.role) query = query.contains("roles", [data.role]);
    const { data: rows, error } = await query
      .order("is_verified", { ascending: false })
      .limit(data.limit ?? 40);
    if (error) throw new Error(error.message);
    return ((rows ?? []) as ProfileBase[]).map((r) => ({
      id: r.id,
      username: r.username ?? "",
      name: r.display_name ?? r.username ?? "",
      headline: r.headline,
      city: r.city,
      roles: r.roles ?? [],
      genres: r.genres ?? [],
      avatarUrl: r.avatar_url,
      verified: Boolean(r.is_verified),
    }));
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
    let query = client
      .from("profiles")
      .select(PROFILE, { count: "exact" })
      .eq("visibility", "public");

    // A comma or a bracket would be read as another condition, so neither survives the text.
    const text = (data.q ?? "").replace(/[,()]/g, " ").trim();
    if (text) {
      const like = `%${text}%`;
      query = query.or(
        `display_name.ilike.${like},username.ilike.${like},headline.ilike.${like},city.ilike.${like}`,
      );
    }
    if (data.role) query = query.contains("roles", [data.role]);
    if (data.genre) query = query.contains("genres", [data.genre]);
    if (data.verifiedOnly) query = query.eq("is_verified", true);

    const {
      data: rows,
      count,
      error,
    } = await query.order("is_verified", { ascending: false }).limit(data.limit ?? 40);
    if (error) throw new Error(error.message);
    return {
      people: ((rows ?? []) as ProfileBase[]).map((r) => ({
        id: r.id,
        username: r.username ?? "",
        name: r.display_name ?? r.username ?? "",
        headline: r.headline,
        city: r.city,
        roles: r.roles ?? [],
        genres: r.genres ?? [],
        avatarUrl: r.avatar_url,
        verified: Boolean(r.is_verified),
      })),
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

/*
 * Create Business extends the signed-in account's own profile (owner's call): the name, tagline
 * and city go on the profile, the address on its profile_business row — and that row is what
 * makes the account a business. The type sets the profile's role only when it has none yet, so a
 * role picked in onboarding is never overwritten. Types with no matching role (production house,
 * rental house) leave roles alone.
 */
const ROLE_FOR_TYPE: Record<string, string> = {
  studio: "studio",
  label: "music_label",
  venue: "venue",
  agency: "booking_agency",
};

export const createMyBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        type: z.enum(["studio", "label", "production_house", "venue", "agency", "rental"]),
        name: z.string().trim().min(1).max(80),
        tagline: z.string().trim().max(160).optional(),
        city: z.string().trim().max(80),
        address: z.string().trim().max(300).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ username: string | null }> => {
    const client = context.supabase as unknown as SupabaseClient;
    const { data: me, error: readError } = await client
      .from("profiles")
      .select("username, roles")
      .eq("id", context.userId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    const current = (me as { username: string | null; roles: string[] | null } | null) ?? null;
    const role = ROLE_FOR_TYPE[data.type];

    const { error } = await client
      .from("profiles")
      .update({
        display_name: data.name,
        city: data.city,
        ...(data.tagline ? { headline: data.tagline } : {}),
        ...(role && !current?.roles?.length ? { roles: [role] } : {}),
      } as never)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);

    const { error: businessError } = await client.from("profile_business").upsert({
      profile_id: context.userId,
      business_address: data.address || null,
      updated_at: new Date().toISOString(),
    } as never);
    if (businessError) throw new Error(businessError.message);
    return { username: current?.username ?? null };
  });
