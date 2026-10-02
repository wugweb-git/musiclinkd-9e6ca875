import { supabase } from "@/integrations/supabase/client";
import { downscale, downscaleImage } from "@/lib/image-downscale";

/*
 * Profile photo and cover uploads. Files go to public Supabase Storage buckets under the signed-in
 * user's own folder (`<user id>/<file>`); storage RLS refuses writes anywhere else. The returned
 * public URL is what profiles.avatar_url / profiles.cover_url store.
 * Buckets and limits: supabase/migrations/20260914140000_profile_images.sql.
 */

export type ProfileImageKind = "avatar" | "cover";

const BUCKET: Record<ProfileImageKind, string> = { avatar: "avatars", cover: "covers" };
const MAX_BYTES: Record<ProfileImageKind, number> = {
  avatar: 5 * 1024 * 1024,
  cover: 10 * 1024 * 1024,
};
const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Value for an `<input type="file" accept>` that matches what the buckets take. */
export const PROFILE_IMAGE_ACCEPT = Object.keys(EXTENSION).join(",");

/**
 * The largest photo a person can pick. Photos are resized in the browser before upload
 * (image-downscale.ts), so a phone's 8–15 MB original is fine to pick; what has to fit the
 * bucket's limit is the resized file, which `checkImageFile` checks after resizing. The buckets
 * enforce their own type and size limits too.
 */
const MAX_PICK_BYTES = 25 * 1024 * 1024;

/** A picked photo's type and size, before resizing. Throws with what to do instead. */
export function checkPickedImage(file: File): void {
  if (!EXTENSION[file.type]) throw new Error("Use a JPEG, PNG or WebP image.");
  if (file.size > MAX_PICK_BYTES) throw new Error("Use a photo under 25 MB.");
}

/** The file's extension once it is an image the buckets take and under `maxBytes`; throws if not. */
export function checkImageFile(file: File, maxBytes: number): string {
  const ext = EXTENSION[file.type];
  if (!ext) throw new Error("Use a JPEG, PNG or WebP image.");
  if (file.size > maxBytes) throw new Error(`Use an image under ${maxBytes / (1024 * 1024)} MB.`);
  return ext;
}

export async function uploadProfileImage(kind: ProfileImageKind, file: File): Promise<string> {
  // Check what the user picked, then upload a version sized for what it is displayed at.
  checkPickedImage(file);
  const scaled = await downscaleImage(file, downscale[kind]);
  const ext = checkImageFile(scaled, MAX_BYTES[kind]);

  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new Error("Sign in to upload a photo.");

  // A fresh name per upload, so a replaced image is never served from a stale cache.
  const path = `${userId}/${kind}-${Date.now()}.${ext}`;
  const bucket = supabase.storage.from(BUCKET[kind]);
  const { error } = await bucket.upload(path, scaled, {
    contentType: scaled.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return bucket.getPublicUrl(path).data.publicUrl;
}

/**
 * Removes a previously uploaded image once the profile points elsewhere. Ignores URLs that are not
 * in this user's folder of that bucket, such as seed or third-party images.
 */
export async function deleteProfileImage(kind: ProfileImageKind, url: string | null | undefined) {
  if (!url) return;
  const marker = `/storage/v1/object/public/${BUCKET[kind]}/`;
  const at = url.indexOf(marker);
  if (at < 0) return;
  const path = decodeURIComponent(url.slice(at + marker.length).split("?")[0] ?? "");

  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId || !path.startsWith(`${userId}/`)) return;
  await supabase.storage.from(BUCKET[kind]).remove([path]);
}
