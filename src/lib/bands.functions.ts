import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { anonClient } from "@/lib/portfolio.functions";

/*
 * Bands: a group of existing talent profiles, not an account, keyed by slug. Public reads with the
 * anon key; members of private profiles are hidden by RLS. Schema:
 * supabase/migrations/20260915130000_bands.sql.
 */

export type BandRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  bio: string | null;
  /** Taxonomy genre slugs, or the demo bands' genre names. */
  genres: string[];
  city: string | null;
  formed_year: number | null;
  avatar_url: string | null;
  cover_url: string | null;
  looking_for: string[];
  availability: "available" | "selective" | "booked" | null;
  rate_paise: number | null;
  rate_unit: string | null;
  is_verified: boolean;
  created_by: string | null;
  members: {
    profile_id: string;
    role: "owner" | "admin" | "member";
    instrument: string | null;
    since_year: number | null;
    sort_order: number;
    profile: {
      username: string | null;
      display_name: string | null;
      avatar_url: string | null;
      is_verified: boolean;
    } | null;
  }[];
  events: {
    id: string;
    title: string;
    venue: string | null;
    city: string | null;
    event_date: string | null;
    event_time: string | null;
    date_precision: "day" | "month";
    status: "confirmed" | "hold" | null;
    ticket_note: string | null;
    sort_order: number;
  }[];
  releases: {
    id: string;
    title: string;
    kind: "single" | "ep" | "album" | "live";
    release_year: number | null;
    cover_url: string | null;
    sort_order: number;
  }[];
};

const BAND = `id, slug, name, tagline, bio, genres, city, formed_year, avatar_url, cover_url, looking_for,
  availability, rate_paise, rate_unit, is_verified, created_by,
  members:band_members(profile_id, role, instrument, since_year, sort_order,
    profile:profiles(username, display_name, avatar_url, is_verified)),
  events:band_events(id, title, venue, city, event_date, event_time, date_precision, status, ticket_note, sort_order),
  releases:band_releases(id, title, kind, release_year, cover_url, sort_order)`;

type Sorted = { sort_order: number };
const bySort = (a: Sorted, b: Sorted) => a.sort_order - b.sort_order;

function shape(raw: BandRow): BandRow {
  return {
    ...raw,
    genres: raw.genres ?? [],
    looking_for: raw.looking_for ?? [],
    members: [...(raw.members ?? [])].sort(bySort),
    events: [...(raw.events ?? [])].sort(bySort),
    releases: [...(raw.releases ?? [])].sort(bySort),
  };
}

export const listBands = createServerFn({ method: "GET" }).handler(async (): Promise<BandRow[]> => {
  const client = await anonClient();
  const { data, error } = await client.from("bands").select(BAND).order("name");
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as BandRow[]).map(shape);
});

export const getBandBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data }): Promise<BandRow | null> => {
    const client = await anonClient();
    const { data: row, error } = await client
      .from("bands")
      .select(BAND)
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? shape(row as unknown as BandRow) : null;
  });
