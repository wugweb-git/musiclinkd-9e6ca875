-- Services have no categories (owner, 10 Oct 2026): a service is already mapped by its owner's
-- persona type and carries its own details. The app stopped reading them in the same change.
-- Also: studio_services is the business services list, renamed business_services.
-- Snapshot: supabase/dumps/2026-10-10-before-drop-service-categories.sql
BEGIN;
ALTER TABLE public.profile_services DROP CONSTRAINT IF EXISTS profile_services_category_fkey;
DROP INDEX IF EXISTS public.profile_services_category_idx;
ALTER TABLE public.profile_services
  DROP COLUMN IF EXISTS category,
  DROP COLUMN IF EXISTS categories,
  DROP COLUMN IF EXISTS category_taxonomy;
DROP TABLE IF EXISTS public.service_category_specialties;
DROP TABLE IF EXISTS public.person_type_service_categories;
DELETE FROM public.taxonomy_options WHERE category_key IN ('service_categories', 'engineer_specialties');
DELETE FROM public.taxonomy_categories WHERE key IN ('service_categories', 'engineer_specialties');

INSERT INTO public.taxonomy_categories (key, label, description, is_published)
SELECT 'business_services', 'Business Services', description, is_published
FROM public.taxonomy_categories WHERE key = 'studio_services'
ON CONFLICT (key) DO NOTHING;
UPDATE public.taxonomy_options SET category_key = 'business_services' WHERE category_key = 'studio_services';
DELETE FROM public.taxonomy_categories WHERE key = 'studio_services';
COMMIT;
NOTIFY pgrst, 'reload schema';
