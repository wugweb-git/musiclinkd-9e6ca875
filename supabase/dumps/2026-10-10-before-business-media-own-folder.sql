-- Snapshot before 20261010230000_business_media_own_folder.sql (10 Oct 2026): the four
-- storage.objects policies for the business-media bucket. Undo: run this file.
BEGIN;
DROP POLICY IF EXISTS "Owners read their business media" ON storage.objects;
CREATE POLICY "Owners read their business media" ON storage.objects FOR SELECT TO authenticated
  USING ((bucket_id = 'business-media'::text) AND (EXISTS (SELECT 1 FROM bookables s
    WHERE (((s.id)::text = (storage.foldername(objects.name))[1]) AND bookable_is_mine(s.id)))));
DROP POLICY IF EXISTS "Owners upload their business media" ON storage.objects;
CREATE POLICY "Owners upload their business media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK ((bucket_id = 'business-media'::text) AND (EXISTS (SELECT 1 FROM bookables s
    WHERE (((s.id)::text = (storage.foldername(objects.name))[1]) AND bookable_is_mine(s.id)))));
DROP POLICY IF EXISTS "Owners replace their business media" ON storage.objects;
CREATE POLICY "Owners replace their business media" ON storage.objects FOR UPDATE TO authenticated
  USING ((bucket_id = 'business-media'::text) AND (EXISTS (SELECT 1 FROM bookables s
    WHERE (((s.id)::text = (storage.foldername(objects.name))[1]) AND bookable_is_mine(s.id)))))
  WITH CHECK ((bucket_id = 'business-media'::text) AND (EXISTS (SELECT 1 FROM bookables s
    WHERE (((s.id)::text = (storage.foldername(objects.name))[1]) AND bookable_is_mine(s.id)))));
DROP POLICY IF EXISTS "Owners delete their business media" ON storage.objects;
CREATE POLICY "Owners delete their business media" ON storage.objects FOR DELETE TO authenticated
  USING ((bucket_id = 'business-media'::text) AND (EXISTS (SELECT 1 FROM bookables s
    WHERE (((s.id)::text = (storage.foldername(objects.name))[1]) AND bookable_is_mine(s.id)))));
COMMIT;
