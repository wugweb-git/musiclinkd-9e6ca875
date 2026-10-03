-- M2 of booking by service (owner, 3 Oct 2026: there are no rooms; people book a service). Apply
-- only after C2/C3 (main at or after the merge of feat/one-calendar) is published: the code
-- published before it still reads bookable_rooms and bookable_busy().room_id.
--
--   1. bookable_busy() returns the taken and closed times of the whole place, without room_id:
--      one calendar per place. Same name, arguments, rules and grants; dropped and re-created
--      because its result columns change.
--   2. Closures on one room become closures of the whole place (0 rows on 4 Oct). Stricter, never
--      looser: no time an owner closed reopens.
--   3. bookable_rooms is retired: renamed bookable_rooms_retired, and anon and authenticated can no
--      longer read or write it. The 25 rows, their gear text and package rates stay in the database,
--      unconverted; nothing goes into git. booking_requests.room_id and bookable_blocks.room_id
--      still point at it until 20261004130000 (held for the owner's yes).
--
-- Replaces bookable_busy() only if the live body is the repo's (20260921110000 after the
-- 20261003130000 rename; md5 of prosrc), otherwise stops.
--
-- Snapshot before applying: supabase/dumps/YYYY-MM-DD-before-retire-rooms.sql, the output of
-- supabase/checks/before-retire-rooms.sql (definitions, grants, counts; no user data).
--
-- Rollback:
--   ALTER TABLE public.bookable_rooms_retired RENAME TO bookable_rooms;
--   re-grant bookable_rooms as recorded in the snapshot;
--   DROP FUNCTION public.bookable_busy(uuid, date, date); re-create it from the snapshot.
--   (Closures moved to the whole place are not moved back: there were none.)

BEGIN;

CREATE TEMP TABLE _before ON COMMIT DROP AS
SELECT (SELECT count(*) FROM public.bookable_rooms)     AS rooms,
       (SELECT count(*) FROM public.booking_requests)   AS bookings,
       (SELECT count(*) FROM public.bookable_blocks)    AS blocks;

-- ── Guards ──────────────────────────────────────────────────────────────────────────────────────
DO $guard$
DECLARE got text; bad text;
BEGIN
  SELECT md5(prosrc) INTO got FROM pg_proc
   WHERE oid = 'public.bookable_busy(uuid, date, date)'::regprocedure;
  IF got IS DISTINCT FROM '579d39d469c22524d9cb48b57478cbe4' THEN
    RAISE EXCEPTION 'bookable_busy() is not the version in the repo (md5 %)', got;
  END IF;
  IF to_regclass('public.bookable_rooms_retired') IS NOT NULL THEN
    RAISE EXCEPTION 'bookable_rooms_retired already exists';
  END IF;
  -- Nothing but foreign keys may still be built on bookable_rooms (a view, a rule).
  SELECT string_agg(DISTINCT dependent.relname, ', ') INTO bad
    FROM pg_depend d
    JOIN pg_rewrite r ON r.oid = d.objid
    JOIN pg_class dependent ON dependent.oid = r.ev_class
   WHERE d.refobjid = 'public.bookable_rooms'::regclass
     AND dependent.oid <> 'public.bookable_rooms'::regclass;
  IF bad IS NOT NULL THEN RAISE EXCEPTION 'views still built on bookable_rooms: %', bad; END IF;
  SELECT string_agg(p.proname, ', ') INTO bad
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname <> 'bookable_busy'
     AND p.prosrc ~ '\mbookable_rooms\M';
  IF bad IS NOT NULL THEN RAISE EXCEPTION 'functions still reading bookable_rooms: %', bad; END IF;
END
$guard$;

-- ── 2. Room closures become whole-place closures ────────────────────────────────────────────────
UPDATE public.bookable_blocks SET room_id = NULL WHERE room_id IS NOT NULL;

-- ── 1. One calendar per place ───────────────────────────────────────────────────────────────────
DROP FUNCTION public.bookable_busy(uuid, date, date);

-- The taken and closed times of one place between two dates, as bare intervals. A confirmed or
-- completed request takes its time; one still waiting has not been agreed to. A request with no
-- start time takes the whole day. Every interval takes the whole place.
CREATE FUNCTION public.bookable_busy(p_studio uuid, p_from date, p_to date)
RETURNS TABLE (starts_at timestamp, ends_at timestamp)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT b.session_date + coalesce(b.start_time, time '00:00'),
         CASE
           WHEN b.start_time IS NULL THEN (b.session_date + 1)::timestamp
           ELSE b.session_date + b.start_time
                + CASE
                    WHEN b.end_time IS NOT NULL AND b.end_time > b.start_time
                      THEN b.end_time - b.start_time
                    WHEN b.end_time IS NOT NULL
                      THEN (b.end_time - b.start_time) + interval '1 day'
                    ELSE make_interval(hours => coalesce(b.hours, 1))
                  END
         END
    FROM public.booking_requests b
   WHERE b.bookable_id = p_studio
     AND b.status IN ('confirmed', 'completed')
     AND b.session_date BETWEEN p_from - 1 AND p_to
  UNION ALL
  SELECT k.starts_at, k.ends_at
    FROM public.bookable_blocks k
   WHERE k.bookable_id = p_studio
     AND k.starts_at < (p_to + 1)::timestamp
     AND k.ends_at > p_from::timestamp;
$fn$;
REVOKE ALL ON FUNCTION public.bookable_busy(uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bookable_busy(uuid, date, date) TO anon, authenticated;

-- ── 3. Retire the rooms ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.bookable_rooms RENAME TO bookable_rooms_retired;
REVOKE ALL ON public.bookable_rooms_retired FROM PUBLIC, anon, authenticated;
COMMENT ON TABLE public.bookable_rooms_retired IS
  'Retired 4 Oct 2026: there are no rooms, people book a service. Kept unconverted; dropped in P2.';

-- ── Check ───────────────────────────────────────────────────────────────────────────────────────
DO $check$
DECLARE b record;
BEGIN
  SELECT * INTO b FROM _before;
  IF (SELECT count(*) FROM public.bookable_rooms_retired) <> b.rooms
     OR (SELECT count(*) FROM public.booking_requests) <> b.bookings
     OR (SELECT count(*) FROM public.bookable_blocks) <> b.blocks THEN
    RAISE EXCEPTION 'row counts changed';
  END IF;
  IF EXISTS (SELECT 1 FROM public.bookable_blocks WHERE room_id IS NOT NULL) THEN
    RAISE EXCEPTION 'a closure still names a room';
  END IF;
  IF to_regclass('public.bookable_rooms') IS NOT NULL THEN
    RAISE EXCEPTION 'bookable_rooms is still there';
  END IF;
  IF has_table_privilege('anon', 'public.bookable_rooms_retired', 'SELECT')
     OR has_table_privilege('authenticated', 'public.bookable_rooms_retired', 'SELECT') THEN
    RAISE EXCEPTION 'bookable_rooms_retired is still readable';
  END IF;
  IF (SELECT count(*) FROM unnest((SELECT proargmodes FROM pg_proc
         WHERE oid = 'public.bookable_busy(uuid, date, date)'::regprocedure)) AS m
       WHERE m = 't') <> 2 THEN
    RAISE EXCEPTION 'bookable_busy() does not return two columns';
  END IF;
  RAISE NOTICE 'rooms retired %, bookings %, blocks %', b.rooms, b.bookings, b.blocks;
END
$check$;

COMMIT;
