-- Owner, 22 Sep 2026: every profile type that offers services maps to at least one service
-- category, so Add service offers the right ones. A Teaching category for teachers and schools.
-- Dealer stays unmapped: it sells gear through Market, not services.
-- Snapshot and undo: supabase/dumps/2026-09-22-before-service-type-map.sql

BEGIN;

INSERT INTO public.taxonomy_options (category_key, slug, label, sort_order, is_published, metadata)
VALUES ('service_categories', 'teaching', 'Teaching', 9, true, '{"app_key":"teaching"}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.person_type_service_categories
  (person_type_category, person_type_slug, service_category_category, service_category_slug)
VALUES
  ('person_types', 'music_teacher', 'service_categories', 'teaching'),
  ('person_types', 'music_school', 'service_categories', 'teaching'),
  ('person_types', 'other', 'service_categories', 'teaching'),
  ('person_types', 'podcaster', 'service_categories', 'production'),
  ('person_types', 'podcaster', 'service_categories', 'vocals'),
  ('person_types', 'rj', 'service_categories', 'vocals'),
  ('person_types', 'event_organizer', 'service_categories', 'live'),
  ('person_types', 'artist_manager', 'service_categories', 'live'),
  ('person_types', 'music_label', 'service_categories', 'production'),
  ('person_types', 'music_publisher', 'service_categories', 'songwriting')
ON CONFLICT DO NOTHING;

COMMIT;
