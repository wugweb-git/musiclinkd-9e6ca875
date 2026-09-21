-- MusicLinkd live database snapshot (Lovable Cloud, Supabase project ace967d9-a62e-48bb-b076-c3b63b11b185)
-- Taken 2026-09-21 via Lovable query_database, before the business-types cleanup.
--
-- What changes:
--   1. taxonomy_options (person_types): `a_and_r` is deleted (no profile uses it; A&R and artist
--      management are one business type). `artist_manager` stays a business type, relabelled
--      "Artist Management".
--   2. profiles.roles on 17 business profiles: the talent-type tags sound_engineer, composer,
--      beatmaker and sound_designer are removed. Every one of them keeps at least one business type.
--   3. 3 production house business profiles are added (auth.users + profiles + profile_business),
--      same passwordless pattern as 20260913090949_seed_linked_profiles.sql. `production_house` had no rows.
--
-- Before state — taxonomy_options (person_types):
--   a_and_r          label "A&R"             sort 38  is_published true  metadata {"flow":"business","group":"business"}
--   artist_manager   label "Artist Manager"  sort 32  is_published true  metadata {"flow":"business","group":"business"}
--
-- Before state — business profiles that carry a talent-type tag (roles column):
--   Analog Ensemble Studios      {studio,sound_engineer}
--   Beatcraft Studios            {studio,beatmaker}
--   BeatRoute Spaces             {studio,sound_engineer}
--   Blue Room Mixing Suite       {studio,sound_engineer}
--   Crimson Owls Academy         {music_school,artist_manager,sound_engineer}
--   Echo Parade Academy          {music_school,artist_manager,sound_engineer}
--   Monsoon Machine Records      {music_label,sound_engineer}
--   Neon Ensemble Agency         {booking_agency,artist_manager,sound_engineer}
--   Paper Parade Studios         {studio,sound_engineer}
--   Resonance Acoustic Suites    {studio,sound_engineer}
--   Silver Riot Agency           {booking_agency,artist_manager,sound_engineer}
--   Swar Academy of Music        {music_school,music_publisher,composer}
--   The Hive Recording Studio    {studio,sound_engineer}
--   Velvet Static Records        {music_label,sound_engineer}
--   Velvet Vocal & Foley Studio  {studio,sound_designer}
--   Wugweb                       {studio,sound_engineer}
--   Yash Raj Sound Studios       {studio,sound_engineer}
--
-- To undo:

INSERT INTO taxonomy_options (category_key, slug, label, sort_order, is_published, metadata)
VALUES ('person_types', 'a_and_r', 'A&R', 38, true, '{"flow":"business","group":"business"}'::jsonb)
ON CONFLICT (category_key, slug) DO NOTHING;
UPDATE taxonomy_options SET label = 'Artist Manager' WHERE category_key = 'person_types' AND slug = 'artist_manager';

UPDATE profiles SET roles = '{studio,sound_engineer}' WHERE id = '6f07d5e5-a7eb-5574-86c0-d5cc286b9ee7'; -- Analog Ensemble Studios
UPDATE profiles SET roles = '{studio,beatmaker}' WHERE id = '0550d73a-8f3a-524e-ad14-f881f9bf4ae8'; -- Beatcraft Studios
UPDATE profiles SET roles = '{studio,sound_engineer}' WHERE id = '1783effb-4fcb-59dc-a6e4-76131013c3d4'; -- BeatRoute Spaces
UPDATE profiles SET roles = '{studio,sound_engineer}' WHERE id = '0741528c-cab0-5ffb-b075-9864e8fd5563'; -- Blue Room Mixing Suite
UPDATE profiles SET roles = '{music_school,artist_manager,sound_engineer}' WHERE id = '7014fbb1-62d5-51be-9324-e7c973587e5e'; -- Crimson Owls Academy
UPDATE profiles SET roles = '{music_school,artist_manager,sound_engineer}' WHERE id = 'e85a682f-a07d-56f3-b450-4a499fad3e87'; -- Echo Parade Academy
UPDATE profiles SET roles = '{music_label,sound_engineer}' WHERE id = '5bd36c67-5084-59bc-ad57-955440ca7c7f'; -- Monsoon Machine Records
UPDATE profiles SET roles = '{booking_agency,artist_manager,sound_engineer}' WHERE id = '6bae7f56-c706-5ef2-baf1-87a7974ae9a7'; -- Neon Ensemble Agency
UPDATE profiles SET roles = '{studio,sound_engineer}' WHERE id = '56eec715-3dc5-5e9c-a65f-1a7ccfccb12b'; -- Paper Parade Studios
UPDATE profiles SET roles = '{studio,sound_engineer}' WHERE id = '4700185d-0e7e-5187-9714-613f2acd9183'; -- Resonance Acoustic Suites
UPDATE profiles SET roles = '{booking_agency,artist_manager,sound_engineer}' WHERE id = '570be91d-3770-5147-b4f4-9f78f8115f7f'; -- Silver Riot Agency
UPDATE profiles SET roles = '{music_school,music_publisher,composer}' WHERE id = '5c4b5ba8-e138-5916-baf9-9e5bbcae00d4'; -- Swar Academy of Music
UPDATE profiles SET roles = '{studio,sound_engineer}' WHERE id = '2d8a7828-9121-595c-b3e0-ec87f4e7e77a'; -- The Hive Recording Studio
UPDATE profiles SET roles = '{music_label,sound_engineer}' WHERE id = '9a7c2a1d-19d1-5a82-8852-3fdb6d6477cb'; -- Velvet Static Records
UPDATE profiles SET roles = '{studio,sound_designer}' WHERE id = '2fac8ef7-d83c-5378-8a74-96263bc168c7'; -- Velvet Vocal & Foley Studio
UPDATE profiles SET roles = '{studio,sound_engineer}' WHERE id = '2baecd1b-d9b3-5f47-9578-5c724efb3c28'; -- Wugweb
UPDATE profiles SET roles = '{studio,sound_engineer}' WHERE id = '86a5d555-61eb-5619-b452-3a9387baa66f'; -- Yash Raj Sound Studios

-- Production house profiles added on 2026-09-21 (profiles and profile_business cascade from auth.users):
--   DELETE FROM auth.users WHERE id IN (
--     '370806f8-ddae-4a37-879b-29e9766c2df0',  -- Marigold Reel Productions (Mumbai)
--     '8916c93c-3864-427f-88a9-1ffeb48a866c',  -- Nine Lamps Media (Bengaluru)
--     'c65cbf9d-62fe-4890-9710-d8361aa5c183'); -- Tarang Audio Visual (Chennai)
--
-- Applied 2026-09-21. After: a_and_r gone, artist_manager labelled "Artist Management", 17 business
-- rows cleaned of talent tags, 3 production houses added (business profiles 33 -> 36).
