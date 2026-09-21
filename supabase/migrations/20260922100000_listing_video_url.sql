-- Owner, 22 Sep 2026: selling and renting out both take an optional short-video link.
-- Snapshot: supabase/dumps/2026-09-22-before-listing-video.sql
--
-- Rollback: ALTER TABLE public.marketplace_listings DROP COLUMN IF EXISTS video_url;

ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS video_url text;
