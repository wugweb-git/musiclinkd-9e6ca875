-- Missing data: the columns, taxonomy options and counters the screens need for the content that
-- was hardcoded in src/data/discover.ts, src/data/profile.ts, src/data/booking.ts,
-- src/data/market.ts and src/data/rentals.ts, and that 20260918220000_hardcoded_rows_to_db.sql and
-- 20260918221000_hardcoded_people_to_db.sql listed as "not stored" because nothing could hold it.
-- Snapshot: supabase/dumps/2026-09-18-before-missing-data.sql
--
--   taxonomy_options   genres +12 (indie, electronic, ambient, pop_vocals, house, techno, desi_bass,
--                      carnatic_fusion, semi_classical, gully_rap, folk, punjabi_folk);
--                      languages +3 (sa, ur, kok); instruments +2 (synth, percussion; "Bass" is the
--                      existing bass_guitar); availability_status +1 (selective); studio_amenities +17
--                      (every facility in booking.ts / market.ts with no slug); profile_fields +4
--                      (labels for the new professional-detail keys)
--   profiles           + rate_paise, rate_unit, area, influences, response_time, rating, review_count,
--                      followers_count
--   profile_business   + legal_name
--   studios            + response_time, add_ons           (rating / review_count now kept by trigger)
--   studio_rooms       + description, tiers
--   reviews            + tags
--   portfolio_items    + duration
--   functions          refresh_review_stats() + trigger on reviews; refresh_follower_count() +
--                      trigger on follows; profile_response_time(uuid)
--
-- Rates: rate_paise / rate_unit hold the talent cards' amount and unit. rate_unit also allows
-- 'feature' (Zaid Qureshi's card: per feature), which the contract list did not name. hourly_rate_paise
-- stays; it is copied into rate_paise / 'hour' where no rate is set.
--
-- Counters: profiles.rating / review_count and studios.rating / review_count are recomputed from
-- the reviews rows, and profiles.followers_count from follows, for every existing row. Studios that
-- held imported figures with no review rows behind them go to rating NULL, review_count 0; their
-- previous values are listed in the snapshot.
--
-- Rows are targeted by the fixed ids, slugs and usernames 20260918220000 and 20260918221000 used
-- (including the live profiles yash.raj.sound.studios and octave.sound.labs and their studios
-- yash-raj-sound-studios, octave-sound-labs, jam-room-bandra).
-- Nothing private is written. ananya.sharma (live QA account) is not touched.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS, ON CONFLICT, CREATE OR REPLACE, DROP TRIGGER IF EXISTS;
-- array backfills only add values not already present; text backfills only fill an empty column.
--
-- Rollback:
--   DROP TRIGGER IF EXISTS reviews_refresh_stats ON public.reviews;
--   DROP TRIGGER IF EXISTS follows_refresh_count ON public.follows;
--   DROP FUNCTION IF EXISTS public.refresh_review_stats(), public.refresh_follower_count(),
--     public.profile_response_time(uuid), public.recompute_review_stats(uuid, uuid);
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS rate_paise, DROP COLUMN IF EXISTS rate_unit,
--     DROP COLUMN IF EXISTS area, DROP COLUMN IF EXISTS influences, DROP COLUMN IF EXISTS response_time,
--     DROP COLUMN IF EXISTS rating, DROP COLUMN IF EXISTS review_count, DROP COLUMN IF EXISTS followers_count;
--   ALTER TABLE public.profile_business DROP COLUMN IF EXISTS legal_name;
--   ALTER TABLE public.studios DROP COLUMN IF EXISTS response_time, DROP COLUMN IF EXISTS add_ons;
--   ALTER TABLE public.studio_rooms DROP COLUMN IF EXISTS description, DROP COLUMN IF EXISTS tiers;
--   ALTER TABLE public.reviews DROP COLUMN IF EXISTS tags;
--   ALTER TABLE public.portfolio_items DROP COLUMN IF EXISTS duration;
--   DELETE FROM public.studio_equipment WHERE id IN (the 13 ids in the studio_equipment block below);
--   DELETE FROM public.taxonomy_options WHERE (category_key, slug) IN (the 39 options in the TAXONOMY
--     block below);
--   then run the snapshot's statements (studios rating / review_count / amenities, profiles genres /
--   languages / instruments, profile_role_details.details).

BEGIN;

-- ===== TAXONOMY =====
-- Slug style as live: genres / instruments / amenities snake_case, languages ISO 639 codes
-- (bho is 639-3, so kok is too), labels as the category shows them (languages in their own script).
-- sort_order continues after the current last option of each category.
INSERT INTO public.taxonomy_options (category_key, slug, label, sort_order, metadata)
SELECT v.category_key, v.slug, v.label,
       coalesce((SELECT max(o.sort_order) FROM public.taxonomy_options o WHERE o.category_key = v.category_key), 0) + v.n,
       v.metadata
FROM (VALUES
  ('genres', 'indie',           'Indie',           1, '{"scope":"universal"}'::jsonb),
  ('genres', 'electronic',      'Electronic',      2, '{"scope":"universal"}'::jsonb),
  ('genres', 'ambient',         'Ambient',         3, '{"scope":"universal"}'::jsonb),
  ('genres', 'pop_vocals',      'Pop Vocals',      4, '{"scope":"universal"}'::jsonb),
  ('genres', 'house',           'House',           5, '{"scope":"universal"}'::jsonb),
  ('genres', 'techno',          'Techno',          6, '{"scope":"universal"}'::jsonb),
  ('genres', 'desi_bass',       'Desi Bass',       7, '{"scope":"regional"}'::jsonb),
  ('genres', 'carnatic_fusion', 'Carnatic Fusion', 8, '{"scope":"regional"}'::jsonb),
  ('genres', 'semi_classical',  'Semi-Classical',  9, '{"scope":"regional"}'::jsonb),
  ('genres', 'gully_rap',       'Gully Rap',      10, '{"scope":"regional"}'::jsonb),
  ('genres', 'folk',            'Folk',           11, '{"scope":"universal"}'::jsonb),
  ('genres', 'punjabi_folk',    'Punjabi Folk',   12, '{"scope":"regional"}'::jsonb),
  ('languages', 'sa',  'संस्कृतम्', 1, NULL::jsonb),
  ('languages', 'ur',  'اردو',     2, NULL::jsonb),
  ('languages', 'kok', 'कोंकणी',   3, NULL::jsonb),
  ('instruments', 'synth',      'Synth',      1, '{"family":"electronic"}'::jsonb),
  ('instruments', 'percussion', 'Percussion', 2, '{"family":"percussion"}'::jsonb),
  ('availability_status', 'selective', 'Selective', 1, NULL::jsonb),
  -- booking.ts facilities (Octave Sound Labs, Headroom Mastering, The Basement Jam Rooms,
  -- Waveform Podcast Studio) and market.ts "Facilities" specs (Bandra Jam Room, Yash Raj Sound —
  -- Studio A) with no slug yet. Parking, Live room, Vocal booth, Engineer included, Lounge map to
  -- parking_space, live_room, vocal_booth, resident_engineers, private_lounge.
  ('studio_amenities', 'green_room',         'Green Room',         1, NULL::jsonb),
  ('studio_amenities', 'wifi',               'Wi-Fi',              2, NULL::jsonb),
  ('studio_amenities', 'attended_sessions',  'Attended Sessions',  3, NULL::jsonb),
  ('studio_amenities', 'stem_mastering',     'Stem Mastering',     4, NULL::jsonb),
  ('studio_amenities', 'analogue_chain',     'Analogue Chain',     5, NULL::jsonb),
  ('studio_amenities', 'reference_library',  'Reference Library',  6, NULL::jsonb),
  ('studio_amenities', 'backline_included',  'Backline Included',  7, NULL::jsonb),
  ('studio_amenities', 'open_till_2am',      'Open Till 2 AM',     8, NULL::jsonb),
  ('studio_amenities', 'lockers',            'Lockers',            9, NULL::jsonb),
  ('studio_amenities', 'cafe',               'Cafe',              10, NULL::jsonb),
  ('studio_amenities', 'four_mic_positions', '4 Mic Positions',   11, NULL::jsonb),
  ('studio_amenities', 'multicam_video',     'Multicam Video',    12, NULL::jsonb),
  ('studio_amenities', 'producer',           'Producer',          13, NULL::jsonb),
  ('studio_amenities', 'same_day_audio',     'Same-Day Audio',    14, NULL::jsonb),
  ('studio_amenities', 'air_conditioning',   'AC',                15, NULL::jsonb),
  ('studio_amenities', 'drinking_water',     'Water',             16, NULL::jsonb),
  ('studio_amenities', 'catering',           'Catering',          17, NULL::jsonb),
  -- Display names for the professional-detail keys written into profile_role_details.details below
  -- (same shape as 20260915190000_profile_field_labels.sql).
  ('profile_fields', 'production_styles',  'Production Styles',  1, '{"table":"profile_role_details","column":"details","json_key":"production_styles"}'::jsonb),
  ('profile_fields', 'monitoring',         'Monitoring',         2, '{"table":"profile_role_details","column":"details","json_key":"monitoring"}'::jsonb),
  ('profile_fields', 'turnaround',         'Turnaround',         3, '{"table":"profile_role_details","column":"details","json_key":"turnaround"}'::jsonb),
  ('profile_fields', 'session_experience', 'Session Experience', 4, '{"table":"profile_role_details","column":"details","json_key":"session_experience"}'::jsonb)
) AS v(category_key, slug, label, n, metadata)
ON CONFLICT (category_key, slug) DO NOTHING;

-- ===== COLUMNS =====
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rate_paise      bigint,
  ADD COLUMN IF NOT EXISTS rate_unit       text,
  ADD COLUMN IF NOT EXISTS area            text,
  ADD COLUMN IF NOT EXISTS influences      text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS response_time   text,
  ADD COLUMN IF NOT EXISTS rating          numeric(2,1),
  ADD COLUMN IF NOT EXISTS review_count    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followers_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_rate_paise_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_rate_paise_check CHECK (rate_paise >= 0);
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_rate_unit_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_rate_unit_check
  CHECK (rate_unit IN ('hour', 'song', 'show', 'night', 'day', 'session', 'track', 'feature'));
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_rating_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_rating_check CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_counts_nonnegative;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_counts_nonnegative
  CHECK (review_count >= 0 AND followers_count >= 0);

ALTER TABLE public.profile_business ADD COLUMN IF NOT EXISTS legal_name text;

ALTER TABLE public.studios
  ADD COLUMN IF NOT EXISTS response_time text,
  ADD COLUMN IF NOT EXISTS add_ons       jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.studios DROP CONSTRAINT IF EXISTS studios_add_ons_array;
ALTER TABLE public.studios ADD CONSTRAINT studios_add_ons_array CHECK (jsonb_typeof(add_ons) = 'array');

ALTER TABLE public.studio_rooms
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS tiers       jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.studio_rooms DROP CONSTRAINT IF EXISTS studio_rooms_tiers_array;
ALTER TABLE public.studio_rooms ADD CONSTRAINT studio_rooms_tiers_array CHECK (jsonb_typeof(tiers) = 'array');

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.portfolio_items ADD COLUMN IF NOT EXISTS duration text;

-- ===== REVIEW STATS =====
-- avg(rating) to one decimal and the count, for one profile and/or one studio. NULL rating at 0.
CREATE OR REPLACE FUNCTION public.recompute_review_stats(p_profile uuid, p_studio uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF p_profile IS NOT NULL THEN
    UPDATE public.profiles p
    SET rating = s.avg_rating, review_count = s.n
    FROM (
      SELECT round(avg(r.rating), 1) AS avg_rating, count(*)::int AS n
      FROM public.reviews r WHERE r.target_profile_id = p_profile
    ) s
    WHERE p.id = p_profile
      AND (p.rating, p.review_count) IS DISTINCT FROM (s.avg_rating, s.n);
  END IF;
  IF p_studio IS NOT NULL THEN
    UPDATE public.studios st
    SET rating = s.avg_rating, review_count = s.n
    FROM (
      SELECT round(avg(r.rating), 1) AS avg_rating, count(*)::int AS n
      FROM public.reviews r WHERE r.target_studio_id = p_studio
    ) s
    WHERE st.id = p_studio
      AND (st.rating, st.review_count) IS DISTINCT FROM (s.avg_rating, s.n);
  END IF;
END
$fn$;

REVOKE ALL ON FUNCTION public.recompute_review_stats(uuid, uuid) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.refresh_review_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM public.recompute_review_stats(NEW.target_profile_id, NEW.target_studio_id);
  END IF;
  IF TG_OP = 'DELETE'
     OR (TG_OP = 'UPDATE' AND (OLD.target_profile_id IS DISTINCT FROM NEW.target_profile_id
                               OR OLD.target_studio_id IS DISTINCT FROM NEW.target_studio_id)) THEN
    PERFORM public.recompute_review_stats(OLD.target_profile_id, OLD.target_studio_id);
  END IF;
  RETURN NULL;
END
$fn$;

REVOKE ALL ON FUNCTION public.refresh_review_stats() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS reviews_refresh_stats ON public.reviews;
CREATE TRIGGER reviews_refresh_stats
  AFTER INSERT OR UPDATE OF rating, target_profile_id, target_studio_id OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.refresh_review_stats();

-- ===== FOLLOWER COUNT =====
-- follows(follower_id, target_id): the followed profile is target_id.
CREATE OR REPLACE FUNCTION public.refresh_follower_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_target uuid := CASE WHEN TG_OP = 'DELETE' THEN OLD.target_id ELSE NEW.target_id END;
BEGIN
  UPDATE public.profiles p
  SET followers_count = (SELECT count(*)::int FROM public.follows f WHERE f.target_id = v_target)
  WHERE p.id = v_target;
  RETURN NULL;
END
$fn$;

REVOKE ALL ON FUNCTION public.refresh_follower_count() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS follows_refresh_count ON public.follows;
CREATE TRIGGER follows_refresh_count
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.refresh_follower_count();

-- ===== RESPONSE TIME =====
-- Median minutes from a message this profile received to its next reply in the same conversation,
-- over replies in the last 90 days. A run of received messages counts once, from its first message.
-- NULL when there are fewer than 3 replies. Returns only the aggregate, never a message, worded like
-- the stored response_time values: "Under 1 hr", "Under 3 hrs", "Under 2 days".
DROP FUNCTION IF EXISTS public.profile_response_time(uuid);
CREATE OR REPLACE FUNCTION public.profile_response_time(p uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  WITH received AS (
    SELECT m.conversation_id, m.created_at,
           (SELECT min(r.created_at) FROM public.messages r
             WHERE r.conversation_id = m.conversation_id
               AND r.sender_id = p
               AND r.created_at > m.created_at) AS replied_at
    FROM public.messages m
    WHERE m.sender_id <> p
      AND EXISTS (SELECT 1 FROM public.conversation_members cm
                   WHERE cm.conversation_id = m.conversation_id AND cm.profile_id = p)
  ),
  replies AS (
    SELECT conversation_id, replied_at, min(created_at) AS first_received
    FROM received
    WHERE replied_at IS NOT NULL AND replied_at > now() - interval '90 days'
    GROUP BY conversation_id, replied_at
  )
  , median AS (
    SELECT CASE WHEN count(*) >= 3
      THEN percentile_cont(0.5) WITHIN GROUP (
             ORDER BY extract(epoch FROM replied_at - first_received) / 60)
    END AS minutes
    FROM replies
  )
  SELECT CASE
    WHEN minutes IS NULL THEN NULL
    WHEN minutes < 60 THEN 'Under 1 hr'
    WHEN minutes < 1440 THEN 'Under ' || (floor(minutes / 60)::int + 1) || ' hrs'
    ELSE 'Under ' || (floor(minutes / 1440)::int + 1) || ' days'
  END
  FROM median;
$fn$;

REVOKE ALL ON FUNCTION public.profile_response_time(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.profile_response_time(uuid) TO anon, authenticated;

-- =====================================================================================================
-- BACKFILL: the content that was hardcoded in src/data/*.ts
-- =====================================================================================================

-- profiles: rates with units (discover.ts cards), areas (the neighbourhood part of each file's
-- location), influences (profile.ts), response times (market.ts / rentals.ts sellers and providers),
-- and the genre / language / instrument labels that had no slug until the taxonomy block above.
-- Arjun Menon's card rate is "On request": no amount, so no rate is stored. ananya.sharma is not touched.
WITH v (id, area, rate_paise, rate_unit, response_time, add_genres, add_languages, add_instruments, influences) AS (
  VALUES
  -- profile.ts + discover.ts
  ('5a7466b9-2422-5d5d-9460-ee61b2002f13'::uuid, 'Indiranagar', 2500000::bigint, 'track', NULL,
     ARRAY['indie', 'electronic', 'ambient'], ARRAY[]::text[], ARRAY['synth', 'bass_guitar', 'percussion'],
     ARRAY['Jai Paul', 'Sneha Khanwalkar', 'Jamie xx', 'A. R. Rahman']),
  -- discover.ts (+ market.ts for Meher Kaur)
  ('0662ace1-0642-5590-832f-f55fa23438f1'::uuid, 'Hauz Khas', 950000, 'day', 'Under 1 hr',
     ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]),
  ('61d15aab-b011-54ef-8644-b185711b608f'::uuid, 'Bandra', 6500000, 'night', NULL,
     ARRAY['house', 'techno', 'desi_bass'], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]),
  ('dbb4397e-9c0c-53d8-8624-2825c93d349f'::uuid, NULL, NULL, NULL, NULL,
     ARRAY['carnatic_fusion'], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]),
  ('3fc0b746-3c09-5140-9270-549088a046db'::uuid, NULL, 1400000, 'show', NULL,
     ARRAY['semi_classical'], ARRAY['sa'], ARRAY[]::text[], ARRAY[]::text[]),
  ('e441dda1-4f3e-562a-812d-1a5525b9a90e'::uuid, 'Dharavi', 4000000, 'feature', NULL,
     ARRAY['gully_rap'], ARRAY['ur'], ARRAY[]::text[], ARRAY[]::text[]),
  ('0f820a59-9f0a-56a6-b1c4-99360bcc0d2c'::uuid, NULL, 1200000, 'song', NULL,
     ARRAY['folk'], ARRAY['kok'], ARRAY[]::text[], ARRAY[]::text[]),
  ('53147d82-58ac-5f17-97d3-f8125042e764'::uuid, NULL, 5500000, 'show', NULL,
     ARRAY['punjabi_folk'], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]),
  ('689e3ab6-0309-58d2-9e9e-b7983d7dc132'::uuid, 'T. Nagar', 2200000, 'song', NULL,
     ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]),
  -- market.ts + rentals.ts
  ('565f053c-eacc-50cb-854d-d5d2bc06b64e'::uuid, 'Dadar', NULL, NULL, 'Under 2 hrs',
     ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]),
  ('7d175f7d-88fd-5a16-ab64-48f852c60c7e'::uuid, 'Andheri West', NULL, NULL, 'Under 1 hr',
     ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]),
  ('fc537d0d-0d31-5e6e-bc74-44d012f11f2d'::uuid, 'Girgaon', NULL, NULL, 'Same day',
     ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]),
  ('269fb1ae-0e54-53ef-8b67-b59865b14427'::uuid, 'Lower Parel', NULL, NULL, 'Under 3 hrs',
     ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]),
  -- discover.ts / booking.ts businesses
  ('4e4558aa-e260-5be1-a1db-ef48eaa6133d'::uuid, 'Koramangala', NULL, NULL, NULL,
     ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]),
  ('77423851-8af1-54e3-b5ab-bb449187d213'::uuid, 'Indiranagar', NULL, NULL, NULL,
     ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]),
  ('79661e0a-7cb0-5696-b16b-478b56381277'::uuid, 'Hauz Khas', NULL, NULL, NULL,
     ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]),
  ('18128ebd-c739-5c2e-b041-55496fcb1771'::uuid, 'Lower Parel', NULL, NULL, NULL,
     ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]),
  -- live profiles 20260918220000 matched by username: market.ts seller "Yash Raj Sound",
  -- booking.ts "Octave Sound Labs" (Andheri West; its reply time is the studio's, below)
  ((SELECT id FROM public.profiles WHERE username = 'yash.raj.sound.studios'), 'Andheri West', NULL, NULL, 'Under 4 hrs',
     ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]),
  ((SELECT id FROM public.profiles WHERE username = 'octave.sound.labs'), 'Andheri West', NULL, NULL, NULL,
     ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[])
)
UPDATE public.profiles p SET
  area          = coalesce(p.area, v.area),
  rate_paise    = coalesce(p.rate_paise, v.rate_paise),
  rate_unit     = CASE WHEN p.rate_paise IS NULL THEN v.rate_unit ELSE p.rate_unit END,
  response_time = coalesce(p.response_time, v.response_time),
  genres        = p.genres || ARRAY(SELECT x FROM unnest(v.add_genres) WITH ORDINALITY AS a(x, i)
                                    WHERE x <> ALL (p.genres) ORDER BY i),
  languages     = p.languages || ARRAY(SELECT x FROM unnest(v.add_languages) WITH ORDINALITY AS a(x, i)
                                       WHERE x <> ALL (p.languages) ORDER BY i),
  instruments   = p.instruments || ARRAY(SELECT x FROM unnest(v.add_instruments) WITH ORDINALITY AS a(x, i)
                                         WHERE x <> ALL (p.instruments) ORDER BY i),
  influences    = p.influences || ARRAY(SELECT x FROM unnest(v.influences) WITH ORDINALITY AS a(x, i)
                                        WHERE x <> ALL (p.influences) ORDER BY i)
FROM v
WHERE p.id = v.id;

-- Every other profile with an hourly rate: the same amount as rate_paise per hour.
UPDATE public.profiles
SET rate_paise = hourly_rate_paise, rate_unit = 'hour'
WHERE rate_paise IS NULL AND hourly_rate_paise IS NOT NULL;

-- profile_role_details: Rahul Iyer's professional-detail rows (profile.ts; DAW is already daw_tools)
-- and the discover.ts cards' "Selective" availability (Rahul Iyer, Arjun Menon, Harpreet Singh).
-- Keys already stored win.
UPDATE public.profile_role_details d
SET details = v.add || d.details
FROM (VALUES
  ('5a7466b9-2422-5d5d-9460-ee61b2002f13'::uuid, 'producer',
   '{"availability_status":"selective","production_styles":"Hybrid analog, live tracking","monitoring":"Focal Shape 65 · Neumann KH 80","turnaround":"3–5 working days per mix","session_experience":"180+ released tracks"}'::jsonb),
  ('dbb4397e-9c0c-53d8-8624-2825c93d349f'::uuid, 'composer',      '{"availability_status":"selective"}'::jsonb),
  ('53147d82-58ac-5f17-97d3-f8125042e764'::uuid, 'folk_vocalist', '{"availability_status":"selective"}'::jsonb)
) AS v (profile_id, role_slug, add)
WHERE d.profile_id = v.profile_id AND d.role_slug = v.role_slug
  AND d.details IS DISTINCT FROM v.add || d.details;

-- profile_business: legal names (rentals.ts providers' "business").
UPDATE public.profile_business b
SET legal_name = v.legal_name
FROM (VALUES
  ('7d175f7d-88fd-5a16-ab64-48f852c60c7e'::uuid, 'SoundHouse Audio LLP'),
  ('fc537d0d-0d31-5e6e-bc74-44d012f11f2d'::uuid, 'Swaraj Instruments Pvt Ltd'),
  ('269fb1ae-0e54-53ef-8b67-b59865b14427'::uuid, 'Pulse Live Systems')
) AS v (profile_id, legal_name)
WHERE b.profile_id = v.profile_id AND b.legal_name IS NULL;

-- studios: response times and add-ons (booking.ts), facilities (booking.ts facilities, market.ts
-- "Facilities" specs) as studio_amenities slugs added to what is stored. Add-on shape:
-- { name, price_paise, unit, description, available, quantity }; unit 'hour' for a per-hour add-on,
-- 'track' for Headroom's per-track one, else null; quantity true where the file let you pick several.
UPDATE public.studios s SET
  response_time = coalesce(s.response_time, v.response_time),
  add_ons       = CASE WHEN s.add_ons = '[]'::jsonb THEN v.add_ons ELSE s.add_ons END,
  amenities     = s.amenities || ARRAY(SELECT x FROM unnest(v.add_amenities) WITH ORDINALITY AS a(x, i)
                                       WHERE x <> ALL (s.amenities) ORDER BY i)
FROM (VALUES
  ('octave-sound-labs', 'Usually replies in 2 hours',
   '[{"name":"Additional engineer","description":"Second pair of hands for large sessions.","price_paise":80000,"unit":"hour","available":true,"quantity":false},
     {"name":"Drum kit (DW Collector''s)","description":"Tuned and mic''d before your slot.","price_paise":150000,"unit":null,"available":true,"quantity":false},
     {"name":"Guitar amp — Fender Twin","description":"Includes cab mics and stands.","price_paise":70000,"unit":null,"available":true,"quantity":false},
     {"name":"Nord Stage 3","description":"88-key stage piano with stand and pedal.","price_paise":90000,"unit":null,"available":false,"quantity":false},
     {"name":"Extra mic pack","description":"4 additional condensers and stands.","price_paise":60000,"unit":null,"available":true,"quantity":true},
     {"name":"Moog Sub 37 (rental)","description":"Fulfilled through the MusicLinkd rental marketplace.","price_paise":110000,"unit":null,"available":true,"quantity":false}]'::jsonb,
   ARRAY['green_room', 'wifi']),
  ('headroom-mastering', 'Usually replies same day',
   '[{"name":"Additional track","description":"Beyond the four included.","price_paise":250000,"unit":"track","available":true,"quantity":true},
     {"name":"Vinyl pre-master","description":"Separate cut optimised for lacquer.","price_paise":400000,"unit":null,"available":true,"quantity":false}]'::jsonb,
   ARRAY['attended_sessions', 'stem_mastering', 'analogue_chain', 'reference_library']),
  ('basement-jam', 'Instant confirmation',
   '[{"name":"Extra PA speaker","description":"For larger rehearsals.","price_paise":25000,"unit":null,"available":true,"quantity":false},
     {"name":"Rough room recording","description":"Stereo capture emailed after the session.","price_paise":40000,"unit":null,"available":true,"quantity":false}]'::jsonb,
   ARRAY['backline_included', 'open_till_2am', 'lockers', 'cafe']),
  ('waveform-podcast', 'Usually replies in 1 hour',
   '[{"name":"Edited episode","description":"Cut, levelled and delivered in 48 hours.","price_paise":350000,"unit":null,"available":true,"quantity":false},
     {"name":"5 vertical clips","description":"Captioned shorts for social.","price_paise":250000,"unit":null,"available":true,"quantity":false}]'::jsonb,
   ARRAY['four_mic_positions', 'multicam_video', 'producer', 'same_day_audio']),
  -- market.ts "Bandra Jam Room — Hourly Rehearsal": Facilities "AC, water, parking"
  ('jam-room-bandra', NULL, '[]'::jsonb, ARRAY['air_conditioning', 'drinking_water', 'parking_space']),
  -- market.ts "Yash Raj Sound — Studio A" (the studio yash-raj-sound-studios): "Parking, lounge, catering"
  ('yash-raj-sound-studios', NULL, '[]'::jsonb, ARRAY['parking_space', 'private_lounge', 'catering'])
) AS v (slug, response_time, add_ons, add_amenities)
WHERE s.slug = v.slug;

-- studio_rooms: descriptions and pricing tiers (booking.ts resources). Tier shape:
-- { label, hours, price_paise, unit } with unit the file's duration unit (hour, halfDay, fullDay,
-- session). The four rooms from 20260918221000 by id, Octave Sound Labs' three by studio and name.
UPDATE public.studio_rooms r SET
  description = coalesce(r.description, v.description),
  tiers       = CASE WHEN r.tiers = '[]'::jsonb THEN v.tiers ELSE r.tiers END
FROM (VALUES
  ('687e0b49-3432-5168-b4cd-e273d446759c'::uuid, NULL::text, NULL::text,
   'Sit in the room while your record is mastered — up to 4 tracks per session.',
   '[{"label":"Session · up to 4 tracks","hours":4,"price_paise":1200000,"unit":"session"},
     {"label":"Hourly","hours":1,"price_paise":350000,"unit":"hour"}]'::jsonb),
  ('43dc2ad6-4862-5421-969c-51115d0a417c'::uuid, NULL, NULL,
   'Drums, two amps, bass rig and a 4-channel PA.',
   '[{"label":"Hourly","hours":1,"price_paise":60000,"unit":"hour"},
     {"label":"Half day · 5 hrs","hours":5,"price_paise":260000,"unit":"halfDay"}]'::jsonb),
  ('d41cb640-dc68-5400-9882-53c870d5086d'::uuid, NULL, NULL,
   'Small carpeted room for writing sessions and acoustic rehearsals.',
   '[{"label":"Hourly","hours":1,"price_paise":35000,"unit":"hour"}]'::jsonb),
  ('238ef603-b18e-5e7d-ae30-4a799f9b82fd'::uuid, NULL, NULL,
   'Table for four with Shure SM7Bs, treated walls and a lit set.',
   '[{"label":"Hourly","hours":1,"price_paise":200000,"unit":"hour"},
     {"label":"Half day · 5 hrs","hours":5,"price_paise":850000,"unit":"halfDay"},
     {"label":"Episode package","hours":3,"price_paise":600000,"unit":"session"}]'::jsonb),
  (NULL, 'octave-sound-labs', 'Live Room A',
   '420 sq ft tracking floor with variable acoustics — best for full-band takes.',
   '[{"label":"Hourly","hours":1,"price_paise":240000,"unit":"hour"},
     {"label":"Half day · 5 hrs","hours":5,"price_paise":1050000,"unit":"halfDay"},
     {"label":"Full day · 10 hrs","hours":10,"price_paise":1900000,"unit":"fullDay"}]'::jsonb),
  (NULL, 'octave-sound-labs', 'Vocal Booth',
   'Tight, dry booth for lead and stack vocals with a dedicated headphone mix.',
   '[{"label":"Hourly","hours":1,"price_paise":120000,"unit":"hour"},
     {"label":"Half day · 5 hrs","hours":5,"price_paise":520000,"unit":"halfDay"}]'::jsonb),
  (NULL, 'octave-sound-labs', 'Mix Room B',
   'Focal-monitored mix suite with an attended-mix option.',
   '[{"label":"Hourly","hours":1,"price_paise":180000,"unit":"hour"},
     {"label":"Mix session · per song","hours":6,"price_paise":950000,"unit":"session"},
     {"label":"Full day · 10 hrs","hours":10,"price_paise":1500000,"unit":"fullDay"}]'::jsonb)
) AS v (room_id, studio_slug, room_name, description, tiers)
WHERE (v.room_id IS NOT NULL AND r.id = v.room_id)
   OR (v.room_id IS NULL AND r.name = v.room_name
       AND r.studio_id = (SELECT st.id FROM public.studios st WHERE st.slug = v.studio_slug));

-- studio_equipment: house gear for the three booking.ts studios, from their rooms' gear lists.
-- "2× SM58", "4× Shure SM7B", "3× Sony FX30" are stored as the item with its quantity.
-- Categories are equipment_categories slugs; gear that fits none (reverb unit, piano, camera) has none.
-- Fixed ids: uuid5 in the import_profiles.py namespace of "hardcoded:booking.ts:<studio>:equipment:<name>".
INSERT INTO public.studio_equipment (id, studio_id, name, category, quantity, sort_order)
SELECT v.id, s.id, v.name, v.category, v.quantity, v.sort_order
FROM (VALUES
  ('cd1a6db5-61b5-562a-ad8a-7a77ef4904b4'::uuid, 'headroom-mastering', 'Maselec MTC-1', 'mixers', NULL::int, 0),
  ('c5c57dc7-8d1b-54b9-bb14-f9101aeef4a2'::uuid, 'headroom-mastering', 'Bricasti M7', NULL::text, NULL, 1),
  ('b80cccf5-5564-5ecc-bf78-b70f547b0a42'::uuid, 'headroom-mastering', 'PMC twotwo.6', 'studio_monitors', NULL, 2),
  ('2aedff33-fd99-5090-9fd3-ee352d7f41ce'::uuid, 'basement-jam', 'Pearl Export kit', 'backline', NULL, 0),
  ('c82d6ace-56c2-53ab-ad9e-94599747a3c2'::uuid, 'basement-jam', 'Marshall DSL', 'backline', NULL, 1),
  ('4d602664-8d55-5c79-87ec-93b6548fc451'::uuid, 'basement-jam', 'Ampeg BA-210', 'backline', NULL, 2),
  ('bac4c8f9-4695-5f68-b6e5-5eddc640af77'::uuid, 'basement-jam', 'Yamaha PA', 'pa_systems', NULL, 3),
  ('f3dfedce-fc2d-5206-85d1-d1e1b8e8ea50'::uuid, 'basement-jam', 'Upright piano', NULL, NULL, 4),
  ('2d9e460a-340a-5ebf-88fb-8456c7450d4b'::uuid, 'basement-jam', 'SM58', 'microphones', 2, 5),
  ('223d98b2-577e-5020-b6e7-5721de7365dd'::uuid, 'basement-jam', 'Mixer', 'mixers', NULL, 6),
  ('b982660d-eb92-575d-b32d-70498dff30b6'::uuid, 'waveform-podcast', 'Shure SM7B', 'microphones', 4, 0),
  ('aa04a996-3ca9-54b6-9ee0-1ba96219266a'::uuid, 'waveform-podcast', 'Rodecaster Pro II', 'mixers', NULL, 1),
  ('5ee7d207-7bc1-5b77-bba5-b62f0a7049db'::uuid, 'waveform-podcast', 'Sony FX30', NULL, 3, 2)
) AS v (id, studio_slug, name, category, quantity, sort_order)
JOIN public.studios s ON s.slug = v.studio_slug
ON CONFLICT (id) DO NOTHING;

-- reviews: tags (rentals.ts rentalReviews rv1–rv3, stored by 20260918221000 under these ids).
UPDATE public.reviews r SET tags = v.tags
FROM (VALUES
  ('6109e3ea-9a2b-5d99-b17c-6fc22c63b9b9'::uuid, ARRAY['Condition as described', 'Great communication', 'Easy pickup']),
  ('c85acf0e-d9a1-53b8-87e2-f9f1a0b5fc67'::uuid, ARRAY['Accurate listing', 'Value']),
  ('7d9f090b-fcf6-5480-914a-cf0228696ad1'::uuid, ARRAY['Delivery', 'Condition as described'])
) AS v (id, tags)
WHERE r.id = v.id AND r.tags = '{}';

-- portfolio_items: durations (profile.ts Rahul Iyer audio a1–a4, video v1–v3).
UPDATE public.portfolio_items i SET duration = v.duration
FROM (VALUES
  ('94dabd52-2517-590e-a136-888bfeffb0c9'::uuid, '3:42'),
  ('65c07767-67e1-52a5-a514-930b8118bcb3'::uuid, '4:08'),
  ('3346b1b9-7e5f-5099-a772-0b909a85ac23'::uuid, '3:15'),
  ('4889d454-d244-58b9-88aa-acaf391f82c9'::uuid, '2:31'),
  ('c53deed2-3ac2-5ffb-923c-18edb9ee61bf'::uuid, '6:12'),
  ('52569034-b162-5378-9d1b-48f2523b19c1'::uuid, '12:40'),
  ('b3278804-1d15-5afc-90a8-c841c8fef5bb'::uuid, '9:05')
) AS v (id, duration)
WHERE i.id = v.id AND i.duration IS NULL;

-- ===== COUNTERS: every existing row =====
UPDATE public.profiles p
SET rating = s.avg_rating, review_count = s.n
FROM (
  SELECT p2.id,
         (SELECT round(avg(r.rating), 1) FROM public.reviews r WHERE r.target_profile_id = p2.id) AS avg_rating,
         (SELECT count(*)::int FROM public.reviews r WHERE r.target_profile_id = p2.id) AS n
  FROM public.profiles p2
) s
WHERE p.id = s.id AND (p.rating, p.review_count) IS DISTINCT FROM (s.avg_rating, s.n);

UPDATE public.studios st
SET rating = s.avg_rating, review_count = s.n
FROM (
  SELECT s2.id,
         (SELECT round(avg(r.rating), 1) FROM public.reviews r WHERE r.target_studio_id = s2.id) AS avg_rating,
         (SELECT count(*)::int FROM public.reviews r WHERE r.target_studio_id = s2.id) AS n
  FROM public.studios s2
) s
WHERE st.id = s.id AND (st.rating, st.review_count) IS DISTINCT FROM (s.avg_rating, s.n);

UPDATE public.profiles p
SET followers_count = s.n
FROM (
  SELECT p2.id, (SELECT count(*)::int FROM public.follows f WHERE f.target_id = p2.id) AS n
  FROM public.profiles p2
) s
WHERE p.id = s.id AND p.followers_count <> s.n;

-- ===== COUNTS ARE THE DATABASE'S =====
-- rating, review_count and followers_count are kept by the triggers above. A profile or studio
-- owner may update their own row, but not these: a direct update from the app keeps the old values.
CREATE OR REPLACE FUNCTION public.keep_counted_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  -- Depth 1 is a direct update; the recount triggers run deeper and may change them.
  IF pg_trigger_depth() = 1 AND auth.uid() IS NOT NULL THEN
    NEW.rating := OLD.rating;
    NEW.review_count := OLD.review_count;
    IF TG_TABLE_NAME = 'profiles' THEN
      NEW.followers_count := OLD.followers_count;
    END IF;
  END IF;
  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS keep_counted_columns ON public.profiles;
CREATE TRIGGER keep_counted_columns BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.keep_counted_columns();
DROP TRIGGER IF EXISTS keep_counted_columns ON public.studios;
CREATE TRIGGER keep_counted_columns BEFORE UPDATE ON public.studios
  FOR EACH ROW EXECUTE FUNCTION public.keep_counted_columns();

-- ===== CHECK: everything above is stored =====
DO $check$
BEGIN
  IF (SELECT count(*) FROM public.taxonomy_options
      WHERE (category_key, slug) IN (
        ('genres','indie'), ('genres','electronic'), ('genres','ambient'), ('genres','pop_vocals'),
        ('genres','house'), ('genres','techno'), ('genres','desi_bass'), ('genres','carnatic_fusion'),
        ('genres','semi_classical'), ('genres','gully_rap'), ('genres','folk'), ('genres','punjabi_folk'),
        ('languages','sa'), ('languages','ur'), ('languages','kok'),
        ('instruments','synth'), ('instruments','percussion'), ('availability_status','selective'),
        ('studio_amenities','green_room'), ('studio_amenities','wifi'), ('studio_amenities','attended_sessions'),
        ('studio_amenities','stem_mastering'), ('studio_amenities','analogue_chain'),
        ('studio_amenities','reference_library'), ('studio_amenities','backline_included'),
        ('studio_amenities','open_till_2am'), ('studio_amenities','lockers'), ('studio_amenities','cafe'),
        ('studio_amenities','four_mic_positions'), ('studio_amenities','multicam_video'),
        ('studio_amenities','producer'), ('studio_amenities','same_day_audio'),
        ('studio_amenities','air_conditioning'), ('studio_amenities','drinking_water'),
        ('studio_amenities','catering'),
        ('profile_fields','production_styles'), ('profile_fields','monitoring'),
        ('profile_fields','turnaround'), ('profile_fields','session_experience'))) <> 39
  THEN
    RAISE EXCEPTION 'missing data: a taxonomy option is missing';
  END IF;

  IF (SELECT count(*) FROM public.profiles WHERE id IN (
        '5a7466b9-2422-5d5d-9460-ee61b2002f13', '0662ace1-0642-5590-832f-f55fa23438f1',
        '61d15aab-b011-54ef-8644-b185711b608f', '3fc0b746-3c09-5140-9270-549088a046db',
        'e441dda1-4f3e-562a-812d-1a5525b9a90e', '0f820a59-9f0a-56a6-b1c4-99360bcc0d2c',
        '53147d82-58ac-5f17-97d3-f8125042e764', '689e3ab6-0309-58d2-9e9e-b7983d7dc132')
      AND rate_paise IS NOT NULL AND rate_unit IS NOT NULL) <> 8
     OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '5a7466b9-2422-5d5d-9460-ee61b2002f13'
                    AND area = 'Indiranagar' AND cardinality(influences) = 4
                    AND genres @> ARRAY['indie','electronic','ambient']
                    AND instruments @> ARRAY['synth','bass_guitar','percussion'])
     OR (SELECT count(*) FROM public.profiles WHERE response_time IS NOT NULL AND id IN (
        '0662ace1-0642-5590-832f-f55fa23438f1', '565f053c-eacc-50cb-854d-d5d2bc06b64e',
        '7d175f7d-88fd-5a16-ab64-48f852c60c7e', 'fc537d0d-0d31-5e6e-bc74-44d012f11f2d',
        '269fb1ae-0e54-53ef-8b67-b59865b14427')) <> 5
     OR (SELECT count(*) FROM public.profile_role_details
         WHERE details->>'availability_status' = 'selective' AND (profile_id, role_slug) IN (
           ('5a7466b9-2422-5d5d-9460-ee61b2002f13'::uuid, 'producer'),
           ('dbb4397e-9c0c-53d8-8624-2825c93d349f'::uuid, 'composer'),
           ('53147d82-58ac-5f17-97d3-f8125042e764'::uuid, 'folk_vocalist'))) <> 3
     OR (SELECT count(*) FROM public.profile_business WHERE legal_name IS NOT NULL AND profile_id IN (
        '7d175f7d-88fd-5a16-ab64-48f852c60c7e', 'fc537d0d-0d31-5e6e-bc74-44d012f11f2d',
        '269fb1ae-0e54-53ef-8b67-b59865b14427')) <> 3
     OR (SELECT count(*) FROM public.studios WHERE response_time IS NOT NULL AND add_ons <> '[]'::jsonb
         AND slug IN ('octave-sound-labs', 'headroom-mastering', 'basement-jam', 'waveform-podcast')) <> 4
     OR (SELECT count(*) FROM public.studio_rooms WHERE description IS NOT NULL AND tiers <> '[]'::jsonb
         AND studio_id IN (SELECT id FROM public.studios
                           WHERE slug IN ('octave-sound-labs', 'headroom-mastering', 'basement-jam', 'waveform-podcast'))) < 7
     OR (SELECT count(*) FROM public.studio_equipment WHERE studio_id IN (SELECT id FROM public.studios
         WHERE slug IN ('headroom-mastering', 'basement-jam', 'waveform-podcast'))) < 13
     OR (SELECT count(*) FROM public.reviews WHERE tags <> '{}' AND id IN (
        '6109e3ea-9a2b-5d99-b17c-6fc22c63b9b9', 'c85acf0e-d9a1-53b8-87e2-f9f1a0b5fc67',
        '7d9f090b-fcf6-5480-914a-cf0228696ad1')) <> 3
     OR (SELECT count(*) FROM public.portfolio_items WHERE duration IS NOT NULL AND id IN (
        '94dabd52-2517-590e-a136-888bfeffb0c9', '65c07767-67e1-52a5-a514-930b8118bcb3',
        '3346b1b9-7e5f-5099-a772-0b909a85ac23', '4889d454-d244-58b9-88aa-acaf391f82c9',
        'c53deed2-3ac2-5ffb-923c-18edb9ee61bf', '52569034-b162-5378-9d1b-48f2523b19c1',
        'b3278804-1d15-5afc-90a8-c841c8fef5bb')) <> 7
  THEN
    RAISE EXCEPTION 'missing data: a backfilled value is missing';
  END IF;
END
$check$;

COMMIT;
