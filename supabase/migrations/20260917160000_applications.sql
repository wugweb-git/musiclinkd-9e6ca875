-- Applying to an opportunity. One application per person per opportunity; the poster reads all of
-- theirs and moves them along, the applicant reads and withdraws their own.
-- Snapshot: supabase/dumps/2026-09-17-before-applications.sql

BEGIN;

CREATE TABLE IF NOT EXISTS public.opportunity_applications (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id       uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  applicant_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message              text CHECK (length(message) <= 2000),
  /** Portfolio items sent with the application, in the order they were picked. */
  portfolio_item_ids   uuid[] NOT NULL DEFAULT '{}',
  status               text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn')),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (opportunity_id, applicant_profile_id)
);
CREATE INDEX IF NOT EXISTS applications_opportunity_idx
  ON public.opportunity_applications (opportunity_id, status);
CREATE INDEX IF NOT EXISTS applications_applicant_idx
  ON public.opportunity_applications (applicant_profile_id, created_at DESC);

ALTER TABLE public.opportunity_applications ENABLE ROW LEVEL SECURITY;

-- Who posted the opportunity, in one place.
CREATE OR REPLACE FUNCTION public.opportunity_is_mine(p_opportunity_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.opportunities o
    WHERE o.id = p_opportunity_id AND o.creator_profile_id = auth.uid());
$fn$;

CREATE POLICY "Applicant and poster read" ON public.opportunity_applications
  FOR SELECT TO authenticated
  USING (applicant_profile_id = auth.uid() OR public.opportunity_is_mine(opportunity_id));
CREATE POLICY "Apply as yourself" ON public.opportunity_applications
  FOR INSERT TO authenticated WITH CHECK (applicant_profile_id = auth.uid());
-- The poster moves it along; the applicant can only withdraw their own.
CREATE POLICY "Poster decides, applicant withdraws" ON public.opportunity_applications
  FOR UPDATE TO authenticated
  USING (public.opportunity_is_mine(opportunity_id) OR applicant_profile_id = auth.uid())
  WITH CHECK (public.opportunity_is_mine(opportunity_id) OR applicant_profile_id = auth.uid());
CREATE POLICY "Applicant removes their own" ON public.opportunity_applications
  FOR DELETE TO authenticated USING (applicant_profile_id = auth.uid());

CREATE OR REPLACE FUNCTION public.applications_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS applications_touch_updated_at ON public.opportunity_applications;
CREATE TRIGGER applications_touch_updated_at BEFORE UPDATE ON public.opportunity_applications
  FOR EACH ROW EXECUTE FUNCTION public.applications_touch_updated_at();

-- opportunities.applicant_count is what every list shows, so the table keeps it true rather than
-- each screen counting rows it is not allowed to read.
CREATE OR REPLACE FUNCTION public.applications_count_opportunity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_id uuid := coalesce(NEW.opportunity_id, OLD.opportunity_id);
BEGIN
  UPDATE public.opportunities o
  SET applicant_count = (
    SELECT count(*) FROM public.opportunity_applications a
    WHERE a.opportunity_id = v_id AND a.status <> 'withdrawn')
  WHERE o.id = v_id;
  RETURN NULL;
END
$fn$;

DROP TRIGGER IF EXISTS applications_count_opportunity ON public.opportunity_applications;
CREATE TRIGGER applications_count_opportunity
  AFTER INSERT OR UPDATE OF status OR DELETE ON public.opportunity_applications
  FOR EACH ROW EXECUTE FUNCTION public.applications_count_opportunity();

COMMIT;
