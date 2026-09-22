-- Migration: 20260922330000_security_lint_and_policies.sql
-- Remediates:
-- 1. profiles SELECT policy: enforce (visibility = 'public' OR auth.uid() = id)
-- 2. profiles UPDATE policy column security: prevent client edits to is_verified, trust_badges, persona_badges
-- 3. studios UPDATE column security: prevent client edits to verified_gold
-- 4. Supabase linter 0028 & 0029: revoke EXECUTE on triggers/admin functions; switch RLS helpers to SECURITY INVOKER
--
-- Fixed 22 Sep 2026 (audit): this file was committed but had never been run — it would have failed
-- immediately. profile_service_is_readable referenced profile_services.is_active, a column that
-- doesn't exist (the table uses status); rewritten to match the function's live definition
-- (status <> 'draft', or the owner). And it revoked EXECUTE on band_can_write/band_can_manage/
-- band_is_owner, which don't exist — a band is a collab (collab_model), so those three lines are
-- removed; the equivalent collab_can_write/collab_can_manage/collab_is_owner revokes are unchanged.
--
-- Snapshot: supabase/dumps/2026-09-22-before-security-lint-and-policies.sql
-- Rollback: restore profiles_guard_admin_fields(), profile_service_is_readable() and the other RLS
-- helper functions (opportunity_is_mine, studio_is_mine, rental_listing_is_mine, can_review_profile,
-- can_review_studio, is_talent) from the snapshot; DROP TRIGGER studios_guard_admin_fields ON
-- public.studios; DROP FUNCTION public.studios_guard_admin_fields(); re-GRANT EXECUTE on the
-- revoked functions to PUBLIC, anon, authenticated.

-- 1. Enforce visibility in profiles SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (visibility = 'public' OR auth.uid() = id);

-- 2. Guard profiles admin columns (is_verified, trust_badges, persona_badges)
CREATE OR REPLACE FUNCTION public.profiles_guard_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' AND (NEW.trust_badges <> '{}' OR NEW.is_verified OR NEW.persona_badges <> '{}') THEN
      RAISE EXCEPTION 'trust_badges, is_verified, and persona_badges are set by MusicLinkd, not by the profile owner';
    END IF;
    IF TG_OP = 'UPDATE' AND (
      NEW.trust_badges IS DISTINCT FROM OLD.trust_badges
      OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
      OR NEW.persona_badges IS DISTINCT FROM OLD.persona_badges
    ) THEN
      RAISE EXCEPTION 'trust_badges, is_verified, and persona_badges are set by MusicLinkd, not by the profile owner';
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

DROP TRIGGER IF EXISTS profiles_guard_admin_fields ON public.profiles;
CREATE TRIGGER profiles_guard_admin_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_admin_fields();

-- 3. Guard studios admin columns (verified_gold)
CREATE OR REPLACE FUNCTION public.studios_guard_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' AND NEW.verified_gold THEN
      RAISE EXCEPTION 'verified_gold is set by MusicLinkd, not by the studio owner';
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.verified_gold IS DISTINCT FROM OLD.verified_gold THEN
      RAISE EXCEPTION 'verified_gold is set by MusicLinkd, not by the studio owner';
    END IF;
  END IF;
  RETURN NEW;
END
$function$;

DROP TRIGGER IF EXISTS studios_guard_admin_fields ON public.studios;
CREATE TRIGGER studios_guard_admin_fields
  BEFORE INSERT OR UPDATE ON public.studios
  FOR EACH ROW EXECUTE FUNCTION public.studios_guard_admin_fields();

-- 4. Supabase Linter 0028 & 0029 remediation:
-- Revoke EXECUTE on triggers and internal maintenance functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.profiles_guard_admin_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.studios_guard_admin_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.keep_counted_columns() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.profiles_username_rules() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verification_requests_sync_trust() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.messages_touch_conversation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.applications_count_opportunity() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rental_booking_counts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.booking_requests_names() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.booking_requests_guard() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reviews_guard() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_profiles_updated_at() FROM PUBLIC, anon, authenticated;

-- Revoke execute on notification triggers
REVOKE EXECUTE ON FUNCTION public.notify_connection() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_application() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_booking() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_review() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_collab_member() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_rental_booking() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_collab_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_enquiry() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_review_request() FROM PUBLIC, anon, authenticated;

-- Admin & Service functions: restrict to service_role
REVOKE EXECUTE ON FUNCTION public.notify(uuid, uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify(uuid, uuid, text, text, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.verification_decide(uuid, text, text, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verification_decide(uuid, text, text, text, text, timestamptz) TO service_role;

REVOKE EXECUTE ON FUNCTION public.verification_expire_due() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verification_expire_due() TO service_role;

REVOKE EXECUTE ON FUNCTION public.verification_sync_trust(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verification_sync_trust(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.recompute_review_stats(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recompute_review_stats(uuid, uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.refresh_review_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_review_stats() TO service_role;

REVOKE EXECUTE ON FUNCTION public.refresh_follower_count() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_follower_count() TO service_role;

-- Revoke anon execute on functions that require authentication
REVOKE EXECUTE ON FUNCTION public.collab_can_write(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.collab_can_manage(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.collab_is_owner(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.start_conversation(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.start_collab(text, text, text, text, text, date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.contact_phone(uuid) FROM anon;

-- Switch RLS helper functions from SECURITY DEFINER to SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.profile_is_readable(p_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_profile_id
      AND (visibility = 'public' OR auth.uid() = id)
  );
$fn$;

CREATE OR REPLACE FUNCTION public.profile_service_is_readable(p_service_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.profile_services s
    WHERE s.id = p_service_id
      AND public.profile_is_readable(s.profile_id)
      AND (s.status <> 'draft' OR s.profile_id = auth.uid())
  );
$fn$;

CREATE OR REPLACE FUNCTION public.opportunity_is_mine(p_opportunity_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.opportunities
    WHERE id = p_opportunity_id AND creator_profile_id = auth.uid()
  );
$fn$;

CREATE OR REPLACE FUNCTION public.studio_is_mine(p_studio_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.studios
    WHERE id = p_studio_id AND owner_profile_id = auth.uid()
  );
$fn$;

CREATE OR REPLACE FUNCTION public.rental_listing_is_mine(p_listing_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.marketplace_listings
    WHERE id = p_listing_id AND seller_profile_id = auth.uid()
  );
$fn$;

CREATE OR REPLACE FUNCTION public.can_review_profile(p_target_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $fn$
  SELECT auth.uid() IS NOT NULL AND auth.uid() <> p_target_profile_id;
$fn$;

CREATE OR REPLACE FUNCTION public.can_review_studio(p_studio_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $fn$
  SELECT auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.studios WHERE id = p_studio_id AND owner_profile_id = auth.uid()
  );
$fn$;

CREATE OR REPLACE FUNCTION public.is_talent(p_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_profile_id AND array_length(roles, 1) > 0
  );
$fn$;
