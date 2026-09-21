-- Recently viewed, synced across devices (owner, 21 Sep 2026). The profiles, studios and Market
-- listings an account opened, one row per thing, moved to the top when opened again. Each device
-- still keeps its own copy (src/lib/device-history.ts) and merges with this one when signed in;
-- signed out, the device copy is all there is.
-- Snapshot: supabase/dumps/2026-09-21-before-recently-viewed.sql
--
-- Rollback:
--   DROP TABLE public.recently_viewed;

BEGIN;

CREATE TABLE IF NOT EXISTS public.recently_viewed (
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('person', 'studio', 'listing')),
  /** The username, slug or listing id the link needs. */
  handle     text NOT NULL CHECK (length(handle) BETWEEN 1 AND 200),
  name       text CHECK (length(name) <= 200),
  detail     text CHECK (length(detail) <= 200),
  avatar_url text CHECK (length(avatar_url) <= 1000),
  viewed_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, kind, handle)
);
CREATE INDEX IF NOT EXISTS recently_viewed_recent_idx
  ON public.recently_viewed (profile_id, viewed_at DESC);

ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner keeps their own views" ON public.recently_viewed;
CREATE POLICY "Owner keeps their own views" ON public.recently_viewed
  FOR ALL TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

COMMIT;
