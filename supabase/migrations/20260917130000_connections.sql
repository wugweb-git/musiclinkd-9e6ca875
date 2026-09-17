-- Connections and follows: the first two things one person can do about another.
--
-- A connection is mutual and needs accepting, like LinkedIn's. A follow is one-way and needs
-- nothing. Both are between profiles; a talent and a business account are both profiles.
-- Additive: no existing table is touched. Snapshot: supabase/dumps/2026-09-17-before-connections.sql

BEGIN;

CREATE TABLE IF NOT EXISTS public.connections (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  note         text CHECK (length(note) <= 500),
  created_at   timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CHECK (requester_id <> addressee_id)
);

-- One connection per pair, whichever way round it was asked.
CREATE UNIQUE INDEX IF NOT EXISTS connections_pair
  ON public.connections (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
CREATE INDEX IF NOT EXISTS connections_addressee_idx ON public.connections (addressee_id, status);
CREATE INDEX IF NOT EXISTS connections_requester_idx ON public.connections (requester_id, status);

CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, target_id),
  CHECK (follower_id <> target_id)
);
CREATE INDEX IF NOT EXISTS follows_target_idx ON public.follows (target_id);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Connections are private to the two people in them.
CREATE POLICY "Both sides read" ON public.connections
  FOR SELECT TO authenticated USING (requester_id = auth.uid() OR addressee_id = auth.uid());
CREATE POLICY "Ask as yourself" ON public.connections
  FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid());
-- The addressee accepts or declines; the requester can withdraw by deleting.
CREATE POLICY "Addressee answers" ON public.connections
  FOR UPDATE TO authenticated USING (addressee_id = auth.uid()) WITH CHECK (addressee_id = auth.uid());
CREATE POLICY "Either side removes" ON public.connections
  FOR DELETE TO authenticated USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- A follow is public, the way a follower count is.
CREATE POLICY "Readable with the profile" ON public.follows
  FOR SELECT TO public USING (public.profile_is_readable(target_id));
CREATE POLICY "Follow as yourself" ON public.follows
  FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
CREATE POLICY "Unfollow your own" ON public.follows
  FOR DELETE TO authenticated USING (follower_id = auth.uid());

-- An answer stamps the time, so neither side can backdate it.
CREATE OR REPLACE FUNCTION public.connections_stamp_response()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.responded_at := now();
  END IF;
  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS connections_stamp_response ON public.connections;
CREATE TRIGGER connections_stamp_response BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.connections_stamp_response();

COMMIT;
