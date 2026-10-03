-- Read-only. The snapshot for 20261004100000_bookings_point_at_services.sql: save the output as
-- supabase/dumps/YYYY-MM-DD-before-bookings-point-at-services.sql. Definitions and counts only.
SELECT * FROM (
SELECT 'function' AS kind, p.proname AS name, md5(p.prosrc) AS detail, pg_get_functiondef(p.oid) AS definition
  FROM pg_proc p
 WHERE p.oid IN ('public.booking_requests_guard()'::regprocedure, 'public.notify_booking()'::regprocedure)
UNION ALL
SELECT 'rule', policyname, cmd, coalesce(qual, '') || ' | ' || coalesce(with_check, '')
  FROM pg_policies WHERE schemaname = 'public' AND tablename = 'booking_requests'
UNION ALL
SELECT 'count', 'bookings', count(*)::text, NULL FROM public.booking_requests
UNION ALL
SELECT 'count', 'bookings with purpose', count(*)::text, NULL
  FROM public.booking_requests WHERE purpose IS NOT NULL
UNION ALL
SELECT 'count', 'purpose matches exactly one service of the business', count(*)::text, NULL
  FROM (SELECT b.id
          FROM public.booking_requests b
          JOIN public.bookables k ON k.id = b.bookable_id
          JOIN public.profile_services s ON s.profile_id = k.owner_profile_id AND s.name = b.purpose
         GROUP BY b.id HAVING count(*) = 1) one
) snapshot
 ORDER BY kind, name;
