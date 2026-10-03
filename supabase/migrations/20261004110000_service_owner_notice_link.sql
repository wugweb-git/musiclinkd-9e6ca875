-- C1 follow-up of booking by service (owner, 4 Oct 2026). A talent's booking notice now opens the
-- request itself, as a business's does: /business/bookings/requests/<id>, which C1 opens to the
-- service's owner (the route keeps its name; route files are never renamed). Only the notice link
-- changes; who is notified and what it says are as in 20261004100000.
--
-- Apply after C1 is published, so the link never points at a screen that turns the talent away.
-- Replaces notify_booking() only if the live body is 20261004100000's (md5 of prosrc), else stops.
--
-- Snapshot: none needed beyond 20261004100000 itself, whose notify_booking() is the live body
-- (fingerprint 8d77693645c8450bc1fb18e24f0a44d1, confirmed by the owner's Claude on 4 Oct).
--
-- Rollback: re-run the notify_booking() block of 20261004100000_bookings_point_at_services.sql.

BEGIN;

DO $guard$
DECLARE got text;
BEGIN
  SELECT md5(prosrc) INTO got FROM pg_proc WHERE oid = 'public.notify_booking()'::regprocedure;
  IF got IS DISTINCT FROM '8d77693645c8450bc1fb18e24f0a44d1' THEN
    RAISE EXCEPTION 'notify_booking() is not the 20261004100000 version (md5 %)', got;
  END IF;
END
$guard$;

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
  -- Every owner's notice opens the request: the request screen takes a service's owner too (C1).
  v_href := '/business/bookings/requests/' || NEW.id;

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

COMMIT;
