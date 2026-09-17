-- Lets a poster save an opportunity before publishing it. Purely additive: widens the status
-- check to include 'draft', alongside the existing open/closed/filled. Nothing reads status = 'draft'
-- as open (listOpportunities filters status = 'open'), so a draft never appears in Discover or
-- Search until the poster actually publishes it.
-- Snapshot: supabase/dumps/2026-09-18-before-opportunity-drafts.sql

BEGIN;

ALTER TABLE public.opportunities DROP CONSTRAINT IF EXISTS opportunities_status_check;
ALTER TABLE public.opportunities
  ADD CONSTRAINT opportunities_status_check CHECK (status IN ('draft', 'open', 'closed', 'filled'));

COMMIT;
