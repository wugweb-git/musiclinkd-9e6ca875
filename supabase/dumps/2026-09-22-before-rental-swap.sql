-- MusicLinkd live database snapshot (Lovable Cloud, Supabase project ace967d9-a62e-48bb-b076-c3b63b11b185)
-- Taken 2026-09-22 via Lovable query_database, before migration 20260922120000_rental_swap_and_twin_backline.sql.
--
-- Scope: two marketplace_listings rows. The rental 7703e7b1 had no bookings and no offers.
-- To restore both rows as they were:
UPDATE public.marketplace_listings SET
  slug = 'focusrite-18i20-rent', title = 'Focusrite Scarlett 18i20 Interface', brand = 'Focusrite',
  model = '18i20 3rd Gen', item_category = 'audio_interfaces', item_category_kind = 'equipment',
  listing_description = 'Eight preamps plus ADAT for tracking live bands on location. Rack ears fitted, all channels tested before dispatch.',
  included = ARRAY['Interface','PSU','USB-C cable','Rack ears'],
  specs = '[{"label":"Brand","value":"Focusrite"},{"label":"Model","value":"Scarlett 18i20 3rd Gen"},{"label":"Type","value":"USB audio interface"},{"label":"Connectivity","value":"USB-C, 8 mic pre, ADAT"},{"label":"Power","value":"External PSU"},{"label":"Weight","value":"3.1 kg"},{"label":"Condition","value":"Good"},{"label":"Year","value":"2020"}]'::jsonb,
  image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Focusrite_Saffire_PRO_and_Liquid_Saffire_Firewire-Thunderbolt_audio_interfaces_-_14%2C_24%2C_24_DSP%2C_40%2C_and_Liquid_Saffire_56_-_2014_NAMM_Show_%28by_Matt_Vanacoro%29.jpg/960px-Focusrite_Saffire_PRO_and_Liquid_Saffire_Firewire-Thunderbolt_audio_interfaces_-_14%2C_24%2C_24_DSP%2C_40%2C_and_Liquid_Saffire_56_-_2014_NAMM_Show_%28by_Matt_Vanacoro%29.jpg'
WHERE id = '7703e7b1-61ef-41bd-919d-e934c42c6041';
UPDATE public.marketplace_listings SET item_category = 'electric_guitar', item_category_kind = 'instrument'
WHERE id = '1894ccf8-c595-4f49-8bc5-311c30699aeb';
