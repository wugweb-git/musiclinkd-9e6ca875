import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anonClient } from "@/lib/portfolio.functions";
import {
  GALLERY_BUCKET,
  MAX_GALLERY_PHOTOS,
  galleryPath,
  type GalleryPhoto,
  type MyGallery,
} from "@/lib/gallery.functions";

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
  /** The showcase: band photos, the first one leading. */
  gallery: {
    id: string;
    image_url: string;
    sort_order: number;
  }[];
};

const BAND = `id, slug, name, tagline, bio, genres, city, formed_year, avatar_url, cover_url, looking_for,
  availability, rate_paise, rate_unit, is_verified, created_by, type, visibility, status,
  rider, stage_plot_url, stage_plot_note,
  members:collab_members(profile_id, role, instrument, since_year, sort_order,
    profile:profiles!band_members_profile_id_fkey(username, display_name, avatar_url, is_verified)),
  events:collab_events(id, title, venue, city, event_date, event_time, date_precision, status, ticket_note, sort_order),
  releases:collab_releases(id, title, kind, release_year, cover_url, sort_order),
  live_videos:collab_live_videos(id, title, url, sort_order),
  gallery:collab_gallery(id, image_url, sort_order)`;

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
    gallery: [...(raw.gallery ?? [])].sort(bySort),
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

/** A release on the band's discography; owners and admins only (the database checks). */
export const addBandRelease = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().trim().min(1).max(120),
        kind: z.enum(["single", "ep", "album", "live"]),
        releaseYear: z.number().int().min(1900).max(2100).nullable(),
        coverUrl: httpsUrl.nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const client = db(context.supabase);
    const { count } = await client
      .from("collab_releases")
      .select("id", { count: "exact", head: true })
      .eq("collab_id", data.id);
    const { error } = await client.from("collab_releases").insert({
      collab_id: data.id,
      title: data.title,
      kind: data.kind,
      release_year: data.releaseYear,
      cover_url: data.coverUrl,
      sort_order: count ?? 0,
    });
    if (error) throw new Error(error.code === "42501" ? NOT_ALLOWED : error.message);
    return { saved: true };
  });

export const removeBandRelease = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ releaseId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await db(context.supabase)
      .from("collab_releases")
      .delete()
      .eq("id", data.releaseId)
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows?.length) throw new Error(NOT_ALLOWED);
    return { removed: true };
  });

/**
 * End a band: its profile, shows and shared links go; members keep their own profiles. Only its
 * creator or owner can ("Creator and owner delete" on collabs), so a row not deleted is refused.
 */
export const deleteBand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await db(context.supabase)
      .from("collabs")
      .delete()
      .eq("id", data.id)
      .eq("type", "band")
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows?.length) throw new Error(NOT_ALLOWED);
    return { deleted: true };
  });

/*
 * A band's showcase (collab_gallery): photos on the band page's Overview. Owners and admins add,
 * remove and reorder them (collab_can_manage, checked by the database). The file is uploaded from
 * the browser into the uploader's own gallery folder (src/lib/gallery.ts), as a person's gallery
 * is. Schema: supabase/migrations/20260922300000_band_showcase.sql
 */

const GALLERY_COLUMNS = "id, image_url";

/** The band's showcase in order, for its editor, and whether uploads are open. */
export const listBandGallery = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<MyGallery> => {
    const client = db(context.supabase);
    const [rows, bucket] = await Promise.all([
      client
        .from("collab_gallery")
        .select(GALLERY_COLUMNS)
        .eq("collab_id", data.id)
        .order("sort_order")
        .order("created_at"),
      // Listing one's own folder fails only while the bucket doesn't exist.
      client.storage.from(GALLERY_BUCKET).list(context.userId, { limit: 1 }),
    ]);
    if (rows.error) throw new Error(rows.error.message);
    return { photos: (rows.data ?? []) as GalleryPhoto[], ready: !bucket.error };
  });

/** Records a photo a manager has just uploaded to their gallery folder, at the end. */
export const addBandGalleryPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), url: z.string().url().max(1000) }).parse(d),
  )
  .handler(async ({ context, data }): Promise<GalleryPhoto> => {
    const client = db(context.supabase);
    if (!data.url.startsWith("https://") || !galleryPath(data.url, context.userId)) {
      throw new Error("That photo isn't in your gallery folder.");
    }
    const { data: existing, error: countError } = await client
      .from("collab_gallery")
      .select("sort_order")
      .eq("collab_id", data.id)
      .order("sort_order", { ascending: false });
    if (countError) throw new Error(countError.message);
    const rows = (existing ?? []) as { sort_order: number }[];
    if (rows.length >= MAX_GALLERY_PHOTOS) {
      throw new Error(`Up to ${MAX_GALLERY_PHOTOS} photos in a gallery.`);
    }
    const { data: row, error } = await client
      .from("collab_gallery")
      .insert({
        collab_id: data.id,
        image_url: data.url,
        sort_order: (rows[0]?.sort_order ?? -1) + 1,
      })
      .select(GALLERY_COLUMNS)
      .single();
    if (error) throw new Error(error.code === "42501" ? NOT_ALLOWED : error.message);
    return row as GalleryPhoto;
  });

/**
 * Removes one photo and, when the remover uploaded it, its file. A file another manager uploaded
 * stays in their folder.
 */
export const removeBandGalleryPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ photoId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const client = db(context.supabase);
    const { data: rows, error } = await client
      .from("collab_gallery")
      .delete()
      .eq("id", data.photoId)
      .select("image_url");
    if (error) throw new Error(error.message);
    if (!rows?.length) throw new Error(NOT_ALLOWED);
    const paths = (rows as { image_url: string }[])
      .map((r) => galleryPath(r.image_url, context.userId))
      .filter((p): p is string => !!p);
    // A file that is already gone is not an error.
    if (paths.length) await client.storage.from(GALLERY_BUCKET).remove(paths);
    return { removed: true };
  });

/** Saves the showcase's order: each photo's position in `ids`. The first one leads. */
export const reorderBandGallery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        ids: z.array(z.string().uuid()).max(MAX_GALLERY_PHOTOS * 2),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const client = db(context.supabase);
    // One update per photo, only within this band; RLS keeps it to the band's managers.
    const results = await Promise.all(
      data.ids.map((photoId, index) =>
        client
          .from("collab_gallery")
          .update({ sort_order: index })
          .eq("id", photoId)
          .eq("collab_id", data.id)
          .select("id"),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) throw new Error(failed.error.message);
    if (data.ids.length && !results.some((r) => r.data?.length)) throw new Error(NOT_ALLOWED);
    return { ordered: data.ids.length };
  });

/*
 * Band invitations, answered on the band side (owner, 4 Oct 2026: bands are separate from
 * collaboration). Until now an invitation could only be answered in the collab room (/collab/$id).
 * An invitation is a collab_members row with status 'invited' that someone else created; a row
 * whose invited_by is the person themselves is a request to join, not an invitation.
 */
export type BandInvite = {
  bandId: string;
  slug: string;
  name: string;
  avatarUrl: string | null;
  role: "owner" | "admin" | "member";
  invitedBy: string | null;
};

export const listMyBandInvites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BandInvite[]> => {
    const { data, error } = await db(context.supabase)
      .from("collab_members")
      .select("role, invited_by, band:collabs!inner(id, slug, name, avatar_url, type)")
      .eq("profile_id", context.userId)
      .eq("status", "invited")
      .eq("band.type", "band");
    if (error) throw new Error(error.message);
    type Row = {
      role: BandInvite["role"];
      invited_by: string | null;
      band: { id: string; slug: string; name: string; avatar_url: string | null };
    };
    return ((data ?? []) as unknown as Row[])
      .filter((r) => r.invited_by !== context.userId)
      .map((r) => ({
        bandId: r.band.id,
        slug: r.band.slug,
        name: r.band.name,
        avatarUrl: r.band.avatar_url,
        role: r.role,
        invitedBy: r.invited_by,
      }));
  });

export const answerBandInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ bandId: z.string().uuid(), answer: z.enum(["join", "no"]) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const client = db(context.supabase);
    const { data: band } = await client
      .from("collabs")
      .select("id")
      .eq("id", data.bandId)
      .eq("type", "band")
      .maybeSingle();
    if (!band) throw new Error("That band no longer exists.");
    const mine = () =>
      client
        .from("collab_members")
        .select("profile_id")
        .eq("collab_id", data.bandId)
        .eq("profile_id", context.userId)
        .eq("status", "invited");
    const { data: rows, error } =
      data.answer === "join"
        ? await client
            .from("collab_members")
            .update({ status: "active" } as never)
            .eq("collab_id", data.bandId)
            .eq("profile_id", context.userId)
            .eq("status", "invited")
            .select("profile_id")
        : await client
            .from("collab_members")
            .delete()
            .eq("collab_id", data.bandId)
            .eq("profile_id", context.userId)
            .eq("status", "invited")
            .select("profile_id");
    if (error) throw new Error(error.message);
    // Nothing matched: the invitation was withdrawn or already answered.
    if (!rows?.length) {
      const { data: still } = await mine();
      if (!still?.length) throw new Error("This invitation is no longer open.");
    }
    return { answered: data.answer };
  });

