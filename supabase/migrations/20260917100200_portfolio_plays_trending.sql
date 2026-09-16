-- Trending portfolio work on Discover (Issue 14). A play is counted by the server, not reported
-- as a number by the client: the client can only ask record_portfolio_play(item), which inserts at
-- most one row per viewer, item and 30 minutes, and only for a published item.
-- Trending = most plays in the last 7 days, published items on public profiles only.

CREATE TABLE IF NOT EXISTS public.portfolio_item_plays (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  item_id uuid NOT NULL REFERENCES public.portfolio_items (id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  played_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portfolio_item_plays_item_time
  ON public.portfolio_item_plays (item_id, played_at DESC);

ALTER TABLE public.portfolio_item_plays ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.portfolio_item_plays FROM anon, authenticated;
GRANT ALL ON public.portfolio_item_plays TO service_role;

CREATE OR REPLACE FUNCTION public.record_portfolio_play(item uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM portfolio_items WHERE id = item AND published) THEN
    RETURN;
  END IF;
  -- Owners playing their own work do not count.
  IF auth.uid() IS NOT NULL
     AND EXISTS (SELECT 1 FROM portfolio_items WHERE id = item AND user_id = auth.uid()) THEN
    RETURN;
  END IF;
  IF auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM portfolio_item_plays
    WHERE item_id = item AND viewer_id = auth.uid() AND played_at > now() - interval '30 minutes'
  ) THEN
    RETURN;
  END IF;
  INSERT INTO portfolio_item_plays (item_id, viewer_id) VALUES (item, auth.uid());
END
$fn$;

REVOKE ALL ON FUNCTION public.record_portfolio_play(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.record_portfolio_play(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.trending_portfolio_items(days integer DEFAULT 7, lim integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  title text,
  kind text,
  cover_url text,
  media_url text,
  plays bigint,
  display_name text,
  username text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT i.id, i.title, i.kind, i.cover_url, i.media_url, count(p.id) AS plays,
         pr.display_name, pr.username
  FROM portfolio_item_plays p
  JOIN portfolio_items i ON i.id = p.item_id AND i.published
  JOIN profiles pr ON pr.id = i.user_id AND coalesce(pr.visibility, 'public') = 'public'
  WHERE p.played_at > now() - make_interval(days => greatest(1, least(days, 90)))
  GROUP BY i.id, pr.id
  ORDER BY plays DESC, max(p.played_at) DESC
  LIMIT greatest(1, least(lim, 50));
$fn$;

REVOKE ALL ON FUNCTION public.trending_portfolio_items(integer, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.trending_portfolio_items(integer, integer) TO anon, authenticated;
