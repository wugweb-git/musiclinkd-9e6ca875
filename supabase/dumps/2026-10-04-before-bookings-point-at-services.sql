-- Snapshot before 20261004100000_bookings_point_at_services.sql. Taken read-only from the live
-- database on 2026-10-03/04 with supabase/checks/before-bookings-point-at-services.sql.
-- Definitions and counts only, no user data.
--
-- Counts: bookings 10 · bookings with purpose 6 · purpose matches exactly one service of the business 6
--
-- Rules on public.booking_requests (cmd | USING | WITH CHECK):
--   "Ask as yourself"                    INSERT |  | (requester_profile_id = auth.uid())
--   "Requester and studio read"          SELECT | ((requester_profile_id = auth.uid()) OR bookable_is_mine(bookable_id)) |
--   "Requester removes their own"        DELETE | (requester_profile_id = auth.uid()) |
--   "Studio answers, requester cancels"  UPDATE | (bookable_is_mine(bookable_id) OR (requester_profile_id = auth.uid())) | same
--
-- booking_requests_guard  md5(prosrc) d30d843d800fddc8a0fdf33f8e5aac5d
CREATE OR REPLACE FUNCTION public.booking_requests_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR public.bookable_is_mine(OLD.bookable_id) THEN
    RETURN NEW;
  END IF;
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
$function$;

-- notify_booking  md5(prosrc) 50c25b098228e3e122866182ddde94f8
CREATE OR REPLACE FUNCTION public.notify_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_studio record;
BEGIN
  SELECT id, name, owner_profile_id INTO v_studio FROM public.bookables WHERE id = NEW.bookable_id;

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
