-- Read-only. The snapshot for 20261004120000_retire_rooms.sql and 20261004140000 (and the count
-- 20261004130000 needs): save the output as supabase/dumps/YYYY-MM-DD-before-retire-rooms.sql.
-- Definitions, grants and counts only; no user data.
SELECT * FROM (
SELECT 'function' AS kind, 'bookable_busy' AS name, md5(p.prosrc) AS detail,
       pg_get_functiondef(p.oid) AS definition
  FROM pg_proc p WHERE p.oid = 'public.bookable_busy(uuid, date, date)'::regprocedure
UNION ALL
SELECT 'grant', grantee || ' on bookable_rooms', string_agg(privilege_type, ', ' ORDER BY privilege_type), NULL
  FROM information_schema.role_table_grants
 WHERE table_schema = 'public' AND table_name = 'bookable_rooms'
 GROUP BY grantee
UNION ALL
SELECT 'rule', policyname, cmd, coalesce(qual, '') || ' | ' || coalesce(with_check, '')
  FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookable_rooms'
UNION ALL
SELECT 'foreign key', conrelid::regclass::text || '.' || conname, NULL, pg_get_constraintdef(oid)
  FROM pg_constraint WHERE contype = 'f' AND confrelid = 'public.bookable_rooms'::regclass
UNION ALL
SELECT 'column', table_name || '.' || column_name, data_type, NULL
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND ((table_name IN ('booking_requests', 'bookable_blocks') AND column_name = 'room_id')
        OR (table_name = 'bookables' AND column_name = 'services'))
UNION ALL
SELECT 'count', 'rooms', count(*)::text, NULL FROM public.bookable_rooms
UNION ALL
SELECT 'count', 'bookings with a room', count(*)::text, NULL
  FROM public.booking_requests WHERE room_id IS NOT NULL
UNION ALL
SELECT 'count', 'closures on a room', count(*)::text, NULL
  FROM public.bookable_blocks WHERE room_id IS NOT NULL
UNION ALL
SELECT 'count', 'places with services tags', count(*)::text, NULL
  FROM public.bookables WHERE cardinality(services) > 0
) snapshot
 ORDER BY kind, name;
