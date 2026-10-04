-- Queue item 5d (owner, 4 Oct 2026): a private calendar subscription — one link per person that a
-- calendar app (Google, Apple, Outlook) polls for their confirmed bookings and rentals. No file is
-- ever downloaded; MusicLinkd stays the source of truth.
--
-- The link's token is random and stored only as its SHA-256 hash, on the owner-only
-- profile_private row (no new table). The feed endpoint looks the hash up with the service role.
-- Resetting the link replaces the hash, so the old link stops working.
--
-- Snapshot: supabase/dumps/2026-10-04-before-calendar-feed.sql

BEGIN;

ALTER TABLE public.profile_private ADD COLUMN calendar_feed_token_hash text;
CREATE UNIQUE INDEX profile_private_calendar_feed_idx
  ON public.profile_private (calendar_feed_token_hash)
  WHERE calendar_feed_token_hash IS NOT NULL;

COMMIT;

NOTIFY pgrst, 'reload schema';
