-- Booking requests: someone asks a studio for a room at a time, and the studio answers. No money
-- is involved and none is recorded — MusicLinkd takes no payments (owner, 17 Sep 2026), so the two
-- of them settle that between themselves.
-- Snapshot: supabase/dumps/2026-09-18-before-bookings.sql

BEGIN;

CREATE TABLE IF NOT EXISTS public.booking_requests (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id            uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  room_id              uuid REFERENCES public.studio_rooms(id) ON DELETE SET NULL,
  requester_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  /** The day asked for, and the hours within it. */
  session_date         date NOT NULL,
  start_time           time,
  end_time             time,
  hours                int CHECK (hours > 0 AND hours <= 24),
  people               int CHECK (people > 0 AND people <= 200),
  purpose              text CHECK (length(purpose) <= 120),
  notes                text CHECK (length(notes) <= 1000),
  status               text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'reviewing', 'confirmed', 'declined', 'cancelled', 'completed')),
  /** What the studio wrote back, whichever way it answered. */
  reply                text CHECK (length(reply) <= 1000),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS booking_requests_studio_idx
  ON public.booking_requests (studio_id, session_date);
CREATE INDEX IF NOT EXISTS booking_requests_requester_idx
  ON public.booking_requests (requester_profile_id, created_at DESC);

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- Who owns the studio being asked, in one place.
CREATE OR REPLACE FUNCTION public.studio_is_mine(p_studio_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.studios s
    WHERE s.id = p_studio_id AND s.owner_profile_id = auth.uid());
$fn$;

CREATE POLICY "Requester and studio read" ON public.booking_requests
  FOR SELECT TO authenticated
  USING (requester_profile_id = auth.uid() OR public.studio_is_mine(studio_id));
CREATE POLICY "Ask as yourself" ON public.booking_requests
  FOR INSERT TO authenticated WITH CHECK (requester_profile_id = auth.uid());
-- The studio answers; the requester can only cancel their own.
CREATE POLICY "Studio answers, requester cancels" ON public.booking_requests
  FOR UPDATE TO authenticated
  USING (public.studio_is_mine(studio_id) OR requester_profile_id = auth.uid())
  WITH CHECK (public.studio_is_mine(studio_id) OR requester_profile_id = auth.uid());
CREATE POLICY "Requester removes their own" ON public.booking_requests
  FOR DELETE TO authenticated USING (requester_profile_id = auth.uid());

CREATE OR REPLACE FUNCTION public.booking_requests_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS booking_requests_touch_updated_at ON public.booking_requests;
CREATE TRIGGER booking_requests_touch_updated_at BEFORE UPDATE ON public.booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.booking_requests_touch_updated_at();

COMMIT;
