-- Amenities and equipment belong to the business, for every business type (owner, 10 Oct 2026),
-- not to a studio-only record. Rows and ids are kept, so services that link equipment still do.
--   1. profile_business.amenities, copied from each owner's bookables.amenities.
--   2. bookable_equipment / bookable_photos get profile_id (the business), filled from the
--      bookable's owner; bookable_id becomes optional; writes are the business's own.
--   3. profile_id defaults to auth.uid(), so a row inserted by code that only sets bookable_id still
--      gets its owner while the new code ships.
-- Snapshot: supabase/dumps/2026-10-10-before-business-amenities-equipment.sql
BEGIN;

ALTER TABLE public.profile_business ADD COLUMN IF NOT EXISTS amenities text[] NOT NULL DEFAULT '{}';
UPDATE public.profile_business pb
SET amenities = b.amenities
FROM public.bookables b
WHERE b.owner_profile_id = pb.profile_id AND cardinality(b.amenities) > 0;

ALTER TABLE public.bookable_equipment
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid();
UPDATE public.bookable_equipment e SET profile_id = b.owner_profile_id
FROM public.bookables b WHERE b.id = e.bookable_id AND e.profile_id IS NULL;
ALTER TABLE public.bookable_equipment ALTER COLUMN profile_id SET NOT NULL;
ALTER TABLE public.bookable_equipment ALTER COLUMN bookable_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS bookable_equipment_profile_idx ON public.bookable_equipment (profile_id);
DROP POLICY IF EXISTS "Owners write their own" ON public.bookable_equipment;
CREATE POLICY "The business writes its own" ON public.bookable_equipment
  FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

ALTER TABLE public.bookable_photos
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid();
UPDATE public.bookable_photos ph SET profile_id = b.owner_profile_id
FROM public.bookables b WHERE b.id = ph.bookable_id AND ph.profile_id IS NULL;
ALTER TABLE public.bookable_photos ALTER COLUMN profile_id SET NOT NULL;
ALTER TABLE public.bookable_photos ALTER COLUMN bookable_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS bookable_photos_profile_idx ON public.bookable_photos (profile_id);
DROP POLICY IF EXISTS "Owner manages their studio photos" ON public.bookable_photos;
CREATE POLICY "The business manages its photos" ON public.bookable_photos
  FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

COMMIT;
NOTIFY pgrst, 'reload schema';
