-- Queue item 7 (owner, 4 Oct 2026): Collaboration types are Band, Duo, Collective, Ensemble,
-- Production Team and Crew. `project` is not a Collaboration type: a one-off creative project is
-- proof of work and lives in Portfolio → Project.
--
--   1. Delete the two `project` rows (test data: ghvb-f1ed6, jnb-e29f5; creator-only, no messages).
--      Their members, invite links and private rows cascade. Fails if anything else would go.
--   2. collabs.type takes the six types; no `project`.
--   3. start_collab / join_collab_by_link take the six types; every collaboration is between talent
--      accounts (owner, 28 Sep: a business can only view a band, never be part of one).
-- Both functions are checked against their md5 in the snapshot first.
--
-- Snapshot: supabase/dumps/2026-10-04-before-collab-types.sql

BEGIN;

DO $guard$
DECLARE
  n int;
BEGIN
  IF (SELECT md5(prosrc) FROM pg_proc WHERE proname = 'start_collab'
        AND pronamespace = 'public'::regnamespace) <> '1aab2bfce1c5b2c02a07a37ee117591f'
     OR (SELECT md5(prosrc) FROM pg_proc WHERE proname = 'join_collab_by_link'
        AND pronamespace = 'public'::regnamespace) <> '8bfdf6c7eaf4662aec4b8b42fd7d81e4' THEN
    RAISE EXCEPTION 'start_collab or join_collab_by_link changed since the snapshot';
  END IF;
  SELECT count(*) INTO n FROM public.collabs WHERE type = 'project';
  IF n <> 2 OR EXISTS (SELECT 1 FROM public.collabs WHERE type = 'project'
                        AND slug NOT IN ('ghvb-f1ed6', 'jnb-e29f5')) THEN
    RAISE EXCEPTION 'Expected exactly the 2 test project rows; found %', n;
  END IF;
END
$guard$;

DELETE FROM public.collabs WHERE type = 'project' AND slug IN ('ghvb-f1ed6', 'jnb-e29f5');

ALTER TABLE public.collabs DROP CONSTRAINT collabs_type_check;
ALTER TABLE public.collabs ADD CONSTRAINT collabs_type_check
  CHECK (type IN ('band', 'duo', 'collective', 'ensemble', 'production_team', 'crew'));

CREATE OR REPLACE FUNCTION public.start_collab(
  p_name text, p_bio text, p_city text, p_visibility text, p_type text, p_ends_on date)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_me uuid := auth.uid();
  v_id uuid;
  v_slug text;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Sign in to start a collaboration';
  END IF;
  IF p_type NOT IN ('band', 'duo', 'collective', 'ensemble', 'production_team', 'crew') THEN
    RAISE EXCEPTION 'A collaboration is a band, duo, collective, ensemble, production team or crew';
  END IF;
  IF NOT public.is_talent(v_me) THEN
    RAISE EXCEPTION 'A collaboration is between talent accounts';
  END IF;
  IF p_visibility NOT IN ('public', 'private') THEN
    RAISE EXCEPTION 'Visibility is public or private';
  END IF;
  IF length(btrim(coalesce(p_name, ''))) < 2 THEN
    RAISE EXCEPTION 'Give it a name';
  END IF;

  v_slug := left(regexp_replace(lower(btrim(p_name)), '[^a-z0-9]+', '-', 'g'), 48);
  v_slug := btrim(v_slug, '-');
  IF v_slug = '' THEN
    v_slug := replace(p_type, '_', '-');
  END IF;
  v_slug := v_slug || '-' || substr(md5(gen_random_uuid()::text), 1, 5);

  INSERT INTO public.collabs (type, slug, name, bio, city, visibility, ends_on, created_by)
  VALUES (p_type, v_slug, btrim(p_name), nullif(btrim(coalesce(p_bio, '')), ''),
          nullif(btrim(coalesce(p_city, '')), ''), p_visibility, p_ends_on, v_me)
  RETURNING id INTO v_id;

  INSERT INTO public.collab_members (collab_id, profile_id, role)
  VALUES (v_id, v_me, 'owner');

  RETURN v_id;
END
$$;

CREATE OR REPLACE FUNCTION public.join_collab_by_link(p_token text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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
  IF NOT public.is_talent(v_me) THEN
    RAISE EXCEPTION 'A collaboration is between talent accounts';
  END IF;

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
$$;

COMMIT;

NOTIFY pgrst, 'reload schema';
