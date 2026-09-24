-- Owner, 24 Sep 2026 ("business user"): Northlight Films, Sunset Records and The Quarter are
-- businesses and should be registered as such.
--
-- All three carry business person_types (production_house, music_label, venue), so they already
-- read as businesses wherever the role is used — but none had a profile_business row, which is
-- what a screen checks when it asks whether a profile is a business at all. The other 29
-- business-shaped profiles were already correct.
--
-- Nothing is invented here. Every profile_business column except profile_id is nullable or
-- defaulted, so these rows carry no address, capacity or roster: those are the owner's to fill
-- from the business page.
--
-- Snapshot and undo: supabase/dumps/2026-09-24-before-business-rows.sql

BEGIN;

INSERT INTO public.profile_business (profile_id)
SELECT id FROM public.profiles
WHERE username IN ('northlightfilms', 'sunsetrecords', 'thequarter')
ON CONFLICT (profile_id) DO NOTHING;

-- Northlight Films had a city ('Delhi') but no state, so it fell out of every state-scoped
-- filter and its city picker had no list to draw from. Delhi the city sits in Delhi the
-- territory; the other two already had theirs.
UPDATE public.profiles
   SET state = 'Delhi'
 WHERE username = 'northlightfilms'
   AND city = 'Delhi'
   AND state IS NULL;

COMMIT;
