-- Starting a project is one step, not two. A private collab is readable only by its members, so at
-- the moment of the insert there is nobody who may read it back — the same problem conversations
-- had. This creates the collab and puts the creator in it as owner, in one call.
--
-- The band rule still holds: only a talent account may start a band (20260918130000).

BEGIN;

CREATE OR REPLACE FUNCTION public.start_collab(
  p_name text,
  p_bio text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_visibility text DEFAULT 'private',
  p_type text DEFAULT 'project',
  p_ends_on date DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_me uuid := auth.uid();
  v_id uuid;
  v_slug text;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Sign in to start a collaboration';
  END IF;
  IF p_type NOT IN ('band', 'project') THEN
    RAISE EXCEPTION 'A collab is a band or a project';
  END IF;
  IF p_type = 'band' AND NOT public.is_talent(v_me) THEN
    RAISE EXCEPTION 'A band is between talent accounts';
  END IF;
  IF p_visibility NOT IN ('public', 'private') THEN
    RAISE EXCEPTION 'Visibility is public or private';
  END IF;
  IF length(btrim(coalesce(p_name, ''))) < 2 THEN
    RAISE EXCEPTION 'Give it a name';
  END IF;

  -- The slug people see, with a short suffix so two projects can share a name.
  v_slug := left(regexp_replace(lower(btrim(p_name)), '[^a-z0-9]+', '-', 'g'), 48);
  v_slug := btrim(v_slug, '-');
  IF v_slug = '' THEN
    v_slug := p_type;
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
$fn$;

REVOKE ALL ON FUNCTION public.start_collab(text, text, text, text, text, date) FROM public;
GRANT EXECUTE ON FUNCTION public.start_collab(text, text, text, text, text, date) TO authenticated;

COMMIT;
