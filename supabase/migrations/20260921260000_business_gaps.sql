-- Business content gaps, filled only from data already stored (owner, 21 Sep 2026: update the rest).
-- 1. Octave Sound Labs (@octave.sound.labs, a sign-in-less studio account) had a studio but no
--    profile_business row, so it was not a business account. It gets one: address, hours line and
--    logo from its studio and profile.
-- 2. @ironwood.live.hall.and.venue's business hours line takes its studio's ("By event booking").
-- 3. @soundhouse.studio is a studio-type business with no studio; it gets one from its profile
--    (name, Andheri West, photo, description). @beatcraft.studios has no city, photo or bio to
--    build one from, so it is left as it is.
-- Businesses with no hours or bio anywhere stay empty: nothing is made up.
-- Snapshot: supabase/dumps/2026-09-21-before-business-gaps.sql
--
-- Rollback:
--   DELETE FROM public.studios WHERE slug = 'soundhouse-studio';
--   UPDATE public.profile_business SET operating_hours = NULL WHERE profile_id = 'f2ece64c-c18d-5f28-bc3e-d72e6e25fa69';
--   DELETE FROM public.profile_business WHERE profile_id = '2c29531c-68cf-4b7d-84e1-08ae729a6c69';

BEGIN;

INSERT INTO public.profile_business (profile_id, business_address, logo_url, operating_hours)
VALUES ('2c29531c-68cf-4b7d-84e1-08ae729a6c69', 'Andheri West, Mumbai',
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=400&q=80',
  'Mon–Sun 10:00–20:00')
ON CONFLICT (profile_id) DO NOTHING;

UPDATE public.profile_business SET operating_hours = 'By event booking'
 WHERE profile_id = 'f2ece64c-c18d-5f28-bc3e-d72e6e25fa69' AND operating_hours IS NULL;

INSERT INTO public.studios (owner_profile_id, slug, name, description, location, image_url, images)
SELECT '7d175f7d-88fd-5a16-ab64-48f852c60c7e', 'soundhouse-studio', 'SoundHouse Studio',
  'Studio-grade microphones, preamps and monitoring available for hire. Everything is serviced between rentals and delivered in flight cases.',
  'Andheri West, Mumbai',
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=300&q=80',
  ARRAY['https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=300&q=80']
WHERE NOT EXISTS (SELECT 1 FROM public.studios WHERE owner_profile_id = '7d175f7d-88fd-5a16-ab64-48f852c60c7e');

COMMIT;
