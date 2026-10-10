-- Orphaned stored values (owner, 10 Oct 2026: "remove the orphaned KVs").
--   * profiles.availability is one Open to work switch: "Available" or nothing. Old values that
--     meant open (Shows, Session Work, Projects, Production, Freelance Work, Recording,
--     Collaborations, available_now) become Available; Touring meant not taking work and is cleared.
--   * a_and_r is not a persona type; A&R is Artist Management (Notion Master Taxonomy).
--   * discovery_prefs.bandIntent is read by nothing.
-- Counts before (no user data): availability Shows 23, Touring 10, Session Work 3, Projects 3,
-- Production 2, Freelance Work 1, Recording 1, Collaborations 1, available_now 1, Available 1;
-- roles a_and_r 1; bandIntent 1.
BEGIN;
UPDATE public.profiles SET availability = NULL WHERE availability = 'Touring';
UPDATE public.profiles SET availability = 'Available'
  WHERE availability IS NOT NULL AND availability <> 'Available';
UPDATE public.profiles SET roles = array_replace(roles, 'a_and_r', 'artist_manager')
  WHERE 'a_and_r' = ANY (roles) AND NOT 'artist_manager' = ANY (roles);
UPDATE public.profiles SET discovery_prefs = discovery_prefs - 'bandIntent'
  WHERE discovery_prefs ? 'bandIntent';
COMMIT;
