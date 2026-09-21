-- Owner, 22 Sep 2026: the 9 service categories were too broad to describe what people sell
-- (a guitarist could only pick Instrument or Live). Each broad category gets specific ones under it
-- (metadata.parent), plus a Hosting group for RJs, podcasters, DJs and event organisers. Every
-- person type is offered the specific categories under each broad one it maps to. The broad
-- ones stay: existing services use them.
-- Snapshot and undo: supabase/dumps/2026-09-22-before-service-subcategories.sql

BEGIN;

INSERT INTO public.taxonomy_options (category_key, slug, label, sort_order, is_published, metadata)
VALUES
  ('service_categories', 'hosting', 'Hosting', 10, true, jsonb_build_object('app_key', 'hosting')),
  ('service_categories', 'playback_singing', 'Playback singing', 101, true, jsonb_build_object('app_key', 'playback_singing', 'parent', 'vocals')),
  ('service_categories', 'session_vocals', 'Session vocals', 102, true, jsonb_build_object('app_key', 'session_vocals', 'parent', 'vocals')),
  ('service_categories', 'backing_vocals', 'Backing vocals', 103, true, jsonb_build_object('app_key', 'backing_vocals', 'parent', 'vocals')),
  ('service_categories', 'jingles', 'Jingles & ads', 104, true, jsonb_build_object('app_key', 'jingles', 'parent', 'vocals')),
  ('service_categories', 'demo_vocals', 'Demo vocals', 105, true, jsonb_build_object('app_key', 'demo_vocals', 'parent', 'vocals')),
  ('service_categories', 'voice_over', 'Voice-over', 106, true, jsonb_build_object('app_key', 'voice_over', 'parent', 'vocals')),
  ('service_categories', 'weddings', 'Weddings & sangeet', 107, true, jsonb_build_object('app_key', 'weddings', 'parent', 'live')),
  ('service_categories', 'corporate_events', 'Corporate events', 108, true, jsonb_build_object('app_key', 'corporate_events', 'parent', 'live')),
  ('service_categories', 'club_nights', 'Club nights', 109, true, jsonb_build_object('app_key', 'club_nights', 'parent', 'live')),
  ('service_categories', 'private_parties', 'Private parties', 110, true, jsonb_build_object('app_key', 'private_parties', 'parent', 'live')),
  ('service_categories', 'band_gigs', 'Band gigs', 111, true, jsonb_build_object('app_key', 'band_gigs', 'parent', 'live')),
  ('service_categories', 'concerts', 'Concerts & festivals', 112, true, jsonb_build_object('app_key', 'concerts', 'parent', 'live')),
  ('service_categories', 'session_recording', 'Session recording', 113, true, jsonb_build_object('app_key', 'session_recording', 'parent', 'instrument')),
  ('service_categories', 'remote_tracks', 'Remote tracks', 114, true, jsonb_build_object('app_key', 'remote_tracks', 'parent', 'instrument')),
  ('service_categories', 'arrangements', 'Arrangements', 115, true, jsonb_build_object('app_key', 'arrangements', 'parent', 'instrument')),
  ('service_categories', 'accompaniment', 'Accompaniment', 116, true, jsonb_build_object('app_key', 'accompaniment', 'parent', 'instrument')),
  ('service_categories', 'music_production', 'Music production', 117, true, jsonb_build_object('app_key', 'music_production', 'parent', 'production')),
  ('service_categories', 'beat_making', 'Beat making', 118, true, jsonb_build_object('app_key', 'beat_making', 'parent', 'production')),
  ('service_categories', 'film_scoring', 'Film & ad scoring', 119, true, jsonb_build_object('app_key', 'film_scoring', 'parent', 'production')),
  ('service_categories', 'sound_design', 'Sound design', 120, true, jsonb_build_object('app_key', 'sound_design', 'parent', 'production')),
  ('service_categories', 'podcast_production', 'Podcast production', 121, true, jsonb_build_object('app_key', 'podcast_production', 'parent', 'production')),
  ('service_categories', 'lyrics', 'Lyrics', 122, true, jsonb_build_object('app_key', 'lyrics', 'parent', 'songwriting')),
  ('service_categories', 'composition', 'Composition', 123, true, jsonb_build_object('app_key', 'composition', 'parent', 'songwriting')),
  ('service_categories', 'topline', 'Topline writing', 124, true, jsonb_build_object('app_key', 'topline', 'parent', 'songwriting')),
  ('service_categories', 'stereo_mixing', 'Stereo mixing', 125, true, jsonb_build_object('app_key', 'stereo_mixing', 'parent', 'mixing')),
  ('service_categories', 'atmos_mixing', 'Dolby Atmos mixing', 126, true, jsonb_build_object('app_key', 'atmos_mixing', 'parent', 'mixing')),
  ('service_categories', 'vocal_tuning', 'Vocal tuning & editing', 127, true, jsonb_build_object('app_key', 'vocal_tuning', 'parent', 'mixing')),
  ('service_categories', 'streaming_mastering', 'Streaming mastering', 128, true, jsonb_build_object('app_key', 'streaming_mastering', 'parent', 'mastering')),
  ('service_categories', 'album_mastering', 'Album mastering', 129, true, jsonb_build_object('app_key', 'album_mastering', 'parent', 'mastering')),
  ('service_categories', 'studio_recording', 'Studio recording', 130, true, jsonb_build_object('app_key', 'studio_recording', 'parent', 'studio')),
  ('service_categories', 'rehearsal_space', 'Rehearsal space', 131, true, jsonb_build_object('app_key', 'rehearsal_space', 'parent', 'studio')),
  ('service_categories', 'studio_rental', 'Studio rental', 132, true, jsonb_build_object('app_key', 'studio_rental', 'parent', 'studio')),
  ('service_categories', 'vocal_lessons', 'Vocal lessons', 133, true, jsonb_build_object('app_key', 'vocal_lessons', 'parent', 'teaching')),
  ('service_categories', 'instrument_lessons', 'Instrument lessons', 134, true, jsonb_build_object('app_key', 'instrument_lessons', 'parent', 'teaching')),
  ('service_categories', 'production_lessons', 'Production lessons', 135, true, jsonb_build_object('app_key', 'production_lessons', 'parent', 'teaching')),
  ('service_categories', 'online_classes', 'Online classes', 136, true, jsonb_build_object('app_key', 'online_classes', 'parent', 'teaching')),
  ('service_categories', 'radio_hosting', 'Radio hosting', 137, true, jsonb_build_object('app_key', 'radio_hosting', 'parent', 'hosting')),
  ('service_categories', 'podcast_hosting', 'Podcast hosting', 138, true, jsonb_build_object('app_key', 'podcast_hosting', 'parent', 'hosting')),
  ('service_categories', 'emcee', 'Emcee & anchoring', 139, true, jsonb_build_object('app_key', 'emcee', 'parent', 'hosting'))
ON CONFLICT (category_key, slug) DO NOTHING;

INSERT INTO public.person_type_service_categories
  (person_type_category, person_type_slug, service_category_category, service_category_slug)
VALUES
  ('person_types', 'rj', 'service_categories', 'hosting'),
  ('person_types', 'podcaster', 'service_categories', 'hosting'),
  ('person_types', 'dj', 'service_categories', 'hosting'),
  ('person_types', 'event_organizer', 'service_categories', 'hosting'),
  ('person_types', 'other', 'service_categories', 'hosting')
ON CONFLICT DO NOTHING;

INSERT INTO public.person_type_service_categories
  (person_type_category, person_type_slug, service_category_category, service_category_slug)
SELECT m.person_type_category, m.person_type_slug, 'service_categories', child
  FROM public.person_type_service_categories m,
       unnest(CASE m.service_category_slug WHEN 'vocals' THEN ARRAY['playback_singing', 'session_vocals', 'backing_vocals', 'jingles', 'demo_vocals', 'voice_over'] WHEN 'live' THEN ARRAY['weddings', 'corporate_events', 'club_nights', 'private_parties', 'band_gigs', 'concerts'] WHEN 'instrument' THEN ARRAY['session_recording', 'remote_tracks', 'arrangements', 'accompaniment'] WHEN 'production' THEN ARRAY['music_production', 'beat_making', 'film_scoring', 'sound_design', 'podcast_production'] WHEN 'songwriting' THEN ARRAY['lyrics', 'composition', 'topline'] WHEN 'mixing' THEN ARRAY['stereo_mixing', 'atmos_mixing', 'vocal_tuning'] WHEN 'mastering' THEN ARRAY['streaming_mastering', 'album_mastering'] WHEN 'studio' THEN ARRAY['studio_recording', 'rehearsal_space', 'studio_rental'] WHEN 'teaching' THEN ARRAY['vocal_lessons', 'instrument_lessons', 'production_lessons', 'online_classes'] WHEN 'hosting' THEN ARRAY['radio_hosting', 'podcast_hosting', 'emcee'] ELSE ARRAY[]::text[] END) AS child
ON CONFLICT DO NOTHING;

COMMIT;
