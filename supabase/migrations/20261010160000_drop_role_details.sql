-- Every talent type has the same setup and profile schema, every business type the same; there
-- are no role-specific details (owner, 10 Oct 2026). The app stopped reading them in the same change.
-- Snapshot: supabase/dumps/2026-10-10-before-drop-role-details.sql
BEGIN;
DROP TABLE IF EXISTS public.profile_role_details;
DELETE FROM public.taxonomy_options
  WHERE category_key IN ('dj_types', 'vocal_range', 'singing_styles', 'lyricist_specializations',
                         'composition_styles');
DELETE FROM public.taxonomy_categories
  WHERE key IN ('dj_types', 'vocal_range', 'singing_styles', 'lyricist_specializations',
                'composition_styles');
COMMIT;
NOTIFY pgrst, 'reload schema';
