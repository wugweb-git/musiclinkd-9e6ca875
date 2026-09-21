-- Business pages owned by a login (owner, 22 Sep 2026): one email is one login, and that login can
-- own one business page, the way Facebook and LinkedIn pages work.
--
-- A page is its own profile row, so every existing rule for business accounts (services, studio,
-- bookings, reviews, QR) applies to it unchanged. profiles.id must be a sign-in principal, so the
-- server gives each page a sign-in nobody types (no known password, an address that receives no
-- mail) and hands its session to the owner when they switch into it (src/lib/pages.functions.ts).
-- owner_id links the page to the login that owns it; only the server sets it.
-- Business accounts created before this stay their own logins with owner_id NULL.
--
-- Rollback:
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS owner_id;  (drops both indexes with it)
--   Restore profiles_guard_admin_fields() from supabase/dumps/2026-09-22-before-business-pages.sql.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.profiles.owner_id IS
  'For a business page: the login that owns it. NULL for a person or a business that is its own login.';

-- One login, one business page.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_one_page_per_owner
  ON public.profiles (owner_id) WHERE owner_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.profiles_guard_admin_fields()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' AND (NEW.trust_badges <> '{}' OR NEW.is_verified) THEN
      RAISE EXCEPTION 'trust_badges and is_verified are set by MusicLinkd, not by the profile owner';
    END IF;
    IF TG_OP = 'UPDATE' AND (NEW.trust_badges IS DISTINCT FROM OLD.trust_badges
                             OR NEW.is_verified IS DISTINCT FROM OLD.is_verified) THEN
      RAISE EXCEPTION 'trust_badges and is_verified are set by MusicLinkd, not by the profile owner';
    END IF;
    -- Which login owns a page is set by the server only.
    IF (TG_OP = 'INSERT' AND NEW.owner_id IS NOT NULL)
       OR (TG_OP = 'UPDATE' AND NEW.owner_id IS DISTINCT FROM OLD.owner_id) THEN
      RAISE EXCEPTION 'owner_id is set by MusicLinkd, not by the profile';
    END IF;
  END IF;
  RETURN NEW;
END
$function$;
