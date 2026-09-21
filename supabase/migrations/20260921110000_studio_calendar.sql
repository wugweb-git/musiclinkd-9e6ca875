-- A real booking calendar for studios. Each studio gets its weekly opening hours
-- (studios.weekly_hours), the owner can close times on top of them (studio_blocks), and the taken
-- times come from the booking requests the studio has confirmed. The public sees only busy
-- intervals through studio_busy(), never who booked or why a time is closed.
-- Times are the studio's own wall clock (all studios are in India today), the same way
-- booking_requests stores session_date + start_time, so nothing here carries a time zone.
-- Backfill: the four studios that came from src/data/booking.ts get the hours its availability
-- calendar used (10:00–20:00; Waveform's room is "Weekdays only", so Mon–Fri); the studios whose
-- operating_hours text states hours get those; every other studio stays '{}' (no calendar, the
-- booking flow keeps sending a plain request).
-- Snapshot: supabase/dumps/2026-09-21-before-studio-calendar.sql
-- Rollback: DROP FUNCTION public.studio_busy(uuid, date, date); DROP TABLE public.studio_blocks;
-- ALTER TABLE public.studios DROP COLUMN weekly_hours;

BEGIN;

-- { "mon": [{ "open": "10:00", "close": "22:00" }], ... } — a missing or empty day is closed.
ALTER TABLE public.studios
  ADD COLUMN IF NOT EXISTS weekly_hours jsonb NOT NULL DEFAULT '{}'::jsonb;
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'studios_weekly_hours_object') THEN
    ALTER TABLE public.studios ADD CONSTRAINT studios_weekly_hours_object
      CHECK (jsonb_typeof(weekly_hours) = 'object');
  END IF;
END
$do$;
-- Written by the owner through the existing "Owners write their own" policy on studios.

-- Times the owner closes on top of the weekly hours: maintenance, a private event, a holiday.
CREATE TABLE IF NOT EXISTS public.studio_blocks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id  uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  /** One room, or the whole studio when null. */
  room_id    uuid REFERENCES public.studio_rooms(id) ON DELETE CASCADE,
  starts_at  timestamp NOT NULL,
  ends_at    timestamp NOT NULL,
  reason     text CHECK (length(reason) <= 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS studio_blocks_studio_idx
  ON public.studio_blocks (studio_id, starts_at);

ALTER TABLE public.studio_blocks ENABLE ROW LEVEL SECURITY;

-- Only the owner reads and writes the rows (the reason is theirs); everyone else sees the closed
-- times through studio_busy() below.
DROP POLICY IF EXISTS "Owner manages their blocks" ON public.studio_blocks;
CREATE POLICY "Owner manages their blocks" ON public.studio_blocks
  FOR ALL TO authenticated
  USING (public.studio_is_mine(studio_id))
  WITH CHECK (public.studio_is_mine(studio_id));

-- The taken and closed times of one studio between two dates, as bare intervals. A confirmed or
-- completed request takes its time; one still waiting on the studio does not, since the studio has
-- not agreed to it. A request with no start time takes the whole day; one with no room, like a
-- block with no room, takes every room.
CREATE OR REPLACE FUNCTION public.studio_busy(p_studio uuid, p_from date, p_to date)
RETURNS TABLE (room_id uuid, starts_at timestamp, ends_at timestamp)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT b.room_id,
         b.session_date + coalesce(b.start_time, time '00:00'),
         CASE
           WHEN b.start_time IS NULL THEN (b.session_date + 1)::timestamp
           ELSE b.session_date + b.start_time
                + CASE
                    WHEN b.end_time IS NOT NULL AND b.end_time > b.start_time
                      THEN b.end_time - b.start_time
                    WHEN b.end_time IS NOT NULL
                      THEN (b.end_time - b.start_time) + interval '1 day'
                    ELSE make_interval(hours => coalesce(b.hours, 1))
                  END
         END
    FROM public.booking_requests b
   WHERE b.studio_id = p_studio
     AND b.status IN ('confirmed', 'completed')
     AND b.session_date BETWEEN p_from - 1 AND p_to
  UNION ALL
  SELECT k.room_id, k.starts_at, k.ends_at
    FROM public.studio_blocks k
   WHERE k.studio_id = p_studio
     AND k.starts_at < (p_to + 1)::timestamp
     AND k.ends_at > p_from::timestamp;
$fn$;

REVOKE ALL ON FUNCTION public.studio_busy(uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.studio_busy(uuid, date, date) TO anon, authenticated;

-- Backfill. Only studios still at '{}' are touched, so a rerun never overwrites an owner's edit.
WITH hours (slug, weekly) AS (VALUES
  -- src/data/booking.ts: its calendar opened every room 10:00–20:00.
  ('octave-sound-labs', '{"mon":[{"open":"10:00","close":"20:00"}],"tue":[{"open":"10:00","close":"20:00"}],"wed":[{"open":"10:00","close":"20:00"}],"thu":[{"open":"10:00","close":"20:00"}],"fri":[{"open":"10:00","close":"20:00"}],"sat":[{"open":"10:00","close":"20:00"}],"sun":[{"open":"10:00","close":"20:00"}]}'),
  ('headroom-mastering', '{"mon":[{"open":"10:00","close":"20:00"}],"tue":[{"open":"10:00","close":"20:00"}],"wed":[{"open":"10:00","close":"20:00"}],"thu":[{"open":"10:00","close":"20:00"}],"fri":[{"open":"10:00","close":"20:00"}],"sat":[{"open":"10:00","close":"20:00"}],"sun":[{"open":"10:00","close":"20:00"}]}'),
  ('basement-jam', '{"mon":[{"open":"10:00","close":"20:00"}],"tue":[{"open":"10:00","close":"20:00"}],"wed":[{"open":"10:00","close":"20:00"}],"thu":[{"open":"10:00","close":"20:00"}],"fri":[{"open":"10:00","close":"20:00"}],"sat":[{"open":"10:00","close":"20:00"}],"sun":[{"open":"10:00","close":"20:00"}]}'),
  -- Its podcast room is "Weekdays only".
  ('waveform-podcast', '{"mon":[{"open":"10:00","close":"20:00"}],"tue":[{"open":"10:00","close":"20:00"}],"wed":[{"open":"10:00","close":"20:00"}],"thu":[{"open":"10:00","close":"20:00"}],"fri":[{"open":"10:00","close":"20:00"}]}'),
  -- operating_hours "9 am – 11 pm".
  ('jam-room-bandra', '{"mon":[{"open":"09:00","close":"23:00"}],"tue":[{"open":"09:00","close":"23:00"}],"wed":[{"open":"09:00","close":"23:00"}],"thu":[{"open":"09:00","close":"23:00"}],"fri":[{"open":"09:00","close":"23:00"}],"sat":[{"open":"09:00","close":"23:00"}],"sun":[{"open":"09:00","close":"23:00"}]}'),
  -- "Mon–Fri: 10:00 – 22:00 / Saturday: 11:00 – 23:00 / Sunday: Closed".
  ('soundhouse-bandra', '{"mon":[{"open":"10:00","close":"22:00"}],"tue":[{"open":"10:00","close":"22:00"}],"wed":[{"open":"10:00","close":"22:00"}],"thu":[{"open":"10:00","close":"22:00"}],"fri":[{"open":"10:00","close":"22:00"}],"sat":[{"open":"11:00","close":"23:00"}]}'),
  -- "09:00 AM – 11:00 PM (Mon–Sat)".
  ('wugweb', '{"mon":[{"open":"09:00","close":"23:00"}],"tue":[{"open":"09:00","close":"23:00"}],"wed":[{"open":"09:00","close":"23:00"}],"thu":[{"open":"09:00","close":"23:00"}],"fri":[{"open":"09:00","close":"23:00"}],"sat":[{"open":"09:00","close":"23:00"}]}'),
  ('yash-raj-sound-studios', '{"mon":[{"open":"09:00","close":"23:00"}],"tue":[{"open":"09:00","close":"23:00"}],"wed":[{"open":"09:00","close":"23:00"}],"thu":[{"open":"09:00","close":"23:00"}],"fri":[{"open":"09:00","close":"23:00"}],"sat":[{"open":"09:00","close":"23:00"}]}')
)
UPDATE public.studios s
   SET weekly_hours = hours.weekly::jsonb
  FROM hours
 WHERE s.slug = hours.slug
   AND s.weekly_hours = '{}'::jsonb;

COMMIT;
