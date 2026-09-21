-- Business location consistency (owner, 21 Sep 2026): the address is the source of truth. Profiles
-- whose city, state, bio or studio location contradicted their business address are brought in line,
-- and addresses written "City, Area" become "Area, City". Ironwood Live Hall had no address and takes
-- its studio's (Baner, Pune); SoundHouse Bandra gets its missing state. Blue Sitar Venues and Sound
-- Solutions have no address or city anywhere and are left as they are.
-- Snapshot: supabase/dumps/2026-09-21-before-business-locations.sql
--
-- Rollback: set the values listed in the snapshot back.

BEGIN;

UPDATE public.profiles SET city = 'Kolkata', state = 'West Bengal', bio = 'Studio serving the Kolkata music scene.'
 WHERE username = 'analog.ensemble.studios';
UPDATE public.profile_business SET business_address = 'Park Street, Kolkata'
 WHERE profile_id = (SELECT id FROM public.profiles WHERE username = 'analog.ensemble.studios');
UPDATE public.studios SET location = 'Park Street, Kolkata'
 WHERE owner_profile_id = (SELECT id FROM public.profiles WHERE username = 'analog.ensemble.studios');

UPDATE public.profiles SET city = 'Anjuna', state = 'Goa', bio = 'School serving the Goa music scene.'
 WHERE username = 'crimson.owls.academy';
UPDATE public.profile_business SET business_address = 'Anjuna, Goa'
 WHERE profile_id = (SELECT id FROM public.profiles WHERE username = 'crimson.owls.academy');

UPDATE public.profiles SET city = 'Chandigarh', state = 'Chandigarh', bio = 'School serving the Chandigarh music scene.'
 WHERE username = 'echo.parade.academy';
UPDATE public.profile_business SET business_address = 'Sector 17, Chandigarh'
 WHERE profile_id = (SELECT id FROM public.profiles WHERE username = 'echo.parade.academy');

UPDATE public.profile_business SET business_address = 'Baner, Pune'
 WHERE profile_id = (SELECT id FROM public.profiles WHERE username = 'ironwood.live.hall.and.venue')
   AND business_address IS NULL;

UPDATE public.profiles SET city = 'Hyderabad', state = 'Telangana', bio = 'Label serving the Hyderabad music scene.'
 WHERE username = 'monsoon.machine.records';
UPDATE public.profile_business SET business_address = 'Jubilee Hills, Hyderabad'
 WHERE profile_id = (SELECT id FROM public.profiles WHERE username = 'monsoon.machine.records');

UPDATE public.profiles SET city = 'Bengaluru', state = 'Karnataka', bio = 'Booking Agency serving the Bengaluru music scene.'
 WHERE username = 'neon.ensemble.agency';
UPDATE public.profile_business SET business_address = 'Indiranagar, Bengaluru'
 WHERE profile_id = (SELECT id FROM public.profiles WHERE username = 'neon.ensemble.agency');

UPDATE public.profiles SET city = 'Mumbai', state = 'Maharashtra', bio = 'Studio serving the Mumbai music scene.'
 WHERE username = 'paper.parade.studios';
UPDATE public.profile_business SET business_address = 'Andheri West, Mumbai'
 WHERE profile_id = (SELECT id FROM public.profiles WHERE username = 'paper.parade.studios');
UPDATE public.studios SET location = 'Andheri West, Mumbai'
 WHERE owner_profile_id = (SELECT id FROM public.profiles WHERE username = 'paper.parade.studios');

UPDATE public.profiles SET city = 'Bengaluru', state = 'Karnataka', bio = 'Booking Agency serving the Bengaluru music scene.'
 WHERE username = 'silver.riot.agency';
UPDATE public.profile_business SET business_address = 'Indiranagar, Bengaluru'
 WHERE profile_id = (SELECT id FROM public.profiles WHERE username = 'silver.riot.agency');

UPDATE public.profiles SET city = 'Hyderabad', state = 'Telangana', bio = 'Label serving the Hyderabad music scene.'
 WHERE username = 'velvet.static.records';
UPDATE public.profile_business SET business_address = 'Jubilee Hills, Hyderabad'
 WHERE profile_id = (SELECT id FROM public.profiles WHERE username = 'velvet.static.records');

UPDATE public.profiles SET state = 'Maharashtra' WHERE username = 'soundhouse.bandra' AND state IS NULL;

COMMIT;
