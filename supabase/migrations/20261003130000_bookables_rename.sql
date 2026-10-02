-- Rename the studio tables to business-neutral names (owner, 3 Oct 2026). A bookable is a place a
-- business runs — rooms, an hourly rate, opening hours, equipment — not the business itself, which
-- is the profile. Studio is one business type; the type stays on the owner's profile (no new
-- column). Rename only: every row, id, link, rule, trigger and index carries over.
--
--   studios          → bookables            studio_id        → bookable_id   (every table)
--   studio_rooms     → bookable_rooms       target_studio_id → target_bookable_id (reviews)
--   studio_blocks    → bookable_blocks      studio_name      → bookable_name (booking_requests)
--   studio_equipment → bookable_equipment   studio_is_mine   → bookable_is_mine
--   studio_photos    → bookable_photos      studio_busy      → bookable_busy
--                                           can_review_studio → can_review_bookable
--                                           studios_guard_admin_fields → bookables_guard_admin_fields
--
-- Functions are rewritten from their LIVE definitions (pg_get_functiondef), not from older
-- migration files: only these exact names are swapped, with word boundaries, nothing else —
--   public.studios / public.studio_rooms / _blocks / _equipment / _photos  → public.bookable…
--   studio_id → bookable_id · target_studio_id → target_bookable_id · studio_name → bookable_name
--   public.studio_is_mine( / public.studio_busy( / public.can_review_studio( → the new names
-- Parameter and variable names (p_studio, v_studio…) are left as they are: Postgres cannot rename a
-- parameter in place, and they never leave the function. Message text is not touched.
--
-- Kept working until the code is on the new names (dropped by the cleanup migration):
--   views studios, studio_rooms, studio_blocks, studio_equipment, studio_photos over the new
--   tables, WITH (security_invoker = true) so every row rule applies to whoever reads them, with
--   bookable_id shown as studio_id; and functions studio_is_mine, studio_busy, can_review_studio
--   calling the new ones.
-- NOT kept working: booking_requests.studio_id / studio_name and reviews.target_studio_id. A
-- column on a table that keeps its name can't have a second name, so the live app's bookings and
-- reviews queries fail from the moment this is applied until the code rename is merged and
-- published. Apply this and publish that together.
--
-- studios_one_per_owner (one bookable per owner) is kept, name and all.
-- The storage rules on business-media call studio_is_mine and read studios by object id, so they
-- follow the renames without being recreated; the checks at the end confirm it.
--
-- Snapshot: supabase/dumps/2026-10-03-before-bookables.sql (definitions and counts; no user data).
-- Every check at the end raises an exception on failure, which rolls the whole migration back.
--
-- Rollback: the reverse renames (ALTER TABLE … RENAME, ALTER FUNCTION … RENAME), after dropping
-- the compatibility views and wrapper functions, then re-run the snapshot's function definitions.

BEGIN;

-- ===== Before: counts and every link, to compare after =====
CREATE TEMP TABLE _before ON COMMIT DROP AS
SELECT
  (SELECT count(*) FROM public.studios)          AS bookables,
  (SELECT count(*) FROM public.studio_rooms)     AS rooms,
  (SELECT count(*) FROM public.studio_blocks)    AS blocks,
  (SELECT count(*) FROM public.studio_equipment) AS equipment,
  (SELECT count(*) FROM public.studio_photos)    AS photos,
  (SELECT count(*) FROM public.reviews)          AS reviews,
  (SELECT count(*) FROM public.booking_requests) AS bookings,
  (SELECT md5(coalesce(string_agg(id::text || ':' || coalesce(target_studio_id::text, '-'), ',' ORDER BY id), ''))
     FROM public.reviews)          AS review_links,
  (SELECT md5(coalesce(string_agg(id::text || ':' || coalesce(studio_id::text, '-'), ',' ORDER BY id), ''))
     FROM public.booking_requests) AS booking_links,
  (SELECT md5(coalesce(string_agg(id::text || ':' || studio_id::text, ',' ORDER BY id), ''))
     FROM public.studio_rooms)     AS room_links,
  (SELECT md5(coalesce(string_agg(id::text || ':' || studio_id::text, ',' ORDER BY id), ''))
     FROM public.studio_equipment) AS equipment_links,
  (SELECT md5(coalesce(string_agg(id::text || ':' || studio_id::text, ',' ORDER BY id), ''))
     FROM public.studio_photos)    AS photo_links;

-- ===== Tables =====
ALTER TABLE public.studios          RENAME TO bookables;
ALTER TABLE public.studio_rooms     RENAME TO bookable_rooms;
ALTER TABLE public.studio_blocks    RENAME TO bookable_blocks;
ALTER TABLE public.studio_equipment RENAME TO bookable_equipment;
ALTER TABLE public.studio_photos    RENAME TO bookable_photos;

-- ===== Columns: every column with "studio" in its name, on these tables and the two that link in =====
DO $cols$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('bookables', 'bookable_rooms', 'bookable_blocks', 'bookable_equipment',
                         'bookable_photos', 'booking_requests', 'reviews')
      AND column_name LIKE '%studio%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I RENAME COLUMN %I TO %I',
                   c.table_name, c.column_name, replace(c.column_name, 'studio', 'bookable'));
  END LOOP;
END
$cols$;

-- ===== Functions named after studios: renamed in place, so every rule and trigger that calls
-- them by object id keeps calling them =====
ALTER FUNCTION public.studio_is_mine(uuid)            RENAME TO bookable_is_mine;
ALTER FUNCTION public.studio_busy(uuid, date, date)   RENAME TO bookable_busy;
ALTER FUNCTION public.can_review_studio(uuid)         RENAME TO can_review_bookable;
ALTER FUNCTION public.studios_guard_admin_fields()    RENAME TO bookables_guard_admin_fields;

-- ===== Function bodies: rewritten from the live definitions, exact names only =====
DO $bodies$
DECLARE
  f record;
  def text;
  rewritten text;
BEGIN
  FOR f IN
    SELECT p.oid, p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosrc ~ '(public\.studio(s|_rooms|_blocks|_equipment|_photos)\M|\mstudio_id\M|\mtarget_studio_id\M|\mstudio_name\M|public\.(studio_is_mine|studio_busy|can_review_studio)\()'
  LOOP
    def := pg_get_functiondef(f.oid);
    rewritten := def;
    rewritten := regexp_replace(rewritten, 'public\.studios\M', 'public.bookables', 'g');
    rewritten := regexp_replace(rewritten, 'public\.studio_(rooms|blocks|equipment|photos)\M', 'public.bookable_\1', 'g');
    rewritten := regexp_replace(rewritten, '\mtarget_studio_id\M', 'target_bookable_id', 'g');
    rewritten := regexp_replace(rewritten, '\mstudio_id\M', 'bookable_id', 'g');
    rewritten := regexp_replace(rewritten, '\mstudio_name\M', 'bookable_name', 'g');
    rewritten := regexp_replace(rewritten, 'public\.studio_is_mine\(', 'public.bookable_is_mine(', 'g');
    rewritten := regexp_replace(rewritten, 'public\.studio_busy\(', 'public.bookable_busy(', 'g');
    rewritten := regexp_replace(rewritten, 'public\.can_review_studio\(', 'public.can_review_bookable(', 'g');
    IF rewritten <> def THEN
      RAISE NOTICE 'rewriting %', f.proname;
      EXECUTE rewritten;
    END IF;
  END LOOP;
END
$bodies$;

-- ===== Compatibility: the old names, until the code is on the new ones =====
-- Views list each column, showing a renamed one under its old name, so old reads and writes work.
DO $views$
DECLARE
  pair text[];
  cols text;
BEGIN
  FOREACH pair SLICE 1 IN ARRAY ARRAY[
    ARRAY['studios', 'bookables'],
    ARRAY['studio_rooms', 'bookable_rooms'],
    ARRAY['studio_blocks', 'bookable_blocks'],
    ARRAY['studio_equipment', 'bookable_equipment'],
    ARRAY['studio_photos', 'bookable_photos']
  ] LOOP
    SELECT string_agg(
             CASE WHEN column_name LIKE '%bookable%'
                  THEN format('%I AS %I', column_name, replace(column_name, 'bookable', 'studio'))
                  ELSE format('%I', column_name) END,
             ', ' ORDER BY ordinal_position)
      INTO cols
      FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = pair[2];
    EXECUTE format('CREATE VIEW public.%I WITH (security_invoker = true) AS SELECT %s FROM public.%I',
                   pair[1], cols, pair[2]);
    -- security_invoker: the reader's own grants and row rules on the table decide what they get.
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', pair[1]);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', pair[1]);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', pair[1]);
  END LOOP;
END
$views$;

CREATE FUNCTION public.studio_is_mine(p_studio_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $fn$ SELECT public.bookable_is_mine(p_studio_id) $fn$;

CREATE FUNCTION public.can_review_studio(p_studio_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $fn$ SELECT public.can_review_bookable(p_studio_id) $fn$;

DO $busy$
BEGIN
  EXECUTE format(
    'CREATE FUNCTION public.studio_busy(%s) RETURNS %s LANGUAGE sql STABLE SECURITY INVOKER '
    'SET search_path = public AS $w$ SELECT * FROM public.bookable_busy($1, $2, $3) $w$',
    pg_get_function_arguments('public.bookable_busy(uuid, date, date)'::regprocedure),
    pg_get_function_result('public.bookable_busy(uuid, date, date)'::regprocedure));
END
$busy$;

GRANT EXECUTE ON FUNCTION public.studio_is_mine(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_review_studio(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.studio_busy(uuid, date, date) TO anon, authenticated;

-- ===== Checks: any failure raises and rolls everything back =====
DO $check$
DECLARE
  b record;
  n_bookables int; n_rooms int; n_blocks int; n_equipment int; n_photos int; n_reviews int; n_bookings int;
  bad text;
BEGIN
  SELECT * INTO b FROM _before;
  SELECT count(*) INTO n_bookables FROM public.bookables;
  SELECT count(*) INTO n_rooms     FROM public.bookable_rooms;
  SELECT count(*) INTO n_blocks    FROM public.bookable_blocks;
  SELECT count(*) INTO n_equipment FROM public.bookable_equipment;
  SELECT count(*) INTO n_photos    FROM public.bookable_photos;
  SELECT count(*) INTO n_reviews   FROM public.reviews;
  SELECT count(*) INTO n_bookings  FROM public.booking_requests;

  -- The live counts in the snapshot.
  IF (n_bookables, n_rooms, n_blocks, n_equipment, n_photos) <> (21, 25, 0, 116, 57) THEN
    RAISE EXCEPTION 'bookable counts are % / % / % / % / %, expected 21 / 25 / 0 / 116 / 57',
      n_bookables, n_rooms, n_blocks, n_equipment, n_photos;
  END IF;
  IF (n_reviews, n_bookings) <> (43, 10) THEN
    RAISE EXCEPTION 'reviews % and booking_requests %, expected 43 and 10', n_reviews, n_bookings;
  END IF;
  -- And nothing lost against the moment before the rename.
  IF (n_bookables, n_rooms, n_blocks, n_equipment, n_photos, n_reviews, n_bookings)
     <> (b.bookables, b.rooms, b.blocks, b.equipment, b.photos, b.reviews, b.bookings) THEN
    RAISE EXCEPTION 'a row count changed during the rename';
  END IF;

  -- Every link points at the same id as before.
  IF (SELECT md5(coalesce(string_agg(id::text || ':' || coalesce(target_bookable_id::text, '-'), ',' ORDER BY id), ''))
        FROM public.reviews) <> b.review_links THEN
    RAISE EXCEPTION 'a review no longer points at the same bookable';
  END IF;
  IF (SELECT md5(coalesce(string_agg(id::text || ':' || coalesce(bookable_id::text, '-'), ',' ORDER BY id), ''))
        FROM public.booking_requests) <> b.booking_links THEN
    RAISE EXCEPTION 'a booking request no longer points at the same bookable';
  END IF;
  IF (SELECT md5(coalesce(string_agg(id::text || ':' || bookable_id::text, ',' ORDER BY id), ''))
        FROM public.bookable_rooms) <> b.room_links
     OR (SELECT md5(coalesce(string_agg(id::text || ':' || bookable_id::text, ',' ORDER BY id), ''))
        FROM public.bookable_equipment) <> b.equipment_links
     OR (SELECT md5(coalesce(string_agg(id::text || ':' || bookable_id::text, ',' ORDER BY id), ''))
        FROM public.bookable_photos) <> b.photo_links THEN
    RAISE EXCEPTION 'a room, equipment item or photo no longer points at the same bookable';
  END IF;

  -- The same rows through the old names, row rules and all.
  IF (SELECT count(*) FROM public.studios) <> n_bookables
     OR (SELECT count(*) FROM public.studio_photos) <> n_photos THEN
    RAISE EXCEPTION 'a compatibility view does not show the same rows';
  END IF;

  -- No column, and no function body, still names a studio table or column.
  SELECT string_agg(table_name || '.' || column_name, ', ') INTO bad
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name IN ('bookables', 'bookable_rooms', 'bookable_blocks', 'bookable_equipment',
                        'bookable_photos', 'booking_requests', 'reviews')
     AND column_name LIKE '%studio%';
  IF bad IS NOT NULL THEN RAISE EXCEPTION 'columns still named studio: %', bad; END IF;

  SELECT string_agg(p.proname, ', ') INTO bad
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname NOT IN ('studio_is_mine', 'studio_busy', 'can_review_studio')
     AND p.prosrc ~ '(public\.studio(s|_rooms|_blocks|_equipment|_photos)\M|\mstudio_id\M|\mtarget_studio_id\M|\mstudio_name\M)';
  IF bad IS NOT NULL THEN RAISE EXCEPTION 'functions still naming studio tables or columns: %', bad; END IF;

  -- The rating trigger watches the renamed column.
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggered_update_columns
                  WHERE event_object_schema = 'public' AND event_object_table = 'reviews'
                    AND trigger_name = 'reviews_refresh_stats'
                    AND event_object_column = 'target_bookable_id') THEN
    RAISE EXCEPTION 'reviews_refresh_stats does not watch target_bookable_id';
  END IF;

  -- One bookable per owner, kept.
  IF NOT EXISTS (SELECT 1 FROM pg_indexes
                  WHERE schemaname = 'public' AND tablename = 'bookables'
                    AND indexname = 'studios_one_per_owner') THEN
    RAISE EXCEPTION 'studios_one_per_owner is missing on bookables';
  END IF;

  -- The business-media storage rules now read bookables through bookable_is_mine.
  IF (SELECT count(*) FROM pg_policies
       WHERE schemaname = 'storage' AND tablename = 'objects'
         AND policyname LIKE '%business media%'
         AND coalesce(qual, '') || coalesce(with_check, '') LIKE '%bookable_is_mine%'
         AND coalesce(qual, '') || coalesce(with_check, '') LIKE '%bookables%') <> 4 THEN
    RAISE EXCEPTION 'the four business-media storage rules do not all use bookables';
  END IF;

  RAISE NOTICE 'bookables rename checked: % / % / % / % / %, reviews %, bookings %',
    n_bookables, n_rooms, n_blocks, n_equipment, n_photos, n_reviews, n_bookings;
END
$check$;

COMMIT;
