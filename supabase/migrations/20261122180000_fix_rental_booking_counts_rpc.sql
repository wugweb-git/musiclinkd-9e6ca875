-- Fix permissions on rental_booking_counts:
-- Was mistakenly revoked in 20260922330000_security_lint_and_policies.sql.
-- Function only aggregates counts of active/completed rental bookings per listing_id
-- and leaks no private user, personal or payment data.

GRANT EXECUTE ON FUNCTION public.rental_booking_counts() TO anon, authenticated, service_role;
