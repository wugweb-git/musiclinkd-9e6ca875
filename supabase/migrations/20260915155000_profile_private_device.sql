-- Private profile details: time zone and device platform, captured silently from the browser.
--
-- Owner request (16 Sep 2026, via the onboarding session). Both live on public.profile_private, which only
-- its owner can read or write (policies in 20260915100000_profile_private.sql apply to the new columns).
--   time_zone        IANA name from the browser, e.g. Asia/Kolkata. Shape-checked only (a CHECK cannot
--                    look up pg_timezone_names).
--   device_platform  android, ios, desktop or other.
-- Both nullable. Idempotent.
--
-- Rollback:
--   ALTER TABLE public.profile_private DROP COLUMN IF EXISTS time_zone, DROP COLUMN IF EXISTS device_platform;

ALTER TABLE public.profile_private
  ADD COLUMN IF NOT EXISTS time_zone text,
  ADD COLUMN IF NOT EXISTS device_platform text;

ALTER TABLE public.profile_private DROP CONSTRAINT IF EXISTS profile_private_time_zone;
ALTER TABLE public.profile_private ADD CONSTRAINT profile_private_time_zone CHECK (
  time_zone IS NULL OR (char_length(time_zone) <= 64 AND time_zone ~ '^[A-Za-z][A-Za-z0-9_+-]*(/[A-Za-z0-9_+-]+)*$')
);

ALTER TABLE public.profile_private DROP CONSTRAINT IF EXISTS profile_private_device_platform;
ALTER TABLE public.profile_private ADD CONSTRAINT profile_private_device_platform CHECK (
  device_platform IS NULL OR device_platform IN ('android', 'ios', 'desktop', 'other')
);

DO $verify$
BEGIN
  IF (SELECT count(*) FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profile_private'
        AND column_name IN ('time_zone', 'device_platform') AND is_nullable = 'YES') <> 2 THEN
    RAISE EXCEPTION 'profile_private time_zone and device_platform columns missing';
  END IF;
END
$verify$;
