-- Owner, 22 Sep 2026: a service shows examples picked from the owner's own portfolio. The ids are
-- portfolio_items.id, in the order chosen; the app keeps only the owner's published items.
-- Snapshot and undo: supabase/dumps/2026-09-22-before-service-examples.sql

ALTER TABLE public.profile_services ADD COLUMN IF NOT EXISTS example_ids uuid[] NOT NULL DEFAULT '{}';
