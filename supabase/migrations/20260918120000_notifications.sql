-- Notifications: told, rather than found out by opening the right screen.
--
-- Every row is written by a trigger on the thing that happened, so a notification cannot be
-- invented by a client and cannot be missed when the action succeeds. Each carries where to go,
-- so the screen needs no lookup table of its own.
-- Snapshot: supabase/dumps/2026-09-18-before-notifications.sql

BEGIN;

CREATE TABLE IF NOT EXISTS public.notifications (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  /** Who caused it. Null when it was not a person (nothing does that yet). */
  actor_profile_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  kind                 text NOT NULL CHECK (kind IN (
    'connection_request', 'connection_accepted', 'message',
    'application_received', 'application_status',
    'booking_requested', 'booking_answered',
    'review_received', 'review_reply')),
  title                text NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
  body                 text CHECK (length(body) <= 400),
  /** Where tapping it goes, as an in-app path. */
  href                 text CHECK (length(href) <= 300),
  read_at              timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_recipient_idx
  ON public.notifications (recipient_profile_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Yours to read and to mark read; nobody writes one by hand.
CREATE POLICY "Read your own" ON public.notifications
  FOR SELECT TO authenticated USING (recipient_profile_id = auth.uid());
CREATE POLICY "Mark your own read" ON public.notifications
  FOR UPDATE TO authenticated
  USING (recipient_profile_id = auth.uid()) WITH CHECK (recipient_profile_id = auth.uid());
CREATE POLICY "Remove your own" ON public.notifications
  FOR DELETE TO authenticated USING (recipient_profile_id = auth.uid());

/** One place that writes a notification, so every trigger below reads the same. */
CREATE OR REPLACE FUNCTION public.notify(
  p_recipient uuid,
  p_actor uuid,
  p_kind text,
  p_title text,
  p_body text,
  p_href text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  -- Nothing tells you about your own doing.
  IF p_recipient IS NULL OR p_recipient = p_actor THEN
    RETURN;
  END IF;
  INSERT INTO public.notifications (recipient_profile_id, actor_profile_id, kind, title, body, href)
  VALUES (p_recipient, p_actor, p_kind, left(p_title, 160), left(p_body, 400), p_href);
END
$fn$;

/** The name to use for someone in a notification. */
CREATE OR REPLACE FUNCTION public.display_name_of(p_profile_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT coalesce(p.display_name, p.username, 'Someone') FROM public.profiles p WHERE p.id = p_profile_id;
$fn$;

-- ===== CONNECTIONS =====

CREATE OR REPLACE FUNCTION public.notify_connection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify(NEW.addressee_id, NEW.requester_id, 'connection_request',
      public.display_name_of(NEW.requester_id) || ' wants to connect',
      NEW.note, '/messages');
  ELSIF NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
    PERFORM public.notify(NEW.requester_id, NEW.addressee_id, 'connection_accepted',
      public.display_name_of(NEW.addressee_id) || ' accepted your request',
      NULL, '/messages');
  END IF;
  RETURN NULL;
END
$fn$;

DROP TRIGGER IF EXISTS notify_connection ON public.connections;
CREATE TRIGGER notify_connection AFTER INSERT OR UPDATE OF status ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.notify_connection();

-- ===== MESSAGES =====

CREATE OR REPLACE FUNCTION public.notify_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  member record;
BEGIN
  FOR member IN
    SELECT profile_id FROM public.conversation_members
    WHERE conversation_id = NEW.conversation_id AND profile_id <> NEW.sender_id
  LOOP
    PERFORM public.notify(member.profile_id, NEW.sender_id, 'message',
      public.display_name_of(NEW.sender_id) || ' sent you a message',
      NEW.body, '/conversation/' || NEW.conversation_id);
  END LOOP;
  RETURN NULL;
END
$fn$;

DROP TRIGGER IF EXISTS notify_message ON public.messages;
CREATE TRIGGER notify_message AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_message();

-- ===== APPLICATIONS =====

CREATE OR REPLACE FUNCTION public.notify_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_opportunity record;
BEGIN
  SELECT id, slug, title, creator_profile_id INTO v_opportunity
  FROM public.opportunities WHERE id = NEW.opportunity_id;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify(v_opportunity.creator_profile_id, NEW.applicant_profile_id,
      'application_received',
      public.display_name_of(NEW.applicant_profile_id) || ' applied to ' || v_opportunity.title,
      NEW.message, '/opportunities/' || v_opportunity.slug || '/applicants');
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'withdrawn' THEN
    PERFORM public.notify(NEW.applicant_profile_id, v_opportunity.creator_profile_id,
      'application_status',
      'Your application to ' || v_opportunity.title || ' is ' || NEW.status,
      NULL, '/opportunities/applications');
  END IF;
  RETURN NULL;
END
$fn$;

DROP TRIGGER IF EXISTS notify_application ON public.opportunity_applications;
CREATE TRIGGER notify_application
  AFTER INSERT OR UPDATE OF status ON public.opportunity_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_application();

-- ===== BOOKINGS =====

CREATE OR REPLACE FUNCTION public.notify_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_studio record;
BEGIN
  SELECT id, name, owner_profile_id INTO v_studio FROM public.studios WHERE id = NEW.studio_id;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify(v_studio.owner_profile_id, NEW.requester_profile_id, 'booking_requested',
      public.display_name_of(NEW.requester_profile_id) || ' asked for a session',
      to_char(NEW.session_date, 'DD Mon') || coalesce(' · ' || NEW.purpose, ''),
      '/provider/bookings/requests');
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'cancelled' THEN
      PERFORM public.notify(v_studio.owner_profile_id, NEW.requester_profile_id, 'booking_answered',
        public.display_name_of(NEW.requester_profile_id) || ' cancelled a session',
        to_char(NEW.session_date, 'DD Mon'), '/provider/bookings/requests');
    ELSE
      PERFORM public.notify(NEW.requester_profile_id, v_studio.owner_profile_id, 'booking_answered',
        v_studio.name || ' marked your session ' || NEW.status,
        NEW.reply, '/booking/confirmed/' || NEW.id);
    END IF;
  END IF;
  RETURN NULL;
END
$fn$;

DROP TRIGGER IF EXISTS notify_booking ON public.booking_requests;
CREATE TRIGGER notify_booking AFTER INSERT OR UPDATE OF status ON public.booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_booking();

-- ===== REVIEWS =====

CREATE OR REPLACE FUNCTION public.notify_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_studio_owner uuid;
BEGIN
  SELECT owner_profile_id INTO v_studio_owner FROM public.studios WHERE id = NEW.target_studio_id;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify(coalesce(NEW.target_profile_id, v_studio_owner), NEW.author_profile_id,
      'review_received', NEW.author_name || ' left you a review', NEW.body, '/reviews');
  ELSIF NEW.response IS DISTINCT FROM OLD.response AND NEW.response IS NOT NULL THEN
    PERFORM public.notify(NEW.author_profile_id, coalesce(NEW.target_profile_id, v_studio_owner),
      'review_reply', 'Your review got a reply', NEW.response, '/reviews');
  END IF;
  RETURN NULL;
END
$fn$;

DROP TRIGGER IF EXISTS notify_review ON public.reviews;
CREATE TRIGGER notify_review AFTER INSERT OR UPDATE OF response ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_review();

COMMIT;
