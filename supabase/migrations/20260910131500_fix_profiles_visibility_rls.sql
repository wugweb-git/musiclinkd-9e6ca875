-- Enforce the `visibility` column in the profiles SELECT policy.
--
-- 20260902172915 created:
--   GRANT SELECT ON public.profiles TO anon;
--   CREATE POLICY "Profiles are viewable by everyone" ... FOR SELECT USING (true);
--
-- 20260902185426, 85 minutes later, added:
--   ADD COLUMN visibility text NOT NULL DEFAULT 'public'
--
-- The policy was never updated to honour the new column, so every profile is
-- readable by every caller including `anon` regardless of its visibility.
--
-- src/lib/portfolio.functions.ts filters `visibility === "private"` when it reads
-- a profile, but that guards the app's own code path only. RLS is the boundary:
-- the anon key ships in the client bundle, so the PostgREST endpoint can be
-- queried directly and returns private rows. The app-level check protects the
-- app's UI and nothing else.

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (visibility = 'public' OR auth.uid() = id);
