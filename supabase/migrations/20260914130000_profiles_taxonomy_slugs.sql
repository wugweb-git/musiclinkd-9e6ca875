-- Store taxonomy slugs, not English display strings, in profiles.
--
-- Converts roles, instruments, genres, languages and the role prefix of specialisations to the slugs
-- in taxonomy_options (20260914120000_taxonomy_persona_bucket.sql). Only the 11 seeded linked
-- profiles hold values; the real accounts have empty arrays and are untouched.
--
-- Mapping (app onboarding value → slug):
--   languages    Hindi hi · English en · Marathi mr · Malayalam ml · Tamil ta · Telugu te ·
--                Kannada kn · Punjabi pa · Bengali bn
--   instruments  Piano piano · Keyboard keyboard_synthesizer · Bass bass_guitar ·
--                Drums drums_percussion · Guitar electric_guitar
--   genres       Bollywood bollywood_filmi · Indie indie_pop · Pop indie_pop · Rock rock_metal ·
--                Jazz jazz_blues · Electronic edm_synthwave · Fusion fusion · Hip-Hop hiphop_trap ·
--                Classical carnatic_classical (Malayalam/Tamil profile) or
--                hindustani_classical (Marathi/Hindi profile)
--   roles        musician · composer · singer · producer (unchanged) · sound-engineer sound_engineer ·
--                Production house production_house · Recording studio studio ·
--                Artist manager artist_manager · Independent label music_label · A&R a_and_r ·
--                Publishing music_publisher · Venue venue
-- Dropped, no slug exists: genre Regional (arjunpillai); roles Music videos (northlightfilms),
-- Rehearsal space (octave-sound-labs), Production liaison (sanya-rao), Live music bookings
-- (thequarter). Their text remains in specialisations.
--
-- Does not change what the app writes: onboarding still saves English values until the pickers
-- read taxonomy_options.
--
-- Rollback: re-run the profile upserts in 20260913090949_seed_linked_profiles.sql.

UPDATE public.profiles SET
  roles = '{musician,composer}', instruments = '{piano,keyboard_synthesizer}',
  genres = '{carnatic_classical,jazz_blues,bollywood_filmi}', languages = '{ml,en,ta}'
WHERE username = 'arjunpillai';

UPDATE public.profiles SET
  roles = '{sound_engineer}', instruments = '{}',
  genres = '{bollywood_filmi,indie_pop,edm_synthwave}', languages = '{hi,ml,en}',
  specialisations = ARRAY['sound_engineer:Mixing', 'sound_engineer:Mastering', 'sound_engineer:Stem delivery']
WHERE username = 'kabir-nair';

UPDATE public.profiles SET
  roles = '{musician,singer}', instruments = '{electric_guitar,bass_guitar}',
  genres = '{rock_metal,indie_pop}', languages = '{en,kn}'
WHERE username = 'kabirmenon';

UPDATE public.profiles SET
  roles = '{producer,musician}', instruments = '{piano,keyboard_synthesizer}',
  genres = '{jazz_blues,fusion,hindustani_classical}', languages = '{en,mr,hi}'
WHERE username = 'meeraraghav';

UPDATE public.profiles SET
  roles = '{production_house}', instruments = '{}',
  genres = '{hiphop_trap,bollywood_filmi,edm_synthwave}', languages = '{hi,en,pa}',
  specialisations = ARRAY['production_house:Brand films', 'production_house:Music videos', 'production_house:Music supervision']
WHERE username = 'northlightfilms';

UPDATE public.profiles SET
  roles = '{studio}', instruments = '{drums_percussion,piano,bass_guitar,electric_guitar}',
  genres = '{indie_pop,rock_metal,jazz_blues,bollywood_filmi}', languages = '{hi,en,mr}',
  specialisations = ARRAY['studio:Live tracking', 'studio:Vocal recording', 'studio:Rehearsals']
WHERE username = 'octave-sound-labs';

UPDATE public.profiles SET
  roles = '{musician}', instruments = '{keyboard_synthesizer,piano}',
  genres = '{jazz_blues,indie_pop,fusion}', languages = '{en,hi,mr}'
WHERE username = 'rheadsouza';

UPDATE public.profiles SET
  roles = '{artist_manager}', instruments = '{}',
  genres = '{bollywood_filmi,indie_pop,edm_synthwave}', languages = '{hi,te,en}',
  specialisations = ARRAY['artist_manager:Artist management', 'artist_manager:Delivery schedules', 'artist_manager:Budgets']
WHERE username = 'sanya-rao';

UPDATE public.profiles SET
  roles = '{music_label,a_and_r,music_publisher}', instruments = '{}',
  genres = '{indie_pop,rock_metal}', languages = '{hi,en}',
  specialisations = ARRAY['music_label:A&R', 'music_label:Release strategy', 'music_label:Playlist pitching', 'music_label:Sync licensing']
WHERE username = 'sunsetrecords';

UPDATE public.profiles SET
  roles = '{producer,musician}', instruments = '{keyboard_synthesizer}',
  genres = '{edm_synthwave,indie_pop}', languages = '{bn,hi,en}'
WHERE username = 'tarabose';

UPDATE public.profiles SET
  roles = '{venue}', instruments = '{}',
  genres = '{jazz_blues,fusion,indie_pop,edm_synthwave}', languages = '{en,hi}',
  specialisations = ARRAY['venue:Live bookings', 'venue:House band', 'venue:Backline']
WHERE username = 'thequarter';
