import { supabase } from "@/integrations/supabase/client";
import { checkImageFile, checkPickedImage } from "@/lib/profile-images";
import { downscale, downscaleImage } from "@/lib/image-downscale";
import { BUSINESS_MEDIA_BUCKET } from "@/lib/studio-photos.functions";

/*
 * Photo uploads for a studio's facilities and equipment, the same way profile photos upload
 * (src/lib/profile-images.ts): a public bucket, a fresh file name per upload, and storage RLS that
 * refuses writes outside the owner's own folder — here `<studio id>/<file>`.
 * The row that shows the photo is written by addMyStudioPhoto (src/lib/studio-photos.functions.ts).
 * Bucket and limits: supabase/migrations/20260921150000_studio_proof_photos.sql.
 */

const MAX_BYTES = 10 * 1024 * 1024;

export async function uploadStudioPhoto(studioId: string, file: File): Promise<string> {
  checkPickedImage(file);
  const scaled = await downscaleImage(file, downscale.photo);
  const ext = checkImageFile(scaled, MAX_BYTES);
  const path = `${studioId}/photo-${Date.now()}.${ext}`;
  const bucket = supabase.storage.from(BUSINESS_MEDIA_BUCKET);
  const { error } = await bucket.upload(path, scaled, {
    contentType: scaled.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return bucket.getPublicUrl(path).data.publicUrl;
}
