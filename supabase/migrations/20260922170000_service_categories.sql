-- Owner, 22 Sep 2026: a service can sit in up to 3 categories, so clients find it under each.
-- `category` stays the first one, for everything that already reads it.
-- Snapshot and undo: supabase/dumps/2026-09-22-before-service-categories.sql

BEGIN;
ALTER TABLE public.profile_services ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT '{}';
UPDATE public.profile_services SET categories = ARRAY[category]
  WHERE category IS NOT NULL AND categories = '{}';
COMMIT;
