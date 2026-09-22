-- MusicLinkd live database snapshot (Lovable Cloud, Supabase project ace967d9-a62e-48bb-b076-c3b63b11b185)
-- Taken 2026-09-22 via Lovable query_database, before adding a band's showcase (photo gallery).
-- Migration: supabase/migrations/20260922300000_band_showcase.sql
--
-- What changes: a new table public.collab_gallery, which starts empty, with its RLS policies and
-- grants. It did not exist before this snapshot (to_regclass('public.collab_gallery') was null).
-- No existing row, column, function or policy is changed; no photos are added for any band.
--
-- To undo the migration:
--   DROP TABLE IF EXISTS public.collab_gallery;

-- The bands (collabs.type = 'band') the showcase attaches to, 3 rows
SELECT $json$[
{"id":"71573c4d-f836-5cfe-9ba1-02b246a57353","slug":"static-bloom","name":"Static Bloom"},
{"id":"035dfe6b-04c5-5fcc-b41f-27e32a435685","slug":"the-bangalore-blues-project","name":"The Bangalore Blues Project"},
{"id":"1a18f576-c433-50ae-9be7-e1d22cad05bc","slug":"the-kite-notes","name":"The Kite Notes"}
]$json$ AS collabs;
