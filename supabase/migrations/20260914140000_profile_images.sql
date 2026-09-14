-- Profile photo and cover image storage.
--
-- profiles.cover_url joins avatar_url. Two public buckets hold the files: avatars (5 MB) and covers
-- (10 MB), JPEG / PNG / WebP only. Files are served by public URL; nothing lists a bucket.
--
-- Paths are `<auth.uid()>/<file>`. A signed-in user can write, replace and delete only inside their
-- own folder; no one else can write there.
--
-- Rollback:
--   DROP POLICY "Users read their own profile images" ON storage.objects;
--   DROP POLICY "Users upload their own profile images" ON storage.objects;
--   DROP POLICY "Users replace their own profile images" ON storage.objects;
--   DROP POLICY "Users delete their own profile images" ON storage.objects;
--   DELETE FROM storage.buckets WHERE id IN ('avatars', 'covers');  -- only once empty
--   ALTER TABLE public.profiles DROP COLUMN cover_url;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_url text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('avatars', 'avatars', true, 5242880,  ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('covers',  'covers',  true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- SELECT is owner-scoped: public URLs need no policy, and upsert needs to read the existing object.
CREATE POLICY "Users read their own profile images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('avatars', 'covers')
         AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

CREATE POLICY "Users upload their own profile images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('avatars', 'covers')
              AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

CREATE POLICY "Users replace their own profile images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('avatars', 'covers')
         AND (storage.foldername(name))[1] = (SELECT auth.uid()::text))
  WITH CHECK (bucket_id IN ('avatars', 'covers')
              AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

CREATE POLICY "Users delete their own profile images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('avatars', 'covers')
         AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));
