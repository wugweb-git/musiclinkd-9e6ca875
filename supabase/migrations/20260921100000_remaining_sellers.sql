-- The six sellers still shown by name only on Market listings (Sound Solutions, Rahul Sharma,
-- Sunidhi Raga, Blue Sitar Venues, Beatcraft Studios, Arjun Mehta) become account-less profiles, the
-- same way as 20260918221000_hardcoded_people_to_db.sql, and their listings link to them. Roles only
-- where the listing makes them plain; no city, photo or bio is stored because none exists. The two
-- service listings (vocal recording, beat licence) are also their sellers' Discover services, since
-- services are Discover's, not Market's. Octave Sound Labs gets a studio-level equipment list from its
-- rooms' gear, like the other studios in 20260918240000.
-- Snapshot: supabase/dumps/2026-09-21-before-remaining-sellers.sql
-- Rollback: UPDATE marketplace_listings SET seller_profile_id = NULL WHERE seller_profile_id IN (the six
-- ids below); DELETE FROM auth.users WHERE id IN (the six ids) — profiles and services cascade;
-- DELETE FROM studio_equipment WHERE id IN (the ten ids below).

BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, is_sso_user, is_anonymous) VALUES
  ('00000000-0000-0000-0000-000000000000', '6af7ef91-245d-5151-a8de-1ae65b5c17cb', 'authenticated', 'authenticated', NULL, NULL, '{}'::jsonb, jsonb_build_object('full_name', 'Sound Solutions'), now(), now(), '', '', '', '', false, false),
  ('00000000-0000-0000-0000-000000000000', 'de95f853-edf4-56fb-aed3-b0bda8149eeb', 'authenticated', 'authenticated', NULL, NULL, '{}'::jsonb, jsonb_build_object('full_name', 'Rahul Sharma'), now(), now(), '', '', '', '', false, false),
  ('00000000-0000-0000-0000-000000000000', '7b97ed4d-499b-5723-b116-04b2c14be958', 'authenticated', 'authenticated', NULL, NULL, '{}'::jsonb, jsonb_build_object('full_name', 'Sunidhi Raga'), now(), now(), '', '', '', '', false, false),
  ('00000000-0000-0000-0000-000000000000', '1ff10813-cb25-56f3-be70-7a51dbc37b78', 'authenticated', 'authenticated', NULL, NULL, '{}'::jsonb, jsonb_build_object('full_name', 'Blue Sitar Venues'), now(), now(), '', '', '', '', false, false),
  ('00000000-0000-0000-0000-000000000000', '0550d73a-8f3a-524e-ad14-f881f9bf4ae8', 'authenticated', 'authenticated', NULL, NULL, '{}'::jsonb, jsonb_build_object('full_name', 'Beatcraft Studios'), now(), now(), '', '', '', '', false, false),
  ('00000000-0000-0000-0000-000000000000', 'a5194820-cb81-5ab8-be7c-e78fe306f6a0', 'authenticated', 'authenticated', NULL, NULL, '{}'::jsonb, jsonb_build_object('full_name', 'Arjun Mehta'), now(), now(), '', '', '', '', false, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, username, display_name, roles, visibility, onboarding_complete) VALUES
  ('6af7ef91-245d-5151-a8de-1ae65b5c17cb', 'sound.solutions', 'Sound Solutions', ARRAY['rental_provider']::text[], 'public', true),
  ('de95f853-edf4-56fb-aed3-b0bda8149eeb', 'rahul.sharma', 'Rahul Sharma', ARRAY[]::text[], 'public', true),
  ('7b97ed4d-499b-5723-b116-04b2c14be958', 'sunidhi.raga', 'Sunidhi Raga', ARRAY['singer']::text[], 'public', true),
  ('1ff10813-cb25-56f3-be70-7a51dbc37b78', 'blue.sitar.venues', 'Blue Sitar Venues', ARRAY['venue','rental_provider']::text[], 'public', true),
  ('0550d73a-8f3a-524e-ad14-f881f9bf4ae8', 'beatcraft.studios', 'Beatcraft Studios', ARRAY['studio','beatmaker']::text[], 'public', true),
  ('a5194820-cb81-5ab8-be7c-e78fe306f6a0', 'arjun.mehta', 'Arjun Mehta', ARRAY[]::text[], 'public', true)
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, display_name = EXCLUDED.display_name, roles = EXCLUDED.roles, visibility = EXCLUDED.visibility, onboarding_complete = true;

INSERT INTO public.profile_business (profile_id) VALUES
  ('6af7ef91-245d-5151-a8de-1ae65b5c17cb'),
  ('1ff10813-cb25-56f3-be70-7a51dbc37b78'),
  ('0550d73a-8f3a-524e-ad14-f881f9bf4ae8')
ON CONFLICT (profile_id) DO NOTHING;

UPDATE public.marketplace_listings l SET seller_profile_id = v.id::uuid FROM (VALUES
  ('Sound Solutions', '6af7ef91-245d-5151-a8de-1ae65b5c17cb'),
  ('Rahul Sharma', 'de95f853-edf4-56fb-aed3-b0bda8149eeb'),
  ('Sunidhi Raga', '7b97ed4d-499b-5723-b116-04b2c14be958'),
  ('Blue Sitar Venues', '1ff10813-cb25-56f3-be70-7a51dbc37b78'),
  ('Beatcraft Studios', '0550d73a-8f3a-524e-ad14-f881f9bf4ae8'),
  ('Arjun Mehta', 'a5194820-cb81-5ab8-be7c-e78fe306f6a0')
) AS v(name, id) WHERE l.seller_name = v.name AND l.seller_profile_id IS NULL;

INSERT INTO public.profile_services (id, profile_id, name, price_paise, price_unit, category, sort_order) VALUES
  ('7adf4004-b97d-51bc-baab-da55d42d6c20', '7b97ed4d-499b-5723-b116-04b2c14be958', 'Hindustani Classical & Sufi Vocal Recording', 600000, 'session', 'vocals', 0),
  ('536b9aa5-0f5a-55c5-a20a-b592b5d355a2', '0550d73a-8f3a-524e-ad14-f881f9bf4ae8', 'Exclusive Trap Lofi Beat Instrumental License', 450000, NULL, 'production', 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.studio_equipment (id, studio_id, name, category, sort_order)
SELECT v.id::uuid, s.id, v.name, v.category, v.sort_order FROM (VALUES
  ('7bbe0f9d-194e-59f8-a2a8-e1c3ee1aa04c', 'Neumann U87', 'microphones', 0),
  ('a1d4be73-3072-59d2-93c3-af04053fbcca', 'SSL Origin desk', 'mixers', 1),
  ('05966d01-47a1-545f-8a7c-5e55a8f9b7f3', 'DW Collector''s kit', 'backline', 2),
  ('149736b6-fc9c-593a-a040-b141ada0eb34', 'Fender Twin', 'backline', 3),
  ('93297984-4d71-56f4-8a38-3f26ee93d695', 'Neumann TLM 103', 'microphones', 4),
  ('7a98b5a9-086a-5f9f-8a7b-c8827138dbf1', 'Avalon VT-737', 'preamps', 5),
  ('2182e19a-5f4a-5a19-9058-ce8ea85acbca', 'Apollo x8', 'audio_interfaces', 6),
  ('a7936730-c59e-5246-9592-1302a891283f', 'Focal Trio11', 'studio_monitors', 7),
  ('d33881d7-0978-5ad1-9c33-ff546e708d50', 'Apollo x16', 'audio_interfaces', 8),
  ('204736f3-60cb-5110-a0b2-7f82ca42b916', 'Analogue summing', NULL, 9)
) AS v(id, name, category, sort_order)
JOIN public.studios s ON s.slug = 'octave-sound-labs'
ON CONFLICT (id) DO NOTHING;

COMMIT;
