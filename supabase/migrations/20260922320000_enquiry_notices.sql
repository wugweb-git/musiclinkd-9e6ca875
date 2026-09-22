-- Owner, 22 Sep 2026: an enquiry (a quote, booking or hire request, or a service request) tells the
-- person it is for with its own notice — "New enquiry: Request quote from Meera" — which opens the
-- business's Leads (a talent's goes to Messages, where the enquiry also lands). The chat message
-- the enquiry posts no longer sends a second "sent you a message" notice for the same thing.
-- Snapshot and undo: supabase/dumps/2026-09-22-before-enquiry-notices.sql

BEGIN;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check CHECK ((kind = ANY (ARRAY['connection_request'::text, 'connection_accepted'::text, 'message'::text, 'application_received'::text, 'application_status'::text, 'booking_requested'::text, 'booking_answered'::text, 'review_received'::text, 'review_reply'::text, 'review_request'::text, 'collab_invite'::text, 'collab_joined'::text, 'rental_requested'::text, 'rental_answered'::text, 'enquiry_received'::text])));

CREATE OR REPLACE FUNCTION public.notify_enquiry()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_username text;
  v_business boolean;
BEGIN
  SELECT p.username, EXISTS (SELECT 1 FROM public.profile_business b WHERE b.profile_id = p.id)
    INTO v_username, v_business
    FROM public.profiles p WHERE p.id = NEW.business_profile_id;
  PERFORM public.notify(NEW.business_profile_id, NEW.sender_profile_id, 'enquiry_received',
    'New enquiry: ' || NEW.intent || ' from ' || public.display_name_of(NEW.sender_profile_id),
    NEW.message,
    CASE WHEN v_business AND v_username IS NOT NULL
         THEN '/business/' || v_username || '/leads' ELSE '/messages' END);
  RETURN NULL;
END
$function$;

DROP TRIGGER IF EXISTS notify_enquiry ON public.enquiries;
CREATE TRIGGER notify_enquiry AFTER INSERT ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION public.notify_enquiry();

-- The enquiry's own chat message (posted by sendEnquiry right after the enquiry, starting with its
-- intent) is already announced by the enquiry notice.
CREATE OR REPLACE FUNCTION public.notify_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  member record;
BEGIN
  FOR member IN
    SELECT profile_id FROM public.conversation_members
    WHERE conversation_id = NEW.conversation_id AND profile_id <> NEW.sender_id
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.enquiries e
       WHERE e.sender_profile_id = NEW.sender_id
         AND e.business_profile_id = member.profile_id
         AND e.created_at > now() - interval '1 minute'
         AND left(NEW.body, length(e.intent)) = e.intent
    ) THEN
      CONTINUE;
    END IF;
    PERFORM public.notify(member.profile_id, NEW.sender_id, 'message',
      public.display_name_of(NEW.sender_id) || ' sent you a message',
      NEW.body, '/conversation/' || NEW.conversation_id);
  END LOOP;
  RETURN NULL;
END
$function$;

COMMIT;
