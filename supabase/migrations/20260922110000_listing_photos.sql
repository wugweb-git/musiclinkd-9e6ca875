-- Owner, 22 Sep 2026: gear listings shared a handful of stock photos, so different products looked
-- the same (the SM7B rental and the TLM 103 sale had one mic photo). Each gear listing now has its
-- own photo of that product, from Wikimedia Commons. The Focusrite 18i20 sale and the backline
-- rental keep theirs.
-- Snapshot and rollback: supabase/dumps/2026-09-22-before-listing-photos.sql

BEGIN;
UPDATE public.marketplace_listings SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Ampeg_SVT_Classic.jpg/960px-Ampeg_SVT_Classic.jpg' WHERE id = 'faef91c2-e4dd-59c6-9f1d-b143eb35d144';
UPDATE public.marketplace_listings SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Instrument_perkusyjny_TABLA_firmy_Meinl.jpg/960px-Instrument_perkusyjny_TABLA_firmy_Meinl.jpg' WHERE id = '09af6466-c2e3-4f3d-9081-358b0ece114f';
UPDATE public.marketplace_listings SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Fender_Stratocaster_004-2.jpg/960px-Fender_Stratocaster_004-2.jpg' WHERE id = '665283bd-4f5a-4684-9d17-22d376d81ddd';
UPDATE public.marketplace_listings SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Jon_Hammond%27s_1965_Fender_Twin_Reverb_Amp_with_Factory_JBL_Speakers.jpg/960px-Jon_Hammond%27s_1965_Fender_Twin_Reverb_Amp_with_Factory_JBL_Speakers.jpg' WHERE id = '1894ccf8-c595-4f49-8bc5-311c30699aeb';
UPDATE public.marketplace_listings SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Focusrite_Saffire_PRO_and_Liquid_Saffire_Firewire-Thunderbolt_audio_interfaces_-_14%2C_24%2C_24_DSP%2C_40%2C_and_Liquid_Saffire_56_-_2014_NAMM_Show_%28by_Matt_Vanacoro%29.jpg/960px-Focusrite_Saffire_PRO_and_Liquid_Saffire_Firewire-Thunderbolt_audio_interfaces_-_14%2C_24%2C_24_DSP%2C_40%2C_and_Liquid_Saffire_56_-_2014_NAMM_Show_%28by_Matt_Vanacoro%29.jpg' WHERE id = '7703e7b1-61ef-41bd-919d-e934c42c6041';
UPDATE public.marketplace_listings SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Focusrite_Scarlett_2i2%2C_2i4%2C_6i6_USB2.0_Audio_Interfaces_with_Focusrite_Mic_Preamps_-_2014_NAMM_Show_%28by_Matt_Vanacoro%29.jpg/960px-Focusrite_Scarlett_2i2%2C_2i4%2C_6i6_USB2.0_Audio_Interfaces_with_Focusrite_Mic_Preamps_-_2014_NAMM_Show_%28by_Matt_Vanacoro%29.jpg' WHERE id = '2de0417c-ceac-59c4-bbe3-b8b62b548c2c';
UPDATE public.marketplace_listings SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Sitar3.jpg/960px-Sitar3.jpg' WHERE id = '88a50b01-7d5c-424c-994e-288f0a9e82a1';
UPDATE public.marketplace_listings SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/JBL_EON_1500.jpg/960px-JBL_EON_1500.jpg' WHERE id = 'a57f1cb8-3d2c-493c-bbff-376a812964d0';
UPDATE public.marketplace_listings SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Neumann_TLM_103.jpg/960px-Neumann_TLM_103.jpg' WHERE id = '67dd4cf0-597a-4507-9074-eda3dd30c3ec';
UPDATE public.marketplace_listings SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Neumann_U87.jpg/960px-Neumann_U87.jpg' WHERE id = '15997341-d8ce-5275-a4de-20647cefc5ca';
UPDATE public.marketplace_listings SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Nord_Stage_EX_and_Roland_AX-Synth.jpg/960px-Nord_Stage_EX_and_Roland_AX-Synth.jpg' WHERE id = '720f478b-c916-443c-bce3-ce81bc7dc160';
UPDATE public.marketplace_listings SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Pearl_Midtown_compact_drum_kit.jpg/960px-Pearl_Midtown_compact_drum_kit.jpg' WHERE id = '4d7bd28f-6f1c-5bde-a8bd-e068eedabc81';
UPDATE public.marketplace_listings SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Pioneer_XDJ-AERO_in_IFA_20130907.jpg/960px-Pioneer_XDJ-AERO_in_IFA_20130907.jpg' WHERE id = 'c60ce189-b65a-4b42-ae20-4c30a2d2e97f';
UPDATE public.marketplace_listings SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Shure_SM7.jpg/960px-Shure_SM7.jpg' WHERE id = 'db7a9ebf-ea72-492b-bad7-213c903f4b53';
UPDATE public.marketplace_listings SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Yamaha_MSP7_Studio_Monitor.jpg/960px-Yamaha_MSP7_Studio_Monitor.jpg' WHERE id = 'e30e2d0f-d5a1-5021-ba7b-f8ac8103be22';
COMMIT;
