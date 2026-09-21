-- MusicLinkd live database snapshot (Lovable Cloud, Supabase project ace967d9-a62e-48bb-b076-c3b63b11b185)
-- Taken 2026-09-22 via Lovable query_database, before the business profiles enrichment.
-- Migration: supabase/migrations/20260922192000_business_profiles_enriched.sql
--
-- Before state (37 business profiles, 186 services, 50 studio_equipment rows, 14 studio_rooms):
--   profile_business.policies empty on all 37; equipment_list, courses and venue_features empty on the profiles listed below;
--   29 business profiles with no headline; 13 studios with no cancellation policy; 8 with no description;
--   studios amenities empty on beatcraft-studios, krimson-avenue, soundhouse-bandra, soundhouse-studio;
--   no equipment on 16 studios and no room on 11 studios (the slugs the migration names).
--   The only existing text replaced is the 13 placeholder bios restored below.
-- Left alone: wugweb, octave.sound.labs, cd.page.
--
-- To undo (run in this order):

BEGIN;

-- Services added: these businesses had none.
DELETE FROM public.profile_services
 WHERE profile_id IN (SELECT id FROM public.profiles WHERE username IN (
    'analog.ensemble.studios',
    'basement.jam.rooms',
    'beatroute.spaces',
    'blue.room.mixing.suite',
    'blue.sitar.venues',
    'crimson.owls.academy',
    'echo.parade.academy',
    'headroom.mastering',
    'ironwood.live.hall.and.venue',
    'ironwood.records',
    'jam.room.bandra',
    'krimson.avenue',
    'marigold.reel',
    'monsoon.machine.records',
    'neon.ensemble.agency',
    'nine.lamps.media',
    'nisha.rao.events',
    'paper.parade.studios',
    'pulse.live.systems',
    'resonance.acoustic.suites',
    'silver.riot.agency',
    'sound.solutions',
    'soundhouse.studio',
    'swar.academy.of.music',
    'swaraj.instruments',
    'tarang.audio.visual',
    'the.hive.recording.studio',
    'the.humming.tree.live.room',
    'velvet.static.records',
    'velvet.vocal.and.foley.studio',
    'waveform.podcast.studio'
 ));

-- Equipment (sort_order 200 and up marks the added rows) and rooms added.
DELETE FROM public.studio_equipment
 WHERE sort_order >= 200
   AND studio_id IN (SELECT id FROM public.studios WHERE slug IN ('analog-ensemble-studios', 'beatcraft-studios', 'beatroute-spaces', 'blue-room-mixing-suite', 'headroom-mastering', 'ironwood-live-hall-and-venue', 'jam-room-bandra', 'krimson-avenue', 'paper-parade-studios', 'resonance-acoustic-suites', 'soundhouse-bandra', 'soundhouse-studio', 'the-hive-recording-studio', 'the-humming-tree-live-room', 'velvet-vocal-and-foley-studio', 'yash-raj-sound-studios'));
DELETE FROM public.studio_rooms
 WHERE studio_id IN (SELECT id FROM public.studios WHERE slug IN ('analog-ensemble-studios', 'beatroute-spaces', 'blue-room-mixing-suite', 'ironwood-live-hall-and-venue', 'jam-room-bandra', 'krimson-avenue', 'paper-parade-studios', 'resonance-acoustic-suites', 'the-hive-recording-studio', 'the-humming-tree-live-room', 'velvet-vocal-and-foley-studio'))
   AND (name, coalesce(kind, '')) IN (('Studio A', 'Tracking room and control room'), ('Rehearsal and tracking room', 'Backlined room'), ('Mix room', 'Mixing suite'), ('Main hall', 'Concert hall'), ('Rehearsal room', 'Backlined rehearsal room'), ('Studio A', 'Tracking room'), ('Studio A', 'Tracking room with console'), ('Acoustic suite', 'Treated tracking room and vocal booth'), ('Studio', 'Recording room'), ('Live room', 'Live room'), ('Vocal booth', 'Vocal booth'));

-- Studio columns filled where they were empty.
UPDATE public.studios SET amenities = '{}' WHERE slug IN ('beatcraft-studios', 'krimson-avenue', 'soundhouse-bandra', 'soundhouse-studio');
UPDATE public.studios SET cancellation_policy = NULL WHERE slug IN ('analog-ensemble-studios', 'beatcraft-studios', 'beatroute-spaces', 'blue-room-mixing-suite', 'jam-room-bandra', 'krimson-avenue', 'paper-parade-studios', 'resonance-acoustic-suites', 'soundhouse-bandra', 'soundhouse-studio', 'the-hive-recording-studio', 'the-humming-tree-live-room', 'velvet-vocal-and-foley-studio');
UPDATE public.studios SET description = '' WHERE slug IN ('analog-ensemble-studios', 'blue-room-mixing-suite', 'krimson-avenue', 'paper-parade-studios', 'resonance-acoustic-suites', 'the-hive-recording-studio', 'the-humming-tree-live-room', 'velvet-vocal-and-foley-studio');

-- Business columns filled where they were empty.
UPDATE public.profile_business SET policies = '{}'
 WHERE profile_id IN (SELECT id FROM public.profiles WHERE username IN (
    'analog.ensemble.studios',
    'basement.jam.rooms',
    'beatcraft.studios',
    'beatroute.spaces',
    'blue.room.mixing.suite',
    'blue.sitar.venues',
    'crimson.owls.academy',
    'echo.parade.academy',
    'headroom.mastering',
    'ironwood.live.hall.and.venue',
    'ironwood.records',
    'jam.room.bandra',
    'krimson.avenue',
    'marigold.reel',
    'monsoon.machine.records',
    'neon.ensemble.agency',
    'nine.lamps.media',
    'nisha.rao.events',
    'paper.parade.studios',
    'pulse.live.systems',
    'resonance.acoustic.suites',
    'silver.riot.agency',
    'sound.solutions',
    'soundhouse.bandra',
    'soundhouse.studio',
    'swar.academy.of.music',
    'swaraj.instruments',
    'tarang.audio.visual',
    'the.hive.recording.studio',
    'the.humming.tree.live.room',
    'velvet.static.records',
    'velvet.vocal.and.foley.studio',
    'waveform.podcast.studio',
    'yash.raj.sound.studios'
 ));
UPDATE public.profile_business SET equipment_list = '{}'
 WHERE profile_id IN (SELECT id FROM public.profiles WHERE username IN ('blue.sitar.venues', 'pulse.live.systems', 'sound.solutions', 'soundhouse.studio', 'swaraj.instruments'));
UPDATE public.profile_business SET courses = '{}'
 WHERE profile_id IN (SELECT id FROM public.profiles WHERE username IN ('crimson.owls.academy', 'echo.parade.academy', 'swar.academy.of.music'));
UPDATE public.profile_business SET venue_features = '{}'
 WHERE profile_id IN (SELECT id FROM public.profiles WHERE username IN ('blue.sitar.venues'));

-- Headlines were NULL; only clear a headline that is still the migration's text.
UPDATE public.profiles SET headline = NULL WHERE username = 'analog.ensemble.studios' AND headline = 'Recording, mixing and mastering in Kolkata';
UPDATE public.profiles SET headline = NULL WHERE username = 'basement.jam.rooms' AND headline = 'Backlined rehearsal rooms, open late, Delhi';
UPDATE public.profiles SET headline = NULL WHERE username = 'beatcraft.studios' AND headline = 'Beat production for trap, lo-fi and hip-hop';
UPDATE public.profiles SET headline = NULL WHERE username = 'beatroute.spaces' AND headline = 'Rehearsal and tracking space, Mumbai';
UPDATE public.profiles SET headline = NULL WHERE username = 'blue.room.mixing.suite' AND headline = 'A mixing suite in Mumbai';
UPDATE public.profiles SET headline = NULL WHERE username = 'blue.sitar.venues' AND headline = 'Live music venue in Pune';
UPDATE public.profiles SET headline = NULL WHERE username = 'crimson.owls.academy' AND headline = 'Music school in Anjuna, Goa';
UPDATE public.profiles SET headline = NULL WHERE username = 'echo.parade.academy' AND headline = 'Music school in Chandigarh';
UPDATE public.profiles SET headline = NULL WHERE username = 'headroom.mastering' AND headline = 'Attended and unattended mastering, Bengaluru';
UPDATE public.profiles SET headline = NULL WHERE username = 'ironwood.live.hall.and.venue' AND headline = '400-capacity live hall and venue, Pune';
UPDATE public.profiles SET headline = NULL WHERE username = 'ironwood.records' AND headline = 'Independent rock and folk label, Delhi';
UPDATE public.profiles SET headline = NULL WHERE username = 'jam.room.bandra' AND headline = 'Hourly rehearsal room in Bandra';
UPDATE public.profiles SET headline = NULL WHERE username = 'krimson.avenue' AND headline = 'Recording and production studio in Koramangala';
UPDATE public.profiles SET headline = NULL WHERE username = 'monsoon.machine.records' AND headline = 'Independent label, Hyderabad';
UPDATE public.profiles SET headline = NULL WHERE username = 'neon.ensemble.agency' AND headline = 'Bookings for bands and solo acts, Bengaluru';
UPDATE public.profiles SET headline = NULL WHERE username = 'nisha.rao.events' AND headline = 'Festival booking and event promotion, Bengaluru';
UPDATE public.profiles SET headline = NULL WHERE username = 'paper.parade.studios' AND headline = 'Recording, mixing and mastering, Mumbai';
UPDATE public.profiles SET headline = NULL WHERE username = 'pulse.live.systems' AND headline = 'PA, line array, DJ and lighting hire with crew';
UPDATE public.profiles SET headline = NULL WHERE username = 'resonance.acoustic.suites' AND headline = 'Acoustic tracking suite, Bengaluru';
UPDATE public.profiles SET headline = NULL WHERE username = 'silver.riot.agency' AND headline = 'Artist and act bookings, Bengaluru';
UPDATE public.profiles SET headline = NULL WHERE username = 'sound.solutions' AND headline = 'Sound equipment on rent for gigs and events';
UPDATE public.profiles SET headline = NULL WHERE username = 'soundhouse.studio' AND headline = 'Studio gear hire and recording, Mumbai';
UPDATE public.profiles SET headline = NULL WHERE username = 'swar.academy.of.music' AND headline = 'Hindustani and contemporary music school, Mumbai';
UPDATE public.profiles SET headline = NULL WHERE username = 'swaraj.instruments' AND headline = 'Sitars, tanpuras, tablas and harmoniums, made and restored in Mumbai';
UPDATE public.profiles SET headline = NULL WHERE username = 'the.hive.recording.studio' AND headline = 'Budget-friendly recording, Mumbai';
UPDATE public.profiles SET headline = NULL WHERE username = 'the.humming.tree.live.room' AND headline = 'A live room for touring bands, Mumbai';
UPDATE public.profiles SET headline = NULL WHERE username = 'velvet.static.records' AND headline = 'Independent label, Hyderabad';
UPDATE public.profiles SET headline = NULL WHERE username = 'velvet.vocal.and.foley.studio' AND headline = 'Vocal recording and foley, Mumbai';
UPDATE public.profiles SET headline = NULL WHERE username = 'waveform.podcast.studio' AND headline = 'Podcast studio with multicam video, Mumbai';

-- The 13 placeholder bios, exactly as they were.
UPDATE public.profiles SET bio = 'Studio serving the Kolkata music scene.' WHERE username = 'analog.ensemble.studios';
UPDATE public.profiles SET bio = 'Mixing-focused suite.' WHERE username = 'blue.room.mixing.suite';
UPDATE public.profiles SET bio = 'School serving the Goa music scene.' WHERE username = 'crimson.owls.academy';
UPDATE public.profiles SET bio = 'School serving the Chandigarh music scene.' WHERE username = 'echo.parade.academy';
UPDATE public.profiles SET bio = 'Label serving the Hyderabad music scene.' WHERE username = 'monsoon.machine.records';
UPDATE public.profiles SET bio = 'Booking Agency serving the Bengaluru music scene.' WHERE username = 'neon.ensemble.agency';
UPDATE public.profiles SET bio = 'Studio serving the Mumbai music scene.' WHERE username = 'paper.parade.studios';
UPDATE public.profiles SET bio = 'Acoustic-focused tracking suite.' WHERE username = 'resonance.acoustic.suites';
UPDATE public.profiles SET bio = 'Booking Agency serving the Bengaluru music scene.' WHERE username = 'silver.riot.agency';
UPDATE public.profiles SET bio = 'Hindustani & contemporary music school.' WHERE username = 'swar.academy.of.music';
UPDATE public.profiles SET bio = 'Live room for touring bands.' WHERE username = 'the.humming.tree.live.room';
UPDATE public.profiles SET bio = 'Label serving the Hyderabad music scene.' WHERE username = 'velvet.static.records';
UPDATE public.profiles SET bio = 'Vocal recording & foley specialists.' WHERE username = 'velvet.vocal.and.foley.studio';

COMMIT;
