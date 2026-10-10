import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anonClient } from "@/lib/portfolio.functions";
import { myBookableIdOrNull } from "@/lib/bookable-calendar.functions";

/*
 * Photos as proof for a business's amenities and equipment (bookable_photos): the business adds
 * and removes them, anyone reads them on its page. subject_id is a bookable_equipment id for
 * equipment and the amenity itself (a taxonomy slug, or the business's own label) for an amenity.
 * Every row belongs to the business by profile_id, whatever its type; no bookable is needed
 * (owner, 10 Oct 2026; 20261010190000_business_amenities_equipment.sql). The file itself is
 * uploaded from the browser (src/lib/bookable-photos.ts); these functions keep the rows and remove
 * the files.
 */

/** Equipment and amenities of a business, as proof of what it offers; gear for sale is listing-media. */
export const BUSINESS_MEDIA_BUCKET = "business-media";
/** Photos per amenity or equipment item. */
export const MAX_BOOKABLE_PHOTOS = 6;

/**
 * One amenity: a taxonomy `amenities` slug, or a label the business typed itself (owner, 10 Oct
 * 2026: a business can add its own). Readers show a slug's label and a custom one as it is.
 */
export const AMENITY = z.string().trim().min(2).max(60);

export type BookablePhotoSubject = "equipment" | "amenity";

export type BookablePhoto = {
  id: string;
  subject_type: BookablePhotoSubject;
  subject_id: string;
  url: string;
};

export type MyBookablePhotos = {
  /** The business's profile id: its photos upload into this folder. */
  profileId: string;
  /** The business's amenities (profile_business.amenities) with their labels, in page order. */
  amenities: { slug: string; label: string }[];
  photos: BookablePhoto[];
  /** false when the photos can't be read, so the editor offers no uploads. */
  ready: boolean;
};

const db = (client: unknown) => client as unknown as SupabaseClient;
const COLUMNS = "id, subject_type, subject_id, url";

/**
 * The storage path of a business-media URL inside one of `folders`, or null for any other URL.
 * New photos sit in the business's own folder (its profile id); older ones in its bookable's.
 */
function mediaPath(url: string, folders: (string | null)[]) {
  const marker = `/storage/v1/object/public/${BUSINESS_MEDIA_BUCKET}/`;
  const at = url.indexOf(marker);
  if (at < 0) return null;
  const path = decodeURIComponent(url.slice(at + marker.length).split("?")[0] ?? "");
  if (path.includes("..")) return null;
  return folders.some((f) => f && path.startsWith(`${f}/`)) ? path : null;
}

/** The folders a business's photos may sit in: its own, and its bookable's from before 10 Oct. */
async function myFolders(client: SupabaseClient, userId: string) {
  return [userId, await myBookableIdOrNull(client, userId).catch(() => null)];
}

/** Removes the files behind these URLs; a file that is already gone is not an error. */
async function removeFiles(client: SupabaseClient, folders: (string | null)[], urls: string[]) {
  const paths = urls.map((u) => mediaPath(u, folders)).filter((p): p is string => !!p);
  if (paths.length) await client.storage.from(BUSINESS_MEDIA_BUCKET).remove(paths);
}

/** A business's amenities with their labels; a custom amenity is its own label. */
export async function amenitiesOf(client: SupabaseClient, profileId: string) {
  const [business, labels] = await Promise.all([
    client.from("profile_business").select("amenities").eq("profile_id", profileId).maybeSingle(),
    client.from("taxonomy_options").select("slug, label").eq("category_key", "amenities"),
  ]);
  if (business.error) throw new Error(business.error.message);
  const label = new Map(
    ((labels.data ?? []) as { slug: string; label: string }[]).map((o) => [o.slug, o.label]),
  );
  const stored = (business.data as { amenities: string[] | null } | null)?.amenities ?? [];
  return stored.map((slug) => ({ slug, label: label.get(slug) ?? slug }));
}

/** Every amenity and equipment photo of one business, in order. Public; empty on any failure. */
export const getBookablePhotos = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ profileId: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<BookablePhoto[]> => {
    const client = db(await anonClient());
    const { data: rows, error } = await client
      .from("bookable_photos")
      .select(COLUMNS)
      .eq("profile_id", data.profileId)
      .order("sort_order")
      .order("created_at");
    return error ? [] : ((rows ?? []) as BookablePhoto[]);
  });

/** The signed-in business's amenities and all its photos. */
export const listMyBookablePhotos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyBookablePhotos> => {
    const client = db(context.supabase);
    const [amenities, photos] = await Promise.all([
      amenitiesOf(client, context.userId),
      client
        .from("bookable_photos")
        .select(COLUMNS)
        .eq("profile_id", context.userId)
        .order("sort_order")
        .order("created_at"),
    ]);
    return {
      profileId: context.userId,
      amenities,
      photos: photos.error ? [] : ((photos.data ?? []) as BookablePhoto[]),
      ready: !photos.error,
    };
  });

/** Records a photo the business has just uploaded to its own folder. */
export const addMyBookablePhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        subjectType: z.enum(["equipment", "amenity"]),
        subjectId: z.string().min(1).max(80),
        url: z.string().url().max(1000),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<BookablePhoto> => {
    const client = db(context.supabase);
    if (!data.url.startsWith("https://") || !mediaPath(data.url, [context.userId])) {
      throw new Error("That photo isn't in your business's folder.");
    }

    // The subject must be this business's own amenity or equipment item.
    if (data.subjectType === "equipment") {
      const { data: item } = await client
        .from("bookable_equipment")
        .select("id")
        .eq("id", data.subjectId)
        .eq("profile_id", context.userId)
        .maybeSingle();
      if (!item) throw new Error("That equipment isn't on your business.");
    } else {
      const { data: business } = await client
        .from("profile_business")
        .select("amenities")
        .eq("profile_id", context.userId)
        .maybeSingle();
      const amenities = (business as { amenities: string[] | null } | null)?.amenities ?? [];
      if (!amenities.includes(data.subjectId))
        throw new Error("That amenity isn't on your business.");
    }

    const { data: existing, error: countError } = await client
      .from("bookable_photos")
      .select("sort_order")
      .eq("profile_id", context.userId)
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
        profile_id: context.userId,
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
    const { data: rows, error } = await client
      .from("bookable_photos")
      .delete()
      .eq("id", data.id)
      .eq("profile_id", context.userId)
      .select("url");
    if (error) throw new Error(error.message);
    await removeFiles(
      client,
      await myFolders(client, context.userId),
      ((rows ?? []) as { url: string }[]).map((r) => r.url),
    );
    return { ok: true };
  });

/**
 * Removes every photo of one equipment item or amenity of the business, rows and files. Used when
 * the item itself is removed.
 */
export async function removeSubjectPhotos(
  client: SupabaseClient,
  profileId: string,
  subjectType: BookablePhotoSubject,
  subjectId: string,
) {
  const { data: rows, error } = await client
    .from("bookable_photos")
    .delete()
    .eq("profile_id", profileId)
    .eq("subject_type", subjectType)
    .eq("subject_id", subjectId)
    .select("url");
  if (error) return;
  await removeFiles(
    client,
    await myFolders(client, profileId),
    ((rows ?? []) as { url: string }[]).map((r) => r.url),
  );
}
