-- Gallery uploads (owner, 21 Sep: "Gallery uploads — keep it on"). The 16 Sep deferral is lifted:
-- a person or business adds photos to its own gallery, removes them and drags them into order; the
-- profile and business pages show them to everyone, full size on a tap.
--
-- One public bucket, gallery (10 MB, JPEG / PNG / WebP only), served by public URL; nothing lists
-- it. Paths are `<profile id>/<file>`, and a profile id is its user's auth id, so these are the
-- avatars/covers policies (20260914140000_profile_images.sql) for one more bucket: a signed-in
-- user writes, replaces and deletes only inside their own folder.
--
-- profile_gallery (20260914170000_profile_sections.sql) already carries what the feature needs:
-- id, profile_id, image_url, caption, sort_order, created_at, the (profile_id, sort_order) index,
-- "Readable with its profile" for reads and "Owners write their own" (auth.uid() = profile_id) for
-- every write. The one thing added is a check on image_url, now that owners write it themselves:
-- https only and at most 1000 characters. All 36 rows at snapshot time pass it.
-- The photo cap per gallery is kept by the app (src/lib/gallery.functions.ts).
-- Snapshot: supabase/dumps/2026-09-21-before-gallery-uploads.sql
--
-- Rollback:
--   ALTER TABLE public.profile_gallery DROP CONSTRAINT profile_gallery_image_url_check;
--   DROP POLICY "Users read their own gallery images" ON storage.objects;
--   DROP POLICY "Users upload their own gallery images" ON storage.objects;
--   DROP POLICY "Users replace their own gallery images" ON storage.objects;
--   DROP POLICY "Users delete their own gallery images" ON storage.objects;
--   DELETE FROM storage.buckets WHERE id = 'gallery';  -- only once empty

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('gallery', 'gallery', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- SELECT is owner-scoped: public URLs need no policy, and upsert needs to read the existing object.
DROP POLICY IF EXISTS "Users read their own gallery images" ON storage.objects;
CREATE POLICY "Users read their own gallery images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'gallery'
         AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "Users upload their own gallery images" ON storage.objects;
CREATE POLICY "Users upload their own gallery images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery'
              AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "Users replace their own gallery images" ON storage.objects;
CREATE POLICY "Users replace their own gallery images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'gallery'
         AND (storage.foldername(name))[1] = (SELECT auth.uid()::text))
  WITH CHECK (bucket_id = 'gallery'
              AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "Users delete their own gallery images" ON storage.objects;
CREATE POLICY "Users delete their own gallery images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'gallery'
         AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

-- Added only when missing, so a second run changes nothing.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conrelid = 'public.profile_gallery'::regclass
                   AND conname = 'profile_gallery_image_url_check') THEN
    ALTER TABLE public.profile_gallery ADD CONSTRAINT profile_gallery_image_url_check
      CHECK (image_url ~ '^https://' AND length(image_url) <= 1000);
  END IF;
END $$;

COMMIT;
