-- M3 of booking by service (owner, 3 Oct 2026): the bookables.services tags are retired;
-- profile_services is the one list of what a business offers. Apply only after C3 (main at or
-- after the merge of feat/one-calendar) is published: code published before it still reads
-- bookables.services.
--
-- The column is renamed services_retired, kept as it is (15 places have tags on 4 Oct) and dropped
-- in P2. Nothing is converted into services.
--
-- Snapshot before applying: supabase/dumps/YYYY-MM-DD-before-retire-rooms.sql covers it (the
-- column's definition and the count of places with tags).
--
-- Rollback: ALTER TABLE public.bookables RENAME COLUMN services_retired TO services;

BEGIN;

CREATE TEMP TABLE _before ON COMMIT DROP AS
SELECT count(*) AS tagged FROM public.bookables WHERE cardinality(services) > 0;

DO $guard$
DECLARE bad text;
BEGIN
  -- A view on the column would stop the rename; a function naming it would break after it.
  SELECT string_agg(p.proname, ', ') INTO bad
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.prosrc ~ '\mbookables\M' AND p.prosrc ~ '\mservices\M';
  IF bad IS NOT NULL THEN RAISE EXCEPTION 'functions that may read bookables.services: %', bad; END IF;
END
$guard$;

ALTER TABLE public.bookables RENAME COLUMN services TO services_retired;
COMMENT ON COLUMN public.bookables.services_retired IS
  'Retired 4 Oct 2026: profile_services is what a business offers. Kept as it was; dropped in P2.';

DO $check$
DECLARE b record;
BEGIN
  SELECT * INTO b FROM _before;
  IF (SELECT count(*) FROM public.bookables WHERE cardinality(services_retired) > 0) <> b.tagged THEN
    RAISE EXCEPTION 'tag counts changed';
  END IF;
END
$check$;

COMMIT;
