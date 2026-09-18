-- Sources for sections that had nothing feeding them: popular and saved searches, rental alerts,
-- listing status, opportunity saves and where views come from, portfolio work events, and how
-- often each rental has been booked. Each is a row the database writes or checks; the screens read
-- them and stay empty (not broken) until this runs.
-- Snapshot: supabase/dumps/2026-09-18-before-section-sources.sql

BEGIN;

-- ===== SEARCH EVENTS =====
-- One row per search someone ran (Market, Rent or Discover). Written by anyone, signed in or not,
-- and only the words, the scope and the Market city: who ran it is filled in by the database and
-- nobody reads rows back. What people see is the aggregate below.
CREATE TABLE IF NOT EXISTS public.search_events (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  scope      text NOT NULL CHECK (scope IN ('market', 'rent', 'discover')),
  query      text NOT NULL CHECK (length(btrim(query)) BETWEEN 2 AND 80),
  /** The Market city the search ran in, when the screen has one. */
  city       text CHECK (length(city) <= 80),
  profile_id uuid DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS search_events_scope_time_idx
  ON public.search_events (scope, created_at DESC);

ALTER TABLE public.search_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone records a search" ON public.search_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (profile_id IS NOT DISTINCT FROM auth.uid());

REVOKE ALL ON public.search_events FROM anon, authenticated;
GRANT INSERT (scope, query, city) ON public.search_events TO anon, authenticated;

-- The most-run searches in one scope over the last 30 days, optionally in one city. A search has
-- to have run at least twice to count as popular, so one person's typo never shows.
CREATE OR REPLACE FUNCTION public.popular_searches(p_scope text, p_city text DEFAULT NULL, lim integer DEFAULT 8)
RETURNS TABLE (query text, searches bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT min(btrim(e.query)) AS query, count(*) AS searches
  FROM public.search_events e
  WHERE e.scope = p_scope
    AND e.created_at > now() - interval '30 days'
    AND (p_city IS NULL OR lower(e.city) = lower(p_city))
  GROUP BY lower(btrim(e.query))
  HAVING count(*) >= 2
  ORDER BY searches DESC, max(e.created_at) DESC
  LIMIT greatest(1, least(lim, 20));
$fn$;

REVOKE ALL ON FUNCTION public.popular_searches(text, text, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.popular_searches(text, text, integer) TO anon, authenticated;

-- ===== SAVED SEARCHES =====
-- A search kept to run again from the Saved screens. Owner-only.
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  scope      text NOT NULL CHECK (scope IN ('market', 'rent')),
  query      text NOT NULL CHECK (length(btrim(query)) BETWEEN 1 AND 80),
  filters    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, scope, query)
);
CREATE INDEX IF NOT EXISTS saved_searches_profile_idx
  ON public.saved_searches (profile_id, scope, created_at DESC);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read your own" ON public.saved_searches
  FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "Save your own" ON public.saved_searches
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Remove your own" ON public.saved_searches
  FOR DELETE TO authenticated USING (profile_id = auth.uid());

REVOKE ALL ON public.saved_searches FROM anon;
GRANT SELECT, INSERT, DELETE ON public.saved_searches TO authenticated;

-- ===== SAVED OPPORTUNITIES =====
-- Saving an opportunity is kept in saved_items like every other save, so its poster can see how
-- many people shortlisted it.
ALTER TABLE public.saved_items DROP CONSTRAINT IF EXISTS saved_items_target_type_check;
ALTER TABLE public.saved_items ADD CONSTRAINT saved_items_target_type_check
  CHECK (target_type IN ('talent', 'band', 'studio', 'business', 'event', 'listing', 'opportunity'));

-- How many people saved one opportunity; readable only by its poster (zero for anyone else).
CREATE OR REPLACE FUNCTION public.opportunity_save_count(opp uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT count(*)
  FROM public.saved_items s
  WHERE s.target_type = 'opportunity' AND s.target_id = opp
    AND EXISTS (
      SELECT 1 FROM public.opportunities o WHERE o.id = opp AND o.creator_profile_id = auth.uid()
    );
$fn$;

REVOKE ALL ON FUNCTION public.opportunity_save_count(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.opportunity_save_count(uuid) TO authenticated;

-- ===== WHERE OPPORTUNITY VIEWS COME FROM =====
-- The screen the viewer opened the opportunity from. Null for views counted before this column.
ALTER TABLE public.opportunity_views
  ADD COLUMN IF NOT EXISTS source text
    CHECK (source IN ('discover', 'search', 'profile', 'opportunities', 'direct', 'other'));

-- Same rules as before (20260918190000_opportunity_views.sql), now with where the view came from.
DROP FUNCTION IF EXISTS public.record_opportunity_view(uuid);
CREATE OR REPLACE FUNCTION public.record_opportunity_view(opp uuid, src text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
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
  INSERT INTO public.opportunity_views (opportunity_id, viewer_id, source)
  VALUES (opp, auth.uid(),
    CASE WHEN src IN ('discover', 'search', 'profile', 'opportunities', 'direct') THEN src
         WHEN src IS NULL THEN NULL ELSE 'other' END);
END
$fn$;

REVOKE ALL ON FUNCTION public.record_opportunity_view(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.record_opportunity_view(uuid, text) TO authenticated;

-- Views per source, all time, for the poster only. Views with no recorded source are left out.
CREATE OR REPLACE FUNCTION public.opportunity_view_sources(opp uuid)
RETURNS TABLE (source text, views bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT v.source, count(*) AS views
  FROM public.opportunity_views v
  WHERE v.opportunity_id = opp
    AND v.source IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.opportunities o WHERE o.id = opp AND o.creator_profile_id = auth.uid()
    )
  GROUP BY v.source
  ORDER BY views DESC;
$fn$;

REVOKE ALL ON FUNCTION public.opportunity_view_sources(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.opportunity_view_sources(uuid) TO authenticated;

-- ===== PORTFOLIO WORK EVENTS =====
-- A work seen on a profile or in Discover, shared, or followed to its owner's profile or its
-- media link. Anyone can record one; only the work's owner reads them. Plays stay in
-- portfolio_item_plays.
CREATE TABLE IF NOT EXISTS public.portfolio_item_events (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  item_id    uuid NOT NULL REFERENCES public.portfolio_items(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('view', 'share', 'profile_click', 'link_click')),
  viewer_id  uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portfolio_item_events_item_idx
  ON public.portfolio_item_events (item_id, kind, created_at DESC);

ALTER TABLE public.portfolio_item_events ENABLE ROW LEVEL SECURITY;

-- A published work, and never the owner looking at their own — except a share, which counts
-- whoever sends the link.
CREATE OR REPLACE FUNCTION public.portfolio_event_allowed(p_item uuid, p_kind text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.portfolio_items i
    WHERE i.id = p_item
      AND CASE WHEN p_kind = 'share'
            THEN i.published OR i.user_id = auth.uid()
            ELSE i.published AND (auth.uid() IS NULL OR i.user_id <> auth.uid())
          END);
$fn$;

CREATE OR REPLACE FUNCTION public.portfolio_item_is_mine(p_item uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.portfolio_items i WHERE i.id = p_item AND i.user_id = auth.uid());
$fn$;

CREATE POLICY "Anyone records an event" ON public.portfolio_item_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (viewer_id IS NOT DISTINCT FROM auth.uid() AND public.portfolio_event_allowed(item_id, kind));
CREATE POLICY "Owner reads their works' events" ON public.portfolio_item_events
  FOR SELECT TO authenticated USING (public.portfolio_item_is_mine(item_id));

REVOKE ALL ON public.portfolio_item_events FROM anon, authenticated;
GRANT INSERT (item_id, kind) ON public.portfolio_item_events TO anon, authenticated;
GRANT SELECT ON public.portfolio_item_events TO authenticated;

-- ===== HOW OFTEN A RENTAL IS BOOKED =====
-- Bookings per rental listing, for "Popular rentals". Only the count leaves the table; declined
-- and cancelled requests are not counted.
CREATE OR REPLACE FUNCTION public.rental_booking_counts()
RETURNS TABLE (listing_id uuid, bookings bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT b.listing_id, count(*) AS bookings
  FROM public.rental_bookings b
  WHERE b.status NOT IN ('declined', 'cancelled')
  GROUP BY b.listing_id;
$fn$;

REVOKE ALL ON FUNCTION public.rental_booking_counts() FROM public;
GRANT EXECUTE ON FUNCTION public.rental_booking_counts() TO anon, authenticated;

-- ===== LISTING STATUS =====
-- Set by the owner. Reserved and Currently Rented are read from rental_bookings by the app; the
-- owner sets Unavailable and Archived, which take a listing out of browsing. The existing
-- "Owners write their own" policy already limits the update to the seller.
ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS listing_status text NOT NULL DEFAULT 'active'
    CHECK (listing_status IN ('active', 'reserved', 'currently_rented', 'unavailable', 'completed', 'archived'));

-- ===== RENTAL NOTIFICATIONS =====
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check CHECK (kind IN (
  'connection_request', 'connection_accepted', 'message',
  'application_received', 'application_status',
  'booking_requested', 'booking_answered',
  'review_received', 'review_reply', 'review_request',
  'collab_invite', 'collab_joined',
  'rental_requested', 'rental_answered'));

CREATE OR REPLACE FUNCTION public.notify_rental_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_listing record;
BEGIN
  SELECT id, title, seller_profile_id INTO v_listing
  FROM public.marketplace_listings WHERE id = NEW.listing_id;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify(v_listing.seller_profile_id, NEW.renter_profile_id, 'rental_requested',
      public.display_name_of(NEW.renter_profile_id) || ' asked to rent ' || v_listing.title,
      to_char(NEW.start_date, 'DD Mon') || ' – ' || to_char(NEW.end_date, 'DD Mon')
        || coalesce(' · ' || NEW.note, ''),
      '/marketplace/rent/listings');
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'cancelled' THEN
      PERFORM public.notify(v_listing.seller_profile_id, NEW.renter_profile_id, 'rental_answered',
        public.display_name_of(NEW.renter_profile_id) || ' cancelled a rental of ' || v_listing.title,
        to_char(NEW.start_date, 'DD Mon') || ' – ' || to_char(NEW.end_date, 'DD Mon'),
        '/marketplace/rent/listings');
    ELSE
      PERFORM public.notify(NEW.renter_profile_id, v_listing.seller_profile_id, 'rental_answered',
        public.display_name_of(v_listing.seller_profile_id) || ' marked your rental of '
          || v_listing.title || ' ' || replace(NEW.status, '_', ' '),
        to_char(NEW.start_date, 'DD Mon') || ' – ' || to_char(NEW.end_date, 'DD Mon'),
        '/marketplace/rent/active/' || NEW.id);
    END IF;
  END IF;
  RETURN NULL;
END
$fn$;

DROP TRIGGER IF EXISTS notify_rental_booking ON public.rental_bookings;
CREATE TRIGGER notify_rental_booking AFTER INSERT OR UPDATE OF status ON public.rental_bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_rental_booking();

COMMIT;
