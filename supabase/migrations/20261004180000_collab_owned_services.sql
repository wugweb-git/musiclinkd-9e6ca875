-- Queue item 13 (owner, 4 Oct 2026): Services are owned by Talent, Business or a Collaboration
-- (Band, Duo, Collective, Ensemble, Production Team, Crew). Same Service model, same Service Card,
-- same request flow and double-booking protection; bands are not turned into profiles.
--
--   1. profile_services.collab_id (nullable) → collabs; profile_id becomes nullable; exactly one
--      owner. Band services carry no packages or add-ons (those tables key on a person owner;
--      every service uses one starting price).
--   2. RLS: a band's owners/admins (collab_can_manage) manage its services; anyone who can read the
--      band reads its non-draft services.
--   3. profile_service_is_mine / profile_service_is_readable cover band services, so the existing
--      booking_requests policies let band admins read and answer their band's requests.
--   4. booking_requests_slot_guard: a band is one provider; notify_booking: a band service's
--      requests go to the band's owner, under the band's name.
-- Each replaced function is checked against its md5 in the snapshot first; any drift stops it.
--
-- Snapshot: supabase/dumps/2026-10-04-before-collab-owned-services.sql. Apply after 20261004170000.

BEGIN;

DO $guard$
DECLARE
  want jsonb := '{"profile_service_is_mine": "64fada16ed6ce34545af2004bf788aac",
                  "profile_service_is_readable": "d4057e0a318222be42a625f58d5b04fc",
                  "booking_requests_slot_guard": "27f8828519b077e072e1a06eb8c02d71",
                  "notify_booking": "b8f052ac2a1c10a7a2a888ba5c7ce796"}';
  k text;
  got text;
BEGIN
  FOR k IN SELECT jsonb_object_keys(want) LOOP
    SELECT md5(prosrc) INTO got FROM pg_proc
     WHERE proname = k AND pronamespace = 'public'::regnamespace;
    IF got IS DISTINCT FROM want ->> k THEN
      RAISE EXCEPTION '% has changed since the snapshot (apply 20261004170000 first?)', k;
    END IF;
  END LOOP;
END
$guard$;

-- 1. Ownership
ALTER TABLE public.profile_services
  ADD COLUMN collab_id uuid REFERENCES public.collabs(id) ON DELETE CASCADE;
ALTER TABLE public.profile_services ALTER COLUMN profile_id DROP NOT NULL;
ALTER TABLE public.profile_services
  ADD CONSTRAINT profile_services_one_owner CHECK (num_nonnulls(profile_id, collab_id) = 1);
CREATE INDEX profile_services_collab_idx ON public.profile_services (collab_id, sort_order)
  WHERE collab_id IS NOT NULL;

-- 2. Access
CREATE POLICY "Band managers write their band's services" ON public.profile_services
  FOR ALL TO authenticated
  USING (collab_id IS NOT NULL AND public.collab_can_manage(collab_id))
  WITH CHECK (collab_id IS NOT NULL AND public.collab_can_manage(collab_id));
CREATE POLICY "Readable with its band" ON public.profile_services
  FOR SELECT
  USING (collab_id IS NOT NULL AND public.collab_is_readable(collab_id)
         AND (status <> 'draft' OR public.collab_can_manage(collab_id)));

-- 3. Ownership helpers used by booking_requests policies
CREATE OR REPLACE FUNCTION public.profile_service_is_mine(p_service_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profile_services s
     WHERE s.id = p_service_id
       AND (s.profile_id = auth.uid()
            OR (s.collab_id IS NOT NULL AND public.collab_can_manage(s.collab_id))));
$$;

CREATE OR REPLACE FUNCTION public.profile_service_is_readable(p_service_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profile_services s
    WHERE s.id = p_service_id
      AND CASE
            WHEN s.collab_id IS NOT NULL THEN
              public.collab_is_readable(s.collab_id)
              AND (s.status <> 'draft' OR public.collab_can_manage(s.collab_id))
            ELSE
              public.profile_is_readable(s.profile_id)
              AND (s.status <> 'draft' OR s.profile_id = auth.uid())
          END
  );
$$;

-- 4a. One provider per band in the double-booking guard
CREATE OR REPLACE FUNCTION public.booking_requests_slot_guard()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_timed  boolean;
  v_owner  uuid;
  v_collab uuid;
  v_from   timestamp;
  v_to     timestamp;
BEGIN
  v_timed := NEW.bookable_id IS NOT NULL OR NEW.service_id IS NULL
             OR public.service_is_time_based(NEW.service_id);

  IF v_timed AND NEW.session_date IS NULL THEN
    RAISE EXCEPTION 'Pick a date for this booking' USING ERRCODE = '23514';
  END IF;
  IF NOT v_timed OR NEW.status <> 'confirmed' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'confirmed'
     AND NEW.session_date IS NOT DISTINCT FROM OLD.session_date
     AND NEW.start_time IS NOT DISTINCT FROM OLD.start_time
     AND NEW.end_time IS NOT DISTINCT FROM OLD.end_time
     AND NEW.hours IS NOT DISTINCT FROM OLD.hours THEN
    RETURN NEW;
  END IF;

  IF NEW.bookable_id IS NULL THEN
    SELECT s.profile_id, s.collab_id INTO v_owner, v_collab
      FROM public.profile_services s WHERE s.id = NEW.service_id;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext(coalesce(
    NEW.bookable_id::text, 'c:' || v_collab::text, 'p:' || v_owner::text)));

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
       AND (CASE
              WHEN NEW.bookable_id IS NOT NULL THEN b.bookable_id = NEW.bookable_id
              WHEN v_collab IS NOT NULL THEN b.bookable_id IS NULL AND s.collab_id = v_collab
              ELSE b.bookable_id IS NULL AND s.profile_id = v_owner
            END)
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

-- 4b. A band service's requests go to the band's owner, under the band's name
CREATE OR REPLACE FUNCTION public.notify_booking()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_owner  uuid;
  v_name   text;
  v_href   text;
  v_when   text;
  v_collab uuid;
BEGIN
  SELECT owner_profile_id, name INTO v_owner, v_name FROM public.bookables WHERE id = NEW.bookable_id;
  IF v_owner IS NULL AND NEW.service_id IS NOT NULL THEN
    SELECT s.profile_id, s.collab_id INTO v_owner, v_collab
      FROM public.profile_services s WHERE s.id = NEW.service_id;
    IF v_collab IS NOT NULL THEN
      SELECT coalesce(
               (SELECT m.profile_id FROM public.collab_members m
                 WHERE m.collab_id = v_collab AND m.role = 'owner' AND m.status = 'active'
                 LIMIT 1),
               c.created_by),
             c.name
        INTO v_owner, v_name
        FROM public.collabs c WHERE c.id = v_collab;
    ELSE
      v_name := public.display_name_of(v_owner);
    END IF;
  END IF;
  IF v_owner IS NULL THEN
    RETURN NULL;
  END IF;
  v_href := '/business/bookings/requests/' || NEW.id;
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
