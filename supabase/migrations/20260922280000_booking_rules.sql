-- A studio's booking rules on top of its weekly hours: how much notice it needs before a session
-- (studios.notice_hours) and the whole days it is closed (studios.blackout_dates). The booking
-- calendar offers no slot that starts inside the notice window or falls on a blackout day, and a
-- request for one is refused. Both are written by the owner through the existing
-- "Owners write their own" policy on studios and read with the rest of the studio.
-- Snapshot: supabase/dumps/2026-09-22-before-booking-rules.sql
-- Rollback: ALTER TABLE public.studios DROP COLUMN notice_hours, DROP COLUMN blackout_dates;

BEGIN;

ALTER TABLE public.studios
  ADD COLUMN IF NOT EXISTS notice_hours integer NOT NULL DEFAULT 0,
  -- [{ "from": "2026-12-24", "to": "2026-12-26" }], both days included.
  ADD COLUMN IF NOT EXISTS blackout_dates jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.studios DROP CONSTRAINT IF EXISTS studios_notice_hours_range;
ALTER TABLE public.studios ADD CONSTRAINT studios_notice_hours_range
  CHECK (notice_hours BETWEEN 0 AND 720);
ALTER TABLE public.studios DROP CONSTRAINT IF EXISTS studios_blackout_dates_array;
ALTER TABLE public.studios ADD CONSTRAINT studios_blackout_dates_array
  CHECK (jsonb_typeof(blackout_dates) = 'array');

COMMIT;
