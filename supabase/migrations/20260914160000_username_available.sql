-- Username availability for onboarding.
--
-- profiles.username is UNIQUE, and the client can't check it directly: the SELECT policy hides
-- members-only and limited profiles. This function reads every row as its owner (SECURITY DEFINER)
-- and returns only a boolean.
--
-- True when no other profile holds the name, case-insensitively; a user's own current name counts as
-- available (IS DISTINCT FROM, so a missing auth.uid() never makes a taken name look free). Signed-in users only, so there is no anonymous enumeration endpoint. Every stored username
-- was lowercase with no case-insensitive duplicates when this was written (95 of 97 profiles set).
--
-- Rollback: DROP FUNCTION public.username_available(text);

CREATE OR REPLACE FUNCTION public.username_available(p_username text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = lower(p_username) AND id IS DISTINCT FROM auth.uid()
  );
$$;

-- Supabase default privileges grant EXECUTE to anon on new functions; revoke it explicitly.
REVOKE ALL ON FUNCTION public.username_available(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.username_available(text) TO authenticated;
