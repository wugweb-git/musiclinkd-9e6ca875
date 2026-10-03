-- HELD: needs the owner's yes before it is applied (owner, 4 Oct 2026). Apply after
-- 20261004120000.
--
-- The last step of retiring rooms: booking_requests.room_id and bookable_blocks.room_id are
-- dropped. 9 bookings (8 still open on 4 Oct) name a room; once this runs, which room they were for
-- is gone from the bookings (the room rows themselves stay in bookable_rooms_retired). No closure
-- names a room after 20261004120000. No code reads either column after C2.
--
-- Snapshot before applying: supabase/dumps/YYYY-MM-DD-before-drop-room-ids.sql — the two column
-- definitions and their foreign keys, and the count of bookings with a room. No user data.
--
-- Rollback (the structure only; which room each booking named is not restored):
--   ALTER TABLE public.booking_requests ADD COLUMN room_id uuid
--     REFERENCES public.bookable_rooms_retired(id) ON DELETE SET NULL;
--   ALTER TABLE public.bookable_blocks ADD COLUMN room_id uuid
--     REFERENCES public.bookable_rooms_retired(id) ON DELETE CASCADE;

BEGIN;

CREATE TEMP TABLE _before ON COMMIT DROP AS
SELECT (SELECT count(*) FROM public.booking_requests) AS bookings,
       (SELECT count(*) FROM public.bookable_blocks)  AS blocks;

DO $guard$
DECLARE bad text;
BEGIN
  IF to_regclass('public.bookable_rooms_retired') IS NULL THEN
    RAISE EXCEPTION 'apply 20261004120000 first';
  END IF;
  IF EXISTS (SELECT 1 FROM public.bookable_blocks WHERE room_id IS NOT NULL) THEN
    RAISE EXCEPTION 'a closure still names a room';
  END IF;
  SELECT string_agg(p.proname, ', ') INTO bad
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.prosrc ~ '\mroom_id\M';
  IF bad IS NOT NULL THEN RAISE EXCEPTION 'functions still reading room_id: %', bad; END IF;
END
$guard$;

-- No CASCADE: anything still built on a column stops this, rather than going with it.
ALTER TABLE public.booking_requests DROP COLUMN room_id;
ALTER TABLE public.bookable_blocks DROP COLUMN room_id;

DO $check$
DECLARE b record;
BEGIN
  SELECT * INTO b FROM _before;
  IF (SELECT count(*) FROM public.booking_requests) <> b.bookings
     OR (SELECT count(*) FROM public.bookable_blocks) <> b.blocks THEN
    RAISE EXCEPTION 'row counts changed';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
               AND table_name IN ('booking_requests', 'bookable_blocks') AND column_name = 'room_id') THEN
    RAISE EXCEPTION 'a room_id column is still there';
  END IF;
END
$check$;

COMMIT;
