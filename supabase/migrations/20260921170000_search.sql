-- Search across everything (/search): people, businesses, studios, bands and collabs,
-- opportunities, Market listings and services from one box.
--
-- 1. search_events and saved_searches take a fourth scope, 'global', for searches run on /search.
--    Rows already there keep their scope; popular_searches() needs no change (it filters by scope).
-- 2. search_feedback: one row each time someone says a search result is not a good match
--    (/search/why/$id). Anyone may write one, signed in or not; the database fills in who. A
--    signed-in person reads back only their own rows, which /search uses to move those results
--    down in their later searches. Nobody reads anyone else's.
--
-- The app fails soft before this is applied: a 'global' search event or saved search is refused
-- by the old check (recording is silent, saving says it didn't save), and feedback that cannot be
-- stored says so instead of claiming it was noted.
-- Snapshot: supabase/dumps/2026-09-21-before-search.sql
--
-- Rollback:
--   DROP TABLE public.search_feedback;
--   DELETE FROM public.search_events WHERE scope = 'global';
--   ALTER TABLE public.search_events DROP CONSTRAINT search_events_scope_check,
--     ADD CONSTRAINT search_events_scope_check CHECK (scope IN ('market', 'rent', 'discover'));
--   DELETE FROM public.saved_searches WHERE scope = 'global';
--   ALTER TABLE public.saved_searches DROP CONSTRAINT saved_searches_scope_check,
--     ADD CONSTRAINT saved_searches_scope_check CHECK (scope IN ('market', 'rent'));

BEGIN;

ALTER TABLE public.search_events DROP CONSTRAINT IF EXISTS search_events_scope_check;
ALTER TABLE public.search_events ADD CONSTRAINT search_events_scope_check
  CHECK (scope IN ('market', 'rent', 'discover', 'global'));

ALTER TABLE public.saved_searches DROP CONSTRAINT IF EXISTS saved_searches_scope_check;
ALTER TABLE public.saved_searches ADD CONSTRAINT saved_searches_scope_check
  CHECK (scope IN ('market', 'rent', 'global'));

CREATE TABLE IF NOT EXISTS public.search_feedback (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   uuid DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  /** What kind of result it was; subject_id is that result's id (a uuid, or a slug). */
  subject_kind text NOT NULL CHECK (subject_kind IN
                 ('person', 'business', 'studio', 'band', 'collab', 'opportunity', 'listing', 'service')),
  subject_id   text NOT NULL CHECK (length(subject_id) BETWEEN 1 AND 120),
  /** The words the result came up for, when there were any. */
  query        text CHECK (length(query) <= 80),
  reason       text NOT NULL CHECK (reason IN
                 ('not_relevant', 'already_know', 'wrong_city', 'wrong_budget', 'show_less')),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS search_feedback_profile_idx
  ON public.search_feedback (profile_id, created_at DESC);

ALTER TABLE public.search_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone gives search feedback" ON public.search_feedback;
CREATE POLICY "Anyone gives search feedback" ON public.search_feedback
  FOR INSERT TO anon, authenticated
  WITH CHECK (profile_id IS NOT DISTINCT FROM auth.uid());

DROP POLICY IF EXISTS "Read your own search feedback" ON public.search_feedback;
CREATE POLICY "Read your own search feedback" ON public.search_feedback
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

REVOKE ALL ON public.search_feedback FROM anon, authenticated;
GRANT INSERT (subject_kind, subject_id, query, reason) ON public.search_feedback TO anon, authenticated;
GRANT SELECT ON public.search_feedback TO authenticated;

COMMIT;
