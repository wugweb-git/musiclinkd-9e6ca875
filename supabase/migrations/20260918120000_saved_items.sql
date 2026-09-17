-- The Saved screen's shortlist: talent, bands, studios, businesses and events a signed-in
-- profile has bookmarked. Owner-only, same RLS pattern as profile_private
-- (20260915100000_profile_private.sql). target_id is intentionally not a foreign key: it can
-- point at profiles, bands or studios depending on target_type, and none of those three share
-- one id space to reference cleanly.
-- Snapshot: supabase/dumps/2026-09-18-before-saved-items.sql

BEGIN;

CREATE TABLE IF NOT EXISTS public.saved_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('talent', 'band', 'studio', 'business', 'event')),
  target_id   uuid NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS saved_items_user_idx
  ON public.saved_items (user_id, target_type, created_at DESC);

ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner reads own saved items" ON public.saved_items;
CREATE POLICY "Owner reads own saved items" ON public.saved_items
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner saves items" ON public.saved_items;
CREATE POLICY "Owner saves items" ON public.saved_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner removes own saved items" ON public.saved_items;
CREATE POLICY "Owner removes own saved items" ON public.saved_items
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

REVOKE ALL ON public.saved_items FROM anon;
GRANT SELECT, INSERT, DELETE ON public.saved_items TO authenticated;

COMMIT;
