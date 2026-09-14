import { supabase } from "@/integrations/supabase/client";

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

export async function uploadProfileImage(kind: ProfileImageKind, file: File): Promise<string> {
  const ext = EXTENSION[file.type];
  if (!ext) throw new Error("Use a JPEG, PNG or WebP image.");
  if (file.size > MAX_BYTES[kind]) {
    throw new Error(`Use an image under ${MAX_BYTES[kind] / (1024 * 1024)} MB.`);
  }

  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new Error("Sign in to upload a photo.");

  // A fresh name per upload, so a replaced image is never served from a stale cache.
  const path = `${userId}/${kind}-${Date.now()}.${ext}`;
  const bucket = supabase.storage.from(BUCKET[kind]);
  const { error } = await bucket.upload(path, file, { contentType: file.type, upsert: false });
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
