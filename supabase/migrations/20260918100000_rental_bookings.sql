-- Renting equipment: a request from a renter against one marketplace_listings row (category
-- gear_rental), moved along by the listing's own seller. Mirrors opportunity_applications'
-- shape (20260917160000_applications.sql) — same request/decide/withdraw pattern, same RLS
-- style — adapted for a listing owner instead of an opportunity poster.
-- Snapshot: supabase/dumps/2026-09-18-before-rental-bookings.sql

BEGIN;

CREATE TABLE IF NOT EXISTS public.rental_bookings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id        uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  renter_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status            text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'offer_sent', 'confirmed', 'active', 'completed', 'cancelled', 'declined')),
  start_date        date NOT NULL,
  end_date          date NOT NULL CHECK (end_date >= start_date),
  quantity          integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  fulfilment        text NOT NULL DEFAULT 'pickup'
    CHECK (fulfilment IN ('pickup', 'provider_delivery', 'courier')),
  total_paise       bigint CHECK (total_paise >= 0),
  deposit_paise     bigint CHECK (deposit_paise >= 0),
  note              text CHECK (length(note) <= 2000),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rental_bookings_listing_idx
  ON public.rental_bookings (listing_id, status);
CREATE INDEX IF NOT EXISTS rental_bookings_renter_idx
  ON public.rental_bookings (renter_profile_id, created_at DESC);

ALTER TABLE public.rental_bookings ENABLE ROW LEVEL SECURITY;

-- Who owns the listing being booked, in one place.
CREATE OR REPLACE FUNCTION public.rental_listing_is_mine(p_listing_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.marketplace_listings l
    WHERE l.id = p_listing_id AND l.seller_profile_id = auth.uid());
$fn$;

CREATE POLICY "Renter and listing owner read" ON public.rental_bookings
  FOR SELECT TO authenticated
  USING (renter_profile_id = auth.uid() OR public.rental_listing_is_mine(listing_id));
CREATE POLICY "Request as yourself" ON public.rental_bookings
  FOR INSERT TO authenticated WITH CHECK (renter_profile_id = auth.uid());
-- The listing owner moves it along (offer/confirm/decline); the renter can only cancel their own.
CREATE POLICY "Owner decides, renter cancels" ON public.rental_bookings
  FOR UPDATE TO authenticated
  USING (public.rental_listing_is_mine(listing_id) OR renter_profile_id = auth.uid())
  WITH CHECK (public.rental_listing_is_mine(listing_id) OR renter_profile_id = auth.uid());
CREATE POLICY "Renter removes their own" ON public.rental_bookings
  FOR DELETE TO authenticated USING (renter_profile_id = auth.uid());

CREATE OR REPLACE FUNCTION public.rental_bookings_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS rental_bookings_touch_updated_at ON public.rental_bookings;
CREATE TRIGGER rental_bookings_touch_updated_at BEFORE UPDATE ON public.rental_bookings
  FOR EACH ROW EXECUTE FUNCTION public.rental_bookings_touch_updated_at();

COMMIT;
