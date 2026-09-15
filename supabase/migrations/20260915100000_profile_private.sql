-- Private profile details: date of birth and gender (owner, 15 Sep 2026: "add dob and gender",
-- "by default hidden").
--
-- They do not go on public.profiles, which anyone can read. This table is readable and writable by
-- its owner only; nothing public selects from it. They are kept out of profiles.onboarding_draft too.
--
-- Rollback:
--   DROP TABLE IF EXISTS public.profile_private;

CREATE TABLE IF NOT EXISTS public.profile_private (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  date_of_birth date,
  gender text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_private_gender CHECK (
    gender IS NULL OR gender IN ('woman', 'man', 'non_binary', 'prefer_not_to_say')
  ),
  CONSTRAINT profile_private_dob CHECK (
    date_of_birth IS NULL OR (date_of_birth >= DATE '1900-01-01' AND date_of_birth <= CURRENT_DATE)
  )
);

ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner reads own private details" ON public.profile_private;
CREATE POLICY "Owner reads own private details" ON public.profile_private
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Owner inserts own private details" ON public.profile_private;
CREATE POLICY "Owner inserts own private details" ON public.profile_private
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Owner updates own private details" ON public.profile_private;
CREATE POLICY "Owner updates own private details" ON public.profile_private
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

REVOKE ALL ON public.profile_private FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.profile_private TO authenticated;
