-- MusicLinkd live database snapshot (Lovable Cloud, Supabase project ace967d9-a62e-48bb-b076-c3b63b11b185)
-- Taken 2026-09-18 via Lovable query_database, before migration
-- 20260918210000_reports_prefs_review_requests.sql.
--
-- Scope: row counts plus the two definitions the migration replaces. It adds three new tables
-- (reports, notification_preferences, review_requests) with their own policies and a trigger,
-- widens the notifications kind check by one value, and replaces can_review_profile(uuid) so a
-- completed rental also counts. No existing row is altered.
--
-- To undo:
--   DROP TABLE public.reports, public.notification_preferences, public.review_requests CASCADE;
--   DROP FUNCTION public.could_review_me(uuid); DROP FUNCTION public.notify_review_request();
--   then restore the two definitions below.

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check CHECK ((kind = ANY (ARRAY['connection_request'::text, 'connection_accepted'::text, 'message'::text, 'application_received'::text, 'application_status'::text, 'booking_requested'::text, 'booking_answered'::text, 'review_received'::text, 'review_reply'::text, 'collab_invite'::text, 'collab_joined'::text])));

CREATE OR REPLACE FUNCTION public.can_review_profile(p_target_profile_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL AND p_target_profile_id <> auth.uid() AND EXISTS (
    SELECT 1
    FROM public.opportunity_applications a
    JOIN public.opportunities o ON o.id = a.opportunity_id
    WHERE a.status = 'accepted'
      AND ((a.applicant_profile_id = auth.uid() AND o.creator_profile_id = p_target_profile_id)
        OR (o.creator_profile_id = auth.uid() AND a.applicant_profile_id = p_target_profile_id)));
$function$;

-- Row counts at snapshot time, every public table:
-- booking_requests: 4, cms_pages: 9, collab_events: 7, collab_members: 11, collab_releases: 3,
-- collabs: 3, connections: 1, conversation_members: 2, conversations: 1, enquiries: 0,
-- feed_posts: 5, follows: 1, genre_languages: 43, marketplace_listings: 8, marketplace_offers: 4,
-- messages: 3, notifications: 4, opportunities: 9, opportunity_applications: 2,
-- opportunity_views: 2, person_type_instruments: 199, person_type_service_categories: 53,
-- portfolio_item_plays: 0, portfolio_items: 85, profile_business: 21, profile_events: 3,
-- profile_experience: 18, profile_gallery: 30, profile_members: 12, profile_private: 84,
-- profile_role_details: 71, profile_service_addons: 2, profile_service_packages: 2,
-- profile_services: 31, profiles: 102, qr_scans: 0, rental_bookings: 2, reserved_usernames: 63,
-- reviews: 35, saved_items: 5, service_category_specialties: 4, spotify_connections: 0,
-- studio_equipment: 16, studio_rooms: 7, studios: 12, taxonomy_categories: 39,
-- taxonomy_options: 380, verification_request_items: 0, verification_request_private: 0,
-- verification_requests: 0, verification_requirements: 12, verification_type_details: 4,
-- verification_type_person_types: 81
