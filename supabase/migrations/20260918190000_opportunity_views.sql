-- Real view tracking for opportunities.$id.analytics.tsx, replacing the fabricated stats block
-- that used to show for every opportunity. A view is counted by the server, not reported as a
-- number by the client: the client can only call record_opportunity_view(id), which inserts at
-- most one row per viewer, opportunity and 30 minutes, never for the poster's own opportunity,
-- and only for a signed-in viewer (an anonymous call cannot be told apart from a repeat).
-- Mirrors portfolio_item_plays / record_portfolio_play (20260917100200, 20260917100300).
-- Snapshot: supabase/dumps/2026-09-18-before-opportunity-views.sql

BEGIN;

CREATE TABLE IF NOT EXISTS public.opportunity_views (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities (id) ON DELETE CASCADE,
  viewer_id      uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  viewed_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS opportunity_views_opp_time
  ON public.opportunity_views (opportunity_id, viewed_at DESC);

ALTER TABLE public.opportunity_views ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.opportunity_views FROM anon, authenticated;
GRANT ALL ON public.opportunity_views TO service_role;

-- Records one view. Silently a no-op for a bad id, the poster's own opportunity, a signed-out
-- caller, or a repeat within 30 minutes — never an error, since a view is a courtesy count, not
-- something the client should be able to fail loudly over.
CREATE OR REPLACE FUNCTION public.record_opportunity_view(opp uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.opportunities WHERE id = opp AND creator_profile_id <> auth.uid()
  ) THEN
    RETURN;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.opportunity_views
    WHERE opportunity_id = opp AND viewer_id = auth.uid() AND viewed_at > now() - interval '30 minutes'
  ) THEN
    RETURN;
  END IF;
  INSERT INTO public.opportunity_views (opportunity_id, viewer_id) VALUES (opp, auth.uid());
END
$fn$;

REVOKE ALL ON FUNCTION public.record_opportunity_view(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.record_opportunity_view(uuid) TO authenticated;

-- Daily view counts for the last 7 days, readable only by the opportunity's own poster — empty
-- for anyone else, rather than an error, so a caller cannot probe whether an id exists.
CREATE OR REPLACE FUNCTION public.opportunity_view_stats(opp uuid)
RETURNS TABLE (day date, views bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT v.viewed_at::date AS day, count(*) AS views
  FROM public.opportunity_views v
  WHERE v.opportunity_id = opp
    AND v.viewed_at > now() - interval '7 days'
    AND EXISTS (
      SELECT 1 FROM public.opportunities o WHERE o.id = opp AND o.creator_profile_id = auth.uid()
    )
  GROUP BY day
  ORDER BY day;
$fn$;

REVOKE ALL ON FUNCTION public.opportunity_view_stats(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.opportunity_view_stats(uuid) TO authenticated;

COMMIT;
