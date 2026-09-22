-- A band's technical rider, stage plot and live performance videos, the three sections the first
-- band page (src/routes/band.tsx, 11 Aug) had and the 13 Sep redirect dropped.
--
--   collabs.rider            one line each: backline, inputs, monitors, power, anything else
--   collabs.stage_plot_url   an uploaded image of the stage layout
--   collabs.stage_plot_note  a short note under it
--   collab_live_videos       links to live videos (YouTube or any https link), each with a title
--
-- Everything starts empty; the bands' owners fill them in from Manage band and the portfolio.
-- Reads follow the collab (public for a public band). Writes are for the band's owner and admins
-- (collab_can_manage): a plain member can already update collabs, so a trigger keeps the three
-- new columns to managers.
-- Additive: no existing row, column, function or policy is changed.
-- Snapshot: supabase/dumps/2026-09-22-before-band-rider-stage-plot-live-videos.sql
-- Rollback:
--   DROP TABLE IF EXISTS public.collab_live_videos;
--   DROP TRIGGER IF EXISTS collabs_guard_manager_fields ON public.collabs;
--   DROP FUNCTION IF EXISTS public.collabs_guard_manager_fields();
--   ALTER TABLE public.collabs DROP COLUMN IF EXISTS rider,
--     DROP COLUMN IF EXISTS stage_plot_url, DROP COLUMN IF EXISTS stage_plot_note;

BEGIN;

-- ===== RIDER AND STAGE PLOT =====

ALTER TABLE public.collabs
  ADD COLUMN IF NOT EXISTS rider text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS stage_plot_url text,
  ADD COLUMN IF NOT EXISTS stage_plot_note text;

ALTER TABLE public.collabs DROP CONSTRAINT IF EXISTS collabs_rider_size;
ALTER TABLE public.collabs ADD CONSTRAINT collabs_rider_size
  CHECK (cardinality(rider) <= 40);
ALTER TABLE public.collabs DROP CONSTRAINT IF EXISTS collabs_stage_plot_url_https;
ALTER TABLE public.collabs ADD CONSTRAINT collabs_stage_plot_url_https
  CHECK (stage_plot_url IS NULL OR (stage_plot_url ~ '^https://' AND length(stage_plot_url) <= 500));
ALTER TABLE public.collabs DROP CONSTRAINT IF EXISTS collabs_stage_plot_note_length;
ALTER TABLE public.collabs ADD CONSTRAINT collabs_stage_plot_note_length
  CHECK (stage_plot_note IS NULL OR length(stage_plot_note) <= 500);

-- Only the band's owner and admins change the rider and stage plot.
CREATE OR REPLACE FUNCTION public.collabs_guard_manager_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') IN ('authenticated', 'anon')
     AND (NEW.rider IS DISTINCT FROM OLD.rider
          OR NEW.stage_plot_url IS DISTINCT FROM OLD.stage_plot_url
          OR NEW.stage_plot_note IS DISTINCT FROM OLD.stage_plot_note)
     AND NOT public.collab_can_manage(NEW.id) THEN
    RAISE EXCEPTION 'Only the band''s owner or an admin can change the rider and stage plot';
  END IF;
  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS collabs_guard_manager_fields ON public.collabs;
CREATE TRIGGER collabs_guard_manager_fields
  BEFORE UPDATE ON public.collabs
  FOR EACH ROW EXECUTE FUNCTION public.collabs_guard_manager_fields();

-- ===== LIVE VIDEOS =====

CREATE TABLE IF NOT EXISTS public.collab_live_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collab_id uuid NOT NULL REFERENCES public.collabs (id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 120),
  url text NOT NULL CHECK (url ~ '^https://' AND length(url) <= 500),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS collab_live_videos_collab_idx
  ON public.collab_live_videos (collab_id, sort_order);

ALTER TABLE public.collab_live_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Readable with the collab" ON public.collab_live_videos;
CREATE POLICY "Readable with the collab" ON public.collab_live_videos
  FOR SELECT TO public USING (public.collab_is_readable(collab_id));
DROP POLICY IF EXISTS "Managers add" ON public.collab_live_videos;
CREATE POLICY "Managers add" ON public.collab_live_videos
  FOR INSERT TO authenticated WITH CHECK (public.collab_can_manage(collab_id));
DROP POLICY IF EXISTS "Managers update" ON public.collab_live_videos;
CREATE POLICY "Managers update" ON public.collab_live_videos
  FOR UPDATE TO authenticated
  USING (public.collab_can_manage(collab_id)) WITH CHECK (public.collab_can_manage(collab_id));
DROP POLICY IF EXISTS "Managers remove" ON public.collab_live_videos;
CREATE POLICY "Managers remove" ON public.collab_live_videos
  FOR DELETE TO authenticated USING (public.collab_can_manage(collab_id));

GRANT SELECT ON public.collab_live_videos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.collab_live_videos TO authenticated;

COMMIT;
