-- Owner, 22 Sep 2026: a service has one starting price ("From ₹X"), with no pricing model or unit,
-- the same as the Add service flow saves. The 48 services that still had a unit ("/hour", "/song")
-- keep their amount and lose the unit.
-- Snapshot and undo: supabase/dumps/2026-09-22-before-starting-prices.sql

UPDATE public.profile_services
   SET pricing_model = NULL, price_unit = NULL, min_hours = NULL, updated_at = now()
 WHERE pricing_model IS NOT NULL OR price_unit IS NOT NULL;
