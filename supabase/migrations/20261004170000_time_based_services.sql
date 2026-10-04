-- Queue item 12 (owner, 4 Oct 2026, §5): the Service decides whether a date/time is needed, and
-- every time-based service is protected against overlapping bookings, whoever provides it.
--
--   1. service_is_time_based(): a service is time-based when its work modes include in_person,
--      touring or hybrid, or it has none set. Remote-only services are async: no date, no lock. A booking of a place
--      (bookable_id) is always time-based.
--   2. booking_requests.session_date becomes optional (an async booking has none).
--   3. booking_requests_slot_guard (BEFORE INSERT OR UPDATE): a time-based booking must have a date;
--      and confirming one takes a per-provider transaction lock and refuses if another confirmed or
--      completed booking of the same provider overlaps. Provider = the place, else the service's
--      owner. Requests still don't hold a slot (owner, 21 Sep): only confirming does.
--   4. notify_booking: a booking with no date says its purpose instead of an empty date.
--      Replaced only if the live body is the one in the snapshot (md5), otherwise stops.
--
-- Snapshot: supabase/dumps/2026-10-04-before-time-based-services.sql (also the undo).

BEGIN;

DO $guard$
BEGIN
  IF (SELECT md5(prosrc) FROM pg_proc WHERE proname = 'notify_booking'
        AND pronamespace = 'public'::regnamespace) <> '83bedd07a14b51f0204a7cc60d26f37b' THEN
    RAISE EXCEPTION 'notify_booking has changed since the snapshot; re-check before applying';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'booking_requests_slot_guard') THEN
    RAISE EXCEPTION 'booking_requests_slot_guard already exists';
  END IF;
END
$guard$;

CREATE OR REPLACE FUNCTION public.service_is_time_based(p_service uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  -- No modes set reads as time-based (the safe side); hybrid includes in person.
  SELECT coalesce(
    (SELECT coalesce(cardinality(s.work_modes), 0) = 0
            OR s.work_modes && ARRAY['in_person', 'touring', 'hybrid']::text[]
       FROM public.profile_services s WHERE s.id = p_service),
    true)
$$;

ALTER TABLE public.booking_requests ALTER COLUMN session_date DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.booking_requests_slot_guard()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_timed boolean;
  v_owner uuid;
  v_from  timestamp;
  v_to    timestamp;
BEGIN
  v_timed := NEW.bookable_id IS NOT NULL OR NEW.service_id IS NULL
             OR public.service_is_time_based(NEW.service_id);

  IF v_timed AND NEW.session_date IS NULL THEN
    RAISE EXCEPTION 'Pick a date for this booking' USING ERRCODE = '23514';
  END IF;
  IF NOT v_timed OR NEW.status <> 'confirmed' THEN
    RETURN NEW;
  END IF;
  -- Already confirmed and its time unchanged: nothing new to check.
  IF TG_OP = 'UPDATE' AND OLD.status = 'confirmed'
     AND NEW.session_date IS NOT DISTINCT FROM OLD.session_date
     AND NEW.start_time IS NOT DISTINCT FROM OLD.start_time
     AND NEW.end_time IS NOT DISTINCT FROM OLD.end_time
     AND NEW.hours IS NOT DISTINCT FROM OLD.hours THEN
    RETURN NEW;
  END IF;

  IF NEW.bookable_id IS NULL THEN
    SELECT s.profile_id INTO v_owner FROM public.profile_services s WHERE s.id = NEW.service_id;
  END IF;
  -- One provider confirms one booking at a time: two confirmations racing can't both pass.
  PERFORM pg_advisory_xact_lock(hashtext(coalesce(NEW.bookable_id::text, 'p:' || v_owner::text)));

  v_from := NEW.session_date + coalesce(NEW.start_time, time '00:00');
  v_to := CASE
    WHEN NEW.start_time IS NULL THEN (NEW.session_date + 1)::timestamp
    WHEN NEW.end_time IS NOT NULL AND NEW.end_time > NEW.start_time
      THEN NEW.session_date + NEW.end_time
    WHEN NEW.end_time IS NOT NULL
      THEN NEW.session_date + NEW.end_time + interval '1 day'
    ELSE v_from + make_interval(hours => coalesce(NEW.hours, 1))
  END;

  IF EXISTS (
    SELECT 1
      FROM public.booking_requests b
      LEFT JOIN public.profile_services s ON s.id = b.service_id
     WHERE b.id <> NEW.id
       AND b.status IN ('confirmed', 'completed')
       AND b.session_date IS NOT NULL
       AND b.session_date BETWEEN NEW.session_date - 1 AND NEW.session_date + 1
       AND (CASE WHEN NEW.bookable_id IS NOT NULL THEN b.bookable_id = NEW.bookable_id
                 ELSE b.bookable_id IS NULL AND s.profile_id = v_owner END)
       AND tsrange(
             b.session_date + coalesce(b.start_time, time '00:00'),
             CASE
               WHEN b.start_time IS NULL THEN (b.session_date + 1)::timestamp
               WHEN b.end_time IS NOT NULL AND b.end_time > b.start_time
                 THEN b.session_date + b.end_time
               WHEN b.end_time IS NOT NULL
                 THEN b.session_date + b.end_time + interval '1 day'
               ELSE b.session_date + b.start_time + make_interval(hours => coalesce(b.hours, 1))
             END) && tsrange(v_from, v_to)
  ) THEN
    RAISE EXCEPTION 'This time is already booked' USING ERRCODE = '23P01';
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER booking_requests_slot_guard
  BEFORE INSERT OR UPDATE ON public.booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.booking_requests_slot_guard();

CREATE OR REPLACE FUNCTION public.notify_booking()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_name  text;
  v_href  text;
  v_when  text;
BEGIN
  SELECT owner_profile_id, name INTO v_owner, v_name FROM public.bookables WHERE id = NEW.bookable_id;
  IF v_owner IS NULL AND NEW.service_id IS NOT NULL THEN
    SELECT s.profile_id, public.display_name_of(s.profile_id) INTO v_owner, v_name
      FROM public.profile_services s WHERE s.id = NEW.service_id;
  END IF;
  IF v_owner IS NULL THEN
    RETURN NULL;
  END IF;
  v_href := '/business/bookings/requests/' || NEW.id;
  -- An async booking has no date: say what it is for instead.
  v_when := coalesce(to_char(NEW.session_date, 'DD Mon'), NEW.purpose, 'No date');

  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify(v_owner, NEW.requester_profile_id, 'booking_requested',
      public.display_name_of(NEW.requester_profile_id) || ' asked for a session',
      CASE WHEN NEW.session_date IS NULL THEN v_when
           ELSE v_when || coalesce(' · ' || NEW.purpose, '') END,
      v_href);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'cancelled' THEN
      PERFORM public.notify(v_owner, NEW.requester_profile_id, 'booking_answered',
        public.display_name_of(NEW.requester_profile_id) || ' cancelled a session',
        v_when, v_href);
    ELSE
      PERFORM public.notify(NEW.requester_profile_id, v_owner, 'booking_answered',
        v_name || ' marked your session ' || NEW.status,
        NEW.reply, '/booking/confirmed/' || NEW.id);
    END IF;
  END IF;
  RETURN NULL;
END
$$;

COMMIT;

NOTIFY pgrst, 'reload schema';
