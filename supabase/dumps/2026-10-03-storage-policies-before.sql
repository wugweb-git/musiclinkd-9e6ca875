-- Snapshot before 20261003110000_business_media_bucket.sql
-- Taken read-only from the live database on 2026-10-02 (pg_policies, storage.buckets).
-- Definitions and counts only. No user data.

-- Bucket
--   id: studio-media · public: true · file_size_limit: 10485760 · allowed_mime_types: {image/jpeg,image/png,image/webp}
--   objects in bucket: 0
--   business-media: does not exist yet

-- Related row counts (public schema)
--   studios 21 · studio_rooms 25 · studio_blocks 0 · studio_equipment 116 · studio_photos 57

-- Policies on storage.objects for bucket studio-media (all role: authenticated)

-- "Owners upload their studio media" (INSERT)
--   WITH CHECK:
--   ((bucket_id = 'studio-media'::text) AND (EXISTS ( SELECT 1
--      FROM studios s
--     WHERE (((s.id)::text = (storage.foldername(s.name))[1]) AND studio_is_mine(s.id)))))

-- "Owners read their studio media" (SELECT)
--   USING:
--   ((bucket_id = 'studio-media'::text) AND (EXISTS ( SELECT 1
--      FROM studios s
--     WHERE (((s.id)::text = (storage.foldername(s.name))[1]) AND studio_is_mine(s.id)))))

-- "Owners replace their studio media" (UPDATE)
--   USING and WITH CHECK (identical):
--   ((bucket_id = 'studio-media'::text) AND (EXISTS ( SELECT 1
--      FROM studios s
--     WHERE (((s.id)::text = (storage.foldername(s.name))[1]) AND studio_is_mine(s.id)))))

-- "Owners delete their studio media" (DELETE)
--   USING:
--   ((bucket_id = 'studio-media'::text) AND (EXISTS ( SELECT 1
--      FROM studios s
--     WHERE (((s.id)::text = (storage.foldername(s.name))[1]) AND studio_is_mine(s.id)))))

-- Defect recorded: storage.foldername(s.name) resolves to studios.name (the display name),
-- not storage.objects.name (the file path), so every check fails.
