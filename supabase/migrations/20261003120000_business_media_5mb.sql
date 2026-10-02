-- business-media takes files up to 5 MB, not 10 (owner, 3 Oct 2026). Photos are resized in the
-- browser to 1600px on the long edge before upload (src/lib/image-downscale.ts), so a facility
-- photo comes in far under this; the limit is the backstop. The app checks the same 5 MB on the
-- resized file (src/lib/studio-photos.ts) and says so before uploading.
--
-- Snapshot: supabase/dumps/2026-10-03-before-business-media-5mb.sql
--
-- Rollback:
--   UPDATE storage.buckets SET file_size_limit = 10485760 WHERE id = 'business-media';

UPDATE storage.buckets SET file_size_limit = 5242880 WHERE id = 'business-media';

DO $verify$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'business-media' AND file_size_limit = 5242880) THEN
    RAISE EXCEPTION 'business-media limit is not 5 MB';
  END IF;
END
$verify$;
