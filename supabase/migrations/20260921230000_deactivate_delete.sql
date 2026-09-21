-- Deactivate vs delete, for talent and business accounts alike (owner, 21 Sep 2026), plus clearing
-- scan history for real.
--
-- 1. profiles.visibility gains 'deactivated'. A deactivated account is hidden everywhere a private
--    profile is (every public read already refuses anything but its public values), and the owner
--    can switch it back. The value it had before is kept in discovery_prefs.visibility_before, so
--    reactivating restores it. A business's studio is archived alongside (studios.archived_at).
-- 2. Delete is permanent. A deleted business takes its studio with it; a deleted account takes its
--    profile with it. The other side of a booking keeps their own record of it:
--    booking_requests.studio_id and requester_profile_id become ON DELETE SET NULL, and the
--    studio's and requester's names are copied onto each booking so the history still reads.
-- 3. qr_scans: the scanner can delete their own scans (Clear history).
-- Snapshot: supabase/dumps/2026-09-21-before-deactivate-delete.sql
--
-- Rollback:
--   DROP POLICY IF EXISTS "Scanner deletes own history" ON public.qr_scans;
--   DROP TRIGGER IF EXISTS booking_requests_names ON public.booking_requests;
--   DROP FUNCTION IF EXISTS public.booking_requests_names();
--   ALTER TABLE public.booking_requests DROP COLUMN IF EXISTS studio_name,
--     DROP COLUMN IF EXISTS requester_name;
--   (then restore both foreign keys to ON DELETE CASCADE and NOT NULL, once no row is null)
--   ALTER TABLE public.profiles DROP CONSTRAINT profiles_visibility_values;
--   ALTER TABLE public.profiles ADD CONSTRAINT profiles_visibility_values
--     CHECK (visibility IN ('public', 'members', 'limited'));  -- only once no row is 'deactivated'

BEGIN;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_visibility_values;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_visibility_values
  CHECK (visibility IN ('public', 'members', 'limited', 'deactivated'));

ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS studio_name text CHECK (length(studio_name) <= 200),
  ADD COLUMN IF NOT EXISTS requester_name text CHECK (length(requester_name) <= 200);

UPDATE public.booking_requests br
   SET studio_name = s.name
  FROM public.studios s
 WHERE s.id = br.studio_id AND br.studio_name IS NULL;
UPDATE public.booking_requests br
   SET requester_name = coalesce(p.display_name, p.username)
  FROM public.profiles p
 WHERE p.id = br.requester_profile_id AND br.requester_name IS NULL;

CREATE OR REPLACE FUNCTION public.booking_requests_names()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NEW.studio_name IS NULL AND NEW.studio_id IS NOT NULL THEN
    SELECT s.name INTO NEW.studio_name FROM public.studios s WHERE s.id = NEW.studio_id;
  END IF;
  IF NEW.requester_name IS NULL AND NEW.requester_profile_id IS NOT NULL THEN
    SELECT coalesce(p.display_name, p.username) INTO NEW.requester_name
      FROM public.profiles p WHERE p.id = NEW.requester_profile_id;
  END IF;
  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS booking_requests_names ON public.booking_requests;
CREATE TRIGGER booking_requests_names BEFORE INSERT ON public.booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.booking_requests_names();

ALTER TABLE public.booking_requests ALTER COLUMN studio_id DROP NOT NULL;
ALTER TABLE public.booking_requests DROP CONSTRAINT IF EXISTS booking_requests_studio_id_fkey;
ALTER TABLE public.booking_requests
  ADD CONSTRAINT booking_requests_studio_id_fkey
  FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE SET NULL;

ALTER TABLE public.booking_requests ALTER COLUMN requester_profile_id DROP NOT NULL;
ALTER TABLE public.booking_requests DROP CONSTRAINT IF EXISTS booking_requests_requester_profile_id_fkey;
ALTER TABLE public.booking_requests
  ADD CONSTRAINT booking_requests_requester_profile_id_fkey
  FOREIGN KEY (requester_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Scanner deletes own history" ON public.qr_scans;
CREATE POLICY "Scanner deletes own history" ON public.qr_scans
  FOR DELETE TO authenticated USING (auth.uid() = scanner_id);

COMMIT;
