-- Places are city + PIN code, no area names (owner, 21 Sep 2026), and a business profile carries a
-- Google Maps link.
-- 1. profiles.pin_code (6 digits) replaces profiles.area: each stored area becomes its PIN code and
--    area is cleared (the column stays for rollback; the app no longer reads it). Businesses without
--    an area take the PIN from their address.
-- 2. profile_business.business_address and studios.location become "City PIN" (e.g. "Mumbai 400053").
--    The Humming Tree had no area ("Mumbai, Maharashtra") and becomes "Mumbai".
-- 3. profile_business.maps_url: the Google Maps link a business adds (https only).
-- 4. Blue Sitar Venues (Pune 411001) and Sound Solutions (Mumbai 400069) get a place and a photo,
--    written in at the owner's request.
-- Snapshot: supabase/dumps/2026-09-21-before-pin-codes.sql
--
-- Rollback: restore area, business_address and location from the snapshot; then
--   ALTER TABLE public.profile_business DROP COLUMN maps_url;
--   ALTER TABLE public.profiles DROP COLUMN pin_code;

BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin_code text;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pin_code_format;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pin_code_format CHECK (pin_code ~ '^[1-9][0-9]{5}$');
ALTER TABLE public.profile_business ADD COLUMN IF NOT EXISTS maps_url text;
ALTER TABLE public.profile_business DROP CONSTRAINT IF EXISTS profile_business_maps_url_format;
ALTER TABLE public.profile_business ADD CONSTRAINT profile_business_maps_url_format CHECK (maps_url ~ '^https://' AND length(maps_url) <= 500);

UPDATE public.profile_business SET business_address='Kolkata 700016' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='analog.ensemble.studios');
UPDATE public.profile_business SET business_address='New Delhi 110016' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='basement.jam.rooms');
UPDATE public.profile_business SET business_address='Mumbai 400053' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='beatcraft.studios');
UPDATE public.profile_business SET business_address='Mumbai 400050' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='beatroute.spaces');
UPDATE public.profile_business SET business_address='Mumbai 400049' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='blue.room.mixing.suite');
UPDATE public.profile_business SET business_address='Goa 403509' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='crimson.owls.academy');
UPDATE public.profile_business SET business_address='Chandigarh 160017' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='echo.parade.academy');
UPDATE public.profile_business SET business_address='Bengaluru 560038' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='headroom.mastering');
UPDATE public.profile_business SET business_address='Pune 411045' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='ironwood.live.hall.and.venue');
UPDATE public.profile_business SET business_address='New Delhi 110016' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='ironwood.records');
UPDATE public.profile_business SET business_address='Mumbai 400051' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='jam.room.bandra');
UPDATE public.profile_business SET business_address='Bengaluru 560034' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='krimson.avenue');
UPDATE public.profile_business SET business_address='Mumbai 400053' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='marigold.reel');
UPDATE public.profile_business SET business_address='Hyderabad 500033' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='monsoon.machine.records');
UPDATE public.profile_business SET business_address='Bengaluru 560038' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='neon.ensemble.agency');
UPDATE public.profile_business SET business_address='Bengaluru 560038' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='nine.lamps.media');
UPDATE public.profile_business SET business_address='Bengaluru 560034' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='nisha.rao.events');
UPDATE public.profile_business SET business_address='Mumbai 400053' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='octave.sound.labs');
UPDATE public.profile_business SET business_address='Mumbai 400053' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='paper.parade.studios');
UPDATE public.profile_business SET business_address='Mumbai 400013' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='pulse.live.systems');
UPDATE public.profile_business SET business_address='Bengaluru 560038' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='resonance.acoustic.suites');
UPDATE public.profile_business SET business_address='Bengaluru 560038' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='silver.riot.agency');
UPDATE public.profile_business SET business_address='Mumbai 400050' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='soundhouse.bandra');
UPDATE public.profile_business SET business_address='Mumbai 400053' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='soundhouse.studio');
UPDATE public.profile_business SET business_address='Mumbai 400049' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='swar.academy.of.music');
UPDATE public.profile_business SET business_address='Mumbai 400004' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='swaraj.instruments');
UPDATE public.profile_business SET business_address='Chennai 600034' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='tarang.audio.visual');
UPDATE public.profile_business SET business_address='Mumbai 400053' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='the.hive.recording.studio');
UPDATE public.profile_business SET business_address='Mumbai' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='the.humming.tree.live.room');
UPDATE public.profile_business SET business_address='Hyderabad 500033' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='velvet.static.records');
UPDATE public.profile_business SET business_address='Mumbai 400049' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='velvet.vocal.and.foley.studio');
UPDATE public.profile_business SET business_address='Mumbai 400013' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='waveform.podcast.studio');
UPDATE public.profile_business SET business_address='Mumbai 400050' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='wugweb');
UPDATE public.profile_business SET business_address='Mumbai 400053' WHERE profile_id=(SELECT id FROM public.profiles WHERE username='yash.raj.sound.studios');
UPDATE public.studios SET location='Kolkata 700016' WHERE slug='analog-ensemble-studios';
UPDATE public.studios SET location='New Delhi 110016' WHERE slug='basement-jam';
UPDATE public.studios SET location='Mumbai 400053' WHERE slug='beatcraft-studios';
UPDATE public.studios SET location='Mumbai 400050' WHERE slug='beatroute-spaces';
UPDATE public.studios SET location='Mumbai 400049' WHERE slug='blue-room-mixing-suite';
UPDATE public.studios SET location='Bengaluru 560038' WHERE slug='headroom-mastering';
UPDATE public.studios SET location='Pune 411045' WHERE slug='ironwood-live-hall-and-venue';
UPDATE public.studios SET location='Mumbai 400051' WHERE slug='jam-room-bandra';
UPDATE public.studios SET location='Bengaluru 560034' WHERE slug='krimson-avenue';
UPDATE public.studios SET location='Mumbai 400053' WHERE slug='octave-sound-labs';
UPDATE public.studios SET location='Mumbai 400053' WHERE slug='paper-parade-studios';
UPDATE public.studios SET location='Bengaluru 560038' WHERE slug='resonance-acoustic-suites';
UPDATE public.studios SET location='Mumbai 400050' WHERE slug='soundhouse-bandra';
UPDATE public.studios SET location='Mumbai 400053' WHERE slug='soundhouse-studio';
UPDATE public.studios SET location='Mumbai 400053' WHERE slug='the-hive-recording-studio';
UPDATE public.studios SET location='Mumbai' WHERE slug='the-humming-tree-live-room';
UPDATE public.studios SET location='Mumbai 400049' WHERE slug='velvet-vocal-and-foley-studio';
UPDATE public.studios SET location='Mumbai 400013' WHERE slug='waveform-podcast';
UPDATE public.studios SET location='Mumbai 400050' WHERE slug='wugweb';
UPDATE public.studios SET location='Mumbai 400053' WHERE slug='yash-raj-sound-studios';
UPDATE public.profiles SET pin_code='700016' WHERE username='analog.ensemble.studios';
UPDATE public.profiles SET pin_code='110016' WHERE username='basement.jam.rooms';
UPDATE public.profiles SET pin_code='400053' WHERE username='beatcraft.studios';
UPDATE public.profiles SET pin_code='400050' WHERE username='beatroute.spaces';
UPDATE public.profiles SET pin_code='400049' WHERE username='blue.room.mixing.suite';
UPDATE public.profiles SET pin_code='411001' WHERE username='blue.sitar.venues';
UPDATE public.profiles SET pin_code='403509' WHERE username='crimson.owls.academy';
UPDATE public.profiles SET pin_code='400050' WHERE username='dj.noor';
UPDATE public.profiles SET pin_code='160017' WHERE username='echo.parade.academy';
UPDATE public.profiles SET pin_code='560038' WHERE username='headroom.mastering';
UPDATE public.profiles SET pin_code='411045' WHERE username='ironwood.live.hall.and.venue';
UPDATE public.profiles SET pin_code='110016' WHERE username='ironwood.records';
UPDATE public.profiles SET pin_code='400051' WHERE username='jam.room.bandra';
UPDATE public.profiles SET pin_code='560034' WHERE username='krimson.avenue';
UPDATE public.profiles SET pin_code='400053' WHERE username='marigold.reel';
UPDATE public.profiles SET pin_code='110016' WHERE username='meher.kaur';
UPDATE public.profiles SET pin_code='500033' WHERE username='monsoon.machine.records';
UPDATE public.profiles SET pin_code='560038' WHERE username='neon.ensemble.agency';
UPDATE public.profiles SET pin_code='560038' WHERE username='nine.lamps.media';
UPDATE public.profiles SET pin_code='560034' WHERE username='nisha.rao.events';
UPDATE public.profiles SET pin_code='600017' WHERE username='nithya.balan';
UPDATE public.profiles SET pin_code='400053' WHERE username='octave.sound.labs';
UPDATE public.profiles SET pin_code='400053' WHERE username='paper.parade.studios';
UPDATE public.profiles SET pin_code='400013' WHERE username='pulse.live.systems';
UPDATE public.profiles SET pin_code='560038' WHERE username='rahul.iyer';
UPDATE public.profiles SET pin_code='400014' WHERE username='ravi.deshmukh';
UPDATE public.profiles SET pin_code='560038' WHERE username='resonance.acoustic.suites';
UPDATE public.profiles SET pin_code='560038' WHERE username='silver.riot.agency';
UPDATE public.profiles SET pin_code='400069' WHERE username='sound.solutions';
UPDATE public.profiles SET pin_code='400050' WHERE username='soundhouse.bandra';
UPDATE public.profiles SET pin_code='400053' WHERE username='soundhouse.studio';
UPDATE public.profiles SET pin_code='400049' WHERE username='swar.academy.of.music';
UPDATE public.profiles SET pin_code='400004' WHERE username='swaraj.instruments';
UPDATE public.profiles SET pin_code='600034' WHERE username='tarang.audio.visual';
UPDATE public.profiles SET pin_code='400053' WHERE username='the.hive.recording.studio';
UPDATE public.profiles SET pin_code='500033' WHERE username='velvet.static.records';
UPDATE public.profiles SET pin_code='400049' WHERE username='velvet.vocal.and.foley.studio';
UPDATE public.profiles SET pin_code='400013' WHERE username='waveform.podcast.studio';
UPDATE public.profiles SET pin_code='400050' WHERE username='wugweb';
UPDATE public.profiles SET pin_code='400053' WHERE username='yash.raj.sound.studios';
UPDATE public.profiles SET pin_code='400017' WHERE username='zaid.qureshi';
UPDATE public.profiles SET area = NULL WHERE area IS NOT NULL;

UPDATE public.profiles SET city = coalesce(city, 'Pune'), state = coalesce(state, 'Maharashtra'), country = coalesce(country, 'India'), avatar_url = coalesce(avatar_url, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400') WHERE username = 'blue.sitar.venues';
UPDATE public.profile_business SET business_address = coalesce(business_address, 'Pune 411001'), logo_url = coalesce(logo_url, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400') WHERE profile_id = (SELECT id FROM public.profiles WHERE username = 'blue.sitar.venues');
UPDATE public.profiles SET city = coalesce(city, 'Mumbai'), state = coalesce(state, 'Maharashtra'), country = coalesce(country, 'India'), avatar_url = coalesce(avatar_url, 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=300&q=80') WHERE username = 'sound.solutions';
UPDATE public.profile_business SET business_address = coalesce(business_address, 'Mumbai 400069'), logo_url = coalesce(logo_url, 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=300&q=80') WHERE profile_id = (SELECT id FROM public.profiles WHERE username = 'sound.solutions');

COMMIT;
