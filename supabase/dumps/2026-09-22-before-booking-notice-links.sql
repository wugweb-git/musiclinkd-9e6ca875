-- Before 20260922310000_booking_notice_links.sql (22 Sep 2026): studio owners' booking notices
-- linked to /provider/bookings/requests, a screen renamed to /business/bookings/requests on 18 Sep.
-- Running this puts the 3 notices and the trigger function back as they were.
BEGIN;
UPDATE public.notifications SET href = '/provider/bookings/requests' WHERE id = 'e21ae4af-f4aa-4688-9889-0b55e63347df';
UPDATE public.notifications SET href = '/provider/bookings/requests' WHERE id = '009c0909-9cbb-47bd-a851-b6898eff72b6';
UPDATE public.notifications SET href = '/provider/bookings/requests' WHERE id = 'efb8af12-3593-4cfc-84d1-967fcf3624e0';

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
      '/provider/bookings/requests');
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'cancelled' THEN
      PERFORM public.notify(v_studio.owner_profile_id, NEW.requester_profile_id, 'booking_answered',
        public.display_name_of(NEW.requester_profile_id) || ' cancelled a session',
        to_char(NEW.session_date, 'DD Mon'), '/provider/bookings/requests');
    ELSE
      PERFORM public.notify(NEW.requester_profile_id, v_studio.owner_profile_id, 'booking_answered',
        v_studio.name || ' marked your session ' || NEW.status,
        NEW.reply, '/booking/confirmed/' || NEW.id);
    END IF;
  END IF;
  RETURN NULL;
END
$function$;
COMMIT;
