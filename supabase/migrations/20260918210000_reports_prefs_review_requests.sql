-- Four buttons that only pretended: report, notification settings, ask for a review, and rating a
-- rental. Each now writes a row the database checks.
-- Snapshot: supabase/dumps/2026-09-18-before-reports-prefs-review-requests.sql

BEGIN;

-- ===== REPORTS =====
-- A flag on a review, a listing, a rental listing or a person. The reporter sees their own; nobody else
-- reads them from the app (the team reads them in the database).
CREATE TABLE IF NOT EXISTS public.reports (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_profile_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_type        text NOT NULL CHECK (subject_type IN ('review', 'listing', 'rental', 'profile')),
  subject_id          text NOT NULL CHECK (length(subject_id) BETWEEN 1 AND 120),
  reason              text NOT NULL CHECK (length(reason) BETWEEN 1 AND 80),
  detail              text CHECK (length(detail) <= 1000),
  status              text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'upheld', 'dismissed')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  -- One report per person per thing; reporting again updates nothing and says so.
  UNIQUE (reporter_profile_id, subject_type, subject_id)
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "File your own" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (reporter_profile_id = auth.uid() AND status = 'open');
CREATE POLICY "Read your own" ON public.reports
  FOR SELECT TO authenticated USING (reporter_profile_id = auth.uid());

-- ===== NOTIFICATION PREFERENCES =====
-- One row per person, written the first time they change anything; until then the app's defaults
-- apply. Channels per category as {category: {push, email, sms}}.
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  profile_id  uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  channels    jsonb NOT NULL DEFAULT '{}'::jsonb,
  quiet_hours boolean NOT NULL DEFAULT true,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read your own" ON public.notification_preferences
  FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "Write your own" ON public.notification_preferences
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Change your own" ON public.notification_preferences
  FOR UPDATE TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- ===== RENTALS COUNT AS WORKING TOGETHER =====
-- A completed rental lets the renter and the listing's owner review each other, the same as an
-- accepted application does.
CREATE OR REPLACE FUNCTION public.can_review_profile(p_target_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT auth.uid() IS NOT NULL AND p_target_profile_id <> auth.uid() AND (
    EXISTS (
      SELECT 1
      FROM public.opportunity_applications a
      JOIN public.opportunities o ON o.id = a.opportunity_id
      WHERE a.status = 'accepted'
        AND ((a.applicant_profile_id = auth.uid() AND o.creator_profile_id = p_target_profile_id)
          OR (o.creator_profile_id = auth.uid() AND a.applicant_profile_id = p_target_profile_id)))
    OR EXISTS (
      SELECT 1
      FROM public.rental_bookings b
      JOIN public.marketplace_listings l ON l.id = b.listing_id
      WHERE b.status = 'completed'
        AND ((b.renter_profile_id = auth.uid() AND l.seller_profile_id = p_target_profile_id)
          OR (l.seller_profile_id = auth.uid() AND b.renter_profile_id = p_target_profile_id))));
$fn$;

-- ===== ASKING FOR A REVIEW =====
-- Ask someone you worked with once, remind them once. The ask is only allowed where they could
-- actually write the review: the same relation, seen from their side.
CREATE OR REPLACE FUNCTION public.could_review_me(p_asked_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT auth.uid() IS NOT NULL AND p_asked_profile_id <> auth.uid() AND (
    EXISTS (
      SELECT 1
      FROM public.opportunity_applications a
      JOIN public.opportunities o ON o.id = a.opportunity_id
      WHERE a.status = 'accepted'
        AND ((a.applicant_profile_id = auth.uid() AND o.creator_profile_id = p_asked_profile_id)
          OR (o.creator_profile_id = auth.uid() AND a.applicant_profile_id = p_asked_profile_id)))
    OR EXISTS (
      SELECT 1
      FROM public.rental_bookings b
      JOIN public.marketplace_listings l ON l.id = b.listing_id
      WHERE b.status = 'completed'
        AND ((b.renter_profile_id = auth.uid() AND l.seller_profile_id = p_asked_profile_id)
          OR (l.seller_profile_id = auth.uid() AND b.renter_profile_id = p_asked_profile_id))));
$fn$;

CREATE TABLE IF NOT EXISTS public.review_requests (
  requester_profile_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  asked_profile_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  context              text CHECK (length(context) <= 120),
  asked_at             timestamptz NOT NULL DEFAULT now(),
  reminded_at          timestamptz,
  PRIMARY KEY (requester_profile_id, asked_profile_id)
);

ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read your own asks" ON public.review_requests
  FOR SELECT TO authenticated USING (requester_profile_id = auth.uid());
CREATE POLICY "Ask someone you worked with" ON public.review_requests
  FOR INSERT TO authenticated
  WITH CHECK (requester_profile_id = auth.uid() AND reminded_at IS NULL
    AND public.could_review_me(asked_profile_id));
-- The one reminder: only once, and only a week after asking.
CREATE POLICY "Remind once" ON public.review_requests
  FOR UPDATE TO authenticated
  USING (requester_profile_id = auth.uid() AND reminded_at IS NULL
    AND asked_at <= now() - interval '7 days')
  WITH CHECK (requester_profile_id = auth.uid());

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check CHECK (kind IN (
  'connection_request', 'connection_accepted', 'message',
  'application_received', 'application_status',
  'booking_requested', 'booking_answered',
  'review_received', 'review_reply', 'review_request',
  'collab_invite', 'collab_joined'));

CREATE OR REPLACE FUNCTION public.notify_review_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF TG_OP = 'INSERT' OR (NEW.reminded_at IS DISTINCT FROM OLD.reminded_at AND NEW.reminded_at IS NOT NULL) THEN
    PERFORM public.notify(NEW.asked_profile_id, NEW.requester_profile_id, 'review_request',
      public.display_name_of(NEW.requester_profile_id)
        || CASE WHEN TG_OP = 'INSERT' THEN ' asked you for a review' ELSE ' is still hoping for a review' END,
      NEW.context, '/reviews/write/' || NEW.requester_profile_id);
  END IF;
  RETURN NULL;
END
$fn$;

DROP TRIGGER IF EXISTS notify_review_request ON public.review_requests;
CREATE TRIGGER notify_review_request AFTER INSERT OR UPDATE OF reminded_at ON public.review_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_review_request();

COMMIT;
