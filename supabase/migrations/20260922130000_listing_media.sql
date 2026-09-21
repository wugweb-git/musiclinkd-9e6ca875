-- Owner, 22 Sep 2026: listing photos are uploaded, not placeholders. Files go to a public bucket
-- under the seller's own folder (<user id>/<file>); storage RLS refuses writes anywhere else, as
-- for profile images. A listing keeps its photos in order in `photos`; image_url stays the cover
-- (the first photo), which every existing read already uses.
-- Snapshot: supabase/dumps/2026-09-22-before-listing-media.sql
--
-- Rollback:
--   ALTER TABLE public.marketplace_listings DROP COLUMN IF EXISTS photos;
--   DROP POLICY IF EXISTS "Sellers read their listing media" ON storage.objects; (and the three others)
--   DELETE FROM storage.buckets WHERE id = 'listing-media';

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('listing-media', 'listing-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Sellers read their listing media" ON storage.objects;
CREATE POLICY "Sellers read their listing media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "Sellers upload their listing media" ON storage.objects;
CREATE POLICY "Sellers upload their listing media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "Sellers replace their listing media" ON storage.objects;
CREATE POLICY "Sellers replace their listing media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text))
  WITH CHECK (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "Sellers delete their listing media" ON storage.objects;
CREATE POLICY "Sellers delete their listing media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}';

COMMIT;
