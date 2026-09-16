-- Profile visibility: exactly three values — public, members, limited.
--
-- Owner's call (15 Sep 2026): "keep 3". Onboarding already writes these keys (taxonomy category
-- profile_visibility). The profile edit screen wrote 'connections' and 'private' instead; it now uses the
-- same three options. Rows it wrote are moved to the closest value:
--   connections -> limited   (only connections see details)
--   private     -> limited
-- A CHECK keeps any other value out. Read access is unchanged: the SELECT policy still lets everyone read
-- 'public' rows and owners read their own.
--
-- Stops if a value other than those five exists. Idempotent.

UPDATE public.profiles SET visibility = 'limited' WHERE visibility IN ('connections', 'private');

DO $verify$
DECLARE
  bad text;
BEGIN
  SELECT string_agg(DISTINCT visibility, ', ') INTO bad
  FROM public.profiles WHERE visibility NOT IN ('public', 'members', 'limited');
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'unexpected profile visibility values: %', bad;
  END IF;
END
$verify$;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_visibility_values;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_visibility_values CHECK (visibility IN ('public', 'members', 'limited'));
