import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { anonClient } from "@/lib/portfolio.functions";
import type { DirectoryPerson } from "@/lib/profile-groups.functions";

/*
 * Trending portfolio work: most plays in the last 7 days, counted by the database
 * (supabase/migrations/20260917100200_portfolio_plays_trending.sql), never by the client.
 */

export type TrendingItem = {
  id: string;
  title: string;
  kind: string;
  cover_url: string | null;
  media_url: string | null;
  plays: number;
  display_name: string | null;
  username: string | null;
};

export const listTrendingWork = createServerFn({ method: "GET" }).handler(async () => {
  const client = (await anonClient()) as unknown as SupabaseClient;
  const { data, error } = await client.rpc("trending_portfolio_items", { days: 7, lim: 10 });
  if (error) throw new Error(error.message);
  return ((data ?? []) as TrendingItem[]).map((r) => ({ ...r, plays: Number(r.plays) }));
});

/*
 * Trending this week on Discover: people and studios ranked by what happened to them in the last
 * 7 days. Each signal is a stored row, counted here:
 *
 *   profile and studio views   recently_viewed (one row per viewer and page, newest view kept)  1
 *   follows                    follows                                                           3
 *   saves                      saved_items (talent, studio, business)                            3
 *   enquiries                  enquiries to a business                                           4
 *   booking requests           booking_requests to a studio                                      4
 *   reviews                    reviews of a profile or a studio                                  4
 *
 * recently_viewed keeps each viewer's latest view of a page, so a view counts one viewer, not
 * every visit. The tables are owner-only, so they are read with the server's key; only the counts
 * leave the server, never who did what. A studio's page is its owner's profile, so views, follows
 * and enquiries of that profile count for the studio. Private profiles, people who turned off
 * "Appear in Discover", other business pages and archived studios never show.
 */

export type TrendingPage =
  | { kind: "person"; score: number; person: DirectoryPerson }
  | { kind: "studio"; score: number; studioId: string };

const WEIGHT = { view: 1, follow: 3, save: 3, enquiry: 4, booking: 4, review: 4 } as const;

async function rowsOf<T>(query: PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
  // A table not there yet is one missing signal, not a failure.
  try {
    const { data, error } = await query;
    return error ? [] : ((data ?? []) as T[]);
  } catch {
    return [];
  }
}

type PersonRowData = {
  id: string;
  username: string | null;
  display_name: string | null;
  headline: string | null;
  city: string | null;
  pin_code: string | null;
  roles: string[] | null;
  genres: string[] | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  rating: number | string | null;
  review_count: number | null;
};

export const listTrendingPages = createServerFn({ method: "GET" }).handler(
  async (): Promise<TrendingPage[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as SupabaseClient;
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [views, follows, saves, enquiries, bookings, reviews, studios, businesses] =
      await Promise.all([
        rowsOf<{ kind: string; handle: string }>(
          db
            .from("recently_viewed")
            .select("kind, handle")
            .in("kind", ["person", "studio"])
            .gte("viewed_at", since)
            .limit(5000),
        ),
        rowsOf<{ target_id: string }>(
          db.from("follows").select("target_id").gte("created_at", since).limit(5000),
        ),
        rowsOf<{ target_type: string; target_id: string }>(
          db
            .from("saved_items")
            .select("target_type, target_id")
            .in("target_type", ["talent", "studio", "business"])
            .gte("created_at", since)
            .limit(5000),
        ),
        rowsOf<{ business_profile_id: string }>(
          db.from("enquiries").select("business_profile_id").gte("created_at", since).limit(5000),
        ),
        rowsOf<{ studio_id: string }>(
          db.from("booking_requests").select("studio_id").gte("created_at", since).limit(5000),
        ),
        rowsOf<{ target_profile_id: string | null; target_studio_id: string | null }>(
          db
            .from("reviews")
            .select("target_profile_id, target_studio_id")
            .gte("created_at", since)
            .limit(5000),
        ),
        rowsOf<{ id: string; owner_profile_id: string | null }>(
          (async () => {
            const live = await db
              .from("studios")
              .select("id, owner_profile_id")
              .is("archived_at", null);
            return live.error?.message.includes("archived_at")
              ? db.from("studios").select("id, owner_profile_id")
              : live;
          })(),
        ),
        rowsOf<{ profile_id: string }>(db.from("profile_business").select("profile_id")),
      ]);

    // Views are stored by username; everything else by id.
    const handles = [...new Set(views.map((v) => v.handle))];
    const handleRows = handles.length
      ? await rowsOf<{ id: string; username: string }>(
          db.from("profiles").select("id, username").in("username", handles),
        )
      : [];
    const idOfHandle = new Map(handleRows.map((r) => [r.username, r.id]));

    const byProfile = new Map<string, number>();
    const byStudio = new Map<string, number>();
    const add = (map: Map<string, number>, id: string | null | undefined, weight: number) => {
      if (id && weight) map.set(id, (map.get(id) ?? 0) + weight);
    };
    for (const v of views) add(byProfile, idOfHandle.get(v.handle), WEIGHT.view);
    for (const f of follows) add(byProfile, f.target_id, WEIGHT.follow);
    for (const s of saves)
      add(s.target_type === "studio" ? byStudio : byProfile, s.target_id, WEIGHT.save);
    for (const e of enquiries) add(byProfile, e.business_profile_id, WEIGHT.enquiry);
    for (const b of bookings) add(byStudio, b.studio_id, WEIGHT.booking);
    for (const r of reviews) {
      if (r.target_studio_id) add(byStudio, r.target_studio_id, WEIGHT.review);
      else add(byProfile, r.target_profile_id, WEIGHT.review);
    }

    // A studio's page is its owner's profile: what happened to that profile counts for the studio.
    const liveStudios = new Set(studios.map((s) => s.id));
    const owners = new Set(studios.map((s) => s.owner_profile_id).filter(Boolean));
    for (const s of studios) {
      if (s.owner_profile_id) add(byStudio, s.id, byProfile.get(s.owner_profile_id) ?? 0);
    }
    const business = new Set(businesses.map((b) => b.profile_id));

    const personIds = [...byProfile.keys()].filter((id) => !owners.has(id) && !business.has(id));
    const personRows = personIds.length
      ? await rowsOf<PersonRowData>(
          db
            .from("profiles")
            .select(
              "id, username, display_name, headline, city, pin_code, roles, genres, avatar_url, is_verified, rating, review_count",
            )
            .in("id", personIds)
            .eq("visibility", "public")
            .or("discovery_prefs->>appear.is.null,discovery_prefs->>appear.neq.false")
            .not("username", "is", null),
        )
      : [];

    const pages: TrendingPage[] = [
      ...personRows.map((r): TrendingPage => {
        const reviewCount = r.review_count ?? 0;
        return {
          kind: "person",
          score: byProfile.get(r.id) ?? 0,
          person: {
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
          },
        };
      }),
      ...[...byStudio]
        .filter(([id]) => liveStudios.has(id))
        .map(([studioId, score]): TrendingPage => ({ kind: "studio", score, studioId })),
    ];
    return pages
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  },
);
