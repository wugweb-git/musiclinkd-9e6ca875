-- Contact phone: Privacy's "Show phone number" (profiles.discovery_prefs.show_phone, never /
-- booked / always, unset reads as booked) made real. A visitor's profile page asks this one
-- function for the owner's number and shows a Call button only when it returns one.
--
-- 1. public.contact_phone(p_profile uuid) RETURNS text: the owner's number, or null. SECURITY
--    DEFINER, so the number is read here and never through a table: a business's
--    profile_private.business_phone first, else the account's confirmed auth phone
--    (auth.users.phone with phone_confirmed_at set, stored without its '+').
--    The rule, applied server-side:
--      always  any signed-in viewer
--      booked  only a viewer with a real relationship to the owner, either way round:
--                a confirmed or completed booking_request at a studio one of them owns;
--                a confirmed, active or completed rental_booking on a listing one of them sells;
--                an accepted opportunity_application to an opportunity one of them created;
--                an accepted connection.
--      never   nobody
--    Signed out, it returns null. The owner always gets their own number.
--
-- Additive: no existing table, row, function or policy is changed.
-- The app fails soft before this is applied: no Call button anywhere.
-- Snapshot: supabase/dumps/2026-09-21-before-contact-phone.sql
--
-- Rollback:
--   DROP FUNCTION IF EXISTS public.contact_phone(uuid);

BEGIN;

CREATE OR REPLACE FUNCTION public.contact_phone(p_profile uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_me uuid := auth.uid();
  v_rule text;
  v_phone text;
BEGIN
  IF v_me IS NULL OR p_profile IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT coalesce(p.discovery_prefs->>'show_phone', 'booked') INTO v_rule
  FROM public.profiles p
  WHERE p.id = p_profile;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_me <> p_profile THEN
    IF v_rule = 'never' THEN
      RETURN NULL;
    END IF;
    IF v_rule <> 'always' AND NOT (
      EXISTS (
        SELECT 1 FROM public.booking_requests r
        JOIN public.studios s ON s.id = r.studio_id
        WHERE r.status IN ('confirmed', 'completed')
          AND ((s.owner_profile_id = p_profile AND r.requester_profile_id = v_me)
            OR (s.owner_profile_id = v_me AND r.requester_profile_id = p_profile)))
      OR EXISTS (
        SELECT 1 FROM public.rental_bookings b
        JOIN public.marketplace_listings l ON l.id = b.listing_id
        WHERE b.status IN ('confirmed', 'active', 'completed')
          AND ((l.seller_profile_id = p_profile AND b.renter_profile_id = v_me)
            OR (l.seller_profile_id = v_me AND b.renter_profile_id = p_profile)))
      OR EXISTS (
        SELECT 1 FROM public.opportunity_applications a
        JOIN public.opportunities o ON o.id = a.opportunity_id
        WHERE a.status = 'accepted'
          AND ((o.creator_profile_id = p_profile AND a.applicant_profile_id = v_me)
            OR (o.creator_profile_id = v_me AND a.applicant_profile_id = p_profile)))
      OR EXISTS (
        SELECT 1 FROM public.connections c
        WHERE c.status = 'accepted'
          AND ((c.requester_id = p_profile AND c.addressee_id = v_me)
            OR (c.requester_id = v_me AND c.addressee_id = p_profile)))
    ) THEN
      RETURN NULL;
    END IF;
  END IF;

  SELECT coalesce(
    (SELECT pp.business_phone FROM public.profile_private pp
     WHERE pp.id = p_profile
       AND EXISTS (SELECT 1 FROM public.profile_business pb WHERE pb.profile_id = p_profile)),
    (SELECT CASE WHEN u.phone LIKE '+%' THEN u.phone ELSE '+' || u.phone END
     FROM auth.users u
     WHERE u.id = p_profile AND u.phone_confirmed_at IS NOT NULL AND coalesce(u.phone, '') <> '')
  ) INTO v_phone;
  RETURN v_phone;
END
$fn$;

REVOKE ALL ON FUNCTION public.contact_phone(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.contact_phone(uuid) TO authenticated;

COMMIT;
