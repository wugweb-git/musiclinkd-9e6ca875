-- The content that was hardcoded in src/data/*.ts, moved into the live tables so the screens that
-- now read only from Supabase show it again, with no code change. Rows are shaped the way the read
-- code expects them (src/lib/catalog.functions.ts, src/lib/market-view.ts,
-- src/lib/rentals.functions.ts, src/lib/opportunity-view.ts, src/lib/studio-view.ts).
--
--   src/data/rentals.ts        equipment  → marketplace_listings (category gear_rental)   7 rows
--   src/data/market.ts         listings   → marketplace_listings                           5 rows
--   (the mixing-and-mastering service is left out: services are Discover's, not Market's)
--   src/data/market.ts         listings   → studios (the "space" listing Bandra Jam Room)  1 row
--   src/data/booking.ts        bookables  → studios + studio_rooms (Octave Sound Labs)     1 + 3 rows
--   src/data/opportunities.ts  opportunities → opportunities                               5 rows
--
-- Owners: a row is linked to a profile only where that profile already exists (matched by
-- username, looked up here rather than hardcoding ids). Everything else carries only the
-- name-only column (marketplace_listings.seller_name). No auth user or profile is created.
-- Counts the tables hold (studios.rating / review_count, opportunities.applicant_count) are left at
-- their empty defaults: the hardcoded figures were never counted from anything.
-- Money is integer paise. Image URLs are the ones the files used.
--
-- Idempotent: every insert skips a slug that already exists (ON CONFLICT (slug) DO NOTHING), and
-- rooms are only added when the studio has no room of that name.
-- Not included, and why: the signed-in user's own activity (bookings, rental requests, alerts,
-- notifications, recent searches, applications, "posted by me", given/received reviews, pending
-- review requests), and any row whose table needs a profile that does not exist (talents,
-- Krimson Avenue, Headroom Mastering, The Basement Jam Rooms, Waveform Podcast Studio, reviews of
-- sellers and rental providers with no profile, the unowned portfolio works).

BEGIN;

-- Two equipment kinds the rentals need and the taxonomy lacked: a PA system and a full backline.
-- Without them those rentals sit in no rental category.
INSERT INTO public.taxonomy_options (category_key, slug, label, sort_order, is_published) VALUES
  ('equipment_categories', 'pa_systems', 'PA Systems', 8, true),
  ('equipment_categories', 'backline', 'Backline', 9, true)
ON CONFLICT (category_key, slug) DO NOTHING;

-- ---------------------------------------------------------------------------------------------
-- src/data/rentals.ts — equipment (providers have no profile: seller_name only)
-- The Pearl Export kit is already live as pearl-export-drum-kit and is not repeated.
-- ---------------------------------------------------------------------------------------------

INSERT INTO public.marketplace_listings (
  slug, seller_name, title, category, item_category_kind, item_category, condition,
  price_paise, price_unit, price_note, image_url, brand, model,
  weekly_price_paise, monthly_price_paise, deposit_paise, quantity_available,
  pickup_available, delivery_available, delivery_fee_paise, delivery_note, pickup_location,
  min_days, max_days, notice_period, unavailable_dates, listing_description, specs, included,
  created_at
) VALUES
(
  'shure-sm7b', 'SoundHouse Studio', 'Shure SM7B', 'gear_rental', 'equipment', 'microphones', 'used',
  90000, 'day', '+ ₹15,000 deposit',
  'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=900&q=80',
  'Shure', 'SM7B',
  450000, 1400000, 1500000, 3,
  true, true, 60000, 'Same-day delivery within Mumbai before 6 pm', 'Andheri West, Mumbai',
  1, 30, '24 hours', '{2026-08-24,2026-08-25,2026-08-26}',
  'The broadcast standard for vocals, podcasts and loud sources. Serviced between every rental, supplied in a padded case with a fresh windscreen.',
  $j$[{"label":"Brand","value":"Shure"},{"label":"Model","value":"SM7B"},{"label":"Type","value":"Dynamic, cardioid"},{"label":"Connectivity","value":"XLR (needs 60dB gain)"},{"label":"Power","value":"No phantom required"},{"label":"Weight","value":"0.76 kg"},{"label":"Condition","value":"Excellent"},{"label":"Year","value":"2023"}]$j$::jsonb,
  ARRAY['Microphone', 'Windscreen A7WS', 'Yoke mount', 'XLR cable 5 m', 'Padded case'],
  now() - interval '1 minute'
),
(
  'fender-twin', 'Ravi Deshmukh', 'Fender Twin Reverb ''65 Reissue', 'gear_rental', 'instrument', 'electric_guitar', 'used',
  180000, 'day', '+ ₹25,000 deposit',
  'https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=900&q=80',
  'Fender', 'Twin Reverb ''65 RI',
  900000, 2800000, 2500000, 1,
  true, true, 120000, 'Delivery with a two-person crew inside Mumbai', 'Dadar, Mumbai',
  1, 14, '48 hours', '{2026-08-20,2026-08-21}',
  '85W of clean headroom with the classic Fender spring reverb and tremolo. Retubed in March, footswitch and cover included.',
  $j$[{"label":"Brand","value":"Fender"},{"label":"Model","value":"'65 Twin Reverb Reissue"},{"label":"Type","value":"Valve combo amplifier"},{"label":"Power","value":"85W · 230V"},{"label":"Speakers","value":"2 × 12\" Jensen C-12K"},{"label":"Weight","value":"29 kg"},{"label":"Condition","value":"Good"},{"label":"Year","value":"2019"}]$j$::jsonb,
  ARRAY['Amplifier', '2-button footswitch', 'Padded cover', 'Power cable'],
  now() - interval '2 minutes'
),
(
  'pioneer-xdj-rx3', 'Pulse Live Systems', 'Pioneer XDJ-RX3 DJ System', 'gear_rental', 'equipment', 'controllers', 'like_new',
  350000, 'day', '+ ₹40,000 deposit',
  'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?auto=format&fit=crop&w=900&q=80',
  'Pioneer DJ', 'XDJ-RX3',
  1750000, 5200000, 4000000, 2,
  true, true, 150000, 'Delivered in flight case with a technician on request', 'Lower Parel, Mumbai',
  1, 21, '24 hours', '{2026-08-31}',
  'All-in-one rekordbox and Serato-ready system with 10.1" touchscreen. Standard for club nights, weddings and brand events across Mumbai.',
  $j$[{"label":"Brand","value":"Pioneer DJ"},{"label":"Model","value":"XDJ-RX3"},{"label":"Type","value":"All-in-one DJ system"},{"label":"Connectivity","value":"USB, XLR out, RCA, mic in"},{"label":"Power","value":"230V AC"},{"label":"Weight","value":"8.6 kg"},{"label":"Condition","value":"Like New"},{"label":"Year","value":"2024"}]$j$::jsonb,
  ARRAY['XDJ-RX3', 'Flight case', 'Power cable', '2 × XLR cables', 'USB drive'],
  now() - interval '3 minutes'
),
(
  'jbl-pa-2k', 'Pulse Live Systems', 'JBL EON 2000W PA System', 'gear_rental', 'equipment', 'pa_systems', 'used',
  650000, 'day', '+ ₹50,000 deposit',
  'https://images.unsplash.com/photo-1519508234439-4f23643125c1?auto=format&fit=crop&w=900&q=80',
  'JBL', 'EON715 + EON718S',
  3200000, 9600000, 5000000, 4,
  false, true, 250000, 'Delivery, rigging and pickup included in MMR; crew billed separately', 'Lower Parel, Mumbai',
  1, 60, '24 hours', '{}',
  'Two tops, two subs, stands and cabling — enough for a 300-person room. Includes a 12-channel mixer and four wired microphones.',
  $j$[{"label":"Brand","value":"JBL"},{"label":"Model","value":"EON715 tops + EON718S subs"},{"label":"Type","value":"Powered PA system"},{"label":"Coverage","value":"Up to 300 people"},{"label":"Power","value":"2000W total · 230V"},{"label":"Weight","value":"148 kg packed"},{"label":"Condition","value":"Excellent"},{"label":"Year","value":"2023"}]$j$::jsonb,
  ARRAY['2 tops', '2 subs', 'Speaker stands', '12-ch mixer', '4 wired mics', 'All cabling'],
  now() - interval '4 minutes'
),
(
  'swaraj-tabla', 'Swaraj Instruments', 'Concert Tabla Set with Tuning Kit', 'gear_rental', 'instrument', 'tabla', 'used',
  70000, 'day', '+ ₹8,000 deposit',
  'https://images.unsplash.com/photo-1621360841013-c7683c659ec6?auto=format&fit=crop&w=900&q=80',
  'Swaraj', 'Concert Series',
  320000, 900000, 800000, 5,
  true, false, NULL, NULL, 'Girgaon, Mumbai',
  1, 90, 'Same day', '{}',
  'Sheesham dayan and nickel bayan tuned to your session key before pickup. Cushions, covers and hammer included.',
  $j$[{"label":"Brand","value":"Swaraj"},{"label":"Model","value":"Concert Series"},{"label":"Type","value":"Tabla pair"},{"label":"Tuning","value":"Tuned to key on request"},{"label":"Weight","value":"11 kg"},{"label":"Condition","value":"Excellent"},{"label":"Year","value":"2024"}]$j$::jsonb,
  ARRAY['Dayan', 'Bayan', 'Cushion rings', 'Covers', 'Tuning hammer'],
  now() - interval '5 minutes'
),
(
  'focusrite-18i20-rent', 'SoundHouse Studio', 'Focusrite Scarlett 18i20 Interface', 'gear_rental', 'equipment', 'audio_interfaces', 'used',
  110000, 'day', '+ ₹12,000 deposit',
  'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=900&q=80',
  'Focusrite', '18i20 3rd Gen',
  520000, 1600000, 1200000, 2,
  true, true, 50000, 'Courier across Mumbai in 24 hours', 'Bandra, Mumbai',
  2, 45, '48 hours', '{2026-08-15,2026-08-16,2026-08-17,2026-08-18}',
  'Eight preamps plus ADAT for tracking live bands on location. Rack ears fitted, all channels tested before dispatch.',
  $j$[{"label":"Brand","value":"Focusrite"},{"label":"Model","value":"Scarlett 18i20 3rd Gen"},{"label":"Type","value":"USB audio interface"},{"label":"Connectivity","value":"USB-C, 8 mic pre, ADAT"},{"label":"Power","value":"External PSU"},{"label":"Weight","value":"3.1 kg"},{"label":"Condition","value":"Good"},{"label":"Year","value":"2020"}]$j$::jsonb,
  ARRAY['Interface', 'PSU', 'USB-C cable', 'Rack ears'],
  now() - interval '6 minutes'
),
(
  'nord-stage-3', 'SoundHouse Studio', 'Nord Stage 3 88-Key Stage Piano', 'gear_rental', 'instrument', 'keyboard', 'used',
  420000, 'day', '+ ₹60,000 deposit',
  'https://images.unsplash.com/photo-1520166012956-add9ba0835cb?auto=format&fit=crop&w=900&q=80',
  'Nord', 'Stage 3 88',
  2100000, 6200000, 6000000, 1,
  true, true, 150000, NULL, 'Andheri West, Mumbai',
  1, 21, '72 hours', '{2026-08-14,2026-08-15,2026-08-16,2026-08-17,2026-08-18}',
  'Fully weighted hammer action with the Nord piano and sample libraries loaded. Flight case, stand and sustain pedal included.',
  $j$[{"label":"Brand","value":"Nord"},{"label":"Model","value":"Stage 3 88"},{"label":"Type","value":"Stage piano"},{"label":"Connectivity","value":"Stereo out, MIDI, USB"},{"label":"Power","value":"230V AC"},{"label":"Weight","value":"18.5 kg"},{"label":"Condition","value":"Excellent"},{"label":"Year","value":"2022"}]$j$::jsonb,
  ARRAY['Keyboard', 'Flight case', 'X-stand', 'Sustain pedal', 'Cables'],
  now() - interval '7 minutes'
)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------------------------
-- src/data/market.ts — listings sold by sellers with no profile (seller_name only)
-- ---------------------------------------------------------------------------------------------

INSERT INTO public.marketplace_listings (
  slug, seller_name, title, category, item_category_kind, item_category, condition,
  price_paise, price_unit, price_note, image_url, brand, model,
  weekly_price_paise, monthly_price_paise, deposit_paise,
  pickup_available, delivery_available, delivery_fee_paise, pickup_location,
  listing_description, specs, created_at
) VALUES
(
  'fender-strat-62', 'Ravi Deshmukh', 'Fender American Vintage II ''61 Stratocaster', 'gear_sale', 'instrument', 'electric_guitar', 'used',
  18400000, NULL, NULL,
  'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?auto=format&fit=crop&w=800&q=80',
  'Fender', 'American Vintage II ''61',
  NULL, NULL, NULL,
  true, false, NULL, 'Dadar, Mumbai',
  'Bought new from Furtados Mumbai in 2022, played only in studio. Frets at 95%, no buckle rash, all electronics stock. Comes with original moulded case, candy and certificate.',
  $j$[{"label":"Brand","value":"Fender"},{"label":"Model","value":"American Vintage II '61"},{"label":"Year","value":"2022"},{"label":"Condition","value":"Excellent"},{"label":"Included","value":"Hard case, strap, cable"}]$j$::jsonb,
  now() - interval '2 days'
),
(
  'sitar-swaraj', 'Swaraj Instruments', 'Handcrafted Ravi Shankar Style Sitar', 'gear_sale', 'instrument', 'sitar', 'new',
  6400000, NULL, NULL,
  'https://images.unsplash.com/photo-1621360841013-c7683c659ec6?auto=format&fit=crop&w=800&q=80',
  'Swaraj', NULL,
  NULL, NULL, NULL,
  true, false, NULL, 'Girgaon, Mumbai',
  'Full size professional sitar with 7 main and 13 sympathetic strings. Hand carved gourd, deer bone jawari, fitted fibre case and tuning kit included.',
  $j$[{"label":"Type","value":"Ravi Shankar style"},{"label":"Wood","value":"Seasoned tun"},{"label":"Strings","value":"7 main + 13 taraf"},{"label":"Included","value":"Fibre case, mizrab, extra strings"},{"label":"Warranty","value":"1 year workshop"}]$j$::jsonb,
  now() - interval '1 day'
),
(
  'backline-rental', 'Ravi Deshmukh', 'Full Backline Rental — Drums, Amps, DI', 'gear_rental', 'equipment', 'backline', NULL,
  650000, 'day', '+ ₹20,000 deposit',
  'https://images.unsplash.com/photo-1571327073757-71d13c24de30?auto=format&fit=crop&w=800&q=80',
  NULL, NULL,
  3200000, 9800000, 2000000,
  true, true, 180000, 'Dadar, Mumbai',
  'Pearl Export kit with Zildjian cymbals, two Fender guitar amps, Ampeg bass rig and DI boxes. Delivery and pickup within Mumbai available at extra cost.',
  $j$[{"label":"Daily","value":"₹6,500"},{"label":"Weekly","value":"₹32,000"},{"label":"Monthly","value":"₹98,000"},{"label":"Deposit","value":"₹20,000 refundable"},{"label":"Delivery","value":"Self pickup or ₹1,800 delivery"}]$j$::jsonb,
  now() - interval '3 days'
),
(
  'focusrite-18i20', 'Ravi Deshmukh', 'Focusrite Scarlett 18i20 3rd Gen', 'gear_sale', 'equipment', 'audio_interfaces', 'used',
  3200000, NULL, NULL,
  'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=800&q=80',
  'Focusrite', 'Scarlett 18i20 3rd Gen',
  NULL, NULL, NULL,
  true, false, NULL, 'Bandra, Mumbai',
  'Rack mounted since new, minor cosmetic marks on the rack ears. All preamps and ADAT ports tested and working. Includes power supply and USB cable.',
  $j$[{"label":"Brand","value":"Focusrite"},{"label":"Model","value":"Scarlett 18i20 3rd Gen"},{"label":"Inputs","value":"8 mic pre + ADAT"},{"label":"Condition","value":"Good"},{"label":"Included","value":"PSU, USB cable"}]$j$::jsonb,
  now() - interval '6 days'
)
ON CONFLICT (slug) DO NOTHING;

-- src/data/market.ts — the listing sold by "Yash Raj Sound", which is the live profile
-- yash.raj.sound.studios (it already sells the Neumann U87 Ai from that profile).
INSERT INTO public.marketplace_listings (
  slug, seller_profile_id, title, category, item_category_kind, item_category, condition,
  price_paise, image_url, brand, model, pickup_location, listing_description, specs, created_at
)
SELECT
  'neumann-tlm103', p.id, 'Neumann TLM 103 Condenser Microphone', 'gear_sale', 'equipment', 'microphones', 'like_new',
  7850000,
  'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80',
  'Neumann', 'TLM 103', 'Andheri, Mumbai',
  'Studio owned, used on vocal sessions only. Includes EA 1 shockmount, original box and dust cover. Ideal for home vocal recording chains.',
  $j$[{"label":"Brand","value":"Neumann"},{"label":"Model","value":"TLM 103"},{"label":"Pattern","value":"Cardioid"},{"label":"Connectivity","value":"XLR, 48V phantom"},{"label":"Condition","value":"Like New"}]$j$::jsonb,
  now() - interval '5 hours'
FROM public.profiles p
WHERE p.username = 'yash.raj.sound.studios'
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------------------------
-- src/data/market.ts — the "space" listings. The marketplace has no space category in the
-- database; a bookable room is a studio. "Yash Raj Sound — Studio A" is already live as the
-- studio yash-raj-sound-studios (Tracking Room 1, 12 musicians) and is not repeated.
-- ---------------------------------------------------------------------------------------------

INSERT INTO public.studios (
  slug, owner_profile_id, name, description, location, hourly_rate_paise,
  amenities, operating_hours, image_url, images
)
SELECT
  'jam-room-bandra', p.id, 'Bandra Jam Room — Hourly Rehearsal',
  'Drum kit, two amps, PA with four mics and a fully treated room. Ideal for band rehearsals and pre-production before studio dates.',
  'Bandra East, Mumbai', 80000,
  ARRAY['rehearsal_room', 'drums_included', 'parking_space'],
  '9 am – 11 pm',
  'https://images.unsplash.com/photo-1524230572899-a752b3835840?auto=format&fit=crop&w=800&q=80',
  ARRAY[
    'https://images.unsplash.com/photo-1524230572899-a752b3835840?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80'
  ]
FROM public.profiles p
WHERE p.username = 'yash.raj.sound.studios'
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------------------------
-- src/data/booking.ts — bookables. Only Octave Sound Labs has a live profile (octave.sound.labs);
-- the studio rate is its lowest hourly room rate, as the studio cards showed it.
-- ---------------------------------------------------------------------------------------------

INSERT INTO public.studios (
  slug, owner_profile_id, name, description, location, hourly_rate_paise,
  services, amenities, cancellation_policy, image_url, images
)
SELECT
  'octave-sound-labs', p.id, 'Octave Sound Labs',
  'A tracking room built for live bands and vocalists, with an SSL-fed control room and an engineer on every session.',
  'Andheri West, Mumbai', 120000,
  ARRAY['recording', 'mixing'],
  ARRAY['live_room', 'vocal_booth', 'resident_engineers', 'parking_space'],
  'Free cancellation up to 48 hours before the session.',
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&h=800&q=70',
  ARRAY[
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&h=600&q=70',
    'https://images.unsplash.com/photo-1519508234439-4f23643125c1?auto=format&fit=crop&w=800&h=600&q=70',
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&h=600&q=70'
  ]
FROM public.profiles p
WHERE p.username = 'octave.sound.labs'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.studio_rooms (studio_id, name, capacity, hourly_rate_paise, amenities, gear, photo_url, sort_order)
SELECT s.id, r.name, r.capacity, r.rate, r.amenities, r.gear, r.photo, r.sort_order
FROM public.studios s
CROSS JOIN (VALUES
  ('Live Room A', 8, 240000, ARRAY['live_room'],
   ARRAY['Neumann U87', 'SSL Origin desk', 'DW Collector''s kit', 'Fender Twin'],
   'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&h=600&q=70', 0),
  ('Vocal Booth', 2, 120000, ARRAY['vocal_booth'],
   ARRAY['Neumann TLM 103', 'Avalon VT-737', 'Apollo x8'],
   'https://images.unsplash.com/photo-1519508234439-4f23643125c1?auto=format&fit=crop&w=800&h=600&q=70', 1),
  ('Mix Room B', 3, 180000, ARRAY[]::text[],
   ARRAY['Focal Trio11', 'Apollo x16', 'Analogue summing'],
   'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&h=600&q=70', 2)
) AS r(name, capacity, rate, amenities, gear, photo, sort_order)
WHERE s.slug = 'octave-sound-labs'
  AND NOT EXISTS (
    SELECT 1 FROM public.studio_rooms x WHERE x.studio_id = s.id AND x.name = r.name
  );

-- ---------------------------------------------------------------------------------------------
-- src/data/opportunities.ts — opportunities. Every poster is a live profile (by username).
-- role_required uses the person-category label the read code matches on; genres are taxonomy
-- slugs (genres with no slug are left out); the upper end of a pay range goes in budget_note.
-- ---------------------------------------------------------------------------------------------

INSERT INTO public.opportunities (
  slug, creator_profile_id, title, role_required, genres, budget_paise, budget_unit, budget_note,
  collaboration_type, location, status, created_at
)
SELECT o.slug, p.id, o.title, o.role_required, o.genres, o.budget_paise, o.budget_unit,
       o.budget_note, o.collaboration_type, o.location, 'open', now() - o.age
FROM (VALUES
  ('female-playback-singer-indie-pop-single', 'sunsetrecords',
   'Female playback singer for indie-pop single', 'Singer', ARRAY['indie_pop'],
   2500000::bigint, 'song', 'up to ₹40,000', 'session_payment', 'Mumbai', interval '2 days'),
  ('mixing-engineer-6-track-alt-rock-ep', 'kabirmenon',
   'Mixing engineer — 6-track alt-rock EP', 'Mixing engineer', ARRAY['rock'],
   800000::bigint, 'track', 'up to ₹12,000', 'session_payment', 'Bengaluru', interval '5 hours'),
  ('session-drummer-2-night-club-run', 'thequarter',
   'Session drummer for 2-night club run', 'Session musician', ARRAY[]::text[],
   1500000::bigint, 'night', NULL, 'session_payment', 'Mumbai', interval '1 day'),
  ('recording-studio-3-days-live-tracking', 'meeraraghav',
   'Recording studio needed — 3 days, live tracking', 'Studio', ARRAY['jazz', 'fusion'],
   1800000::bigint, 'day', 'up to ₹30,000', NULL, 'Pune', interval '3 days'),
  ('lyricist-hindi-brand-film-sneaker-launch', 'northlightfilms',
   'Lyricist — Hindi, brand film for a sneaker launch', 'Lyricist', ARRAY['hiphop'],
   6000000::bigint, NULL, 'flat', 'work_for_hire', 'Delhi', interval '6 days')
) AS o(slug, username, title, role_required, genres, budget_paise, budget_unit, budget_note,
       collaboration_type, location, age)
JOIN public.profiles p ON p.username = o.username
ON CONFLICT (slug) DO NOTHING;

COMMIT;
