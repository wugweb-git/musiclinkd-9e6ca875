import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anonClient } from "@/lib/portfolio.functions";

/*
 * Bands read the collabs tables: a band is a collab of type 'band' (owner, 17 Sep 2026), the
 * ongoing public kind, as against a project room. A collab is a group of existing talent profiles,
 * not an account, keyed by slug. Public reads with the anon key; members of private profiles are
 * hidden by RLS. Schema: supabase/migrations/20260917120000_collabs.sql.
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
  type: "band" | "project";
  visibility: "public" | "private";
  status: "active" | "paused" | "completed" | "archived";
  /** Technical rider, one line each (backline, inputs, monitors, power…). */
  rider: string[];
  stage_plot_url: string | null;
  stage_plot_note: string | null;
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
  live_videos: {
    id: string;
    title: string;
    url: string;
    sort_order: number;
  }[];
};

const BAND = `id, slug, name, tagline, bio, genres, city, formed_year, avatar_url, cover_url, looking_for,
  availability, rate_paise, rate_unit, is_verified, created_by, type, visibility, status,
  rider, stage_plot_url, stage_plot_note,
  members:collab_members(profile_id, role, instrument, since_year, sort_order,
    profile:profiles(username, display_name, avatar_url, is_verified)),
  events:collab_events(id, title, venue, city, event_date, event_time, date_precision, status, ticket_note, sort_order),
  releases:collab_releases(id, title, kind, release_year, cover_url, sort_order),
  live_videos:collab_live_videos(id, title, url, sort_order)`;

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
    rider: raw.rider ?? [],
    live_videos: [...(raw.live_videos ?? [])].sort(bySort),
  };
}

export const listBands = createServerFn({ method: "GET" }).handler(async (): Promise<BandRow[]> => {
  const client = await anonClient();
  const { data, error } = await client
    .from("collabs")
    .select(BAND)
    .eq("type", "band")
    .order("name");
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as BandRow[]).map(shape);
});

export const getBandBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data }): Promise<BandRow | null> => {
    const client = await anonClient();
    const { data: row, error } = await client
      .from("collabs")
      .select(BAND)
      .eq("type", "band")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? shape(row as unknown as BandRow) : null;
  });

/*
 * A band's technical rider, stage plot and live videos. Only its owner and admins write them
 * (collab_can_manage, plus a trigger on collabs for the rider and stage plot). Schema:
 * supabase/migrations/20260922290000_band_rider_stage_plot_live_videos.sql
 */

/** The generated types do not cover the collab tables; they are written through the plain client. */
const db = (client: unknown) => client as unknown as SupabaseClient;

const NOT_ALLOWED = "Only the band's owner or an admin can change this.";

const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .regex(/^https:\/\/\S+\.\S+/, "Paste a full link, starting with https://");

export const saveBandRider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        rider: z.array(z.string().trim().min(1).max(200)).max(40),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await db(context.supabase)
      .from("collabs")
      .update({ rider: data.rider })
      .eq("id", data.id)
      .eq("type", "band")
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows?.length) throw new Error(NOT_ALLOWED);
    return { saved: true };
  });

export const saveBandStagePlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        url: z.union([httpsUrl, z.literal("")]),
        note: z.string().trim().max(500),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await db(context.supabase)
      .from("collabs")
      .update({ stage_plot_url: data.url || null, stage_plot_note: data.note || null })
      .eq("id", data.id)
      .eq("type", "band")
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows?.length) throw new Error(NOT_ALLOWED);
    return { saved: true };
  });

export const addBandLiveVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().trim().min(1).max(120),
        url: httpsUrl,
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const client = db(context.supabase);
    const { count } = await client
      .from("collab_live_videos")
      .select("id", { count: "exact", head: true })
      .eq("collab_id", data.id);
    const { error } = await client.from("collab_live_videos").insert({
      collab_id: data.id,
      title: data.title,
      url: data.url,
      sort_order: count ?? 0,
    });
    if (error) throw new Error(error.code === "42501" ? NOT_ALLOWED : error.message);
    return { saved: true };
  });

export const removeBandLiveVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ videoId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await db(context.supabase)
      .from("collab_live_videos")
      .delete()
      .eq("id", data.videoId)
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows?.length) throw new Error(NOT_ALLOWED);
    return { removed: true };
  });
