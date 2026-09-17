-- Featured work (owner, 18 Sep 2026).
--
-- The Reorder screen has always offered "Feature this" — up to three works that lead the profile —
-- and kept the answer in the screen, so it was gone on the next visit. Featuring is a property of
-- the work, like its order and whether it is published, so it lives on the work.
--
-- Every existing work starts unfeatured, which is what every profile shows today.

ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.portfolio_items.featured IS
  'Leads the owner profile. At most three per account — the app enforces the limit when saving.';

-- Featured work is read together with the rest of an account's portfolio, in its order.
CREATE INDEX IF NOT EXISTS portfolio_items_user_featured_idx
  ON public.portfolio_items (user_id, featured, sort_order);
