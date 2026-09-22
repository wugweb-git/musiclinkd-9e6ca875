-- Before 20260922320000_enquiry_notices.sql (22 Sep 2026). No rows change; this restores the kind
-- rule and notify_message, and drops the new enquiry trigger.
BEGIN;
DROP TRIGGER IF EXISTS notify_enquiry ON public.enquiries;
DROP FUNCTION IF EXISTS public.notify_enquiry();
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check CHECK ((kind = ANY (ARRAY['connection_request'::text, 'connection_accepted'::text, 'message'::text, 'application_received'::text, 'application_status'::text, 'booking_requested'::text, 'booking_answered'::text, 'review_received'::text, 'review_reply'::text, 'review_request'::text, 'collab_invite'::text, 'collab_joined'::text, 'rental_requested'::text, 'rental_answered'::text])));
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
    PERFORM public.notify(member.profile_id, NEW.sender_id, 'message',
      public.display_name_of(NEW.sender_id) || ' sent you a message',
      NEW.body, '/conversation/' || NEW.conversation_id);
  END LOOP;
  RETURN NULL;
END
$function$;
COMMIT;
