-- Owner, 22 Sep 2026: the Services tab was empty on most talent profiles. This gives each of the
-- remaining generated talent profiles two services, priced from the person's own profile rate.
-- Snapshot and undo: supabase/dumps/2026-09-22-before-talent-services-rest.sql
--
-- Who: completed talent profiles with no services and no business row, whose id is a generated
-- (version 5) uuid and that have at least one role. Real sign-ups (version 4 ids), the owner's own
-- accounts and profiles with no role are left alone.
-- Pricing: an hourly rate prices hourly services at the rate, and per-song and per-show services at
-- a multiple of it, rounded to the nearest 100 rupees. A profile with a per-song, per-show or per-feature
-- rate uses that rate on its first service and asks for a quote on the second. A profile with no rate
-- asks for a quote on both.
-- Applied to the live database 2026-09-22: 122 rows for 61 profiles (64 -> 186 services).
-- Idempotent: a profile that already has a service is skipped.

INSERT INTO public.profile_services
  (profile_id, name, description, price_paise, price_unit, pricing_model_taxonomy, pricing_model,
   category_taxonomy, category, mode, work_modes, turnaround, availability, sort_order, status)
WITH t(role, variant, name, description, category, pricing_model, price_unit, mult, mode, work_modes, turnaround, availability) AS (
  VALUES
    ('singer', 'A', 'Session vocals', 'Lead and harmony vocals recorded for your track, in a studio or remotely. Two takes of each section and a comp-ready session.', 'session_vocals', 'hourly', 'hour', 1, 'Hybrid', ARRAY['in_person','remote']::text[], '3 days', 'Weekdays'),
    ('singer', 'B', 'Live vocal set', 'A live vocal set for weddings, cafés and private events around {city}, with the setlist agreed with you beforehand.', 'private_parties', 'custom', 'show', 4, 'In person', ARRAY['in_person']::text[], '2 weeks'' notice', 'Weekends'),
    ('lyricist', 'A', 'Lyric writing for your song', 'Original lyrics written to your melody or brief, with one round of revisions.', 'lyrics', 'per_song', 'song', 4, 'Remote', ARRAY['remote']::text[], '5 days', 'Weekdays'),
    ('lyricist', 'B', 'Hooks and topline lyrics', 'A chorus hook and topline lyric written over your track, delivered as a clean lyric sheet.', 'topline', 'per_song', 'song', 3, 'Remote', ARRAY['remote']::text[], '3 days', 'Weekdays'),
    ('producer', 'A', 'Music production for your track', 'Arrangement, programming and production for your song, from a demo to a finished session, with one round of revisions.', 'music_production', 'per_song', 'song', 6, 'Hybrid', ARRAY['in_person','remote']::text[], '1 week', 'Weekdays'),
    ('producer', 'B', 'Beat making', 'A custom beat built to your reference and tempo, delivered as stems.', 'beat_making', 'per_song', 'song', 3, 'Remote', ARRAY['remote']::text[], '4 days', 'Weekdays'),
    ('composer', 'A', 'Original composition', 'An original composition for your project, delivered as a demo with notation or a session on request.', 'composition', 'per_song', 'song', 6, 'Remote', ARRAY['remote']::text[], '1 week', 'Weekdays'),
    ('composer', 'B', 'Scoring for film and ads', 'Music written to picture for films, ads and digital content, quoted per project once I have seen the cut.', 'film_scoring', 'custom', 'song', NULL, 'Remote', ARRAY['remote']::text[], '2 weeks', 'Weekdays'),
    ('sound_engineer', 'A', 'Recording session engineering', 'Recording and tracking for your session, with the mics and signal chain set up for the source, in a studio in {city}.', 'session_recording', 'hourly', 'hour', 1, 'In person', ARRAY['in_person']::text[], 'Same week', 'Weekdays'),
    ('sound_engineer', 'B', 'Stereo mixing', 'A stereo mix of your track from stems, with two rounds of revisions.', 'stereo_mixing', 'per_song', 'song', 4, 'Remote', ARRAY['remote']::text[], '5 days', 'Weekdays'),
    ('sound_designer', 'A', 'Sound design for film and ads', 'Custom sound design and effects for films, ads and digital content, quoted per project.', 'sound_design', 'custom', 'song', NULL, 'Remote', ARRAY['remote']::text[], '1 week', 'Weekdays'),
    ('guitarist', 'A', 'Session guitar', 'Electric and acoustic parts for your track, tracked at a studio in {city} or sent as files.', 'instrument', 'hourly', 'hour', 1, 'Hybrid', ARRAY['in_person','remote']::text[], 'Same week', 'Weekdays'),
    ('guitarist', 'B', 'Live guitarist for gigs', 'Guitar for live gigs and tours, with my own rig; one rehearsal included.', 'band_gigs', 'custom', 'show', 4, 'In person', ARRAY['in_person','touring']::text[], '2 weeks'' notice', 'Weekends'),
    ('drummer', 'A', 'Session drums', 'Drum parts for your track, tracked at a studio in {city}.', 'instrument', 'hourly', 'hour', 1, 'In person', ARRAY['in_person']::text[], 'Same week', 'Weekdays'),
    ('drummer', 'B', 'Live drummer for gigs', 'Drums for live gigs and tours; one rehearsal included.', 'band_gigs', 'custom', 'show', 4, 'In person', ARRAY['in_person','touring']::text[], '2 weeks'' notice', 'Weekends'),
    ('keyboardist', 'A', 'Session keys', 'Keys, piano and synth parts for your track, tracked in a studio or sent as files.', 'instrument', 'hourly', 'hour', 1, 'Hybrid', ARRAY['in_person','remote']::text[], 'Same week', 'Weekdays'),
    ('keyboardist', 'B', 'Live keys for gigs', 'Keys for live gigs and shows; one rehearsal included.', 'band_gigs', 'custom', 'show', 4, 'In person', ARRAY['in_person','touring']::text[], '2 weeks'' notice', 'Weekends'),
    ('sitarist', 'A', 'Sitar for recordings', 'Sitar parts for your track, from melodic lines to ambient layers, tracked in a studio or sent as files.', 'instrument', 'hourly', 'hour', 1, 'Hybrid', ARRAY['in_person','remote']::text[], 'Same week', 'Weekdays'),
    ('sitarist', 'B', 'Sitar performance for events', 'A live sitar performance for weddings, receptions and private events around {city}.', 'live', 'custom', 'show', 4, 'In person', ARRAY['in_person']::text[], '2 weeks'' notice', 'Weekends'),
    ('folk_vocalist', 'A', 'Folk vocal set', 'A live folk vocal set for weddings, festivals and private events, with the setlist agreed with you beforehand.', 'live', 'custom', 'show', 4, 'In person', ARRAY['in_person','touring']::text[], '3 weeks'' notice', 'Weekends'),
    ('folk_vocalist', 'B', 'Folk vocals for recordings', 'Folk vocals recorded for your track, in a studio or remotely, quoted per song.', 'session_vocals', 'custom', 'song', NULL, 'Hybrid', ARRAY['in_person','remote']::text[], '1 week', 'Weekdays'),
    ('rapper', 'A', 'Guest verse', 'A rap verse written and recorded for your track, delivered as dry stems with a guide mix.', 'vocals', 'custom', 'feature', 4, 'Remote', ARRAY['remote']::text[], '1 week', 'Weekdays'),
    ('rapper', 'B', 'Rap hooks and features', 'Hooks and features for singles and EPs, quoted per track.', 'vocals', 'custom', 'song', NULL, 'Remote', ARRAY['remote']::text[], '1 week', 'Weekdays')
),
target AS (
  SELECT p.id, p.city, p.roles, p.rate_paise, p.rate_unit
    FROM public.profiles p
   WHERE p.onboarding_complete
     AND cardinality(p.roles) > 0
     AND p.username NOT IN ('test', 'vedanshu', 'vedanshu.beats')
     AND substr(p.id::text, 15, 1) = '5'
     AND NOT EXISTS (SELECT 1 FROM public.profile_business b WHERE b.profile_id = p.id)
     AND NOT EXISTS (SELECT 1 FROM public.profile_services s WHERE s.profile_id = p.id)
),
slots AS (
  -- slot 0: the first role, variant A. slot 1: the second role's variant A when it has one, otherwise the first role's variant B.
  SELECT g.id, 0 AS slot, g.roles[1] AS role, 'A' AS variant FROM target g
  UNION ALL
  SELECT g.id, 1,
         CASE WHEN g.roles[2] IS NOT NULL AND EXISTS (SELECT 1 FROM t WHERE t.role = g.roles[2] AND t.variant = 'A') THEN g.roles[2] ELSE g.roles[1] END,
         CASE WHEN g.roles[2] IS NOT NULL AND EXISTS (SELECT 1 FROM t WHERE t.role = g.roles[2] AND t.variant = 'A') THEN 'A' ELSE 'B' END
    FROM target g
)
SELECT g.id AS profile_id,
       t.name AS name,
       replace(t.description, '{city}', coalesce(g.city, 'your city')) AS description,
       CASE
         WHEN g.rate_paise IS NULL THEN NULL
         WHEN g.rate_unit = 'hour' THEN CASE WHEN t.mult IS NULL THEN NULL ELSE (round(g.rate_paise * t.mult / 10000.0) * 10000)::bigint END
         WHEN s.slot = 0 THEN g.rate_paise
         ELSE NULL
       END AS price_paise,
       CASE WHEN g.rate_paise IS NOT NULL AND g.rate_unit <> 'hour' AND s.slot = 0 THEN g.rate_unit ELSE t.price_unit END AS price_unit,
       'pricing_models' AS pricing_model_taxonomy,
       CASE
         WHEN g.rate_paise IS NULL THEN 'custom'
         WHEN g.rate_unit <> 'hour' AND s.slot = 0 THEN CASE WHEN g.rate_unit = 'song' THEN 'per_song' ELSE 'custom' END
         WHEN g.rate_unit <> 'hour' THEN 'custom'
         ELSE t.pricing_model
       END AS pricing_model,
       'service_categories' AS category_taxonomy,
       t.category AS category, t.mode AS mode, t.work_modes AS work_modes, t.turnaround AS turnaround, t.availability AS availability, s.slot AS sort_order, 'active' AS status
  FROM slots s
  JOIN target g ON g.id = s.id
  JOIN t ON t.role = s.role AND t.variant = s.variant;
