-- Likes on published portfolio work (owner, 5 Oct 2026; phone plan 5.4).
-- NOT APPLIED until the owner says yes. Until it is, the app hides the Like button.
--
-- Like is a public count; Save (saved_items) stays a private bookmark. Who liked what is never
-- readable by others: a user sees only their own rows, and counts come from a function.

CREATE TABLE IF NOT EXISTS public.portfolio_item_likes (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id    uuid NOT NULL REFERENCES public.portfolio_items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS portfolio_item_likes_item_idx ON public.portfolio_item_likes (item_id);

ALTER TABLE public.portfolio_item_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes: read own" ON public.portfolio_item_likes
  FOR SELECT USING (auth.uid() = user_id);

-- Only published work can be liked.
CREATE POLICY "likes: add own on published work" ON public.portfolio_item_likes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.portfolio_items p WHERE p.id = item_id AND p.published)
  );

CREATE POLICY "likes: remove own" ON public.portfolio_item_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Counts for published items only; never who liked.
CREATE OR REPLACE FUNCTION public.portfolio_like_counts(item_ids uuid[])
RETURNS TABLE (item_id uuid, likes bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.item_id, count(*)::bigint
  FROM public.portfolio_item_likes l
  JOIN public.portfolio_items p ON p.id = l.item_id AND p.published
  WHERE l.item_id = ANY (item_ids)
  GROUP BY l.item_id;
$$;

REVOKE ALL ON FUNCTION public.portfolio_like_counts(uuid[]) FROM public;
GRANT EXECUTE ON FUNCTION public.portfolio_like_counts(uuid[]) TO anon, authenticated;
