-- Before 20260922240000_collab_plan.sql (22 Sep 2026). The migration only adds: collabs.starts_on,
-- collabs.work_mode and the members-only table collab_private (budget). No existing row changes.
-- Undo:
BEGIN;
DROP TABLE IF EXISTS public.collab_private;
ALTER TABLE public.collabs DROP COLUMN IF EXISTS starts_on, DROP COLUMN IF EXISTS work_mode;
COMMIT;
-- Rows at the time, for the record: 5 collabs (3 bands: The Kite Notes, Static Bloom, The
-- Bangalore Blues Project; 2 projects by @test: jnb, ghvb) and 13 collab_members rows. None are
-- touched by the migration.
