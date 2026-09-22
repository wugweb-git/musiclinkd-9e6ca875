-- Owner, 22 Sep 2026: starting a project asks again for what the 18 Sep cut dropped — how you'll
-- work, a start date beside the end date (collabs.ends_on) and a budget. Your own role is stored
-- on your member row (collab_members.instrument, the part you play in it).
-- The budget is for the people in the project only, so it lives in its own table: a public
-- project's row is readable by anyone, its budget only by active members.
-- Snapshot and undo: supabase/dumps/2026-09-22-before-collab-plan.sql

BEGIN;

ALTER TABLE public.collabs
  ADD COLUMN IF NOT EXISTS starts_on date,
  ADD COLUMN IF NOT EXISTS work_mode text;

CREATE TABLE IF NOT EXISTS public.collab_private (
  collab_id uuid PRIMARY KEY REFERENCES public.collabs(id) ON DELETE CASCADE,
  budget_paise bigint CHECK (budget_paise IS NULL OR budget_paise >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.collab_private ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read the budget" ON public.collab_private;
CREATE POLICY "Members read the budget" ON public.collab_private
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.collab_members m
             WHERE m.collab_id = collab_private.collab_id
               AND m.profile_id = auth.uid()
               AND m.status = 'active')
  );

DROP POLICY IF EXISTS "Managers set the budget" ON public.collab_private;
CREATE POLICY "Managers set the budget" ON public.collab_private
  FOR INSERT WITH CHECK (public.collab_can_manage(collab_id));

DROP POLICY IF EXISTS "Managers change the budget" ON public.collab_private;
CREATE POLICY "Managers change the budget" ON public.collab_private
  FOR UPDATE USING (public.collab_can_manage(collab_id))
  WITH CHECK (public.collab_can_manage(collab_id));

GRANT SELECT, INSERT, UPDATE ON public.collab_private TO authenticated;

COMMIT;
