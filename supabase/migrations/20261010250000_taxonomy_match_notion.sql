-- Live taxonomy brought in line with the Notion Master Taxonomy (owner, 10 Oct 2026).
--   * DJ Controller, Drum Machine, Sampler, Synth are Production → Hardware, not Instruments; Speakers
--     is added to hardware. Two profiles listed one of them as an instrument; it is removed there.
--     Equipment rows already typed drum_machine / sampler now resolve as hardware.
--   * booking_statuses (booking uses booking_requests.status), opportunity_types and profile_fields
--     are deleted: nothing reads them.
--   * person_types "other" is retired (no profile uses it).
-- Kept although Notion's hardware list lacks them: consoles, amplifiers, outboard (11 equipment
-- rows use them); Notion is updated to list them.
-- Counts before (no user data): instruments 37; equipment_categories 12; booking_statuses 5;
-- opportunity_types 23; profile_fields 30; person_types 38; profiles with a moved slug 2.
BEGIN;
INSERT INTO public.taxonomy_options (category_key, slug, label, sort_order, is_published, metadata)
SELECT 'equipment_categories', o.slug, o.label, 100 + o.sort_order, true, '{}'::jsonb
FROM public.taxonomy_options o
WHERE o.category_key = 'instruments' AND o.slug IN ('dj_controller', 'drum_machine', 'sampler', 'synth')
ON CONFLICT (category_key, slug) DO NOTHING;
INSERT INTO public.taxonomy_options (category_key, slug, label, sort_order, is_published, metadata)
VALUES ('equipment_categories', 'speakers', 'Speakers', 200, true, '{}'::jsonb)
ON CONFLICT (category_key, slug) DO NOTHING;
UPDATE public.profiles
SET instruments = array(SELECT i FROM unnest(instruments) i
                        WHERE i NOT IN ('dj_controller', 'drum_machine', 'sampler', 'synth'))
WHERE instruments && ARRAY['dj_controller', 'drum_machine', 'sampler', 'synth'];
DELETE FROM public.taxonomy_options
  WHERE category_key = 'instruments' AND slug IN ('dj_controller', 'drum_machine', 'sampler', 'synth');
DELETE FROM public.taxonomy_options WHERE category_key IN ('booking_statuses', 'opportunity_types', 'profile_fields');
DELETE FROM public.taxonomy_categories WHERE key IN ('booking_statuses', 'opportunity_types', 'profile_fields');
DELETE FROM public.taxonomy_options WHERE category_key = 'person_types' AND slug = 'other';
COMMIT;
