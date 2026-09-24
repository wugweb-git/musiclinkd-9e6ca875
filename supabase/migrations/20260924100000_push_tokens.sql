-- Owner, 24 Sep 2026: turn on Firebase Cloud Messaging for in-app status pushes. A push has to be
-- addressed to a device, and nothing stored a device address, so this is where a registration
-- token lives.
--
-- One row per device, not per person: somebody signed in on a phone and a tablet gets both. The
-- token is the natural key — FCM reissues it when it rotates, and the same token must never be
-- registered twice — so a device re-registering on launch is an upsert, not a duplicate.
--
-- Snapshot and undo: supabase/dumps/2026-09-24-before-push-tokens.sql

BEGIN;

CREATE TABLE public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles (id) ON DELETE CASCADE,
  -- The FCM registration token for this install.
  token text NOT NULL UNIQUE,
  -- Which wrap it came from, so a send can be routed correctly later.
  platform text NOT NULL DEFAULT 'android' CHECK (platform IN ('android', 'ios', 'web')),
  -- What the person would recognise the handset as, for a future "signed-in devices" screen.
  device text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sending to one person reads by profile; re-registration reads by token (already unique).
CREATE INDEX push_tokens_profile_id_idx ON public.push_tokens (profile_id);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Owner-only throughout, matching notification_preferences. A device token is as identifying as
-- a phone number: nobody but its owner reads or writes it.
CREATE POLICY "Read your own" ON public.push_tokens
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Write your own" ON public.push_tokens
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Change your own" ON public.push_tokens
  FOR UPDATE USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- Signing out of a device has to remove that device's token, or it keeps delivering the previous
-- owner's notifications to a handset that is no longer theirs.
CREATE POLICY "Remove your own" ON public.push_tokens
  FOR DELETE USING (profile_id = auth.uid());

COMMIT;
