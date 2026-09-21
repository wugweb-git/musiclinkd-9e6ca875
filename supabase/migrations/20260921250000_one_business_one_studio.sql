-- One account is one business profile, of any type; a studio is one type (owner, 21 Sep 2026).
-- @yash.raj.sound.studios held two studios. Bandra Jam Room — Hourly Rehearsal (no rooms, bookings,
-- reviews, equipment or photos) becomes its own business: a sign-in-less account like the ones in
-- 20260918221000_hardcoded_people_to_db.sql (no email, no password; nobody can sign in as it),
-- @jam.room.bandra, with its profile_business row, and the studio moves to it. Yash Raj's business
-- hours line becomes its remaining studio's. Then at most one studio per account, enforced.
-- Snapshot: supabase/dumps/2026-09-21-before-one-business-one-studio.sql
--
-- Rollback:
--   DROP INDEX IF EXISTS public.studios_one_per_owner;
--   UPDATE public.studios SET owner_profile_id = '86a5d555-61eb-5619-b452-3a9387baa66f'
--    WHERE id = 'b84bbaa9-f4e2-40c8-8f27-959b220c7410';
--   UPDATE public.profile_business SET operating_hours = '09:00 AM – 11:00 PM (Mon–Sat)'
--    WHERE profile_id = '86a5d555-61eb-5619-b452-3a9387baa66f';
--   DELETE FROM auth.users WHERE id = 'b968e63a-0ff6-5378-81f7-9fab18f22d3b';

BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, raw_app_meta_data,
  raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_new, email_change, is_sso_user, is_anonymous)
VALUES ('00000000-0000-0000-0000-000000000000', 'b968e63a-0ff6-5378-81f7-9fab18f22d3b',
  'authenticated', 'authenticated', NULL, NULL, '{}'::jsonb,
  jsonb_build_object('full_name', 'Bandra Jam Room',
    'avatar_url', 'https://images.unsplash.com/photo-1524230572899-a752b3835840?auto=format&fit=crop&w=800&q=80'),
  now(), now(), '', '', '', '', false, false)
ON CONFLICT (id) DO NOTHING;

-- on_auth_user_created has made a bare profile; fill it.
INSERT INTO public.profiles (id, username, display_name, first_name, last_name, bio, city, state,
  country, roles, avatar_url, cover_url, is_verified, is_available, visibility, onboarding_complete)
VALUES ('b968e63a-0ff6-5378-81f7-9fab18f22d3b', 'jam.room.bandra', 'Bandra Jam Room', 'Bandra',
  'Jam Room',
  'Drum kit, two amps, PA with four mics and a fully treated room. Ideal for band rehearsals and pre-production before studio dates.',
  'Mumbai', 'Maharashtra', 'India', ARRAY['studio'],
  'https://images.unsplash.com/photo-1524230572899-a752b3835840?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
  false, true, 'public', true)
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, display_name = EXCLUDED.display_name,
  first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, bio = EXCLUDED.bio,
  city = EXCLUDED.city, state = EXCLUDED.state, country = EXCLUDED.country, roles = EXCLUDED.roles,
  avatar_url = EXCLUDED.avatar_url, cover_url = EXCLUDED.cover_url, is_available = EXCLUDED.is_available,
  visibility = EXCLUDED.visibility, onboarding_complete = EXCLUDED.onboarding_complete;

INSERT INTO public.profile_business (profile_id, business_address, logo_url, operating_hours)
VALUES ('b968e63a-0ff6-5378-81f7-9fab18f22d3b', 'Bandra East, Mumbai',
  'https://images.unsplash.com/photo-1524230572899-a752b3835840?auto=format&fit=crop&w=800&q=80',
  'Mon–Sun 09:00–23:00')
ON CONFLICT (profile_id) DO NOTHING;

UPDATE public.studios SET owner_profile_id = 'b968e63a-0ff6-5378-81f7-9fab18f22d3b'
 WHERE id = 'b84bbaa9-f4e2-40c8-8f27-959b220c7410';

UPDATE public.profile_business SET operating_hours = 'Mon–Sat 09:00–23:00 · Sun closed'
 WHERE profile_id = '86a5d555-61eb-5619-b452-3a9387baa66f';

CREATE UNIQUE INDEX IF NOT EXISTS studios_one_per_owner ON public.studios (owner_profile_id);

COMMIT;
