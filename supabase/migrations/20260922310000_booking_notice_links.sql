-- A studio owner's "asked for a session" and "cancelled a session" notices open the request itself
-- (/business/bookings/requests/<id>). They linked to /provider/bookings/requests, which has not
-- existed since the provider screens became /business/bookings on 18 Sep, so tapping one led
-- nowhere. The 3 notices already sent point at the requests list.
-- Snapshot and undo: supabase/dumps/2026-09-22-before-booking-notice-links.sql

BEGIN;

CREATE OR REPLACE FUNCTION public.notify_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_studio record;
BEGIN
  SELECT id, name, owner_profile_id INTO v_studio FROM public.studios WHERE id = NEW.studio_id;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify(v_studio.owner_profile_id, NEW.requester_profile_id, 'booking_requested',
      public.display_name_of(NEW.requester_profile_id) || ' asked for a session',
      to_char(NEW.session_date, 'DD Mon') || coalesce(' · ' || NEW.purpose, ''),
      '/business/bookings/requests/' || NEW.id);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'cancelled' THEN
      PERFORM public.notify(v_studio.owner_profile_id, NEW.requester_profile_id, 'booking_answered',
        public.display_name_of(NEW.requester_profile_id) || ' cancelled a session',
        to_char(NEW.session_date, 'DD Mon'), '/business/bookings/requests/' || NEW.id);
    ELSE
      PERFORM public.notify(NEW.requester_profile_id, v_studio.owner_profile_id, 'booking_answered',
        v_studio.name || ' marked your session ' || NEW.status,
        NEW.reply, '/booking/confirmed/' || NEW.id);
    END IF;
  END IF;
  RETURN NULL;
END
$function$;

UPDATE public.notifications SET href = '/business/bookings/requests'
 WHERE href = '/provider/bookings/requests';

COMMIT;
