-- Read-only. The snapshot for 20261003160000_amenities_key_and_service_fold.sql: save the output as
-- supabase/dumps/2026-10-03-before-amenities-key.sql. Taxonomy only, no user data.
SELECT 'category' AS kind, to_jsonb(c) AS row
  FROM public.taxonomy_categories c
 WHERE c.key IN ('studio_amenities', 'studio_services', 'service_categories', 'amenities')
UNION ALL
SELECT 'option', to_jsonb(o)
  FROM public.taxonomy_options o
 WHERE o.category_key IN ('studio_amenities', 'studio_services', 'service_categories', 'amenities')
UNION ALL
SELECT 'person_type_map', to_jsonb(m)
  FROM public.person_type_service_categories m
 WHERE m.service_category_slug IN ('studio', 'recording', 'resident_engineers', 'attended_sessions',
                                   'stem_mastering', 'producer', 'same_day_audio', 'multicam_video')
 ORDER BY 1, 2::text;
