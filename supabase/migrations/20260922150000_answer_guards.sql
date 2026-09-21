-- Only the studio answers a booking request, and only the reviewed business replies to a review.
--
-- The UPDATE policies are row-level: a requester may update their own booking (to cancel or move
-- it) and an author may edit their own review, but a policy can't say which columns. So a
-- requester could set their own request to "confirmed", and a reviewer could write the owner's
-- reply. These BEFORE UPDATE triggers limit the columns. Server-side calls (no auth.uid()) are not
-- limited. No rows change.
--
-- Rollback:
--   DROP TRIGGER IF EXISTS booking_requests_guard ON public.booking_requests;
--   DROP FUNCTION IF EXISTS public.booking_requests_guard();
--   DROP TRIGGER IF EXISTS reviews_guard ON public.reviews;
--   DROP FUNCTION IF EXISTS public.reviews_guard();

CREATE OR REPLACE FUNCTION public.booking_requests_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF auth.uid() IS NULL OR public.studio_is_mine(OLD.studio_id) THEN
    RETURN NEW;
  END IF;
  -- The requester: cancel, or move the time (which sends it back to "requested"). Nothing else.
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status NOT IN ('cancelled', 'requested') THEN
    RAISE EXCEPTION 'Only the studio can answer a booking request' USING ERRCODE = '42501';
  END IF;
  IF NEW.reply IS DISTINCT FROM OLD.reply AND NEW.reply IS NOT NULL THEN
    RAISE EXCEPTION 'Only the studio can reply to a booking request' USING ERRCODE = '42501';
  END IF;
  IF NEW.studio_id IS DISTINCT FROM OLD.studio_id
     OR NEW.requester_profile_id IS DISTINCT FROM OLD.requester_profile_id
     OR NEW.studio_name IS DISTINCT FROM OLD.studio_name
     OR NEW.requester_name IS DISTINCT FROM OLD.requester_name THEN
    RAISE EXCEPTION 'A booking request keeps its studio and requester' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS booking_requests_guard ON public.booking_requests;
CREATE TRIGGER booking_requests_guard BEFORE UPDATE ON public.booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.booking_requests_guard();

CREATE OR REPLACE FUNCTION public.reviews_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  reviewed boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  reviewed := OLD.target_profile_id = auth.uid() OR public.studio_is_mine(OLD.target_studio_id);
  -- Only the reviewed profile or studio owner writes the reply.
  IF NEW.response IS DISTINCT FROM OLD.response AND NOT coalesce(reviewed, false) THEN
    RAISE EXCEPTION 'Only the reviewed business can reply' USING ERRCODE = '42501';
  END IF;
  -- Only the author changes the review itself.
  IF OLD.author_profile_id IS DISTINCT FROM auth.uid()
     AND (to_jsonb(NEW) - 'response') IS DISTINCT FROM (to_jsonb(OLD) - 'response') THEN
    RAISE EXCEPTION 'Only the author can edit a review' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS reviews_guard ON public.reviews;
CREATE TRIGGER reviews_guard BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.reviews_guard();
