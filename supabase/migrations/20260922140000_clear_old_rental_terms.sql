-- Owner, 22 Sep 2026: the listing flow no longer takes a deposit, weekly or monthly prices, a
-- notice period, delivery fee or note, rental length or quantity, and listing pages don't show
-- them. Gear listings drop what they still stored, so every listing holds only what its seller can
-- see and edit. Columns that can't be empty go back to their defaults (1 day, 30 days, 1 unit).
-- Snapshot and rollback: supabase/dumps/2026-09-22-before-clear-rental-terms.sql

UPDATE public.marketplace_listings SET
  price_note = NULL, deposit_paise = NULL, weekly_price_paise = NULL, monthly_price_paise = NULL,
  notice_period = NULL, delivery_fee_paise = NULL, delivery_note = NULL,
  min_days = 1, max_days = 30, quantity_available = 1
WHERE category IN ('gear_sale', 'gear_rental');
