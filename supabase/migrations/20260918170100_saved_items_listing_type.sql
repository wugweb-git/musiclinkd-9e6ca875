-- Marketplace and rental listings share one table (marketplace_listings), so one new
-- target_type value covers saving either kind from /marketplace or /marketplace/rent.
alter table public.saved_items drop constraint saved_items_target_type_check;
alter table public.saved_items
  add constraint saved_items_target_type_check
  check (target_type = any (array['talent', 'band', 'studio', 'business', 'event', 'listing']));
