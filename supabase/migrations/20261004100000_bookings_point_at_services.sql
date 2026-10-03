-- M1 of booking by service (owner, 3 Oct 2026: there are no rooms; people book a service, every
-- service is bookable, a business offers many). Additive: nothing is dropped, no row is deleted.
--
--   1. booking_requests.service_id → profile_services(id). A deleted service clears it; the
--      booking keeps its purpose text.
--   2. The 10 existing bookings: service_id is filled only where purpose is exactly the name of
--      one service of the business asked. The rest stay empty. room_id is untouched (M2).
--   3. Whoever owns the service can read and answer a booking of it, as a bookable's owner can
--      today, so a talent, who has no bookable, can accept or decline. Two new rules, added beside
--      the existing ones; the guard and the notification learn the service's owner the same way.
--
-- The guard and the notification are replaced, so the migration first checks that the live
-- bodies are exactly the ones in the snapshot (md5 of prosrc) and stops if either differs, rather
-- than overwrite a change made elsewhere. Both were compared with the repo: the guard is
-- 20260922150000 after the 20261003130000 rename, less one comment line; the notification is
-- 20260922310000 (links to the request itself) after the rename. Same logic in both.
--
-- Links: a booking with a bookable still opens /business/bookings/requests/<id>, as today. A
-- booking with no bookable (a talent's service) has no request screen yet, so its notice carries
-- no link (notifications.href is optional and the list shows it unlinked) until C1 adds one.
--
-- Snapshot: supabase/dumps/2026-10-04-before-bookings-point-at-services.sql (taken read-only with
-- supabase/checks/before-bookings-point-at-services.sql; definitions and counts, no user data).
--
-- Rollback:
--   DROP POLICY "Service owner reads" ON public.booking_requests;
--   DROP POLICY "Service owner answers" ON public.booking_requests;
--   then re-create booking_requests_guard() and notify_booking() from the snapshot
--   (supabase/dumps/2026-10-04-before-bookings-point-at-services.sql);
--   DROP FUNCTION public.profile_service_is_mine(uuid);
--   ALTER TABLE public.booking_requests DROP COLUMN service_id;

BEGIN;

CREATE TEMP TABLE _before ON COMMIT DROP AS
SELECT (SELECT count(*) FROM public.booking_requests) AS bookings;

-- ── The live bodies must be the ones this file replaces ─────────────────────────────────────────
DO $guard$
DECLARE got text;
BEGIN
  SELECT md5(prosrc) INTO got FROM pg_proc
   WHERE oid = 'public.booking_requests_guard()'::regprocedure;
  IF got IS DISTINCT FROM 'd30d843d800fddc8a0fdf33f8e5aac5d' THEN
    RAISE EXCEPTION 'booking_requests_guard() is not the version in the snapshot (md5 %)', got;
  END IF;
  SELECT md5(prosrc) INTO got FROM pg_proc
   WHERE oid = 'public.notify_booking()'::regprocedure;
  IF got IS DISTINCT FROM '50c25b098228e3e122866182ddde94f8' THEN
    RAISE EXCEPTION 'notify_booking() is not the version in the snapshot (md5 %)', got;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
               AND table_name = 'booking_requests' AND column_name = 'service_id') THEN
    RAISE EXCEPTION 'booking_requests.service_id already exists';
  END IF;
END
$guard$;

-- ── 1. The column ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.booking_requests
  ADD COLUMN service_id uuid REFERENCES public.profile_services(id) ON DELETE SET NULL;
CREATE INDEX booking_requests_service_idx ON public.booking_requests (service_id, session_date);
COMMENT ON COLUMN public.booking_requests.service_id IS
  'The service booked (profile_services). Null for bookings made before services were bookable.';

-- ── 2. Existing bookings: exact name, one match only ────────────────────────────────────────────
UPDATE public.booking_requests b
   SET service_id = m.service_id
  FROM (
    SELECT b2.id AS booking_id, min(s.id::text)::uuid AS service_id
      FROM public.booking_requests b2
      JOIN public.bookables k ON k.id = b2.bookable_id
      JOIN public.profile_services s ON s.profile_id = k.owner_profile_id AND s.name = b2.purpose
     WHERE b2.purpose IS NOT NULL
     GROUP BY b2.id
    HAVING count(*) = 1
  ) m
 WHERE b.id = m.booking_id;

-- ── 3. The service's owner ──────────────────────────────────────────────────────────────────────
CREATE FUNCTION public.profile_service_is_mine(p_service_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.profile_services s
     WHERE s.id = p_service_id AND s.profile_id = auth.uid());
$fn$;
REVOKE ALL ON FUNCTION public.profile_service_is_mine(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.profile_service_is_mine(uuid) TO authenticated;

CREATE POLICY "Service owner reads" ON public.booking_requests
  FOR SELECT TO authenticated
  USING (public.profile_service_is_mine(service_id));
CREATE POLICY "Service owner answers" ON public.booking_requests
  FOR UPDATE TO authenticated
  USING (public.profile_service_is_mine(service_id))
  WITH CHECK (public.profile_service_is_mine(service_id));

-- The guard: the bookable's owner or the service's owner answers; the requester may only cancel or
-- move the time; nobody changes who was asked, for what, or by whom.
CREATE OR REPLACE FUNCTION public.booking_requests_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.service_id IS DISTINCT FROM OLD.service_id THEN
    RAISE EXCEPTION 'A booking request keeps its service' USING ERRCODE = '42501';
  END IF;
  IF auth.uid() IS NULL OR public.bookable_is_mine(OLD.bookable_id)
     OR public.profile_service_is_mine(OLD.service_id) THEN
    RETURN NEW;
  END IF;
  -- The requester: cancel, or move the time (which sends it back to "requested"). Nothing else.
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status NOT IN ('cancelled', 'requested') THEN
    RAISE EXCEPTION 'Only the studio can answer a booking request' USING ERRCODE = '42501';
  END IF;
  IF NEW.reply IS DISTINCT FROM OLD.reply AND NEW.reply IS NOT NULL THEN
    RAISE EXCEPTION 'Only the studio can reply to a booking request' USING ERRCODE = '42501';
  END IF;
  IF NEW.bookable_id IS DISTINCT FROM OLD.bookable_id
     OR NEW.requester_profile_id IS DISTINCT FROM OLD.requester_profile_id
     OR NEW.bookable_name IS DISTINCT FROM OLD.bookable_name
     OR NEW.requester_name IS DISTINCT FROM OLD.requester_name THEN
    RAISE EXCEPTION 'A booking request keeps its studio and requester' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$fn$;
REVOKE EXECUTE ON FUNCTION public.booking_requests_guard() FROM PUBLIC, anon, authenticated;

-- The notification goes to the bookable's owner, or, with no bookable, the service's owner. The
-- owner's notice opens the request itself where there is a screen for it (a bookable's).
CREATE OR REPLACE FUNCTION public.notify_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_owner uuid;
  v_name  text;
  v_href  text;
BEGIN
  SELECT owner_profile_id, name INTO v_owner, v_name FROM public.bookables WHERE id = NEW.bookable_id;
  IF v_owner IS NULL AND NEW.service_id IS NOT NULL THEN
    SELECT s.profile_id, public.display_name_of(s.profile_id) INTO v_owner, v_name
      FROM public.profile_services s WHERE s.id = NEW.service_id;
  END IF;
  IF v_owner IS NULL THEN
    RETURN NULL;
  END IF;
  IF NEW.bookable_id IS NOT NULL THEN
    v_href := '/business/bookings/requests/' || NEW.id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify(v_owner, NEW.requester_profile_id, 'booking_requested',
      public.display_name_of(NEW.requester_profile_id) || ' asked for a session',
      to_char(NEW.session_date, 'DD Mon') || coalesce(' · ' || NEW.purpose, ''),
      v_href);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'cancelled' THEN
      PERFORM public.notify(v_owner, NEW.requester_profile_id, 'booking_answered',
        public.display_name_of(NEW.requester_profile_id) || ' cancelled a session',
        to_char(NEW.session_date, 'DD Mon'), v_href);
    ELSE
      PERFORM public.notify(NEW.requester_profile_id, v_owner, 'booking_answered',
        v_name || ' marked your session ' || NEW.status,
        NEW.reply, '/booking/confirmed/' || NEW.id);
    END IF;
  END IF;
  RETURN NULL;
END
$fn$;

-- ── Check ───────────────────────────────────────────────────────────────────────────────────────
DO $check$
DECLARE b record; linked bigint;
BEGIN
  SELECT * INTO b FROM _before;
  IF (SELECT count(*) FROM public.booking_requests) <> b.bookings THEN
    RAISE EXCEPTION 'booking rows changed';
  END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'booking_requests'
        AND policyname IN ('Service owner reads', 'Service owner answers')) <> 2 THEN
    RAISE EXCEPTION 'the service-owner rules are not both there';
  END IF;
  SELECT count(*) INTO linked FROM public.booking_requests WHERE service_id IS NOT NULL;
  RAISE NOTICE 'bookings % · linked to a service %', b.bookings, linked;
END
$check$;

COMMIT;
