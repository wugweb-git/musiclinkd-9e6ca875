-- MusicLinkd live database snapshot (Lovable Cloud, Supabase project ace967d9-a62e-48bb-b076-c3b63b11b185)
-- Taken 2026-09-22 via Lovable query_database, before adding a band's technical rider, stage plot
-- and live performance videos.
-- Migration: supabase/migrations/20260922290000_band_rider_stage_plot_live_videos.sql
--
-- What changes: public.collabs gets three new columns (rider, stage_plot_url, stage_plot_note),
-- empty on every row; a new table public.collab_live_videos starts empty. No existing value is
-- changed. Before state: the 3 bands (collabs.type = 'band') and their members, events and
-- releases, as below, as JSON rows.
--
-- To undo the migration:
--   DROP TABLE IF EXISTS public.collab_live_videos;
--   DROP TRIGGER IF EXISTS collabs_guard_manager_fields ON public.collabs;
--   DROP FUNCTION IF EXISTS public.collabs_guard_manager_fields();
--   ALTER TABLE public.collabs DROP COLUMN IF EXISTS rider,
--     DROP COLUMN IF EXISTS stage_plot_url, DROP COLUMN IF EXISTS stage_plot_note;
--
-- To restore a band row's values from here (example, collabs):
--   UPDATE public.collabs c SET name = s.name, tagline = s.tagline, bio = s.bio
--   FROM json_populate_recordset(NULL::public.collabs, <collabs json below>) s WHERE c.id = s.id;

-- collabs (type = 'band'), 3 rows
SELECT $json$[
{"id":"71573c4d-f836-5cfe-9ba1-02b246a57353","slug":"static-bloom","name":"Static Bloom","tagline":"Electronic trio building live-modular sets.","bio":"Modular rigs, no laptops on stage. Currently writing a first full-length.","genres":["Electronic","Ambient"],"city":"Bengaluru","formed_year":2022,"avatar_url":"https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=400&q=80","cover_url":"https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80","looking_for":["Visual artist","Booking agent"],"availability":"available","rate_paise":4000000,"rate_unit":"show","is_verified":false,"created_by":null,"created_at":"2026-09-16T03:17:31.634944+00:00","updated_at":"2026-09-16T03:17:31.634944+00:00","type":"band","visibility":"public","status":"active","ends_on":null,"project_type":null,"starts_on":null,"work_mode":null},
{"id":"035dfe6b-04c5-5fcc-b41f-27e32a435685","slug":"the-bangalore-blues-project","name":"The Bangalore Blues Project","tagline":null,"bio":"5-piece blues & jazz ensemble, playing Bengaluru's live circuit for a decade.","genres":["jazz","rock"],"city":"Bengaluru","formed_year":null,"avatar_url":"https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400","cover_url":null,"looking_for":[],"availability":null,"rate_paise":null,"rate_unit":null,"is_verified":false,"created_by":null,"created_at":"2026-09-16T03:17:31.634944+00:00","updated_at":"2026-09-16T03:17:31.634944+00:00","type":"band","visibility":"public","status":"active","ends_on":null,"project_type":null,"starts_on":null,"work_mode":null},
{"id":"1a18f576-c433-50ae-9be7-e1d22cad05bc","slug":"the-kite-notes","name":"The Kite Notes","tagline":"Indie-folk quartet from Bandra with a brass habit.","bio":"Four players, one room, everything tracked live. We tour the west-coast circuit and record between runs at Octave Sound Labs.","genres":["Indie Folk","Alt Pop"],"city":"Mumbai","formed_year":2019,"avatar_url":"https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80","cover_url":"https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=80","looking_for":["Touring drummer","Live sound engineer"],"availability":"selective","rate_paise":8500000,"rate_unit":"show","is_verified":true,"created_by":null,"created_at":"2026-09-16T03:17:31.634944+00:00","updated_at":"2026-09-16T03:17:31.634944+00:00","type":"band","visibility":"public","status":"active","ends_on":null,"project_type":null,"starts_on":null,"work_mode":null}
]$json$ AS collabs;

-- collab_members of those bands, 11 rows
SELECT $json$[
{"collab_id":"035dfe6b-04c5-5fcc-b41f-27e32a435685","profile_id":"388fbd0a-9c57-5f5d-84e7-45a43890c4a8","role":"owner","instrument":"Lead Vocalist & Slide Guitar","since_year":null,"sort_order":0,"created_at":"2026-09-16T03:18:30.099331+00:00","status":"active","invited_by":null},
{"collab_id":"035dfe6b-04c5-5fcc-b41f-27e32a435685","profile_id":"9078142e-bb3a-59c1-b330-2c9bb54af016","role":"member","instrument":"Keyboards & Hammond B3","since_year":null,"sort_order":1,"created_at":"2026-09-16T03:18:30.099331+00:00","status":"active","invited_by":null},
{"collab_id":"035dfe6b-04c5-5fcc-b41f-27e32a435685","profile_id":"41bb93a2-c008-5cd9-8527-df24dd257435","role":"member","instrument":"Alto Saxophone","since_year":null,"sort_order":2,"created_at":"2026-09-16T03:18:30.099331+00:00","status":"active","invited_by":null},
{"collab_id":"035dfe6b-04c5-5fcc-b41f-27e32a435685","profile_id":"472ea245-75bc-42ee-8fbb-db6d571ee5d0","role":"member","instrument":"Double Bass","since_year":null,"sort_order":3,"created_at":"2026-09-16T03:18:30.099331+00:00","status":"active","invited_by":null},
{"collab_id":"035dfe6b-04c5-5fcc-b41f-27e32a435685","profile_id":"d7b2a092-5bed-5b7b-8789-77faad938c7c","role":"member","instrument":"Drums & Percussion","since_year":null,"sort_order":4,"created_at":"2026-09-16T03:18:30.099331+00:00","status":"active","invited_by":null},
{"collab_id":"1a18f576-c433-50ae-9be7-e1d22cad05bc","profile_id":"576fc434-bf67-50a6-8f58-6f31c6f73dfe","role":"owner","instrument":"Producer, guitar","since_year":2019,"sort_order":0,"created_at":"2026-09-16T04:10:53.739032+00:00","status":"active","invited_by":null},
{"collab_id":"1a18f576-c433-50ae-9be7-e1d22cad05bc","profile_id":"ba5786ec-11fd-5ee9-b013-176f102e6fa9","role":"admin","instrument":"Lead vocals","since_year":2019,"sort_order":1,"created_at":"2026-09-16T04:10:53.739032+00:00","status":"active","invited_by":null},
{"collab_id":"1a18f576-c433-50ae-9be7-e1d22cad05bc","profile_id":"6bff4ad2-63de-5f0d-80f9-1e27c222bcfc","role":"member","instrument":"Bass","since_year":2021,"sort_order":2,"created_at":"2026-09-16T04:10:53.739032+00:00","status":"active","invited_by":null},
{"collab_id":"1a18f576-c433-50ae-9be7-e1d22cad05bc","profile_id":"86d5ed33-51cf-58a1-8173-27df428e378b","role":"member","instrument":"Drums","since_year":2022,"sort_order":3,"created_at":"2026-09-16T04:10:53.739032+00:00","status":"active","invited_by":null},
{"collab_id":"71573c4d-f836-5cfe-9ba1-02b246a57353","profile_id":"76d1e631-1a32-59ab-8cf5-96ce884da4e4","role":"owner","instrument":"Synths","since_year":2022,"sort_order":0,"created_at":"2026-09-16T04:10:53.739032+00:00","status":"active","invited_by":null},
{"collab_id":"71573c4d-f836-5cfe-9ba1-02b246a57353","profile_id":"ad14622c-32a2-5745-ab7a-ac0a07a26d24","role":"member","instrument":"Live drums","since_year":2023,"sort_order":1,"created_at":"2026-09-16T04:10:53.739032+00:00","status":"active","invited_by":null}
]$json$ AS collab_members;

-- collab_events of those bands, 7 rows
SELECT $json$[
{"id":"25321640-045e-5909-ad98-f46d8416ed34","collab_id":"035dfe6b-04c5-5fcc-b41f-27e32a435685","title":"Indie Rock Fiesta","venue":"Phoenix MarketCity, Mumbai","city":null,"event_date":"2026-06-28","event_time":null,"date_precision":"day","status":null,"ticket_note":null,"sort_order":0,"created_at":"2026-09-16T03:18:30.099331+00:00"},
{"id":"cf61e70a-57b1-51ea-8ee0-8f2a5dbfe8c3","collab_id":"035dfe6b-04c5-5fcc-b41f-27e32a435685","title":"Swar Fest Showcase","venue":"Swabhumi, Kolkata","city":null,"event_date":"2026-07-12","event_time":null,"date_precision":"day","status":null,"ticket_note":null,"sort_order":1,"created_at":"2026-09-16T03:18:30.099331+00:00"},
{"id":"242a2073-a3ea-58b4-b2e5-f90638a70f2c","collab_id":"035dfe6b-04c5-5fcc-b41f-27e32a435685","title":"The BlueBreeze Stage","venue":"Koramangala, Bengaluru","city":null,"event_date":"2026-08-05","event_time":null,"date_precision":"day","status":null,"ticket_note":null,"sort_order":2,"created_at":"2026-09-16T03:18:30.099331+00:00"},
{"id":"a9e71aa6-acfc-560c-8bd8-6538048ec94f","collab_id":"1a18f576-c433-50ae-9be7-e1d22cad05bc","title":"Monsoon Sessions","venue":"antiSOCIAL","city":"Mumbai","event_date":"2026-09-19","event_time":"21:00:00","date_precision":"day","status":"confirmed","ticket_note":"Tickets live","sort_order":0,"created_at":"2026-09-16T03:18:30.099331+00:00"},
{"id":"079e52ca-03d5-5536-a249-c79bf7ccd550","collab_id":"1a18f576-c433-50ae-9be7-e1d22cad05bc","title":"Bengaluru run","venue":"Fandom","city":"Bengaluru","event_date":"2026-10-02","event_time":"20:30:00","date_precision":"day","status":"hold","ticket_note":null,"sort_order":1,"created_at":"2026-09-16T03:18:30.099331+00:00"},
{"id":"bedb48d2-26e2-5c72-8c03-3286e093f748","collab_id":"1a18f576-c433-50ae-9be7-e1d22cad05bc","title":"Kala Ghoda Festival","venue":"Amphitheatre","city":"Mumbai","event_date":"2026-02-01","event_time":null,"date_precision":"month","status":null,"ticket_note":null,"sort_order":2,"created_at":"2026-09-16T03:18:30.099331+00:00"},
{"id":"168e1881-63a3-58f1-b441-24ab463c5243","collab_id":"71573c4d-f836-5cfe-9ba1-02b246a57353","title":"Basement Series","venue":"Bflat","city":"Bengaluru","event_date":"2026-09-24","event_time":"20:00:00","date_precision":"day","status":"confirmed","ticket_note":null,"sort_order":0,"created_at":"2026-09-16T03:18:30.099331+00:00"}
]$json$ AS collab_events;

-- collab_releases of those bands, 3 rows
SELECT $json$[
{"id":"5cff6f78-d042-579e-ac50-da394c2e7707","collab_id":"1a18f576-c433-50ae-9be7-e1d22cad05bc","title":"Paper Kites","kind":"ep","release_year":2025,"cover_url":"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=500&q=80","sort_order":0,"created_at":"2026-09-16T03:18:30.099331+00:00"},
{"id":"d6196139-7841-58f3-bd5d-fc81af9463d3","collab_id":"1a18f576-c433-50ae-9be7-e1d22cad05bc","title":"Bandra East, Live","kind":"live","release_year":2024,"cover_url":"https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=500&q=80","sort_order":1,"created_at":"2026-09-16T03:18:30.099331+00:00"},
{"id":"b75bc3d8-39e2-506f-aabe-755b48e78e0a","collab_id":"71573c4d-f836-5cfe-9ba1-02b246a57353","title":"Signal Garden","kind":"single","release_year":2025,"cover_url":"https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&w=500&q=80","sort_order":0,"created_at":"2026-09-16T03:18:30.099331+00:00"}
]$json$ AS collab_releases;
