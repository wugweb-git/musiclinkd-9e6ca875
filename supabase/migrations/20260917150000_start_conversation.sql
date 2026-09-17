-- Starting a conversation is one step, not three. Creating the row, adding yourself and adding the
-- other person cannot be done under the members-only policies (there is no membership yet at the
-- moment of the insert), so this does all three as one call and returns the conversation.
-- It still refuses anything but your own account, and it reuses the thread if one already exists.

BEGIN;

CREATE OR REPLACE FUNCTION public.start_conversation(p_other_profile_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_me uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Sign in to start a conversation';
  END IF;
  IF p_other_profile_id = v_me THEN
    RAISE EXCEPTION 'You cannot message yourself';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = p_other_profile_id) THEN
    RAISE EXCEPTION 'No such profile';
  END IF;

  SELECT m.conversation_id INTO v_id
  FROM public.conversation_members m
  JOIN public.conversation_members other
    ON other.conversation_id = m.conversation_id AND other.profile_id = p_other_profile_id
  WHERE m.profile_id = v_me
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.conversations (created_by) VALUES (v_me) RETURNING id INTO v_id;
  INSERT INTO public.conversation_members (conversation_id, profile_id)
  VALUES (v_id, v_me), (v_id, p_other_profile_id);
  RETURN v_id;
END
$fn$;

REVOKE ALL ON FUNCTION public.start_conversation(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.start_conversation(uuid) TO authenticated;

COMMIT;
