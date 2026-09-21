-- The collab room's own thread. The room says "who is in it, what it is, and where to talk"; until
-- now "where to talk" was a link to the general Messages list, which has no thread for the room.
-- This adds one: collab_messages, one row per message, read and written by the people who are in
-- the collab (active members and its creator, public.collab_can_write) — invited people read it
-- once they have said yes, like everything else in a private room.
--
-- It is its own table rather than a group row in conversations: start_conversation reuses any
-- conversation two people share, so a room thread there would swallow their one-to-one messages.
--
-- Each message tells the other people in the room, with the existing 'message' notification kind
-- (no change to notifications_kind_check), linking to /collab/<id>.
--
-- Additive: no existing table, row, function or policy is changed.
-- Snapshot: supabase/dumps/2026-09-21-before-collab-complete.sql
--
-- Rollback:
--   DROP TRIGGER IF EXISTS notify_collab_message ON public.collab_messages;
--   DROP FUNCTION IF EXISTS public.notify_collab_message();
--   DROP TABLE IF EXISTS public.collab_messages;

BEGIN;

CREATE TABLE IF NOT EXISTS public.collab_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collab_id  uuid NOT NULL REFERENCES public.collabs(id) ON DELETE CASCADE,
  sender_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body       text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS collab_messages_collab_idx ON public.collab_messages (collab_id, created_at);

ALTER TABLE public.collab_messages ENABLE ROW LEVEL SECURITY;

-- Same rule as the room: the people in it (collab_can_write = creator or an active member).
DROP POLICY IF EXISTS "People in the collab read" ON public.collab_messages;
CREATE POLICY "People in the collab read" ON public.collab_messages
  FOR SELECT TO authenticated USING (public.collab_can_write(collab_id));
DROP POLICY IF EXISTS "People in the collab write as themselves" ON public.collab_messages;
CREATE POLICY "People in the collab write as themselves" ON public.collab_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.collab_can_write(collab_id));
DROP POLICY IF EXISTS "Senders delete their own" ON public.collab_messages;
CREATE POLICY "Senders delete their own" ON public.collab_messages
  FOR DELETE TO authenticated USING (sender_id = auth.uid());

-- Everyone else in the room hears about it.
CREATE OR REPLACE FUNCTION public.notify_collab_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_name text;
  member record;
BEGIN
  SELECT name INTO v_name FROM public.collabs WHERE id = NEW.collab_id;
  FOR member IN
    SELECT m.profile_id FROM public.collab_members m
    WHERE m.collab_id = NEW.collab_id AND m.status = 'active' AND m.profile_id <> NEW.sender_id
  LOOP
    PERFORM public.notify(member.profile_id, NEW.sender_id, 'message',
      public.display_name_of(NEW.sender_id) || ' wrote in ' || v_name,
      left(NEW.body, 140), '/collab/' || NEW.collab_id);
  END LOOP;
  RETURN NULL;
END
$fn$;

DROP TRIGGER IF EXISTS notify_collab_message ON public.collab_messages;
CREATE TRIGGER notify_collab_message AFTER INSERT ON public.collab_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_collab_message();

COMMIT;
