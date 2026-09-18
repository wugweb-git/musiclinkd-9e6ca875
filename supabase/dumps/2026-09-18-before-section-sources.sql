-- MusicLinkd live database snapshot (Lovable Cloud, Supabase project ace967d9-a62e-48bb-b076-c3b63b11b185)
-- Taken 2026-09-18 via Lovable query_database, before migration 20260918230000_section_sources.sql.
--
-- Scope: row counts plus the definitions the migration replaces. It adds search_events,
-- saved_searches and portfolio_item_events, the columns opportunity_views.source and
-- marketplace_listings.listing_status (default 'active', so every existing listing stays as it is),
-- widens the saved_items and notifications kind checks, adds read functions and a rental-booking
-- notification trigger, and recreates record_opportunity_view with an optional source argument.
-- No existing row is changed.
--
-- Row counts: marketplace_listings 8, saved_items 5, opportunity_views 2, notifications 4,
-- rental_bookings 2.
--
-- To undo: drop the three new tables, the two new columns, the new functions and the trigger
-- notify_rental_booking on rental_bookings; then restore the definitions below (the notifications
-- kind check is in 2026-09-18-before-reports-prefs-review-requests.sql plus 'review_request').

ALTER TABLE public.saved_items DROP CONSTRAINT IF EXISTS saved_items_target_type_check;
ALTER TABLE public.saved_items ADD CONSTRAINT saved_items_target_type_check CHECK ((target_type = ANY (ARRAY['talent'::text, 'band'::text, 'studio'::text, 'business'::text, 'event'::text, 'listing'::text])));

DROP FUNCTION IF EXISTS public.record_opportunity_view(uuid, text);
CREATE OR REPLACE FUNCTION public.record_opportunity_view(opp uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.opportunities WHERE id = opp AND creator_profile_id <> auth.uid()
  ) THEN
    RETURN;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.opportunity_views
    WHERE opportunity_id = opp AND viewer_id = auth.uid() AND viewed_at > now() - interval '30 minutes'
  ) THEN
    RETURN;
  END IF;
  INSERT INTO public.opportunity_views (opportunity_id, viewer_id) VALUES (opp, auth.uid());
END
$function$;
