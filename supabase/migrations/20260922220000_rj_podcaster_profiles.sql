-- Owner, 22 Sep 2026: no RJ or Podcaster profiles existed, so those types had no services to
-- show. Two RJs and two podcasters, each with two services under the Hosting categories and two
-- published portfolio works linked as the services' examples. Accounts have no password or email
-- (the auth.users pattern of 20260921300000_business_types_cleanup.sql).
-- New rows only; undo: supabase/dumps/2026-09-22-before-rj-podcaster-profiles.sql

BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, is_sso_user, is_anonymous)
VALUES
  ('00000000-0000-0000-0000-000000000000', '06f82052-a882-4c24-aeb1-fdfa46f1f06b', 'authenticated', 'authenticated', NULL, NULL, '{}'::jsonb, jsonb_build_object('full_name', 'RJ Meher Sethi'), now(), now(), '', '', '', '', false, false),
  ('00000000-0000-0000-0000-000000000000', 'c44a75ff-43f2-4122-833b-bd891883bd36', 'authenticated', 'authenticated', NULL, NULL, '{}'::jsonb, jsonb_build_object('full_name', 'RJ Kavin Raj'), now(), now(), '', '', '', '', false, false),
  ('00000000-0000-0000-0000-000000000000', '361fd4d7-df5b-46d7-9f5d-8e76d77532d2', 'authenticated', 'authenticated', NULL, NULL, '{}'::jsonb, jsonb_build_object('full_name', 'Rhea D''Souza'), now(), now(), '', '', '', '', false, false),
  ('00000000-0000-0000-0000-000000000000', 'c2e62e64-b80c-4041-9879-0528827730ad', 'authenticated', 'authenticated', NULL, NULL, '{}'::jsonb, jsonb_build_object('full_name', 'Arjun Malhotra'), now(), now(), '', '', '', '', false, false)
ON CONFLICT (id) DO NOTHING;

UPDATE public.profiles p SET
    username = v.username, first_name = v.first_name, last_name = v.last_name, display_name = v.display_name,
    headline = v.headline, bio = v.bio, city = v.city, state = v.state, country = 'India', area = v.area,
    pin_code = v.pin_code, roles = v.roles, genres = v.genres, languages = v.languages,
    visibility = 'public', onboarding_complete = true, is_available = true, updated_at = now()
  FROM (VALUES
    ('06f82052-a882-4c24-aeb1-fdfa46f1f06b'::uuid, 'rj.meher', 'Meher', 'Sethi', 'RJ Meher Sethi', 'Radio host and emcee — Bollywood breakfast shows and live events', 'Breakfast-show RJ on Mumbai radio for six years. I host live shows, record promos and anchor college fests, launches and weddings in Hindi, English and Marathi.', 'Mumbai', 'Maharashtra', 'Andheri West', '400053', ARRAY['rj']::text[], ARRAY['bollywood', 'indie_pop']::text[], ARRAY['hi', 'en', 'mr']::text[]),
    ('c44a75ff-43f2-4122-833b-bd891883bd36'::uuid, 'rj.kavin', 'Kavin', 'Raj', 'RJ Kavin Raj', 'Tamil radio host, promo voice and event anchor', 'Evening drive-time RJ in Chennai. I voice radio promos and ads from my home studio and anchor Tamil events across Tamil Nadu.', 'Chennai', 'Tamil Nadu', 'Nungambakkam', '600034', ARRAY['rj']::text[], ARRAY['kollywood', 'indie']::text[], ARRAY['ta', 'en']::text[]),
    ('361fd4d7-df5b-46d7-9f5d-8e76d77532d2'::uuid, 'rhea.podcasts', 'Rhea', 'D''Souza', 'Rhea D''Souza', 'Podcast host and producer — interview shows about India''s independent music', 'I host and produce Indie Rooms, a podcast of long conversations with independent musicians. I also edit and produce shows for other hosts.', 'Bengaluru', 'Karnataka', 'Indiranagar', '560038', ARRAY['podcaster']::text[], ARRAY['indie', 'indie_pop']::text[], ARRAY['en', 'kn', 'hi']::text[]),
    ('c2e62e64-b80c-4041-9879-0528827730ad'::uuid, 'arjun.talks', 'Arjun', 'Malhotra', 'Arjun Malhotra', 'Hindi hip-hop podcast host and interviewer', 'I run a Hindi podcast about the Delhi hip-hop scene: interviews with rappers, producers and DJs, filmed in studio and cut for social.', 'Delhi', 'Delhi', 'Hauz Khas', '110016', ARRAY['podcaster']::text[], ARRAY['hiphop', 'gully_rap']::text[], ARRAY['hi', 'en', 'pa']::text[])
  ) AS v(id, username, first_name, last_name, display_name, headline, bio, city, state, area, pin_code, roles, genres, languages)
 WHERE p.id = v.id;

INSERT INTO public.portfolio_items
  (id, user_id, title, kind, description, role, release_year, published, sort_order, featured)
VALUES
  ('d1805035-4641-48aa-a670-3b6373ec31b9', '06f82052-a882-4c24-aeb1-fdfa46f1f06b', 'Mumbai Mornings — breakfast show', 'project', 'A weekday breakfast show of Bollywood hits, listener calls and city news.', 'RJ', 2025, true, 0, true),
  ('47b8a3bb-5379-4c1f-a003-09238d2cf0c5', '06f82052-a882-4c24-aeb1-fdfa46f1f06b', 'College fest emcee, IIT Bombay', 'performance', 'Anchored three nights of a college cultural fest, with band and DJ changeovers.', 'Emcee', 2026, true, 1, false),
  ('d6719930-de0c-432b-b0fc-1b60fca2e058', 'c44a75ff-43f2-4122-833b-bd891883bd36', 'Chennai Drive Time — evening show', 'project', 'An evening drive-time show of Tamil film music and listener dedications.', 'RJ', 2025, true, 0, true),
  ('7edd1889-980b-46e7-9093-546c52ea6f7a', 'c44a75ff-43f2-4122-833b-bd891883bd36', 'Radio promo reel', 'track', 'A reel of station promos and ad reads in Tamil and English.', 'Voice-over', 2026, true, 1, false),
  ('eababd07-daed-41ec-ac8e-edc4fe4a8d51', '361fd4d7-df5b-46d7-9f5d-8e76d77532d2', 'Indie Rooms podcast, season 2', 'project', 'Twelve interview episodes with independent musicians from across India.', 'Host', 2025, true, 0, true),
  ('715a3282-88e5-417b-b781-316279b42b90', '361fd4d7-df5b-46d7-9f5d-8e76d77532d2', 'Episode 14: Building a Bengaluru label', 'track', 'An hour-long conversation about starting an independent label.', 'Host and producer', 2026, true, 1, false),
  ('6784ef56-0b68-40d2-8b3c-3e2c4bce903b', 'c2e62e64-b80c-4041-9879-0528827730ad', 'Dilli Cypher Talks', 'project', 'A video podcast of interviews with Delhi rappers and producers.', 'Host', 2025, true, 0, true),
  ('06e887d6-9d3c-423c-9d26-f1943f4d5538', 'c2e62e64-b80c-4041-9879-0528827730ad', 'Episode 9: From cyphers to a label deal', 'track', 'A conversation with a Delhi rapper about signing their first deal.', 'Host', 2026, true, 1, false);

INSERT INTO public.profile_services
  (profile_id, name, description, categories, category, price_paise, turnaround, mode, work_modes, availability, deliverables, example_ids, status, sort_order)
VALUES
  ('06f82052-a882-4c24-aeb1-fdfa46f1f06b', 'Radio show hosting', 'Hosting for a radio or streaming show, live in your studio or pre-recorded, with links written to your format.', ARRAY['radio_hosting']::text[], 'radio_hosting', 2500000, '1 week', 'In person', ARRAY['in_person']::text[], 'Weekdays', ARRAY['Scripted show links', 'Live or pre-recorded segments', 'Show prep with your producer']::text[], ARRAY['d1805035-4641-48aa-a670-3b6373ec31b9', '47b8a3bb-5379-4c1f-a003-09238d2cf0c5']::uuid[], 'active', 0),
  ('06f82052-a882-4c24-aeb1-fdfa46f1f06b', 'Event emcee and anchoring', 'Anchoring for fests, launches and weddings, from the opening to the last act, in Hindi and English.', ARRAY['emcee']::text[], 'emcee', 4000000, '1 week', 'In person', ARRAY['in_person', 'touring']::text[], 'Weekends', ARRAY['Script in Hindi and English', 'Run-of-show rehearsal', 'Crowd engagement segments']::text[], ARRAY['d1805035-4641-48aa-a670-3b6373ec31b9', '47b8a3bb-5379-4c1f-a003-09238d2cf0c5']::uuid[], 'active', 1),
  ('c44a75ff-43f2-4122-833b-bd891883bd36', 'Radio promos and voice-overs', 'Station promos, ad reads and show intros recorded in my home studio, in Tamil or English.', ARRAY['voice_over', 'radio_hosting']::text[], 'voice_over', 800000, '1–2 days', 'Remote', ARRAY['remote']::text[], 'Open', ARRAY['Recorded promo read', 'Two takes, different tone', 'Broadcast-ready WAV']::text[], ARRAY['d6719930-de0c-432b-b0fc-1b60fca2e058', '7edd1889-980b-46e7-9093-546c52ea6f7a']::uuid[], 'active', 0),
  ('c44a75ff-43f2-4122-833b-bd891883bd36', 'Tamil event anchoring', 'Anchoring for Tamil events, weddings and corporate evenings, with the script agreed in advance.', ARRAY['emcee']::text[], 'emcee', 3000000, '1 week', 'In person', ARRAY['in_person']::text[], 'Weekends', ARRAY['Script in Tamil and English', 'Run-of-show rehearsal', 'Audience games and segments']::text[], ARRAY['d6719930-de0c-432b-b0fc-1b60fca2e058', '7edd1889-980b-46e7-9093-546c52ea6f7a']::uuid[], 'active', 1),
  ('361fd4d7-df5b-46d7-9f5d-8e76d77532d2', 'Podcast hosting', 'I host your episode or series: research, questions, the recording, and a spoken intro and outro.', ARRAY['podcast_hosting']::text[], 'podcast_hosting', 1500000, '1 week', 'Remote · In person', ARRAY['remote', 'in_person']::text[], 'Open', ARRAY['Researched interview questions', 'Hosted recording session', 'Episode intro and outro']::text[], ARRAY['eababd07-daed-41ec-ac8e-edc4fe4a8d51', '715a3282-88e5-417b-b781-316279b42b90']::uuid[], 'active', 0),
  ('361fd4d7-df5b-46d7-9f5d-8e76d77532d2', 'Podcast editing and production', 'Editing, clean-up and mastering for a recorded episode, with show notes ready to publish.', ARRAY['podcast_production']::text[], 'podcast_production', 600000, '3–5 days', 'Remote', ARRAY['remote']::text[], 'Open', ARRAY['Edited episode', 'Loudness-matched master', 'Show notes']::text[], ARRAY['eababd07-daed-41ec-ac8e-edc4fe4a8d51', '715a3282-88e5-417b-b781-316279b42b90']::uuid[], 'active', 1),
  ('c2e62e64-b80c-4041-9879-0528827730ad', 'Artist interview episodes', 'An interview episode about your release or story, recorded in studio and cut into clips for social.', ARRAY['podcast_hosting']::text[], 'podcast_hosting', 1200000, '1 week', 'In person', ARRAY['in_person']::text[], 'Weekdays', ARRAY['Pre-interview call', 'Recorded interview episode', 'Short clips for social']::text[], ARRAY['6784ef56-0b68-40d2-8b3c-3e2c4bce903b', '06e887d6-9d3c-423c-9d26-f1943f4d5538']::uuid[], 'active', 0),
  ('c2e62e64-b80c-4041-9879-0528827730ad', 'Podcast intros and emcee', 'Recorded intros, outros and ad reads for your podcast, in Hindi or English.', ARRAY['emcee', 'podcast_hosting']::text[], 'emcee', 500000, '1–2 days', 'Remote', ARRAY['remote']::text[], 'Open', ARRAY['Recorded intro and outro', 'Two takes', 'Broadcast-ready WAV']::text[], ARRAY['6784ef56-0b68-40d2-8b3c-3e2c4bce903b', '06e887d6-9d3c-423c-9d26-f1943f4d5538']::uuid[], 'active', 1);

COMMIT;
