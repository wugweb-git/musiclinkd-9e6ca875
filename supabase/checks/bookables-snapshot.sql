-- Read-only. Everything the bookables rename touches, as the live database has it, for
-- supabase/dumps/YYYY-MM-DD-before-bookables.sql. Definitions and counts only, no user data.
-- Run each block and paste the results into the snapshot file.

-- 1. Row counts (expected 21 / 25 / 0 / 116 / 57, plus reviews and bookings for the check after).
select 'studios' as t, count(*) from public.studios
union all select 'studio_rooms', count(*) from public.studio_rooms
union all select 'studio_blocks', count(*) from public.studio_blocks
union all select 'studio_equipment', count(*) from public.studio_equipment
union all select 'studio_photos', count(*) from public.studio_photos
union all select 'reviews with target_studio_id', count(*) from public.reviews where target_studio_id is not null
union all select 'booking_requests', count(*) from public.booking_requests;

-- 2. Every column named studio_id / target_studio_id / *studio*, and the table it is on.
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public' and column_name like '%studio%'
order by table_name, column_name;

-- 3. Foreign keys into the five tables.
select conrelid::regclass as on_table, conname, pg_get_constraintdef(oid) as def
from pg_constraint
where contype = 'f'
  and confrelid in ('public.studios'::regclass, 'public.studio_rooms'::regclass,
                    'public.studio_blocks'::regclass, 'public.studio_equipment'::regclass,
                    'public.studio_photos'::regclass)
order by 1, 2;

-- 4. Full definitions of every function whose body names a studio table or column.
select p.proname, pg_get_functiondef(p.oid) as def
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and prosrc ~ '(\mstudios?\M|studio_(rooms|blocks|equipment|photos|id)\M|target_studio_id)'
order by 1;

-- 5. Triggers on the five tables, booking_requests and reviews.
select event_object_table as on_table, trigger_name, action_timing, event_manipulation,
       action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in ('studios', 'studio_rooms', 'studio_blocks', 'studio_equipment',
                             'studio_photos', 'booking_requests', 'reviews')
order by 1, 2, 4;

-- 6. Row-level rules on those tables and on storage.objects for business-media.
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where (schemaname = 'public' and tablename in ('studios', 'studio_rooms', 'studio_blocks',
                                               'studio_equipment', 'studio_photos'))
   or (schemaname = 'storage' and tablename = 'objects' and policyname like '%business media%')
order by 1, 2, 3;

-- 7. Views and RPC grants that depend on the five tables.
select distinct dependent.relname as view_name
from pg_depend d
join pg_rewrite r on r.oid = d.objid
join pg_class dependent on dependent.oid = r.ev_class
join pg_class source on source.oid = d.refobjid
where source.relname in ('studios', 'studio_rooms', 'studio_blocks', 'studio_equipment',
                         'studio_photos')
  and dependent.relname <> source.relname;
