import { supabase } from "@/integrations/supabase/client";
import { checkImageFile, checkPickedImage } from "@/lib/profile-images";
import { downscale, downscaleImage } from "@/lib/image-downscale";

/*
 * Listing photos: uploaded to the public listing-media bucket under the seller's own folder
 * (`<user id>/<file>`); storage RLS refuses writes anywhere else. The public URLs, in order, are
 * what marketplace_listings.photos stores; the first is the cover (image_url).
 * Bucket and policies: supabase/migrations/20260922130000_listing_media.sql.
 */

const BUCKET = "listing-media";
const MAX_BYTES = 10 * 1024 * 1024;
export const MAX_LISTING_PHOTOS = 5;

export async function uploadListingPhoto(file: File): Promise<string> {
  checkPickedImage(file);
  const scaled = await downscaleImage(file, downscale.photo);
  const ext = checkImageFile(scaled, MAX_BYTES);
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new Error("Sign in to add photos.");
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const bucket = supabase.storage.from(BUCKET);
  const { error } = await bucket.upload(path, scaled, {
    contentType: scaled.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return bucket.getPublicUrl(path).data.publicUrl;
}

/** Removes a photo this seller uploaded; ignores any other URL (older listings' photos). */
export async function deleteListingPhoto(url: string) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const at = url.indexOf(marker);
  if (at < 0) return;
  const path = decodeURIComponent(url.slice(at + marker.length).split("?")[0] ?? "");
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId || !path.startsWith(`${userId}/`)) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
