-- Owner, 22 Sep 2026: (1) the Focusrite 18i20 was listed both for sale and for rent; the rental
-- (no bookings, no offers) becomes a Behringer X32 digital mixer, so no product shows twice.
-- Price, terms and seller stay. (2) The Fender Twin Reverb is an amplifier: Backline, not guitars.
-- Snapshot and rollback: supabase/dumps/2026-09-22-before-rental-swap.sql

BEGIN;

UPDATE public.marketplace_listings SET
  slug = 'behringer-x32-rent', title = 'Behringer X32 Digital Mixer', brand = 'Behringer',
  model = 'X32', item_category = 'mixers', item_category_kind = 'equipment',
  listing_description = '32-channel digital mixer for live gigs and location recording. Road case included, all faders and preamps tested before dispatch.',
  included = ARRAY['Mixer','Road case','Power cable'],
  specs = '[{"label":"Brand","value":"Behringer"},{"label":"Model","value":"X32"},{"label":"Type","value":"Digital mixer"},{"label":"Channels","value":"32 inputs, 16 buses"},{"label":"Condition","value":"Good"}]'::jsonb,
  image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Behringer_X32_%281%29.jpg/960px-Behringer_X32_%281%29.jpg'
WHERE id = '7703e7b1-61ef-41bd-919d-e934c42c6041';

UPDATE public.marketplace_listings SET item_category = 'backline', item_category_kind = 'equipment'
WHERE id = '1894ccf8-c595-4f49-8bc5-311c30699aeb';

COMMIT;
