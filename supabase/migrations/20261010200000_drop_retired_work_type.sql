-- Retired lists out of the database (owner, 10 Oct 2026). The live code stopped reading all of
-- these in 1a65b7d, published the same day.
--   * Old opportunities keep their pay line: where there is no budget and no note, the old work
--     type becomes the note (Revenue share / Co-write / Paid), as the card used to show it.
--   * opportunities.collaboration_type, collabs.project_type, person_type_instruments ("let
--     everyone see everything"), and the collaboration_types, project_types, available_for and
--     work_types categories are dropped.
-- Snapshot: supabase/dumps/2026-10-10-before-retired-work-type.sql
BEGIN;
UPDATE public.opportunities
SET budget_note = CASE collaboration_type
      WHEN 'royalties_split' THEN 'Revenue share'
      WHEN 'co_write' THEN 'Co-write'
      WHEN 'session_payment' THEN 'Paid'
      WHEN 'work_for_hire' THEN 'Paid'
    END
WHERE budget_paise IS NULL AND coalesce(budget_note, '') = ''
  AND collaboration_type IN ('royalties_split', 'co_write', 'session_payment', 'work_for_hire');
ALTER TABLE public.opportunities DROP COLUMN IF EXISTS collaboration_type;
ALTER TABLE public.collabs DROP COLUMN IF EXISTS project_type;
DROP TABLE IF EXISTS public.person_type_instruments;
DELETE FROM public.taxonomy_options
  WHERE category_key IN ('collaboration_types', 'project_types', 'available_for', 'work_types');
DELETE FROM public.taxonomy_categories
  WHERE key IN ('collaboration_types', 'project_types', 'available_for', 'work_types');
COMMIT;
NOTIFY pgrst, 'reload schema';
