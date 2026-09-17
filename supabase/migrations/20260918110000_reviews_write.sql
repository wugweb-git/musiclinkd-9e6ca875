-- Writing a review. Until now reviews could only be read.
--
-- A review follows real work: you can review a studio you have a confirmed or completed session
-- with, and a person you have an accepted application with (either way round — the poster who
-- accepted you, or the applicant you accepted). Nothing else earns one, so a review cannot be
-- written about a stranger. One review per pair, and the reviewed party may reply once.
-- Snapshot: supabase/dumps/2026-09-18-before-reviews.sql

BEGIN;

CREATE OR REPLACE FUNCTION public.can_review_profile(p_target_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT auth.uid() IS NOT NULL AND p_target_profile_id <> auth.uid() AND EXISTS (
    SELECT 1
    FROM public.opportunity_applications a
    JOIN public.opportunities o ON o.id = a.opportunity_id
    WHERE a.status = 'accepted'
      AND ((a.applicant_profile_id = auth.uid() AND o.creator_profile_id = p_target_profile_id)
        OR (o.creator_profile_id = auth.uid() AND a.applicant_profile_id = p_target_profile_id)));
$fn$;

CREATE OR REPLACE FUNCTION public.can_review_studio(p_studio_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.booking_requests b
    WHERE b.studio_id = p_studio_id
      AND b.requester_profile_id = auth.uid()
      AND b.status IN ('confirmed', 'completed'));
$fn$;

-- One review per person per subject, whichever kind of subject it is.
CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_profile
  ON public.reviews (author_profile_id, target_profile_id)
  WHERE author_profile_id IS NOT NULL AND target_profile_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_studio
  ON public.reviews (author_profile_id, target_studio_id)
  WHERE author_profile_id IS NOT NULL AND target_studio_id IS NOT NULL;

CREATE POLICY "Write about work you have done" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (
    author_profile_id = auth.uid()
    AND rating >= 1 AND rating <= 5
    AND (
      (target_profile_id IS NOT NULL AND public.can_review_profile(target_profile_id))
      OR (target_studio_id IS NOT NULL AND public.can_review_studio(target_studio_id))
    ));

CREATE POLICY "Authors edit their own" ON public.reviews
  FOR UPDATE TO authenticated
  USING (author_profile_id = auth.uid())
  WITH CHECK (author_profile_id = auth.uid());

-- The person or studio reviewed can answer publicly.
CREATE POLICY "The reviewed may reply" ON public.reviews
  FOR UPDATE TO authenticated
  USING (target_profile_id = auth.uid() OR public.studio_is_mine(target_studio_id))
  WITH CHECK (target_profile_id = auth.uid() OR public.studio_is_mine(target_studio_id));

CREATE POLICY "Authors remove their own" ON public.reviews
  FOR DELETE TO authenticated USING (author_profile_id = auth.uid());

COMMIT;
