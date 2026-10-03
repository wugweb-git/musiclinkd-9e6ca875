-- Snapshot before 20261003140000_bookables_drop_compat.sql.
-- Taken read-only from the live database on 2026-10-03 (pg_get_viewdef, pg_get_functiondef).
-- Definitions and counts only. No user data. Restoring these re-creates the old-name shims.
-- Live counts at snapshot time: bookables 22, bookable_photos 61 (not 21 / 57: one business
-- created its bookable and uploaded 4 amenity photos on 3 Oct).

CREATE VIEW public.studios WITH (security_invoker = true) AS SELECT id, owner_profile_id, slug, name,
  description, location, geo_lat, geo_lng, hourly_rate_paise, rating, review_count, verified_gold,
  console_type, services, amenities, cancellation_policy, operating_hours, image_url, images,
  created_at, updated_at, response_time, add_ons, weekly_hours, archived_at, notice_hours,
  blackout_dates FROM public.bookables;
CREATE VIEW public.studio_rooms WITH (security_invoker = true) AS SELECT id, bookable_id AS studio_id,
  name, capacity, hourly_rate_paise, amenities, sort_order, kind, photo_url, gear, description, tiers
  FROM public.bookable_rooms;
CREATE VIEW public.studio_blocks WITH (security_invoker = true) AS SELECT id, bookable_id AS studio_id,
  room_id, starts_at, ends_at, reason, created_at FROM public.bookable_blocks;
CREATE VIEW public.studio_equipment WITH (security_invoker = true) AS SELECT id,
  bookable_id AS studio_id, name, category, quantity, included, sort_order FROM public.bookable_equipment;
CREATE VIEW public.studio_photos WITH (security_invoker = true) AS SELECT id, bookable_id AS studio_id,
  subject_type, subject_id, url, sort_order, created_at FROM public.bookable_photos;
-- Grants as in 20261003130000: SELECT to anon, authenticated; INSERT, UPDATE, DELETE to
-- authenticated; ALL to service_role.

CREATE OR REPLACE FUNCTION public.studio_is_mine(p_studio_id uuid)
 RETURNS boolean LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$ SELECT public.bookable_is_mine(p_studio_id) $function$;

CREATE OR REPLACE FUNCTION public.can_review_studio(p_studio_id uuid)
 RETURNS boolean LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$ SELECT public.can_review_bookable(p_studio_id) $function$;

CREATE OR REPLACE FUNCTION public.studio_busy(p_studio uuid, p_from date, p_to date)
 RETURNS TABLE(room_id uuid, starts_at timestamp without time zone, ends_at timestamp without time zone)
 LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$ SELECT * FROM public.bookable_busy($1, $2, $3) $function$;
-- EXECUTE granted to anon, authenticated.
