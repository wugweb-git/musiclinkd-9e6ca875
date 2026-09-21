-- Business types cleanup, and the talent_user / business_user filter on person_types.
-- Snapshot and undo: supabase/dumps/2026-09-21-before-business-types-cleanup.sql
--
--   1. A&R and artist management are one business type: `a_and_r` goes, `artist_manager` is
--      relabelled "Artist Management".
--   2. Talent-type tags (sound_engineer, composer, beatmaker, sound_designer) come off business
--      profiles; a role a person does is a talent type, a company is a business type.
--   3. Three production house business profiles (`production_house` had none). Same passwordless
--      auth.users pattern as 20260913090949_seed_linked_profiles.sql.
--   4. person_types options carry metadata.flow = talent_user | business_user (was talent | business).
--
-- Idempotent: steps 1-3 were already applied to the live database on 2026-09-21.

DELETE FROM public.taxonomy_options WHERE category_key = 'person_types' AND slug = 'a_and_r';
UPDATE public.taxonomy_options SET label = 'Artist Management'
  WHERE category_key = 'person_types' AND slug = 'artist_manager';

UPDATE public.profiles p
   SET roles = ARRAY(SELECT r FROM unnest(p.roles) r
                      WHERE r NOT IN ('sound_engineer', 'composer', 'beatmaker', 'sound_designer')),
       updated_at = now()
 WHERE EXISTS (SELECT 1 FROM public.profile_business b WHERE b.profile_id = p.id)
   AND p.roles && ARRAY['sound_engineer', 'composer', 'beatmaker', 'sound_designer'];

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, is_sso_user, is_anonymous)
VALUES
  ('00000000-0000-0000-0000-000000000000', '370806f8-ddae-4a37-879b-29e9766c2df0', 'authenticated', 'authenticated', NULL, NULL, '{}'::jsonb, '{"full_name":"Marigold Reel Productions"}'::jsonb, now(), now(), '', '', '', '', false, false),
  ('00000000-0000-0000-0000-000000000000', '8916c93c-3864-427f-88a9-1ffeb48a866c', 'authenticated', 'authenticated', NULL, NULL, '{}'::jsonb, '{"full_name":"Nine Lamps Media"}'::jsonb, now(), now(), '', '', '', '', false, false),
  ('00000000-0000-0000-0000-000000000000', 'c65cbf9d-62fe-4890-9710-d8361aa5c183', 'authenticated', 'authenticated', NULL, NULL, '{}'::jsonb, '{"full_name":"Tarang Audio Visual"}'::jsonb, now(), now(), '', '', '', '', false, false)
ON CONFLICT (id) DO NOTHING;

UPDATE public.profiles p SET
    username = v.username, first_name = v.first_name, last_name = v.last_name, headline = v.headline,
    bio = v.bio, city = v.city, state = v.state, country = 'India', area = v.area,
    roles = ARRAY['production_house'], genres = v.genres, languages = v.languages,
    visibility = 'public', onboarding_complete = true, is_available = true, updated_at = now()
  FROM (VALUES
    ('370806f8-ddae-4a37-879b-29e9766c2df0'::uuid, 'marigold.reel', 'Marigold', 'Reel Productions', 'Ad films, web series and brand films with music built in', 'Production house for ad films, web series and brand films, with in-house composers, sound design and post. We score to picture from the first cut and deliver stems, mixes and masters ready for broadcast and OTT.', 'Mumbai', 'Maharashtra', 'Andheri West', ARRAY['bollywood','indie_pop','electronic'], ARRAY['hi','en']),
    ('8916c93c-3864-427f-88a9-1ffeb48a866c'::uuid, 'nine.lamps.media', 'Nine Lamps', 'Media', 'Branded content and documentaries, scored and mixed in-house', 'Branded content and documentary production house working with composers and sound designers for OTT, campaigns and festival films. We commission original scores and license independent music for our productions.', 'Bengaluru', 'Karnataka', 'Indiranagar', ARRAY['indie','ambient','fusion'], ARRAY['en','kn','hi']),
    ('c65cbf9d-62fe-4890-9710-d8361aa5c183'::uuid, 'tarang.audio.visual', 'Tarang', 'Audio Visual', 'Film songs, music videos and live shoots', 'Film and music-video production house shooting songs, live sessions and title tracks. We work with vocalists, composers, live musicians and mixing engineers across Tamil and Telugu projects.', 'Chennai', 'Tamil Nadu', 'Nungambakkam', ARRAY['kollywood','carnatic_fusion','pop_vocals'], ARRAY['ta','te','en'])
  ) AS v(id, username, first_name, last_name, headline, bio, city, state, area, genres, languages)
 WHERE p.id = v.id;

INSERT INTO public.profile_business (profile_id, business_address, operating_hours, legal_name, founded_year)
VALUES
  ('370806f8-ddae-4a37-879b-29e9766c2df0', 'Andheri West, Mumbai', 'Mon–Sat 10:00–19:00 · Sun closed', 'Marigold Reel Productions LLP', 2016),
  ('8916c93c-3864-427f-88a9-1ffeb48a866c', 'Indiranagar, Bengaluru', 'Mon–Fri 10:00–18:00 · Sat–Sun closed', 'Nine Lamps Media Pvt Ltd', 2019),
  ('c65cbf9d-62fe-4890-9710-d8361aa5c183', 'Nungambakkam, Chennai', 'Mon–Sat 09:30–18:30 · Sun closed', 'Tarang Audio Visual Pvt Ltd', 2014)
ON CONFLICT (profile_id) DO NOTHING;

UPDATE public.taxonomy_options
   SET metadata = jsonb_set(metadata, '{flow}', to_jsonb((metadata ->> 'flow') || '_user')),
       updated_at = now()
 WHERE category_key = 'person_types' AND metadata ->> 'flow' IN ('talent', 'business');

UPDATE public.taxonomy_categories
   SET description = 'Roles a person selects. Filter on metadata.flow: talent_user or business_user.'
 WHERE key = 'person_types';
