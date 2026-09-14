-- Username rules, as decided by the owner on 14 Sep 2026.
--
-- 1. Format: lowercase a–z, 0–9, dots and underscores, 3–30 characters. The 95 imported usernames
--    used hyphens; they become dots (aarav-mehta → aarav.mehta), so their /profile/ URLs change.
--    Checked before writing: no collisions after the rename, no other invalid characters or lengths.
-- 2. Reserved names live in public.reserved_usernames and are enforced here, not only in the app.
-- 3. A username cannot be changed once set. Signed-in and anonymous callers are blocked; the service
--    role and direct database sessions (MusicLinkd admins) can still change it.
--
-- Errors raised for the app to map: 'username_reserved', 'username_locked'. A taken name is the
-- existing UNIQUE constraint (23505, profiles_username_key); a bad format is the CHECK (23514,
-- profiles_username_format).
--
-- Rollback:
--   DROP TRIGGER IF EXISTS profiles_username_rules ON public.profiles;
--   DROP FUNCTION IF EXISTS public.profiles_username_rules();
--   ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_format;
--   DROP TABLE IF EXISTS public.reserved_usernames;
--   UPDATE public.profiles SET username = replace(username, '.', '-') WHERE username LIKE '%.%';
--   then restore username_available from 20260914160000_username_available.sql.

-- 1. Rename, then enforce the format.
UPDATE public.profiles SET username = replace(username, '-', '.') WHERE username LIKE '%-%';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_format;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_format CHECK (username ~ '^[a-z0-9._]{3,30}$');

-- 2. Reserved names: MusicLinkd's own, staff-sounding names, and the app's top-level routes.
CREATE TABLE IF NOT EXISTS public.reserved_usernames (
  name text PRIMARY KEY CHECK (name = lower(name)),
  reason text NOT NULL DEFAULT 'route',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Nobody reads or writes this from the client; the functions below read it as their owner.
ALTER TABLE public.reserved_usernames ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reserved_usernames FROM anon, authenticated;

INSERT INTO public.reserved_usernames (name, reason) VALUES
  ('musiclinkd', 'brand'), ('music.linkd', 'brand'), ('musiclinkd.official', 'brand'),
  ('official', 'brand'),
  ('admin', 'staff'), ('administrator', 'staff'), ('root', 'staff'), ('system', 'staff'),
  ('staff', 'staff'), ('team', 'staff'), ('moderator', 'staff'), ('mod', 'staff'),
  ('security', 'staff'), ('support', 'staff'), ('help', 'staff'), ('contact', 'staff'),
  ('api', 'system'), ('www', 'system'), ('app', 'system'), ('null', 'system'),
  ('undefined', 'system'), ('anonymous', 'system'),
  ('auth', 'route'), ('band', 'route'), ('bands', 'route'), ('booking', 'route'),
  ('bookings', 'route'), ('business', 'route'), ('categories', 'route'), ('collab', 'route'),
  ('discover', 'route'), ('feed', 'route'), ('identity', 'route'), ('legal', 'route'),
  ('marketplace', 'route'), ('me', 'route'), ('messages', 'route'), ('notifications', 'route'),
  ('onboarding', 'route'), ('opportunities', 'route'), ('plans', 'route'), ('portfolio', 'route'),
  ('profile', 'route'), ('provider', 'route'), ('recently.viewed', 'route'),
  ('recommendations', 'route'), ('recommended', 'route'), ('reset.password', 'route'),
  ('reviews', 'route'), ('saved', 'route'), ('search', 'route'), ('services', 'route'),
  ('settings', 'route'), ('singers', 'route'), ('studio', 'route'), ('talent', 'route'),
  ('verification', 'route'), ('welcome', 'route'), ('login', 'route'), ('signup', 'route'),
  ('terms', 'route'), ('privacy', 'route'), ('about', 'route')
ON CONFLICT (name) DO NOTHING;

-- 3. Reserved and lock rules on write.
CREATE OR REPLACE FUNCTION public.profiles_username_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.username IS NOT NULL
     AND NEW.username IS DISTINCT FROM OLD.username THEN
    RAISE EXCEPTION 'username_locked' USING HINT = 'A username cannot be changed once it is set.';
  END IF;

  IF NEW.username IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.username IS DISTINCT FROM OLD.username)
     AND EXISTS (SELECT 1 FROM public.reserved_usernames WHERE name = NEW.username) THEN
    RAISE EXCEPTION 'username_reserved' USING HINT = 'This username is reserved.';
  END IF;

  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS profiles_username_rules ON public.profiles;
CREATE TRIGGER profiles_username_rules
  BEFORE INSERT OR UPDATE OF username ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_username_rules();

-- Availability now also refuses reserved names. Your own current name still counts as available.
CREATE OR REPLACE FUNCTION public.username_available(p_username text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.reserved_usernames WHERE name = lower(p_username))
     AND NOT EXISTS (
       SELECT 1 FROM public.profiles
       WHERE lower(username) = lower(p_username) AND id IS DISTINCT FROM auth.uid()
     );
$$;

REVOKE ALL ON FUNCTION public.username_available(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.username_available(text) TO authenticated;
