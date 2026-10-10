-- Plays per work for the signed-in artist's own works (owner report, 10 Oct 2026: the analytics
-- screen failed every time). `authenticated` has no grant on portfolio_item_plays, and the server
-- read through the service key, which is not reliably present on the live server. This function
-- counts only rows for works the caller owns, so it is safe to run as definer.
-- New function only; nothing to snapshot.
CREATE OR REPLACE FUNCTION public.my_portfolio_play_counts(p_days int DEFAULT NULL)
RETURNS TABLE (item_id uuid, plays bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, count(p.item_id)::bigint
  FROM public.portfolio_items i
  LEFT JOIN public.portfolio_item_plays p
    ON p.item_id = i.id
   AND (p_days IS NULL OR p.played_at >= now() - make_interval(days => p_days))
  WHERE i.user_id = auth.uid()
  GROUP BY i.id;
$$;
REVOKE ALL ON FUNCTION public.my_portfolio_play_counts(int) FROM public;
GRANT EXECUTE ON FUNCTION public.my_portfolio_play_counts(int) TO authenticated;
