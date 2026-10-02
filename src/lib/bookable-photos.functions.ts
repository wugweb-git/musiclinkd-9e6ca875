import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anonClient } from "@/lib/portfolio.functions";
import { myBookableId } from "@/lib/bookable-calendar.functions";

/*
 * Photos as proof for a studio's facilities and equipment (bookable_photos): the owner adds and
 * removes them, anyone reads them on the studio page. subject_id is a bookable_equipment id for
 * equipment and a studio_amenities slug for a facility. The file itself is uploaded from the
 * browser (src/lib/bookable-photos.ts); these functions keep the rows and remove the files.
 * Before 20260921150000_studio_proof_photos.sql is applied every read comes back empty.
 */

/** Equipment and facilities of a bookable space; gear for sale or rent is listing-media. */
export const BUSINESS_MEDIA_BUCKET = "business-media";
/** Photos per facility or equipment item. */
export const MAX_BOOKABLE_PHOTOS = 6;

export type BookablePhotoSubject = "equipment" | "facility";

export type BookablePhoto = {
  id: string;
  subject_type: BookablePhotoSubject;
  subject_id: string;
  url: string;
};

export type MyBookablePhotos = {
  studioId: string;
  /** The studio's facilities (studios.amenities) with their published labels, in page order. */
  facilities: { slug: string; label: string }[];
  photos: BookablePhoto[];
  /** false until the photos table exists, so the editor offers no uploads before then. */
  ready: boolean;
};

const db = (client: unknown) => client as unknown as SupabaseClient;
const COLUMNS = "id, subject_type, subject_id, url";

/** The storage path of a business-media URL inside `studioId`'s folder, or null for any other URL. */
function mediaPath(url: string, studioId: string) {
  const marker = `/storage/v1/object/public/${BUSINESS_MEDIA_BUCKET}/`;
  const at = url.indexOf(marker);
  if (at < 0) return null;
  const path = decodeURIComponent(url.slice(at + marker.length).split("?")[0] ?? "");
  return path.startsWith(`${studioId}/`) && !path.includes("..") ? path : null;
}

/** Removes the files behind these URLs; a file that is already gone is not an error. */
async function removeFiles(client: SupabaseClient, studioId: string, urls: string[]) {
  const paths = urls.map((u) => mediaPath(u, studioId)).filter((p): p is string => !!p);
  if (paths.length) await client.storage.from(BUSINESS_MEDIA_BUCKET).remove(paths);
}

/** Every facility and equipment photo of one studio, in order. Public; empty on any failure. */
export const getBookablePhotos = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ studioId: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<BookablePhoto[]> => {
    const client = db(await anonClient());
    const { data: rows, error } = await client
      .from("bookable_photos")
      .select(COLUMNS)
      .eq("bookable_id", data.studioId)
      .order("sort_order")
      .order("created_at");
    return error ? [] : ((rows ?? []) as BookablePhoto[]);
  });

/** The owner's studio id, its facilities and all its photos. Photos are empty before the table. */
export const listMyBookablePhotos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyBookablePhotos> => {
    const client = db(context.supabase);
    const studioId = await myBookableId(client, context.userId);
    const [studio, labels, photos] = await Promise.all([
      client.from("bookables").select("amenities").eq("id", studioId).single(),
      client.from("taxonomy_options").select("slug, label").eq("category_key", "studio_amenities"),
      client
        .from("bookable_photos")
        .select(COLUMNS)
        .eq("bookable_id", studioId)
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
      photos: photos.error ? [] : ((photos.data ?? []) as BookablePhoto[]),
      ready: !photos.error,
    };
  });

/** Records a photo the owner has just uploaded to their studio's folder. */
export const addMyBookablePhoto = createServerFn({ method: "POST" })
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
  .handler(async ({ context, data }): Promise<BookablePhoto> => {
    const client = db(context.supabase);
    const studioId = await myBookableId(client, context.userId);
    if (!data.url.startsWith("https://") || !mediaPath(data.url, studioId)) {
      throw new Error("That photo isn't in your studio's folder.");
    }

    // The subject must be this studio's own facility or equipment item.
    if (data.subjectType === "equipment") {
      const { data: item } = await client
        .from("bookable_equipment")
        .select("id")
        .eq("id", data.subjectId)
        .eq("bookable_id", studioId)
        .maybeSingle();
      if (!item) throw new Error("That equipment isn't on your studio.");
    } else {
      const { data: studio } = await client
        .from("bookables")
        .select("amenities")
        .eq("id", studioId)
        .single();
      const amenities = (studio as { amenities: string[] | null } | null)?.amenities ?? [];
      if (!amenities.includes(data.subjectId))
        throw new Error("That facility isn't on your studio.");
    }

    const { data: existing, error: countError } = await client
      .from("bookable_photos")
      .select("sort_order")
      .eq("bookable_id", studioId)
      .eq("subject_type", data.subjectType)
      .eq("subject_id", data.subjectId)
      .order("sort_order", { ascending: false });
    if (countError) throw new Error("Photos aren't available yet.");
    const rows = (existing ?? []) as { sort_order: number }[];
    if (rows.length >= MAX_BOOKABLE_PHOTOS) {
      throw new Error(`Up to ${MAX_BOOKABLE_PHOTOS} photos each.`);
    }

    const { data: row, error } = await client
      .from("bookable_photos")
      .insert({
        bookable_id: studioId,
        subject_type: data.subjectType,
        subject_id: data.subjectId,
        url: data.url,
        sort_order: (rows[0]?.sort_order ?? -1) + 1,
      } as never)
      .select(COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return row as BookablePhoto;
  });

export const removeMyBookablePhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const client = db(context.supabase);
    const studioId = await myBookableId(client, context.userId);
    const { data: rows, error } = await client
      .from("bookable_photos")
      .delete()
      .eq("id", data.id)
      .eq("bookable_id", studioId)
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
  subjectType: BookablePhotoSubject,
  subjectId: string,
) {
  const { data: rows, error } = await client
    .from("bookable_photos")
    .delete()
    .eq("bookable_id", studioId)
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
