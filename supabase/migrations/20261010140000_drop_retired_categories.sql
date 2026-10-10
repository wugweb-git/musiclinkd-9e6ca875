-- Retired taxonomy categories that nothing reads or stores (owner, 10 Oct 2026: delete retired
-- data). Checked: no screen, no stored profile detail, no foreign key uses them.
-- Undo: supabase/dumps/2026-10-10-before-retired-categories.sql
BEGIN;
DELETE FROM public.taxonomy_options
  WHERE category_key IN ('project_roles', 'director_specializations', 'podcast_categories');
DELETE FROM public.taxonomy_categories
  WHERE key IN ('project_roles', 'director_specializations', 'podcast_categories');
COMMIT;
