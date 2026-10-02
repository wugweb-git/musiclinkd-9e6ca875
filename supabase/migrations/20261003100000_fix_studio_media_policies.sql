-- Fix the four studio-media storage policies from 20260921150000_studio_proof_photos.sql.
--
-- Each policy checks the file's folder inside `EXISTS (SELECT 1 FROM public.studios s ...)`. There,
-- an unqualified `name` resolves to the nearest table that has one: studios.name, the studio's
-- display name, not storage.objects.name, the file's path. So every check compared a studio's id
-- with the first segment of its own display name, which never matches: no owner could upload,
-- replace, read back or delete a studio photo. Qualifying the column as `objects.name` makes it
-- the file's path, as intended. The verification-documents policies have the same shape but
-- verification_requests has no `name` column, so they were never affected.
--
-- Snapshot: take supabase/dumps/2026-10-03-before-fix-studio-media-policies.sql (storage policies
-- and storage.objects for bucket 'studio-media') and commit it before applying. Not taken in the
-- session that wrote this file: it had no access to the live database.
--
-- Rollback: re-run the four CREATE POLICY statements from 20260921150000_studio_proof_photos.sql.

BEGIN;

DROP POLICY IF EXISTS "Owners read their studio media" ON storage.objects;
CREATE POLICY "Owners read their studio media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'studio-media'
         AND EXISTS (SELECT 1 FROM public.studios s
                     WHERE s.id::text = (storage.foldername(objects.name))[1]
                       AND public.studio_is_mine(s.id)));

DROP POLICY IF EXISTS "Owners upload their studio media" ON storage.objects;
CREATE POLICY "Owners upload their studio media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'studio-media'
              AND EXISTS (SELECT 1 FROM public.studios s
                          WHERE s.id::text = (storage.foldername(objects.name))[1]
                            AND public.studio_is_mine(s.id)));

DROP POLICY IF EXISTS "Owners replace their studio media" ON storage.objects;
CREATE POLICY "Owners replace their studio media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'studio-media'
         AND EXISTS (SELECT 1 FROM public.studios s
                     WHERE s.id::text = (storage.foldername(objects.name))[1]
                       AND public.studio_is_mine(s.id)))
  WITH CHECK (bucket_id = 'studio-media'
              AND EXISTS (SELECT 1 FROM public.studios s
                          WHERE s.id::text = (storage.foldername(objects.name))[1]
                            AND public.studio_is_mine(s.id)));

DROP POLICY IF EXISTS "Owners delete their studio media" ON storage.objects;
CREATE POLICY "Owners delete their studio media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'studio-media'
         AND EXISTS (SELECT 1 FROM public.studios s
                     WHERE s.id::text = (storage.foldername(objects.name))[1]
                       AND public.studio_is_mine(s.id)));

COMMIT;
