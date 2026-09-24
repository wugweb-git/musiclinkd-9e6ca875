-- Two invariant violations on profiles, both factual.
--
-- onboarding_complete = true while onboarding_step is still set is a state the app cannot produce:
-- its own writers set the pair together (onboarding/complete.tsx and profile-groups.functions.ts).
-- Two rows predate that and made the column mean different things on different rows.
--
-- A city with no state falls out of every state-scoped filter, and its city picker has no list to
-- draw from, because cities are scoped by state. Same correction already applied to northlightfilms.
--
-- Not touched: the three rows holding city = 'Delhi'. "Delhi" is not a city in taxonomy_options, so
-- those people typed something the app never offered them — the list or the validation is the fix,
-- not rewriting where somebody says they live.
--
-- Snapshot and undo: supabase/dumps/2026-09-24-before-profile-invariants.sql

BEGIN;

UPDATE public.profiles
   SET onboarding_step = NULL
 WHERE onboarding_complete = true
   AND onboarding_step IS NOT NULL;

UPDATE public.profiles
   SET state = 'Delhi'
 WHERE city = 'Delhi'
   AND state IS NULL;

COMMIT;
