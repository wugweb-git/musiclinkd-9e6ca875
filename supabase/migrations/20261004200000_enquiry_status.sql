-- Queue item 10 (owner, 4 Oct 2026): an enquiry's state is new (the provider hasn't responded),
-- replied (they have; the buyer's turn) or closed (the provider's own archive). `booked` is removed,
-- never mapped: it was a hand-set label with no booking behind it. Booking state lives on
-- booking_requests and is never mixed into an enquiry.
--
-- Stops if any row is still 'booked' (live on 4 Oct: none of 3).
-- Snapshot: supabase/dumps/2026-10-04-before-enquiry-status.sql

BEGIN;

DO $guard$
BEGIN
  IF EXISTS (SELECT 1 FROM public.enquiries WHERE status = 'booked') THEN
    RAISE EXCEPTION 'Some enquiries are still marked booked; report them before narrowing';
  END IF;
END
$guard$;

ALTER TABLE public.enquiries DROP CONSTRAINT enquiries_status_check;
ALTER TABLE public.enquiries ADD CONSTRAINT enquiries_status_check
  CHECK (status IN ('new', 'replied', 'closed'));

COMMIT;
