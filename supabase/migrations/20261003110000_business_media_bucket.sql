-- Studio photos move to a bucket named for its job: business-media, the equipment and facilities
-- of a bookable space (a studio's console, a venue's PA, a rehearsal room's kit), shown as proof
-- of what the space offers and never for sale. Gear for sale or rent is listing-media. Storage is
-- named by the job, never by one persona type (AGENTS.md, owner 3 Oct 2026).
--
-- It also fixes the bug in the old bucket's rules (20260921150000_studio_proof_photos.sql): the
-- folder check sat inside `EXISTS (SELECT 1 FROM public.studios s ...)`, where a bare `name`
-- resolves to studios.name, the studio's display name, not the file's path, so no owner could ever
-- upload, replace or delete a studio photo. These rules say `objects.name`.
--
-- This replaces 20261003100000_fix_studio_media_policies.sql, which fixed the old bucket in place
-- and was never applied; it was deleted in the same commit as this file was added.
--
-- studio-media holds no files (confirmed live by the owner, 3 Oct 2026), so nothing moves; no
-- studio_photos row points into it. Same limits: public, 10 MB, JPEG / PNG / WebP. Paths stay
-- `<studio id>/<file>`; only the owner of that studio can write, replace and delete in its folder.
--
-- Snapshot: supabase/dumps/2026-10-03-storage-policies-before.sql (the studio-media policy
-- definitions this drops; no user data). To be committed before this is applied.
--
-- Rollback:
--   DROP POLICY "Owners read their business media" ON storage.objects;
--   DROP POLICY "Owners upload their business media" ON storage.objects;
--   DROP POLICY "Owners replace their business media" ON storage.objects;
--   DROP POLICY "Owners delete their business media" ON storage.objects;
--   then re-run 20260921150000_studio_proof_photos.sql's bucket insert and four policies.

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('business-media', 'business-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- The folder is a studio id the signed-in user owns. `objects.name` is the file's path; compared
-- as text, so a folder that is not a uuid is simply refused rather than failing the cast.
DROP POLICY IF EXISTS "Owners read their business media" ON storage.objects;
CREATE POLICY "Owners read their business media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'business-media'
         AND EXISTS (SELECT 1 FROM public.studios s
                     WHERE s.id::text = (storage.foldername(objects.name))[1]
                       AND public.studio_is_mine(s.id)));

DROP POLICY IF EXISTS "Owners upload their business media" ON storage.objects;
CREATE POLICY "Owners upload their business media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'business-media'
              AND EXISTS (SELECT 1 FROM public.studios s
                          WHERE s.id::text = (storage.foldername(objects.name))[1]
                            AND public.studio_is_mine(s.id)));

DROP POLICY IF EXISTS "Owners replace their business media" ON storage.objects;
CREATE POLICY "Owners replace their business media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'business-media'
         AND EXISTS (SELECT 1 FROM public.studios s
                     WHERE s.id::text = (storage.foldername(objects.name))[1]
                       AND public.studio_is_mine(s.id)))
  WITH CHECK (bucket_id = 'business-media'
              AND EXISTS (SELECT 1 FROM public.studios s
                          WHERE s.id::text = (storage.foldername(objects.name))[1]
                            AND public.studio_is_mine(s.id)));

DROP POLICY IF EXISTS "Owners delete their business media" ON storage.objects;
CREATE POLICY "Owners delete their business media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'business-media'
         AND EXISTS (SELECT 1 FROM public.studios s
                     WHERE s.id::text = (storage.foldername(objects.name))[1]
                       AND public.studio_is_mine(s.id)));

-- The old bucket's rules go, then the bucket itself while it is empty. Supabase may refuse a
-- direct delete from storage.buckets; then the empty bucket stays, with no rules, until it is
-- removed from the Storage dashboard.
DROP POLICY IF EXISTS "Owners read their studio media" ON storage.objects;
DROP POLICY IF EXISTS "Owners upload their studio media" ON storage.objects;
DROP POLICY IF EXISTS "Owners replace their studio media" ON storage.objects;
DROP POLICY IF EXISTS "Owners delete their studio media" ON storage.objects;

DO $drop$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'studio-media') THEN
    RAISE NOTICE 'studio-media is not empty; left in place';
  ELSE
    DELETE FROM storage.buckets WHERE id = 'studio-media';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'studio-media not dropped (%); remove it from the Storage dashboard', SQLERRM;
END
$drop$;

COMMIT;
