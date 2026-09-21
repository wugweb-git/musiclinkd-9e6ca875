-- Partials complete: the last pretend control on the business Manage hub, Delete business, made
-- real. One account is one business, so deleting it removes the account's business profile
-- (profile_business) and team rows, and archives its studio.
--
-- 1. studios.archived_at: set when the owner deletes their business. An archived studio leaves
--    every public list and page (the app reads only archived_at IS NULL), but the row stays, so
--    the customers' past bookings and reviews of it (both ON DELETE CASCADE from studios) are kept
--    with the people involved, as the Manage screen promises.
--
-- The app fails soft before this is applied: Delete business says it isn't available yet and
-- changes nothing, and studio lists read as they do today.
-- Snapshot: supabase/dumps/2026-09-21-before-partials-complete.sql
--
-- Rollback:
--   DROP INDEX IF EXISTS public.studios_live_rating_idx;
--   ALTER TABLE public.studios DROP COLUMN IF EXISTS archived_at;

BEGIN;

ALTER TABLE public.studios ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS studios_live_rating_idx
  ON public.studios (rating DESC NULLS LAST)
  WHERE archived_at IS NULL;

COMMIT;
