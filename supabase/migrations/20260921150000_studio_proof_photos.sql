-- Photos as proof for a studio's facilities and equipment. The owner adds up to six photos to each
-- facility (a studios.amenities slug) and each equipment item (a studio_equipment row); the studio
-- page shows them as thumbnails anyone can open. Nothing else on the studio carries photos here.
--
-- One public bucket, studio-media (10 MB, JPEG / PNG / WebP only), served by public URL; nothing
-- lists it. Paths are `<studio id>/<file>`: only the owner of that studio can write, replace and
-- delete inside its folder — the avatars/covers policies (20260914140000_profile_images.sql) with
-- the studio's owner in place of the user.
--
-- studio_photos holds one row per photo. subject_id is text because a facility has no row of its
-- own (it is the amenity slug); for equipment it is studio_equipment.id, and removing an item
-- removes its photos in the app (src/lib/studio-owner.functions.ts). The six-per-item cap is kept
-- by the app too.
-- Snapshot: supabase/dumps/2026-09-21-before-studio-proof-photos.sql
--
-- Rollback:
--   DROP TABLE public.studio_photos;
--   DROP POLICY "Owners read their studio media" ON storage.objects;
--   DROP POLICY "Owners upload their studio media" ON storage.objects;
--   DROP POLICY "Owners replace their studio media" ON storage.objects;
--   DROP POLICY "Owners delete their studio media" ON storage.objects;
--   DELETE FROM storage.buckets WHERE id = 'studio-media';  -- only once empty

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('studio-media', 'studio-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- The folder is a studio id the signed-in user owns. Compared as text, so a folder that is not a
-- uuid is simply refused rather than failing the cast.
-- SELECT is owner-scoped: public URLs need no policy, and upsert needs to read the existing object.
DROP POLICY IF EXISTS "Owners read their studio media" ON storage.objects;
CREATE POLICY "Owners read their studio media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'studio-media'
         AND EXISTS (SELECT 1 FROM public.studios s
                     WHERE s.id::text = (storage.foldername(name))[1]
                       AND public.studio_is_mine(s.id)));

DROP POLICY IF EXISTS "Owners upload their studio media" ON storage.objects;
CREATE POLICY "Owners upload their studio media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'studio-media'
              AND EXISTS (SELECT 1 FROM public.studios s
                          WHERE s.id::text = (storage.foldername(name))[1]
                            AND public.studio_is_mine(s.id)));

DROP POLICY IF EXISTS "Owners replace their studio media" ON storage.objects;
CREATE POLICY "Owners replace their studio media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'studio-media'
         AND EXISTS (SELECT 1 FROM public.studios s
                     WHERE s.id::text = (storage.foldername(name))[1]
                       AND public.studio_is_mine(s.id)))
  WITH CHECK (bucket_id = 'studio-media'
              AND EXISTS (SELECT 1 FROM public.studios s
                          WHERE s.id::text = (storage.foldername(name))[1]
                            AND public.studio_is_mine(s.id)));

DROP POLICY IF EXISTS "Owners delete their studio media" ON storage.objects;
CREATE POLICY "Owners delete their studio media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'studio-media'
         AND EXISTS (SELECT 1 FROM public.studios s
                     WHERE s.id::text = (storage.foldername(name))[1]
                       AND public.studio_is_mine(s.id)));

CREATE TABLE IF NOT EXISTS public.studio_photos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id    uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  subject_type text NOT NULL CHECK (subject_type IN ('equipment', 'facility')),
  /** studio_equipment.id for equipment, the studio_amenities slug for a facility. */
  subject_id   text NOT NULL CHECK (length(subject_id) BETWEEN 1 AND 80),
  url          text NOT NULL CHECK (url ~ '^https://' AND length(url) <= 1000),
  sort_order   int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS studio_photos_subject_idx
  ON public.studio_photos (studio_id, subject_type, subject_id, sort_order);

ALTER TABLE public.studio_photos ENABLE ROW LEVEL SECURITY;

-- Proof is public: anyone looking at the studio page sees it.
DROP POLICY IF EXISTS "Anyone reads studio photos" ON public.studio_photos;
CREATE POLICY "Anyone reads studio photos" ON public.studio_photos
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Owner manages their studio photos" ON public.studio_photos;
CREATE POLICY "Owner manages their studio photos" ON public.studio_photos
  FOR ALL TO authenticated
  USING (public.studio_is_mine(studio_id))
  WITH CHECK (public.studio_is_mine(studio_id));

COMMIT;
