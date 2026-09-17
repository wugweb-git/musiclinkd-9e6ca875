-- Makes the QR module's style preference and scan history/analytics real.
-- qr_style: a display preference on the existing profiles row, same pattern as visibility.
-- qr_scans: who scanned whose code — the scanner can see their own history, the scanned
-- profile's owner can see aggregate/individual scans of their own code (analytics).
-- Snapshot: supabase/dumps/2026-09-18-before-qr-real.sql

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS qr_style text NOT NULL DEFAULT 'light'
    CHECK (qr_style IN ('light', 'dark', 'branded', 'minimal'));

CREATE TABLE IF NOT EXISTS public.qr_scans (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scanner_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scanned_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS qr_scans_scanner_idx ON public.qr_scans (scanner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS qr_scans_scanned_idx ON public.qr_scans (scanned_profile_id, created_at DESC);

ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Scanner reads own history" ON public.qr_scans;
CREATE POLICY "Scanner reads own history" ON public.qr_scans
  FOR SELECT TO authenticated USING (auth.uid() = scanner_id);

DROP POLICY IF EXISTS "Scanned owner reads their analytics" ON public.qr_scans;
CREATE POLICY "Scanned owner reads their analytics" ON public.qr_scans
  FOR SELECT TO authenticated USING (auth.uid() = scanned_profile_id);

DROP POLICY IF EXISTS "Record a scan as yourself" ON public.qr_scans;
CREATE POLICY "Record a scan as yourself" ON public.qr_scans
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = scanner_id);

REVOKE ALL ON public.qr_scans FROM anon;
GRANT SELECT, INSERT ON public.qr_scans TO authenticated;

COMMIT;
