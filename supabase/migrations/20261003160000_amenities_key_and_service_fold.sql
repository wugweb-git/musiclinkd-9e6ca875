-- Owner, 3 Oct 2026: name by the job, never by persona type.
--   1. The taxonomy key `studio_amenities` is `amenities`. Same 33 options, same slugs and labels;
--      every stored selection (bookables.amenities, bookable_rooms.amenities,
--      profile_services.amenity_slugs, bookable_photos.subject_id) is a slug and is untouched.
--   2. The amenity picker offers 12 options. The other 21 get metadata.picker = false: still
--      published, so their labels keep showing wherever a profile already has them; nothing is
--      deleted and no profile row changes.
--   3. `studio_services` folds into `service_categories`: 6 options that aren't there yet are
--      added with their existing labels, under the `studio` parent, offered to every person type
--      already offered `studio`. Not `recording`: `studio_recording` ("Studio recording") is
--      already under `studio`, and both would show in the picker. bookables.services is untouched,
--      so a business tagged "Recording" still shows it. The studio_services rows stay
--      (service_category_specialties still points at them); no screen reads that key.
-- Ships with the code on p1/facility-to-amenity, which reads `amenities` and honours `picker`.
-- Apply after 20261003150000, then publish. Between the two the live code still asks for
-- `studio_amenities`: amenity names fall back to slugs and the amenity picker is empty.
--
-- Snapshot: supabase/dumps/2026-10-03-before-amenities-key.sql, taken read-only on 3 Oct with
-- supabase/checks/before-amenities-key.sql (taxonomy only, no user data).
--
-- Rollback:
--   INSERT INTO public.taxonomy_categories SELECT * FROM jsonb_populate_record(
--     NULL::public.taxonomy_categories, (SELECT to_jsonb(c) FROM public.taxonomy_categories c
--     WHERE key = 'amenities') || '{"key":"studio_amenities","label":"Studio Amenities"}');
--   UPDATE public.taxonomy_options SET category_key = 'studio_amenities',
--     metadata = nullif(metadata - 'picker', '{}'::jsonb) WHERE category_key = 'amenities';
--   DELETE FROM public.taxonomy_categories WHERE key = 'amenities';
--   DELETE FROM public.person_type_service_categories WHERE service_category_category =
--     'service_categories' AND service_category_slug IN ('resident_engineers',
--     'attended_sessions', 'stem_mastering', 'producer', 'same_day_audio', 'multicam_video');
--   DELETE FROM public.taxonomy_options WHERE category_key = 'service_categories' AND slug IN
--     (the same 6);   -- none existed before (see the snapshot), so all 6 are this migration's.

BEGIN;

CREATE TEMP TABLE _before ON COMMIT DROP AS
SELECT (SELECT count(*) FROM public.taxonomy_options WHERE category_key = 'studio_amenities') AS amenities,
       (SELECT count(*) FROM public.taxonomy_options WHERE category_key = 'service_categories') AS services,
       (SELECT count(*) FROM public.taxonomy_options) AS options;

-- ── Guards ──────────────────────────────────────────────────────────────────────────────────────
DO $guard$
DECLARE r record; n bigint; bad text;
BEGIN
  IF EXISTS (SELECT 1 FROM public.taxonomy_categories WHERE key = 'amenities')
     OR EXISTS (SELECT 1 FROM public.taxonomy_options WHERE category_key = 'amenities') THEN
    RAISE EXCEPTION 'a taxonomy key "amenities" already exists';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.taxonomy_categories WHERE key = 'studio_amenities') THEN
    RAISE EXCEPTION 'no taxonomy key "studio_amenities" to rename';
  END IF;

  -- A row elsewhere pointing at a studio_amenities option by (category, slug) would block the
  -- rename; name it rather than fail on a constraint.
  FOR r IN
    SELECT c.conrelid::regclass AS tbl, a1.attname AS cat_col
      FROM pg_constraint c
      JOIN pg_attribute a1 ON a1.attrelid = c.conrelid AND a1.attnum = c.conkey[1]
     WHERE c.contype = 'f' AND c.confrelid = 'public.taxonomy_options'::regclass
  LOOP
    EXECUTE format('SELECT count(*) FROM %s WHERE %I = %L', r.tbl, r.cat_col, 'studio_amenities') INTO n;
    IF n > 0 THEN RAISE EXCEPTION '% has % rows pointing at studio_amenities', r.tbl, n; END IF;
  END LOOP;

  SELECT string_agg(p.proname, ', ') INTO bad
    FROM pg_proc p JOIN pg_namespace ns ON ns.oid = p.pronamespace
   WHERE ns.nspname = 'public' AND p.prosrc LIKE '%studio_amenities%';
  IF bad IS NOT NULL THEN RAISE EXCEPTION 'functions still naming studio_amenities: %', bad; END IF;

  IF (SELECT count(*) FROM public.taxonomy_options
       WHERE category_key = 'studio_services'
         AND slug IN ('resident_engineers', 'attended_sessions', 'stem_mastering',
                      'producer', 'same_day_audio', 'multicam_video')) <> 6 THEN
    RAISE EXCEPTION 'studio_services does not have all 6 options to fold';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.taxonomy_options
                  WHERE category_key = 'service_categories' AND slug = 'studio') THEN
    RAISE EXCEPTION 'service_categories has no "studio" parent';
  END IF;
END
$guard$;

-- ── 1. studio_amenities → amenities ─────────────────────────────────────────────────────────────
INSERT INTO public.taxonomy_categories
SELECT (jsonb_populate_record(NULL::public.taxonomy_categories,
          to_jsonb(c) || '{"key": "amenities", "label": "Amenities"}'::jsonb)).*
  FROM public.taxonomy_categories c
 WHERE c.key = 'studio_amenities';

UPDATE public.taxonomy_options SET category_key = 'amenities' WHERE category_key = 'studio_amenities';

DELETE FROM public.taxonomy_categories WHERE key = 'studio_amenities';

COMMENT ON COLUMN public.profile_services.amenity_slugs IS
  'The amenities a service uses (taxonomy key amenities).';

-- ── 2. The picker offers these 12 ───────────────────────────────────────────────────────────────
UPDATE public.taxonomy_options
   SET metadata = coalesce(metadata, '{}'::jsonb) || '{"picker": false}'::jsonb
 WHERE category_key = 'amenities'
   AND slug NOT IN ('valet_parking', 'private_lounge', 'chill_lounge', 'parking_space',
                    'fiber_internet', 'bar_and_diner_access', 'wifi', 'lockers', 'cafe',
                    'air_conditioning', 'drinking_water', 'catering');

-- ── 3. studio_services → service_categories ─────────────────────────────────────────────────────
INSERT INTO public.taxonomy_options (category_key, slug, label, sort_order, is_published, metadata)
SELECT 'service_categories', s.slug, s.label,
       139 + row_number() OVER (ORDER BY s.sort_order, s.slug),
       true,
       jsonb_build_object('app_key', s.slug, 'parent', 'studio')
  FROM public.taxonomy_options s
 WHERE s.category_key = 'studio_services'
   AND s.slug IN ('resident_engineers', 'attended_sessions', 'stem_mastering',
                  'producer', 'same_day_audio', 'multicam_video')
ON CONFLICT (category_key, slug) DO NOTHING;

INSERT INTO public.person_type_service_categories
  (person_type_category, person_type_slug, service_category_category, service_category_slug)
SELECT m.person_type_category, m.person_type_slug, 'service_categories', child
  FROM public.person_type_service_categories m,
       unnest(ARRAY['resident_engineers', 'attended_sessions', 'stem_mastering',
                    'producer', 'same_day_audio', 'multicam_video']) AS child
 WHERE m.service_category_category = 'service_categories' AND m.service_category_slug = 'studio'
ON CONFLICT DO NOTHING;

-- ── Check ───────────────────────────────────────────────────────────────────────────────────────
DO $check$
DECLARE b record;
BEGIN
  SELECT * INTO b FROM _before;
  IF EXISTS (SELECT 1 FROM public.taxonomy_options WHERE category_key = 'studio_amenities')
     OR EXISTS (SELECT 1 FROM public.taxonomy_categories WHERE key = 'studio_amenities') THEN
    RAISE EXCEPTION 'studio_amenities is still there';
  END IF;
  IF (SELECT count(*) FROM public.taxonomy_options WHERE category_key = 'amenities') <> b.amenities THEN
    RAISE EXCEPTION 'not every amenity option moved';
  END IF;
  IF (SELECT count(*) FROM public.taxonomy_options
       WHERE category_key = 'amenities' AND coalesce(metadata ->> 'picker', 'true') <> 'false') <> 12 THEN
    RAISE EXCEPTION 'the picker does not offer exactly 12 amenities';
  END IF;
  IF (SELECT count(*) FROM public.taxonomy_options
       WHERE category_key = 'service_categories'
         AND slug IN ('resident_engineers', 'attended_sessions', 'stem_mastering',
                      'producer', 'same_day_audio', 'multicam_video')) <> 6 THEN
    RAISE EXCEPTION 'service_categories is missing one of the 6 folded options';
  END IF;
  IF (SELECT count(*) FROM public.taxonomy_options) <> b.options
       + (SELECT count(*) FROM public.taxonomy_options WHERE category_key = 'service_categories')
       - b.services THEN
    RAISE EXCEPTION 'taxonomy options changed beyond the fold';
  END IF;
END
$check$;

COMMIT;
