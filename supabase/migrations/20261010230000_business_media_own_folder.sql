-- business-media accepts the uploader's own folder, `<profile id>/<file>`, because amenity and
-- equipment photos now belong to the business, for every business type, not to a bookable
-- (owner, 10 Oct 2026; 20261010190000_business_amenities_equipment.sql). Until this is applied the
-- four rules only accept a bookable's folder, so a photo upload from the app is refused.
-- A bookable's folder stays allowed, so the files already stored there can still be removed.
-- `objects.name` inside the subquery, never a bare `name` (supabase/AGENTS.md).
--
-- Snapshot: supabase/dumps/2026-10-10-before-business-media-own-folder.sql (the four
-- "business media" policy definitions from pg_policies; no user data). To be committed before
-- this is applied.
--
-- Rollback: re-create the four policies from that snapshot.
BEGIN;

DROP POLICY IF EXISTS "Owners read their business media" ON storage.objects;
CREATE POLICY "Owners read their business media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'business-media'
         AND ((storage.foldername(objects.name))[1] = auth.uid()::text
              OR EXISTS (SELECT 1 FROM public.bookables b
                         WHERE b.id::text = (storage.foldername(objects.name))[1]
                           AND public.bookable_is_mine(b.id))));

DROP POLICY IF EXISTS "Owners upload their business media" ON storage.objects;
CREATE POLICY "Owners upload their business media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'business-media'
              AND (storage.foldername(objects.name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Owners replace their business media" ON storage.objects;
CREATE POLICY "Owners replace their business media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'business-media'
         AND (storage.foldername(objects.name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'business-media'
              AND (storage.foldername(objects.name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Owners delete their business media" ON storage.objects;
CREATE POLICY "Owners delete their business media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'business-media'
         AND ((storage.foldername(objects.name))[1] = auth.uid()::text
              OR EXISTS (SELECT 1 FROM public.bookables b
                         WHERE b.id::text = (storage.foldername(objects.name))[1]
                           AND public.bookable_is_mine(b.id))));

COMMIT;
