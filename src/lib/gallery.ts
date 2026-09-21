import { supabase } from "@/integrations/supabase/client";
import { checkImageFile } from "@/lib/profile-images";
import { GALLERY_BUCKET } from "@/lib/gallery.functions";

/*
 * Gallery photo uploads, the same way profile photos upload (src/lib/profile-images.ts): a public
 * bucket, a fresh file name per upload, and storage RLS that refuses writes outside the signed-in
 * user's own folder, `<user id>/<file>`. A profile's id is its user's id, so this is the folder of
 * the person's or business's own gallery. The row that shows the photo is written by
 * addMyGalleryPhoto (src/lib/gallery.functions.ts).
 * Bucket and limits: supabase/migrations/20260921160000_gallery_uploads.sql.
 */

const MAX_BYTES = 10 * 1024 * 1024;

export async function uploadGalleryPhoto(file: File): Promise<string> {
  const ext = checkImageFile(file, MAX_BYTES);

  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new Error("Sign in to upload a photo.");

  // Several photos can go up in one pick, so the name carries a random part as well as the time.
  const path = `${userId}/gallery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const bucket = supabase.storage.from(GALLERY_BUCKET);
  const { error } = await bucket.upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return bucket.getPublicUrl(path).data.publicUrl;
}
