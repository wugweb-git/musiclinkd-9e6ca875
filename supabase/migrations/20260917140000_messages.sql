-- Messages: a conversation between two people (members, so a group thread is possible later) and
-- the messages in it. Anyone signed in can open a conversation with a profile they can see — the
-- Message button is on every profile, not only on connections.
-- Additive: no existing table is touched. Snapshot: supabase/dumps/2026-09-17-before-messages.sql

BEGIN;

CREATE TABLE IF NOT EXISTS public.conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  profile_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, profile_id)
);
CREATE INDEX IF NOT EXISTS conversation_members_profile_idx ON public.conversation_members (profile_id);

CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body            text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 4000),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON public.messages (conversation_id, created_at);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Membership decides everything, and is checked in one place.
CREATE OR REPLACE FUNCTION public.conversation_has_member(p_conversation_id uuid, p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members m
    WHERE m.conversation_id = p_conversation_id AND m.profile_id = p_profile_id);
$fn$;

CREATE POLICY "Members read" ON public.conversations
  FOR SELECT TO authenticated USING (public.conversation_has_member(id, auth.uid()));
CREATE POLICY "Start as yourself" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Members touch" ON public.conversations
  FOR UPDATE TO authenticated USING (public.conversation_has_member(id, auth.uid()))
  WITH CHECK (public.conversation_has_member(id, auth.uid()));

CREATE POLICY "Members read the roster" ON public.conversation_members
  FOR SELECT TO authenticated USING (public.conversation_has_member(conversation_id, auth.uid()));
-- You add yourself when you start one, and the person you are writing to.
CREATE POLICY "Starter adds" ON public.conversation_members
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id AND c.created_by = auth.uid())
    OR public.conversation_has_member(conversation_id, auth.uid()));
CREATE POLICY "Mark your own read" ON public.conversation_members
  FOR UPDATE TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Leave your own" ON public.conversation_members
  FOR DELETE TO authenticated USING (profile_id = auth.uid());

CREATE POLICY "Members read messages" ON public.messages
  FOR SELECT TO authenticated USING (public.conversation_has_member(conversation_id, auth.uid()));
CREATE POLICY "Members write as themselves" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND public.conversation_has_member(conversation_id, auth.uid()));
CREATE POLICY "Senders delete their own" ON public.messages
  FOR DELETE TO authenticated USING (sender_id = auth.uid());

-- A sent message moves its conversation to the top of the list.
CREATE OR REPLACE FUNCTION public.messages_touch_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS messages_touch_conversation ON public.messages;
CREATE TRIGGER messages_touch_conversation AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.messages_touch_conversation();

COMMIT;
