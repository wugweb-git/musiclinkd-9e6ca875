import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * The signed-in account's own gallery (profile_gallery): a person's or a business's photos, which
 * its profile page shows to everyone. The owner adds, removes and reorders them; RLS keeps every
 * write to rows whose profile_id is the user. The file itself is uploaded from the browser
 * (src/lib/gallery.ts); these functions keep the rows and remove the files.
 * Before 20260921160000_gallery_uploads.sql is applied there is no bucket, so `ready` is false and
 * the editor offers no uploads; removing and reordering the rows already there still work.
 */

export const GALLERY_BUCKET = "gallery";
/** Photos per gallery. */
export const MAX_GALLERY_PHOTOS = 24;

export type GalleryPhoto = { id: string; image_url: string };

export type MyGallery = {
  photos: GalleryPhoto[];
  /** false until the gallery bucket exists. */
  ready: boolean;
};

const db = (client: unknown) => client as unknown as SupabaseClient;
const COLUMNS = "id, image_url";

/** The storage path of a gallery URL inside `userId`'s folder, or null for any other URL. */
function galleryPath(url: string, userId: string) {
  const marker = `/storage/v1/object/public/${GALLERY_BUCKET}/`;
  const at = url.indexOf(marker);
  if (at < 0) return null;
  const path = decodeURIComponent(url.slice(at + marker.length).split("?")[0] ?? "");
  return path.startsWith(`${userId}/`) && !path.includes("..") ? path : null;
}

/** The owner's gallery in order, and whether uploads are open. */
export const listMyGallery = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyGallery> => {
    const client = db(context.supabase);
    const [rows, bucket] = await Promise.all([
      client
        .from("profile_gallery")
        .select(COLUMNS)
        .eq("profile_id", context.userId)
        .order("sort_order")
        .order("created_at"),
      // Listing one's own folder fails only while the bucket doesn't exist.
      client.storage.from(GALLERY_BUCKET).list(context.userId, { limit: 1 }),
    ]);
    if (rows.error) throw new Error(rows.error.message);
    return { photos: (rows.data ?? []) as GalleryPhoto[], ready: !bucket.error };
  });

/** Records a photo the owner has just uploaded to their gallery folder, at the end. */
export const addMyGalleryPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ url: z.string().url().max(1000) }).parse(d))
  .handler(async ({ context, data }): Promise<GalleryPhoto> => {
    const client = db(context.supabase);
    if (!data.url.startsWith("https://") || !galleryPath(data.url, context.userId)) {
      throw new Error("That photo isn't in your gallery folder.");
    }

    const { data: existing, error: countError } = await client
      .from("profile_gallery")
      .select("sort_order")
      .eq("profile_id", context.userId)
      .order("sort_order", { ascending: false });
    if (countError) throw new Error(countError.message);
    const rows = (existing ?? []) as { sort_order: number }[];
    if (rows.length >= MAX_GALLERY_PHOTOS) {
      throw new Error(`Up to ${MAX_GALLERY_PHOTOS} photos in a gallery.`);
    }

    const { data: row, error } = await client
      .from("profile_gallery")
      .insert({
        profile_id: context.userId,
        image_url: data.url,
        sort_order: (rows[0]?.sort_order ?? -1) + 1,
      } as never)
      .select(COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return row as GalleryPhoto;
  });

/** Removes one photo and, when it was uploaded here, its file. Other URLs keep their files. */
export const removeMyGalleryPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const client = db(context.supabase);
    const { data: rows, error } = await client
      .from("profile_gallery")
      .delete()
      .eq("id", data.id)
      .eq("profile_id", context.userId)
      .select("image_url");
    if (error) throw new Error(error.message);
    const paths = ((rows ?? []) as { image_url: string }[])
      .map((r) => galleryPath(r.image_url, context.userId))
      .filter((p): p is string => !!p);
    // A file that is already gone is not an error.
    if (paths.length) await client.storage.from(GALLERY_BUCKET).remove(paths);
    return { ok: true };
  });

/** Saves the gallery's order: each photo's position in `ids`. The first one leads. */
export const reorderMyGallery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ ids: z.array(z.string().uuid()).max(MAX_GALLERY_PHOTOS * 2) }).parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ordered: number }> => {
    const client = db(context.supabase);
    // One update per photo, and only ever the owner's own: the profile_id filter is the guard.
    const results = await Promise.all(
      data.ids.map((id, index) =>
        client
          .from("profile_gallery")
          .update({ sort_order: index } as never)
          .eq("id", id)
          .eq("profile_id", context.userId),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) throw new Error(failed.error.message);
    return { ordered: data.ids.length };
  });
