-- Rounding out marketplace_listings (category gear_rental) so a real listing can drive the same
-- request wizard the seed Equipment type does: RentalCalendar, FulfilmentPicker, PriceBreakdown
-- (src/components/ml/rental.tsx) all require a fully-populated Equipment object.
-- Purely additive: every column is nullable or defaulted, nothing existing is touched.
-- Snapshot: supabase/dumps/2026-09-18-before-rental-equipment-fields.sql

BEGIN;

ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS brand                text,
  ADD COLUMN IF NOT EXISTS model                 text,
  ADD COLUMN IF NOT EXISTS weekly_price_paise    bigint CHECK (weekly_price_paise >= 0),
  ADD COLUMN IF NOT EXISTS monthly_price_paise   bigint CHECK (monthly_price_paise >= 0),
  ADD COLUMN IF NOT EXISTS deposit_paise         bigint CHECK (deposit_paise >= 0),
  ADD COLUMN IF NOT EXISTS quantity_available    integer NOT NULL DEFAULT 1 CHECK (quantity_available > 0),
  ADD COLUMN IF NOT EXISTS pickup_available      boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS delivery_available    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_fee_paise    bigint CHECK (delivery_fee_paise >= 0),
  ADD COLUMN IF NOT EXISTS delivery_note         text,
  ADD COLUMN IF NOT EXISTS pickup_location       text,
  ADD COLUMN IF NOT EXISTS min_days              integer NOT NULL DEFAULT 1 CHECK (min_days > 0),
  ADD COLUMN IF NOT EXISTS max_days              integer NOT NULL DEFAULT 30 CHECK (max_days >= min_days),
  ADD COLUMN IF NOT EXISTS notice_period         text,
  ADD COLUMN IF NOT EXISTS unavailable_dates     date[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS listing_description   text,
  ADD COLUMN IF NOT EXISTS specs                 jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS included              text[] NOT NULL DEFAULT '{}';

COMMIT;
