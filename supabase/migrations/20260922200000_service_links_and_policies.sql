-- Link every studio service to the amenities and equipment it uses, and give the three businesses
-- without policies the standard ones (owner, 22 Sep 2026: "make/create" the links; "add" policies).
-- A service's kind is read from its name; it takes the matching amenities the studio has and the
-- studio's equipment in the matching categories. A service no rule matches, or that would end up
-- with nothing, takes all of its studio's amenities and equipment.
--
-- Rollback:
--   UPDATE public.profile_services SET amenity_slugs = '{}', equipment_ids = '{}';
--   UPDATE public.profile_business SET policies = '{}' WHERE profile_id IN
--     ('2c29531c-68cf-4b7d-84e1-08ae729a6c69','2baecd1b-d9b3-5f47-9578-5c724efb3c28','fb84584c-7f03-435c-b7f0-526bded3e3b6');

WITH svc AS (
  SELECT ps.id, s.id AS studio_id, s.amenities,
    CASE
      WHEN ps.name ~* 'podcast|video' THEN 'podcast'
      WHEN ps.name ~* 'gear hire|rental' THEN 'gear'
      WHEN ps.name ~* 'beat|licen|masterclass|production' AND ps.name !~* 'pre-production' THEN 'beats'
      WHEN ps.name ~* 'mix|master|atmos|summing' THEN 'mixing'
      WHEN ps.name ~* 'rehears|band|backline|jam|soundcheck|concert|event|live room|pre-production|acoustic room' THEN 'rehearsal'
      WHEN ps.name ~* 'record|track|vocal|voice|foley|overdub|acoustic|piano|dubbing|session|studio' THEN 'recording'
      ELSE 'all'
    END AS kind
  FROM public.profile_services ps
  JOIN public.studios s ON s.owner_profile_id = ps.profile_id
  WHERE ps.status = 'active'
),
rules(kind, amenities, categories) AS (VALUES
  ('mixing',    ARRAY['vocal_booth'], ARRAY['consoles','mixers','studio_monitors','outboard','audio_interfaces','controllers']),
  ('recording', ARRAY['vocal_booth','live_room','acoustics_optimized'], ARRAY['microphones','preamps','audio_interfaces','headphones','consoles','mixers','studio_monitors']),
  ('rehearsal', ARRAY['rehearsal_room','live_room'], ARRAY['drums','backline','amplifiers','pa_systems','microphones']),
  ('podcast',   ARRAY[]::text[], ARRAY['microphones','mixers']),
  ('beats',     ARRAY[]::text[], ARRAY['controllers','drum_machine','sampler','studio_monitors','audio_interfaces'])
),
picked AS (
  SELECT svc.id, svc.studio_id, svc.amenities AS studio_amenities, svc.kind,
    ARRAY(SELECT a FROM unnest(svc.amenities) a WHERE a = ANY (coalesce(r.amenities, '{}'))) AS amenity_slugs,
    ARRAY(
      SELECT e.id FROM public.studio_equipment e
      WHERE e.studio_id = svc.studio_id
        AND (svc.kind = 'gear' OR e.category = ANY (coalesce(r.categories, '{}'))
             -- A podcast's camera has no category; video services take uncategorised gear too.
             OR (svc.kind = 'podcast' AND e.category IS NULL))
      ORDER BY e.sort_order
    ) AS equipment_ids
  FROM svc LEFT JOIN rules r ON r.kind = svc.kind
)
UPDATE public.profile_services ps
SET amenity_slugs = CASE
      WHEN p.kind = 'all' OR (cardinality(p.amenity_slugs) = 0 AND cardinality(p.equipment_ids) = 0)
        THEN p.studio_amenities ELSE p.amenity_slugs END,
    equipment_ids = CASE
      WHEN p.kind = 'all' OR (cardinality(p.amenity_slugs) = 0 AND cardinality(p.equipment_ids) = 0)
        THEN ARRAY(SELECT e.id FROM public.studio_equipment e WHERE e.studio_id = p.studio_id ORDER BY e.sort_order)
      ELSE p.equipment_ids END
FROM picked p
WHERE ps.id = p.id;

-- Policies for the three businesses that had none (the business_policies suggestions).
UPDATE public.profile_business SET policies = ARRAY[
  'No smoking or alcohol inside the rooms.',
  'Reschedule at least 24 hours before your session.',
  'Please arrive 10 minutes before your slot.',
  'Studio gear stays in the building; ask before moving it.'
] WHERE profile_id IN ('2c29531c-68cf-4b7d-84e1-08ae729a6c69','2baecd1b-d9b3-5f47-9578-5c724efb3c28');

UPDATE public.profile_business SET policies = ARRAY[
  'No smoking or alcohol inside the rooms.',
  'Reschedule at least 24 hours before your session.',
  'Please arrive 10 minutes before your slot.',
  'Carry a photo ID for check-in.'
] WHERE profile_id = 'fb84584c-7f03-435c-b7f0-526bded3e3b6';
