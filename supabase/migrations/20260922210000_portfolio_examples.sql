-- Owner, 22 Sep 2026: ten profiles with services had nothing in their portfolio, so their services
-- had no examples. Each gets two published works that match their type and services, and their
-- services link them as examples.
-- Snapshot and undo: supabase/dumps/2026-09-22-before-portfolio-examples.sql

BEGIN;

INSERT INTO public.portfolio_items
  (user_id, title, kind, description, role, release_year, published, sort_order, featured)
VALUES
  ('0550d73a-8f3a-524e-ad14-f881f9bf4ae8', 'Midnight Chai — lo-fi beat tape', 'album', 'Eight lo-fi and trap instrumentals produced in-house, licensed to independent rappers.', 'Producer', 2025, true, 0, true),
  ('0550d73a-8f3a-524e-ad14-f881f9bf4ae8', 'Streetlight (instrumental)', 'track', 'A trap lo-fi beat built from a sampled sarangi phrase and 808s.', 'Producer', 2026, true, 1, false),
  ('61d15aab-b011-54ef-8644-b185711b608f', 'Bandra Rooftop Sessions', 'performance', 'A four-hour house and Bollywood-edit set at a sold-out rooftop night in Mumbai.', 'DJ', 2025, true, 0, true),
  ('61d15aab-b011-54ef-8644-b185711b608f', 'Monsoon Desi Bass Mix', 'track', 'A sixty-minute Desi Bass mix recorded live for a club residency.', 'DJ', 2026, true, 1, false),
  ('ba5786ec-11fd-5ee9-b013-176f102e6fa9', 'Kho Gaye (backing vocals)', 'track', 'Stacked harmonies and backing vocals for an indie-pop single.', 'Backing vocalist', 2025, true, 0, true),
  ('ba5786ec-11fd-5ee9-b013-176f102e6fa9', 'Songwriter demo reel', 'project', 'Guide vocals recorded for six songwriters'' demos pitched to labels.', 'Demo vocalist', 2026, true, 1, false),
  ('0662ace1-0642-5590-832f-f55fa23438f1', 'Dilli Nights EP — mix and master', 'album', 'Mixed and mastered a four-song indie EP for streaming and a club master.', 'Mixing engineer', 2025, true, 0, true),
  ('0662ace1-0642-5590-832f-f55fa23438f1', 'Paper Planes (guitar and mix)', 'track', 'Rhythm and lead guitar, then the final mix, on an alt-rock single.', 'Guitarist, mixing engineer', 2026, true, 1, false),
  ('689e3ab6-0309-58d2-9e9e-b7983d7dc132', 'Vaanam Paadum — film song', 'credit', 'Playback vocals for a Tamil film song, recorded to the composer''s guide.', 'Playback singer', 2025, true, 0, true),
  ('689e3ab6-0309-58d2-9e9e-b7983d7dc132', 'Chennai Coffee jingle', 'track', 'A thirty-second jingle vocal with two alternate tones for a coffee brand.', 'Vocalist', 2026, true, 1, false),
  ('7b97ed4d-499b-5723-b116-04b2c14be958', 'Raag Yaman — live baithak', 'performance', 'An evening baithak of Raag Yaman with tabla and harmonium accompaniment.', 'Vocalist', 2025, true, 0, true),
  ('7b97ed4d-499b-5723-b116-04b2c14be958', 'Kun Faya Kun (Sufi rendition)', 'track', 'A Sufi rendition recorded with alaaps and harkats for an independent release.', 'Vocalist', 2026, true, 1, false),
  ('3fc0b746-3c09-5140-9270-549088a046db', 'Sangeet night, Pune', 'performance', 'A full sangeet set with dholak and keys for a family wedding.', 'Vocalist', 2025, true, 0, true),
  ('3fc0b746-3c09-5140-9270-549088a046db', 'Café acoustic sessions', 'project', 'A monthly acoustic set of Bollywood and indie covers at a Pune café.', 'Vocalist', 2026, true, 1, false),
  ('ef3160ef-b8ea-5d08-9eb7-8efd08b98917', 'Hyderabad Duo Sessions', 'performance', 'Guitar-and-vocal duo sets at venues and private events in Hyderabad.', 'Guitarist, vocalist', 2025, true, 0, true),
  ('ef3160ef-b8ea-5d08-9eb7-8efd08b98917', 'Blue Hour (single)', 'track', 'A singer-songwriter single with guitar and lead vocals tracked in one session.', 'Guitarist, vocalist', 2026, true, 1, false),
  ('86a5d555-61eb-5619-b452-3a9387baa66f', 'Feature film sound mix', 'credit', 'Final sound mix for a Hindi feature on the studio''s mix stage.', 'Sound mix', 2025, true, 0, true),
  ('86a5d555-61eb-5619-b452-3a9387baa66f', 'Web series dubbing and mix', 'project', 'Dubbing and stereo mix for an eight-episode web series.', 'Dubbing and mix', 2026, true, 1, false),
  ('224b80f9-2a74-579a-8c7c-84dd30a5edcb', 'Fingerstyle covers', 'project', 'Fingerstyle arrangements of film songs, recorded with tabs for students.', 'Guitarist, arranger', 2025, true, 0, true),
  ('224b80f9-2a74-579a-8c7c-84dd30a5edcb', 'Corporate evening, Pune', 'performance', 'A solo acoustic set for a corporate awards evening.', 'Guitarist', 2026, true, 1, false);

UPDATE public.profile_services s SET example_ids = coalesce((
  SELECT array_agg(x.id) FROM (
    SELECT id FROM public.portfolio_items
     WHERE user_id = s.profile_id AND published
     ORDER BY featured DESC, sort_order LIMIT 2) x), '{}')
 WHERE cardinality(s.example_ids) = 0 AND s.profile_id IN ('0550d73a-8f3a-524e-ad14-f881f9bf4ae8', '61d15aab-b011-54ef-8644-b185711b608f', 'ba5786ec-11fd-5ee9-b013-176f102e6fa9', '0662ace1-0642-5590-832f-f55fa23438f1', '689e3ab6-0309-58d2-9e9e-b7983d7dc132', '7b97ed4d-499b-5723-b116-04b2c14be958', '3fc0b746-3c09-5140-9270-549088a046db', 'ef3160ef-b8ea-5d08-9eb7-8efd08b98917', '86a5d555-61eb-5619-b452-3a9387baa66f', '224b80f9-2a74-579a-8c7c-84dd30a5edcb');

COMMIT;
