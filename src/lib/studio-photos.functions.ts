import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anonClient } from "@/lib/portfolio.functions";
import { myStudioId } from "@/lib/studio-calendar.functions";

/*
 * Photos as proof for a studio's facilities and equipment (studio_photos): the owner adds and
 * removes them, anyone reads them on the studio page. subject_id is a studio_equipment id for
 * equipment and a studio_amenities slug for a facility. The file itself is uploaded from the
 * browser (src/lib/studio-photos.ts); these functions keep the rows and remove the files.
 * Before 20260921150000_studio_proof_photos.sql is applied every read comes back empty.
 */

export const STUDIO_MEDIA_BUCKET = "studio-media";
/** Photos per facility or equipment item. */
export const MAX_STUDIO_PHOTOS = 6;

export type StudioPhotoSubject = "equipment" | "facility";

export type StudioPhoto = {
  id: string;
  subject_type: StudioPhotoSubject;
  subject_id: string;
  url: string;
};

export type MyStudioPhotos = {
  studioId: string;
  /** The studio's facilities (studios.amenities) with their published labels, in page order. */
  facilities: { slug: string; label: string }[];
  photos: StudioPhoto[];
  /** false until the photos table exists, so the editor offers no uploads before then. */
  ready: boolean;
};

const db = (client: unknown) => client as unknown as SupabaseClient;
const COLUMNS = "id, subject_type, subject_id, url";

/** The storage path of a studio-media URL inside `studioId`'s folder, or null for any other URL. */
function mediaPath(url: string, studioId: string) {
  const marker = `/storage/v1/object/public/${STUDIO_MEDIA_BUCKET}/`;
  const at = url.indexOf(marker);
  if (at < 0) return null;
  const path = decodeURIComponent(url.slice(at + marker.length).split("?")[0] ?? "");
  return path.startsWith(`${studioId}/`) && !path.includes("..") ? path : null;
}

/** Removes the files behind these URLs; a file that is already gone is not an error. */
async function removeFiles(client: SupabaseClient, studioId: string, urls: string[]) {
  const paths = urls.map((u) => mediaPath(u, studioId)).filter((p): p is string => !!p);
  if (paths.length) await client.storage.from(STUDIO_MEDIA_BUCKET).remove(paths);
}

/** Every facility and equipment photo of one studio, in order. Public; empty on any failure. */
export const getStudioPhotos = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ studioId: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<StudioPhoto[]> => {
    const client = db(await anonClient());
    const { data: rows, error } = await client
      .from("studio_photos")
      .select(COLUMNS)
      .eq("studio_id", data.studioId)
      .order("sort_order")
      .order("created_at");
    return error ? [] : ((rows ?? []) as StudioPhoto[]);
  });

/** The owner's studio id, its facilities and all its photos. Photos are empty before the table. */
export const listMyStudioPhotos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyStudioPhotos> => {
    const client = db(context.supabase);
    const studioId = await myStudioId(client, context.userId);
    const [studio, labels, photos] = await Promise.all([
      client.from("studios").select("amenities").eq("id", studioId).single(),
      client.from("taxonomy_options").select("slug, label").eq("category_key", "studio_amenities"),
      client
        .from("studio_photos")
        .select(COLUMNS)
        .eq("studio_id", studioId)
        .order("sort_order")
        .order("created_at"),
    ]);
    if (studio.error) throw new Error(studio.error.message);
    const label = new Map(
      ((labels.data ?? []) as { slug: string; label: string }[]).map((o) => [o.slug, o.label]),
    );
    const amenities = ((studio.data as { amenities: string[] | null }).amenities ?? []) as string[];
    return {
      studioId,
      facilities: amenities.map((slug) => ({ slug, label: label.get(slug) ?? slug })),
      photos: photos.error ? [] : ((photos.data ?? []) as StudioPhoto[]),
      ready: !photos.error,
    };
  });

/** Records a photo the owner has just uploaded to their studio's folder. */
export const addMyStudioPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        subjectType: z.enum(["equipment", "facility"]),
        subjectId: z.string().min(1).max(80),
        url: z.string().url().max(1000),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<StudioPhoto> => {
    const client = db(context.supabase);
    const studioId = await myStudioId(client, context.userId);
    if (!data.url.startsWith("https://") || !mediaPath(data.url, studioId)) {
      throw new Error("That photo isn't in your studio's folder.");
    }

    // The subject must be this studio's own facility or equipment item.
    if (data.subjectType === "equipment") {
      const { data: item } = await client
        .from("studio_equipment")
        .select("id")
        .eq("id", data.subjectId)
        .eq("studio_id", studioId)
        .maybeSingle();
      if (!item) throw new Error("That equipment isn't on your studio.");
    } else {
      const { data: studio } = await client
        .from("studios")
        .select("amenities")
        .eq("id", studioId)
        .single();
      const amenities = (studio as { amenities: string[] | null } | null)?.amenities ?? [];
      if (!amenities.includes(data.subjectId))
        throw new Error("That facility isn't on your studio.");
    }

    const { data: existing, error: countError } = await client
      .from("studio_photos")
      .select("sort_order")
      .eq("studio_id", studioId)
      .eq("subject_type", data.subjectType)
      .eq("subject_id", data.subjectId)
      .order("sort_order", { ascending: false });
    if (countError) throw new Error("Photos aren't available yet.");
    const rows = (existing ?? []) as { sort_order: number }[];
    if (rows.length >= MAX_STUDIO_PHOTOS) {
      throw new Error(`Up to ${MAX_STUDIO_PHOTOS} photos each.`);
    }

    const { data: row, error } = await client
      .from("studio_photos")
      .insert({
        studio_id: studioId,
        subject_type: data.subjectType,
        subject_id: data.subjectId,
        url: data.url,
        sort_order: (rows[0]?.sort_order ?? -1) + 1,
      } as never)
      .select(COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return row as StudioPhoto;
  });

export const removeMyStudioPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const client = db(context.supabase);
    const studioId = await myStudioId(client, context.userId);
    const { data: rows, error } = await client
      .from("studio_photos")
      .delete()
      .eq("id", data.id)
      .eq("studio_id", studioId)
      .select("url");
    if (error) throw new Error(error.message);
    await removeFiles(
      client,
      studioId,
      ((rows ?? []) as { url: string }[]).map((r) => r.url),
    );
    return { ok: true };
  });

/**
 * Removes every photo of one equipment item or facility, rows and files. Used when the item itself
 * is removed; does nothing before the table exists.
 */
export async function removeSubjectPhotos(
  client: SupabaseClient,
  studioId: string,
  subjectType: StudioPhotoSubject,
  subjectId: string,
) {
  const { data: rows, error } = await client
    .from("studio_photos")
    .delete()
    .eq("studio_id", studioId)
    .eq("subject_type", subjectType)
    .eq("subject_id", subjectId)
    .select("url");
  if (error) return;
  await removeFiles(
    client,
    studioId,
    ((rows ?? []) as { url: string }[]).map((r) => r.url),
  );
}
