-- Drop the old-name shims from 20261003130000_bookables_rename.sql, once the code on the new names
-- (main at 161ca9c or later) is published and confirmed live. NOT to be applied before then: the
-- published app would lose the old names mid-session.
--
-- Drops:
--   views     studios, studio_rooms, studio_blocks, studio_equipment, studio_photos
--   functions studio_is_mine(uuid), can_review_studio(uuid), studio_busy(uuid, date, date)
-- Keeps everything they pointed at: the bookable tables, bookable_is_mine, can_review_bookable,
-- bookable_busy, every rule and trigger. No data is touched.
--
-- No CASCADE: if anything still depends on a shim (a rule, a view, a function), the drop fails and
-- the whole migration rolls back, rather than taking the dependent with it.
--
-- Snapshot: supabase/dumps/2026-10-03-before-drop-bookables-compat.sql, the live definitions of the
-- five views and three functions (taken read-only on 3 Oct; definitions and counts, no user data).
--
-- Rollback: run that snapshot, or the "Compatibility" section of 20261003130000_bookables_rename.sql.

BEGIN;

-- Row counts before, compared after: dropping views and functions must not change a row.
CREATE TEMP TABLE _before ON COMMIT DROP AS
SELECT (SELECT count(*) FROM public.bookables)       AS bookables,
       (SELECT count(*) FROM public.bookable_rooms)  AS rooms,
       (SELECT count(*) FROM public.bookable_blocks) AS blocks,
       (SELECT count(*) FROM public.bookable_equipment) AS equipment,
       (SELECT count(*) FROM public.bookable_photos) AS photos;

-- Nothing outside the shims may still call them.
DO $deps$
DECLARE bad text;
BEGIN
  SELECT string_agg(DISTINCT dependent.relname, ', ') INTO bad
    FROM pg_depend d
    JOIN pg_rewrite r ON r.oid = d.objid
    JOIN pg_class dependent ON dependent.oid = r.ev_class
    JOIN pg_class source ON source.oid = d.refobjid
   WHERE source.relnamespace = 'public'::regnamespace
     AND source.relname IN ('studios', 'studio_rooms', 'studio_blocks', 'studio_equipment', 'studio_photos')
     AND dependent.relname <> source.relname;
  IF bad IS NOT NULL THEN RAISE EXCEPTION 'views still built on the old names: %', bad; END IF;

  SELECT string_agg(p.proname, ', ') INTO bad
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname NOT IN ('studio_is_mine', 'can_review_studio', 'studio_busy')
     AND p.prosrc ~ '(public\.studio(s|_rooms|_blocks|_equipment|_photos)\M|\mstudio_is_mine\(|\mstudio_busy\(|\mcan_review_studio\()';
  IF bad IS NOT NULL THEN RAISE EXCEPTION 'functions still calling the old names: %', bad; END IF;

  SELECT string_agg(schemaname || '.' || tablename || ': ' || policyname, ', ') INTO bad
    FROM pg_policies
   WHERE coalesce(qual, '') || coalesce(with_check, '') ~ '(\mstudio_is_mine\(|\mcan_review_studio\(|\mstudio_busy\()';
  IF bad IS NOT NULL THEN RAISE EXCEPTION 'rules still calling the old names: %', bad; END IF;
END
$deps$;

DROP VIEW public.studios;
DROP VIEW public.studio_rooms;
DROP VIEW public.studio_blocks;
DROP VIEW public.studio_equipment;
DROP VIEW public.studio_photos;

DROP FUNCTION public.studio_is_mine(uuid);
DROP FUNCTION public.can_review_studio(uuid);
DROP FUNCTION public.studio_busy(uuid, date, date);

DO $check$
DECLARE b record;
BEGIN
  SELECT * INTO b FROM _before;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'public'::regnamespace
               AND relname IN ('studios', 'studio_rooms', 'studio_blocks', 'studio_equipment', 'studio_photos')) THEN
    RAISE EXCEPTION 'an old-name view is still there';
  END IF;
  IF (SELECT count(*) FROM public.bookables) <> b.bookables
     OR (SELECT count(*) FROM public.bookable_rooms) <> b.rooms
     OR (SELECT count(*) FROM public.bookable_blocks) <> b.blocks
     OR (SELECT count(*) FROM public.bookable_equipment) <> b.equipment
     OR (SELECT count(*) FROM public.bookable_photos) <> b.photos THEN
    RAISE EXCEPTION 'bookable rows changed';
  END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
        AND policyname LIKE '%business media%') <> 4 THEN
    RAISE EXCEPTION 'the business-media storage rules are not all there';
  END IF;
END
$check$;

COMMIT;
