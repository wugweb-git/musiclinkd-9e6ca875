-- Two things a collab needed.
--
-- 1. Being added is an invitation, not a fact (owner, 18 Sep 2026). A person is invited, told about
--    it, and decides. Until they accept they are not in the room.
-- 2. A project says what kind of project it is, from the taxonomy's project_types (Song, Album, EP,
--    Podcast, DJ Mix, Film Score, Commercial Jingle, Live Performance, Music Video, Custom) rather
--    than a list written in the app.
--
-- The 11 members stored today are people who are in their bands, so they become 'active'.
-- Snapshot: supabase/dumps/2026-09-18-before-collab-invites.sql

BEGIN;

-- ===== 1. INVITATIONS =====

ALTER TABLE public.collab_members
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('invited', 'active')),
  ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Only people who have accepted count as being in the collab.
CREATE OR REPLACE FUNCTION public.collab_can_write(p_collab_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.collabs c WHERE c.id = p_collab_id AND c.created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM public.collab_members m
               WHERE m.collab_id = p_collab_id AND m.profile_id = auth.uid() AND m.status = 'active'));
$fn$;

CREATE OR REPLACE FUNCTION public.collab_can_manage(p_collab_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.collabs c WHERE c.id = p_collab_id AND c.created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM public.collab_members m
               WHERE m.collab_id = p_collab_id AND m.profile_id = auth.uid()
                 AND m.status = 'active' AND m.role IN ('owner', 'admin')));
$fn$;

-- An invited person can see the collab they were invited to, so they can decide.
CREATE OR REPLACE FUNCTION public.collab_is_readable(p_collab_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.collabs c WHERE c.id = p_collab_id AND c.visibility = 'public')
    OR public.collab_can_write(p_collab_id)
    OR EXISTS (SELECT 1 FROM public.collab_members m
               WHERE m.collab_id = p_collab_id AND m.profile_id = auth.uid());
$fn$;

DROP POLICY IF EXISTS "Public collabs readable, private to members" ON public.collabs;
CREATE POLICY "Public collabs readable, private to members" ON public.collabs
  FOR SELECT TO public USING (visibility = 'public' OR public.collab_is_readable(id));

-- The invited person answers their own row; a manager still sets roles and takes people out.
DROP POLICY IF EXISTS "Managers update" ON public.collab_members;
CREATE POLICY "Managers update" ON public.collab_members
  FOR UPDATE TO authenticated
  USING (public.collab_can_manage(collab_id) OR profile_id = auth.uid())
  WITH CHECK (public.collab_can_manage(collab_id) OR profile_id = auth.uid());

-- Being told: one notification to the person invited.
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check CHECK (kind IN (
  'connection_request', 'connection_accepted', 'message',
  'application_received', 'application_status',
  'booking_requested', 'booking_answered',
  'review_received', 'review_reply',
  'collab_invite', 'collab_joined'));

CREATE OR REPLACE FUNCTION public.notify_collab_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_collab record;
BEGIN
  SELECT id, name, type INTO v_collab FROM public.collabs WHERE id = NEW.collab_id;

  IF TG_OP = 'INSERT' AND NEW.status = 'invited' THEN
    PERFORM public.notify(NEW.profile_id, NEW.invited_by, 'collab_invite',
      public.display_name_of(NEW.invited_by) || ' invited you to ' || v_collab.name,
      'Open it to join or say no.', '/collab/' || v_collab.id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status = 'invited' THEN
    -- Whoever asked them hears that they said yes.
    PERFORM public.notify(NEW.invited_by, NEW.profile_id, 'collab_joined',
      public.display_name_of(NEW.profile_id) || ' joined ' || v_collab.name,
      NULL, '/collab/' || v_collab.id);
  END IF;
  RETURN NULL;
END
$fn$;

DROP TRIGGER IF EXISTS notify_collab_member ON public.collab_members;
CREATE TRIGGER notify_collab_member
  AFTER INSERT OR UPDATE OF status ON public.collab_members
  FOR EACH ROW EXECUTE FUNCTION public.notify_collab_member();

-- ===== 2. WHAT KIND OF PROJECT =====

ALTER TABLE public.collabs
  ADD COLUMN IF NOT EXISTS project_type text;

COMMENT ON COLUMN public.collabs.project_type IS
  'taxonomy_options slug in category project_types. Null for a band, and for a project that has not said.';

COMMIT;
