-- An enquiry remembers which service it was about and which conversation it opened, so the
-- thread can show that service at the top (owner, 4 Oct 2026: a service-originated Inbox thread
-- starts with the service). Two nullable columns on enquiries; no new table. Older enquiries and
-- enquiries from a business page keep both empty and their threads show no block.
--
-- A trigger keeps the links honest, because the sender writes the row: a service that isn't the
-- business's own, or a conversation the sender isn't in, is dropped to null rather than stored.
--
-- Snapshot: supabase/dumps/2026-10-04-before-enquiry-service-link.sql

BEGIN;

ALTER TABLE public.enquiries
  ADD COLUMN service_id uuid REFERENCES public.profile_services(id) ON DELETE SET NULL,
  ADD COLUMN conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL;

CREATE INDEX enquiries_conversation_id_idx
  ON public.enquiries (conversation_id) WHERE conversation_id IS NOT NULL;

CREATE FUNCTION public.enquiries_check_links() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.service_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profile_services s
    WHERE s.id = NEW.service_id AND s.profile_id = NEW.business_profile_id
  ) THEN
    NEW.service_id := NULL;
  END IF;
  IF NEW.conversation_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.conversation_members m
    WHERE m.conversation_id = NEW.conversation_id AND m.profile_id = NEW.sender_profile_id
  ) THEN
    NEW.conversation_id := NULL;
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER enquiries_check_links
  BEFORE INSERT OR UPDATE OF service_id, conversation_id, business_profile_id, sender_profile_id
  ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION public.enquiries_check_links();

COMMIT;
