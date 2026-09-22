-- A business's services link to what they use (owner, 22 Sep 2026): a talent's service shows
-- examples from their portfolio (example_ids); a studio's service shows the amenities and equipment
-- it uses, each with its photos. amenity_slugs are studio_amenities slugs on the owner's studio;
-- equipment_ids are its studio_equipment rows. Empty by default; no rows change.
--
-- Rollback:
--   ALTER TABLE public.profile_services DROP COLUMN IF EXISTS amenity_slugs;
--   ALTER TABLE public.profile_services DROP COLUMN IF EXISTS equipment_ids;

ALTER TABLE public.profile_services
  ADD COLUMN IF NOT EXISTS amenity_slugs text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS equipment_ids uuid[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.profile_services.amenity_slugs IS 'A studio service: the amenities it uses (studio_amenities slugs).';
COMMENT ON COLUMN public.profile_services.equipment_ids IS 'A studio service: the equipment it uses (studio_equipment ids).';
