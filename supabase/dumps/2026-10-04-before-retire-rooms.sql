-- Snapshot before 20261004120000_retire_rooms.sql and 20261004140000_retire_bookable_services.sql.
-- Taken read-only from the live database with supabase/checks/before-retire-rooms.sql.
-- Definitions, grants and counts only; no user data.
--
-- Counts: rooms 25 · bookings with a room 10 · closures on a room 0 · places with services tags 15
--
-- Columns: booking_requests.room_id uuid · bookable_blocks.room_id uuid · bookables.services text[]
--
-- Foreign keys into bookable_rooms:
--   bookable_blocks.studio_blocks_room_id_fkey        FOREIGN KEY (room_id) REFERENCES bookable_rooms(id) ON DELETE CASCADE
--   booking_requests.booking_requests_room_id_fkey   FOREIGN KEY (room_id) REFERENCES bookable_rooms(id) ON DELETE SET NULL
--
-- Rules on bookable_rooms:
--   "Owners write their own"  ALL    USING/CHECK (EXISTS (SELECT 1 FROM bookables s WHERE s.id = bookable_rooms.bookable_id AND s.owner_profile_id = auth.uid()))
--   "Readable by everyone"    SELECT USING true
--
-- Grants on bookable_rooms:
--   anon, authenticated, postgres, service_role: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
--   sandbox_exec: INSERT, SELECT
--
-- bookable_busy  md5(prosrc) 579d39d469c22524d9cb48b57478cbe4
CREATE OR REPLACE FUNCTION public.bookable_busy(p_studio uuid, p_from date, p_to date)
 RETURNS TABLE(room_id uuid, starts_at timestamp without time zone, ends_at timestamp without time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT b.room_id,
         b.session_date + coalesce(b.start_time, time '00:00'),
         CASE
           WHEN b.start_time IS NULL THEN (b.session_date + 1)::timestamp
           ELSE b.session_date + b.start_time
                + CASE
                    WHEN b.end_time IS NOT NULL AND b.end_time > b.start_time
                      THEN b.end_time - b.start_time
                    WHEN b.end_time IS NOT NULL
                      THEN (b.end_time - b.start_time) + interval '1 day'
                    ELSE make_interval(hours => coalesce(b.hours, 1))
                  END
         END
    FROM public.booking_requests b
   WHERE b.bookable_id = p_studio
     AND b.status IN ('confirmed', 'completed')
     AND b.session_date BETWEEN p_from - 1 AND p_to
  UNION ALL
  SELECT k.room_id, k.starts_at, k.ends_at
    FROM public.bookable_blocks k
   WHERE k.bookable_id = p_studio
     AND k.starts_at < (p_to + 1)::timestamp
     AND k.ends_at > p_from::timestamp;
$function$;
