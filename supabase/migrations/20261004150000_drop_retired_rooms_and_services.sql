-- P2 of booking by service (owner, 3–4 Oct 2026): drop what M2 and M3 retired.
--
--   1. DROP TABLE public.bookable_rooms_retired (25 rows on 4 Oct).
--   2. ALTER TABLE public.bookables DROP COLUMN services_retired (15 places with tags on 4 Oct).
--
-- !! This deletes data for good. M2 (20261004120000) and M3 (20261004140000) kept these "unconverted":
-- the rooms' names, gear text and package rates, and the places' service tags, exist nowhere else.
-- The snapshot holds definitions and counts only (no user data in the repo), so it cannot bring the
-- rows back. Apply only on the owner's yes.
--
-- Nothing reads either: no code since C2/C3, no foreign key (20261004130000 dropped the last two),
-- no view, function or trigger (checked live, 4 Oct). The guards below stop if that has changed.
--
-- Snapshot: supabase/dumps/2026-10-04-before-drop-retired-rooms-and-services.sql
-- Rollback: re-create the empty table and column from the snapshot. The rows do not come back.

BEGIN;

DO $guard$
DECLARE bad text;
BEGIN
  SELECT string_agg(conrelid::regclass::text || '.' || conname, ', ') INTO bad
    FROM pg_constraint WHERE confrelid = 'public.bookable_rooms_retired'::regclass;
  IF bad IS NOT NULL THEN RAISE EXCEPTION 'foreign keys still point at bookable_rooms_retired: %', bad; END IF;

  SELECT string_agg(p.proname, ', ') INTO bad
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND (p.prosrc ~ '\mbookable_rooms_retired\M' OR p.prosrc ~ '\mservices_retired\M');
  IF bad IS NOT NULL THEN RAISE EXCEPTION 'functions that name the retired objects: %', bad; END IF;
END
$guard$;

DROP TABLE public.bookable_rooms_retired;
ALTER TABLE public.bookables DROP COLUMN services_retired;

COMMIT;

NOTIFY pgrst, 'reload schema';
