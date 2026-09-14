import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { anonClient } from "@/lib/portfolio.functions";

/*
 * Public reads for the business and band screens of a stored profile, keyed by username. A profile
 * is a business when it has a profile_business row, and a band when it has a line-up or shows.
 * Private profiles return null. Schema: supabase/migrations/20260914170000_profile_sections.sql and
 * 20260914180000_catalog.sql.
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
  };
  services: {
    id: string;
    name: string;
    price_paise: number | null;
    price_unit: string | null;
    price_note: string | null;
  }[];
  team: { id: string; name: string; role: string | null; experience: string | null }[];
  studio: {
    rating: number | null;
    review_count: number;
    rooms: { id: string; name: string; hourly_rate_paise: number | null; sort_order: number }[];
  } | null;
};

export type BandRecord = {
  profile: ProfileBase;
  lineup: { id: string; name: string; role: string | null }[];
  events: { id: string; title: string; event_date: string | null; venue_name: string | null }[];
};

const PROFILE =
  "id, username, display_name, headline, bio, city, roles, genres, avatar_url, cover_url, is_verified, hourly_rate_paise, visibility";

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

export const getPublicBusiness = createServerFn({ method: "GET" })
  .inputValidator((d) => username.parse(d))
  .handler(async ({ data }): Promise<BusinessRecord | null> => {
    const client = await anonClient();
    const profile = await publicProfile(client, data.username);
    if (!profile) return null;

    const [business, services, team, studios] = await Promise.all([
      client
        .from("profile_business")
        .select("business_address, operating_hours, logo_url, hero_banner_url")
        .eq("profile_id", profile.id)
        .maybeSingle(),
      client
        .from("profile_services")
        .select("id, name, price_paise, price_unit, price_note")
        .eq("profile_id", profile.id)
        .order("sort_order"),
      client
        .from("profile_members")
        .select("id, name, role, experience")
        .eq("profile_id", profile.id)
        .eq("kind", "team")
        .order("sort_order"),
      client
        .from("studios")
        .select("rating, review_count, rooms:studio_rooms(id, name, hourly_rate_paise, sort_order)")
        .eq("owner_profile_id", profile.id)
        .order("created_at")
        .limit(1),
    ]);
    const failed = [business, services, team, studios].find((r) => r.error);
    if (failed?.error) throw new Error(failed.error.message);
    if (!business.data) return null;

    const studio = (studios.data?.[0] ?? null) as BusinessRecord["studio"];
    return {
      profile,
      business: business.data as BusinessRecord["business"],
      services: (services.data ?? []) as BusinessRecord["services"],
      team: (team.data ?? []) as BusinessRecord["team"],
      studio: studio
        ? {
            rating: studio.rating == null ? null : Number(studio.rating),
            review_count: studio.review_count,
            rooms: [...(studio.rooms ?? [])].sort((a, b) => a.sort_order - b.sort_order),
          }
        : null,
    };
  });

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
