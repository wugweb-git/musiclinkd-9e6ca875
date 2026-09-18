-- MusicLinkd live database snapshot (Lovable Cloud, Supabase project ace967d9-a62e-48bb-b076-c3b63b11b185)
-- Taken 2026-09-18 via Lovable query_database, before migration 20260918240000_missing_data.sql.
--
-- Scope: row counts of every table the migration touches, plus the stored values it changes.
-- It replaces no existing constraint, function or trigger: none of refresh_review_stats,
-- refresh_follower_count, recompute_review_stats, profile_response_time, the triggers
-- reviews_refresh_stats / follows_refresh_count, or the constraints profiles_rate_paise_check,
-- profiles_rate_unit_check, profiles_rating_check, profiles_counts_nonnegative, studios_add_ons_array,
-- studio_rooms_tiers_array existed at snapshot time, and none of the new columns (profiles rate_paise,
-- rate_unit, area, influences, response_time, rating, review_count, followers_count;
-- profile_business.legal_name; studios response_time, add_ons; studio_rooms description, tiers;
-- reviews.tags; portfolio_items.duration) existed. Existing triggers on the touched tables, unchanged:
-- profiles_guard_admin_fields, profiles_username_rules, update_profiles_updated_at (profiles);
-- update_portfolio_items_updated_at; taxonomy_options_touch_updated_at; notify_review (reviews).
--
-- Values the migration overwrites or extends, with the statements that put them back:
--   studios.rating / review_count are recomputed from reviews for every studio. 12 studios held
--   figures that the reviews rows do not produce (10 with no review rows at all; wugweb has 3 reviews,
--   paper-parade-studios 1). studios.amenities gains slugs on six studios.
--   profiles genres / languages / instruments gain slugs on seven profiles.
--   profile_role_details.details gains keys on three rows.
--   profiles.updated_at moves on every profile the migration updates.
--
-- Row counts at snapshot time:
--   profiles 119, profile_business 28, profile_role_details 80, studios 18, studio_rooms 14,
--   studio_equipment 19, reviews 43, portfolio_items 98, taxonomy_options 382, follows 1,
--   messages 3, conversation_members 2.
-- 74 profiles have hourly_rate_paise (copied into rate_paise / 'hour'); 21 profiles have reviews;
-- 1 profile is followed.
-- Last migration recorded in supabase_migrations.schema_migrations: 20260918160000.
--
-- To undo: run the rollback in the migration header, then the statements below.

-- studios: rating, review_count and amenities before the migration
UPDATE public.studios SET rating = 4.40, review_count = 22, amenities = '{valet_parking,parking_space}' WHERE slug = 'analog-ensemble-studios';
UPDATE public.studios SET rating = NULL, review_count = 0, amenities = '{rehearsal_room,drums_included}' WHERE slug = 'basement-jam';
UPDATE public.studios SET rating = 4.80, review_count = 94, amenities = '{rehearsal_room,live_room}' WHERE slug = 'beatroute-spaces';
UPDATE public.studios SET rating = 4.90, review_count = 18, amenities = '{vocal_booth,fiber_internet}' WHERE slug = 'blue-room-mixing-suite';
UPDATE public.studios SET rating = NULL, review_count = 0, amenities = '{}' WHERE slug = 'headroom-mastering';
UPDATE public.studios SET rating = 4.80, review_count = 142, amenities = '{live_room,stage_monitors,parking_space}' WHERE slug = 'ironwood-live-hall-and-venue';
UPDATE public.studios SET rating = NULL, review_count = 0, amenities = '{rehearsal_room,drums_included,parking_space}' WHERE slug = 'jam-room-bandra';
UPDATE public.studios SET rating = NULL, review_count = 0, amenities = '{live_room,vocal_booth,resident_engineers,parking_space}' WHERE slug = 'octave-sound-labs';
UPDATE public.studios SET rating = 5.00, review_count = 32, amenities = '{valet_parking,fiber_internet}' WHERE slug = 'paper-parade-studios';
UPDATE public.studios SET rating = 4.88, review_count = 54, amenities = '{vocal_booth,acoustics_optimized}' WHERE slug = 'resonance-acoustic-suites';
UPDATE public.studios SET rating = 4.90, review_count = 64, amenities = '{}' WHERE slug = 'soundhouse-bandra';
UPDATE public.studios SET rating = 4.80, review_count = 22, amenities = '{access_24x7}' WHERE slug = 'the-hive-recording-studio';
UPDATE public.studios SET rating = 4.60, review_count = 51, amenities = '{live_room,rehearsal_room}' WHERE slug = 'the-humming-tree-live-room';
UPDATE public.studios SET rating = 4.90, review_count = 31, amenities = '{vocal_booth}' WHERE slug = 'velvet-vocal-and-foley-studio';
UPDATE public.studios SET rating = NULL, review_count = 0, amenities = '{}' WHERE slug = 'waveform-podcast';
UPDATE public.studios SET rating = 4.95, review_count = 88, amenities = '{dolby_atmos,vocal_booth,live_room,access_24x7,private_lounge}' WHERE slug = 'wugweb';
UPDATE public.studios SET rating = 4.90, review_count = 188, amenities = '{dolby_atmos,live_room,resident_engineers,valet_parking}' WHERE slug = 'yash-raj-sound-studios';

-- profiles: genres, languages and instruments before the migration
UPDATE public.profiles SET genres = '{}', languages = '{ml,ta,en}', instruments = '{}' WHERE id = 'dbb4397e-9c0c-53d8-8624-2825c93d349f';
UPDATE public.profiles SET genres = '{}', languages = '{hi,en}', instruments = '{}' WHERE id = '61d15aab-b011-54ef-8644-b185711b608f';
UPDATE public.profiles SET genres = '{sufi_devotional}', languages = '{pa,hi}', instruments = '{}' WHERE id = '53147d82-58ac-5f17-97d3-f8125042e764';
UPDATE public.profiles SET genres = '{indie_pop}', languages = '{en}', instruments = '{}' WHERE id = '0f820a59-9f0a-56a6-b1c4-99360bcc0d2c';
UPDATE public.profiles SET genres = '{rnb,bollywood}', languages = '{en,ta,kn,hi}', instruments = '{keyboard}' WHERE id = '5a7466b9-2422-5d5d-9460-ee61b2002f13';
UPDATE public.profiles SET genres = '{hindustani_classical,bhajan}', languages = '{mr,hi}', instruments = '{}' WHERE id = '3fc0b746-3c09-5140-9270-549088a046db';
UPDATE public.profiles SET genres = '{hiphop}', languages = '{hi}', instruments = '{}' WHERE id = 'e441dda1-4f3e-562a-812d-1a5525b9a90e';

-- profile_role_details: details before the migration
UPDATE public.profile_role_details SET details = '{"daw_tools": ["ableton_live", "pro_tools"]}' WHERE profile_id = '5a7466b9-2422-5d5d-9460-ee61b2002f13' AND role_slug = 'producer';
UPDATE public.profile_role_details SET details = '{"composition_styles": ["film_score", "orchestral"]}' WHERE profile_id = 'dbb4397e-9c0c-53d8-8624-2825c93d349f' AND role_slug = 'composer';
UPDATE public.profile_role_details SET details = '{"singing_styles": ["sufi"]}' WHERE profile_id = '53147d82-58ac-5f17-97d3-f8125042e764' AND role_slug = 'folk_vocalist';
