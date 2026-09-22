-- A project's join link (owner, 22 Sep 2026: the invite link comes back, on the database).
--
-- One link per collab. Owners and admins create it, copy or share it, and turn it off. Opening
-- /collab/join/<token> while signed in runs join_collab_by_link:
--   * "Owner approves each join" on  -> the person is added as 'invited' with invited_by = themselves
--     (a request); an owner or admin lets them in.
--   * "Owner approves each join" off -> the person is added as 'active', invited_by = who made the link.
-- Snapshot taken first: supabase/dumps/2026-09-22-before-collab-invite-links.sql

CREATE TABLE IF NOT EXISTS public.collab_invite_links (
  collab_id uuid PRIMARY KEY REFERENCES public.collabs(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  active boolean NOT NULL DEFAULT true,
  needs_approval boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT collab_invite_links_token_check CHECK (token ~ '^[a-z0-9]{16,64}$')
);

ALTER TABLE public.collab_invite_links ENABLE ROW LEVEL SECURITY;

-- Only the people who run the collab see or set the token.
DROP POLICY IF EXISTS "Managers read the link" ON public.collab_invite_links;
CREATE POLICY "Managers read the link" ON public.collab_invite_links
  FOR SELECT USING (public.collab_can_manage(collab_id));
DROP POLICY IF EXISTS "Managers make the link" ON public.collab_invite_links;
CREATE POLICY "Managers make the link" ON public.collab_invite_links
  FOR INSERT WITH CHECK (public.collab_can_manage(collab_id));
DROP POLICY IF EXISTS "Managers change the link" ON public.collab_invite_links;
CREATE POLICY "Managers change the link" ON public.collab_invite_links
  FOR UPDATE USING (public.collab_can_manage(collab_id))
  WITH CHECK (public.collab_can_manage(collab_id));
DROP POLICY IF EXISTS "Managers remove the link" ON public.collab_invite_links;
CREATE POLICY "Managers remove the link" ON public.collab_invite_links
  FOR DELETE USING (public.collab_can_manage(collab_id));

REVOKE ALL ON public.collab_invite_links FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collab_invite_links TO authenticated;

DROP TRIGGER IF EXISTS update_collab_invite_links_updated_at ON public.collab_invite_links;
CREATE TRIGGER update_collab_invite_links_updated_at
  BEFORE UPDATE ON public.collab_invite_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Join by link. Runs as the database so a private collab can be joined without being readable first.
CREATE OR REPLACE FUNCTION public.join_collab_by_link(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_me uuid := auth.uid();
  v_link record;
  v_existing text;
  v_status text;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Sign in to join';
  END IF;

  SELECT l.collab_id, l.active, l.needs_approval, l.created_by, c.type
    INTO v_link
    FROM public.collab_invite_links l
    JOIN public.collabs c ON c.id = l.collab_id
   WHERE l.token = p_token;
  IF NOT FOUND OR NOT v_link.active THEN
    RAISE EXCEPTION 'This link is turned off or no longer works';
  END IF;
  IF v_link.type = 'band' AND NOT public.is_talent(v_me) THEN
    RAISE EXCEPTION 'A band is between talent accounts';
  END IF;

  -- Already in it, or already asked: nothing changes.
  SELECT status INTO v_existing
    FROM public.collab_members
   WHERE collab_id = v_link.collab_id AND profile_id = v_me;
  IF FOUND THEN
    RETURN jsonb_build_object('collab_id', v_link.collab_id, 'status', v_existing, 'new', false);
  END IF;

  v_status := CASE WHEN v_link.needs_approval THEN 'invited' ELSE 'active' END;
  INSERT INTO public.collab_members (collab_id, profile_id, role, status, invited_by, sort_order)
  VALUES (
    v_link.collab_id, v_me, 'member', v_status,
    CASE WHEN v_link.needs_approval THEN v_me ELSE v_link.created_by END,
    coalesce((SELECT max(sort_order) + 1 FROM public.collab_members
               WHERE collab_id = v_link.collab_id), 0)
  );

  RETURN jsonb_build_object('collab_id', v_link.collab_id, 'status', v_status, 'new', true);
END
$function$;

REVOKE ALL ON FUNCTION public.join_collab_by_link(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.join_collab_by_link(text) TO authenticated;

-- A request to join (invited_by = the person themselves) waits for an owner or admin, and someone
-- who does not run the collab cannot change who asked them, their standing or which row it is.
CREATE OR REPLACE FUNCTION public.collab_members_guard_self()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND NOT public.collab_can_manage(OLD.collab_id) THEN
    IF NEW.collab_id <> OLD.collab_id
       OR NEW.profile_id <> OLD.profile_id
       OR NEW.role IS DISTINCT FROM OLD.role
       OR NEW.invited_by IS DISTINCT FROM OLD.invited_by THEN
      RAISE EXCEPTION 'Only an owner or admin can change that';
    END IF;
    IF OLD.status = 'invited' AND NEW.status = 'active' AND OLD.invited_by = OLD.profile_id THEN
      RAISE EXCEPTION 'An owner or admin lets you in';
    END IF;
  END IF;
  RETURN NEW;
END
$function$;

DROP TRIGGER IF EXISTS collab_members_guard_self ON public.collab_members;
CREATE TRIGGER collab_members_guard_self
  BEFORE UPDATE ON public.collab_members
  FOR EACH ROW EXECUTE FUNCTION public.collab_members_guard_self();

-- Notices: a request tells the owner; letting someone in tells them; a link join tells who made it.
CREATE OR REPLACE FUNCTION public.notify_collab_member()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_collab record;
  v_owner uuid;
BEGIN
  SELECT id, name, type INTO v_collab FROM public.collabs WHERE id = NEW.collab_id;

  IF TG_OP = 'INSERT' AND NEW.status = 'invited' AND NEW.invited_by = NEW.profile_id THEN
    SELECT profile_id INTO v_owner FROM public.collab_members
     WHERE collab_id = NEW.collab_id AND role = 'owner' AND status = 'active' LIMIT 1;
    PERFORM public.notify(v_owner, NEW.profile_id, 'collab_invite',
      public.display_name_of(NEW.profile_id) || ' asked to join ' || v_collab.name,
      'Open it to let them in or say no.', '/collab/' || v_collab.id);
  ELSIF TG_OP = 'INSERT' AND NEW.status = 'invited' THEN
    PERFORM public.notify(NEW.profile_id, NEW.invited_by, 'collab_invite',
      public.display_name_of(NEW.invited_by) || ' invited you to ' || v_collab.name,
      'Open it to join or say no.', '/collab/' || v_collab.id);
  ELSIF TG_OP = 'INSERT' AND NEW.status = 'active' AND NEW.invited_by IS NOT NULL THEN
    PERFORM public.notify(NEW.invited_by, NEW.profile_id, 'collab_joined',
      public.display_name_of(NEW.profile_id) || ' joined ' || v_collab.name,
      NULL, '/collab/' || v_collab.id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status = 'invited'
        AND NEW.invited_by = NEW.profile_id THEN
    PERFORM public.notify(NEW.profile_id, auth.uid(), 'collab_joined',
      'You are in ' || v_collab.name,
      NULL, '/collab/' || v_collab.id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status = 'invited' THEN
    PERFORM public.notify(NEW.invited_by, NEW.profile_id, 'collab_joined',
      public.display_name_of(NEW.profile_id) || ' joined ' || v_collab.name,
      NULL, '/collab/' || v_collab.id);
  END IF;
  RETURN NULL;
END
$function$;
