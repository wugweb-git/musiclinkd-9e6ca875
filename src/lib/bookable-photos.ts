import { supabase } from "@/integrations/supabase/client";
import { checkImageFile, checkPickedImage } from "@/lib/profile-images";
import { downscale, downscaleImage } from "@/lib/image-downscale";
import { BUSINESS_MEDIA_BUCKET } from "@/lib/bookable-photos.functions";

/*
 * Photo uploads for a business's amenities and equipment, the same way profile photos upload
 * (src/lib/profile-images.ts): a public bucket, a fresh file name per upload, and storage RLS that
 * refuses writes outside the uploader's own folder — here `<profile id>/<file>`, since the photos
 * belong to the business, not a bookable (owner, 10 Oct 2026;
 * 20261010230000_business_media_own_folder.sql).
 * The row that shows the photo is written by addMyBookablePhoto (src/lib/bookable-photos.functions.ts).
 * Bucket and limits: supabase/migrations/20260921150000_studio_proof_photos.sql.
 */

/** business-media's own limit (20261003120000_business_media_5mb.sql), checked on the resized photo. */
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadBookablePhoto(profileId: string, file: File): Promise<string> {
  checkPickedImage(file);
  const scaled = await downscaleImage(file, downscale.photo);
  const ext = checkImageFile(scaled, MAX_BYTES);
  const path = `${profileId}/photo-${Date.now()}.${ext}`;
  const bucket = supabase.storage.from(BUSINESS_MEDIA_BUCKET);
  const { error } = await bucket.upload(path, scaled, {
    contentType: scaled.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return bucket.getPublicUrl(path).data.publicUrl;
}
