-- Read-only. Every studio_amenities option, published or not, and how many rows use it at each
-- level: the bookable (bookables.amenities), a room (bookable_rooms.amenities), a service
-- (profile_services.amenity_slugs). Slugs used but missing from the taxonomy come last.
-- Run as the service role: the anon API sees only what RLS shows the public.
WITH used AS (
  SELECT unnest(amenities) AS slug, 'bookable' AS lvl FROM public.bookables
  UNION ALL SELECT unnest(amenities), 'room' FROM public.bookable_rooms
  UNION ALL SELECT unnest(amenity_slugs), 'service' FROM public.profile_services
), counts AS (
  SELECT slug,
         count(*) FILTER (WHERE lvl = 'bookable') AS bookables,
         count(*) FILTER (WHERE lvl = 'room')     AS rooms,
         count(*) FILTER (WHERE lvl = 'service')  AS services
    FROM used GROUP BY slug
)
SELECT t.slug, t.label, t.sort_order, to_jsonb(t) - 'id' - 'slug' - 'label' - 'sort_order' AS other_columns,
       coalesce(c.bookables, 0) AS bookables, coalesce(c.rooms, 0) AS rooms,
       coalesce(c.services, 0) AS services
  FROM public.taxonomy_options t
  LEFT JOIN counts c USING (slug)
 WHERE t.category_key = 'studio_amenities'
UNION ALL
SELECT c.slug, NULL, NULL, NULL, c.bookables, c.rooms, c.services
  FROM counts c
 WHERE NOT EXISTS (SELECT 1 FROM public.taxonomy_options t
                    WHERE t.category_key = 'studio_amenities' AND t.slug = c.slug)
 ORDER BY 3 NULLS LAST, 1;
