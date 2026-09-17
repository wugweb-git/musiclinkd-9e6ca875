-- A band is between talents (owner, 18 Sep 2026). A business account — a studio, label, venue —
-- cannot start a band or be a member of one. A project collab is open to both, because a studio or
-- a label belongs in a project.
--
-- An account is a business when it has a profile_business row; everything else is talent.
-- All 11 members of the three bands stored today are talent, so nothing existing breaks.
-- Snapshot: supabase/dumps/2026-09-18-before-band-talent-rule.sql

BEGIN;

CREATE OR REPLACE FUNCTION public.is_talent(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT p_profile_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = p_profile_id)
    AND NOT EXISTS (SELECT 1 FROM public.profile_business b WHERE b.profile_id = p_profile_id);
$fn$;

-- Starting one: a band only by a talent account; a project by anyone signed in.
DROP POLICY IF EXISTS "Creators insert" ON public.collabs;
CREATE POLICY "Creators insert" ON public.collabs
  FOR INSERT TO authenticated WITH CHECK (
    created_by = auth.uid()
    AND (type <> 'band' OR public.is_talent(auth.uid())));

-- Joining one: the same rule for who can be in a band.
DROP POLICY IF EXISTS "Managers add" ON public.collab_members;
CREATE POLICY "Managers add" ON public.collab_members
  FOR INSERT TO authenticated WITH CHECK (
    public.collab_can_manage(collab_id)
    AND (
      public.is_talent(profile_id)
      OR NOT EXISTS (SELECT 1 FROM public.collabs c WHERE c.id = collab_id AND c.type = 'band')
    ));

COMMIT;
