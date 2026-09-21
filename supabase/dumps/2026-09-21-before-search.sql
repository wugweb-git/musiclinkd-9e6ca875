-- MusicLinkd live database snapshot (Lovable Cloud, Supabase project ace967d9-a62e-48bb-b076-c3b63b11b185)
-- Taken 2026-09-21 via Lovable query_database, before migration 20260921170000_search.sql.
--
-- Scope: row counts and what the migration touches. It replaces the scope check on search_events
-- and on saved_searches (adding 'global') and adds a new table search_feedback, which did not exist
-- at snapshot time (to_regclass('public.search_feedback') null). It writes no existing rows.
--
-- Row counts: search_events 0, saved_searches 0.
--
-- Definitions at snapshot time:
ALTER TABLE public.search_events DROP CONSTRAINT IF EXISTS search_events_scope_check;
ALTER TABLE public.search_events ADD CONSTRAINT search_events_scope_check
  CHECK ((scope = ANY (ARRAY['market'::text, 'rent'::text, 'discover'::text])));
ALTER TABLE public.saved_searches DROP CONSTRAINT IF EXISTS saved_searches_scope_check;
ALTER TABLE public.saved_searches ADD CONSTRAINT saved_searches_scope_check
  CHECK ((scope = ANY (ARRAY['market'::text, 'rent'::text])));
--
-- Grants at snapshot time: search_events INSERT (scope, query, city) to anon and authenticated;
-- saved_searches all table privileges to authenticated. Policies: search_events "Anyone records a
-- search" (INSERT, profile_id IS NOT DISTINCT FROM auth.uid()); saved_searches "Read your own",
-- "Save your own", "Remove your own".
--
-- To undo: see the Rollback note at the top of the migration.
