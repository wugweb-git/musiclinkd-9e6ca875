-- A band's showcase: a photo gallery on the band page's Overview, like a business page's Showcase.
--
--   collab_gallery   one row per photo, in sort_order; the first photo leads
--
-- The files go in the gallery bucket (20260921160000_gallery_uploads.sql), in the uploading
-- manager's own folder, as a person's gallery does. Reads follow the collab (public for a public
-- band). Adding, reordering and removing photos is for the band's owner and admins
-- (collab_can_manage). The photo cap per band is kept by the app (src/lib/bands.functions.ts).
-- Starts empty: no photos are added for any band.
-- Additive: no existing row, column, function or policy is changed.
-- Snapshot: supabase/dumps/2026-09-22-before-band-showcase.sql
-- Rollback:
--   DROP TABLE IF EXISTS public.collab_gallery;

BEGIN;

CREATE TABLE IF NOT EXISTS public.collab_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collab_id uuid NOT NULL REFERENCES public.collabs (id) ON DELETE CASCADE,
  image_url text NOT NULL CHECK (image_url ~ '^https://' AND length(image_url) <= 1000),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS collab_gallery_collab_idx
  ON public.collab_gallery (collab_id, sort_order);

ALTER TABLE public.collab_gallery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Readable with the collab" ON public.collab_gallery;
CREATE POLICY "Readable with the collab" ON public.collab_gallery
  FOR SELECT TO public USING (public.collab_is_readable(collab_id));
DROP POLICY IF EXISTS "Managers add" ON public.collab_gallery;
CREATE POLICY "Managers add" ON public.collab_gallery
  FOR INSERT TO authenticated WITH CHECK (public.collab_can_manage(collab_id));
DROP POLICY IF EXISTS "Managers update" ON public.collab_gallery;
CREATE POLICY "Managers update" ON public.collab_gallery
  FOR UPDATE TO authenticated
  USING (public.collab_can_manage(collab_id)) WITH CHECK (public.collab_can_manage(collab_id));
DROP POLICY IF EXISTS "Managers remove" ON public.collab_gallery;
CREATE POLICY "Managers remove" ON public.collab_gallery
  FOR DELETE TO authenticated USING (public.collab_can_manage(collab_id));

GRANT SELECT ON public.collab_gallery TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.collab_gallery TO authenticated;

COMMIT;
