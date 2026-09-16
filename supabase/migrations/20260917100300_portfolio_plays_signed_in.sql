-- Plays count only from signed-in viewers: an anonymous call cannot be told apart from a repeat
-- or from the owner, so it could inflate Trending. Applied live 2026-09-17.

CREATE OR REPLACE FUNCTION public.record_portfolio_play(item uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM portfolio_items WHERE id = item AND published AND user_id <> auth.uid()) THEN
    RETURN;
  END IF;
  IF EXISTS (
    SELECT 1 FROM portfolio_item_plays
    WHERE item_id = item AND viewer_id = auth.uid() AND played_at > now() - interval '30 minutes'
  ) THEN
    RETURN;
  END IF;
  INSERT INTO portfolio_item_plays (item_id, viewer_id) VALUES (item, auth.uid());
END
$fn$;

REVOKE ALL ON FUNCTION public.record_portfolio_play(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.record_portfolio_play(uuid) TO authenticated;
