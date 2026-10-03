-- The Market's suggested places come from taxonomy_options (AGENTS.md: cities are never an array
-- in code). Until now src/components/ml/market.tsx kept six names and their map centres in code,
-- and one of them ("Panjim") wasn't even the taxonomy's name for the city ("Panaji").
--
-- Adds to six existing city rows, merged into metadata (nothing else changes):
--   market_rank  1–6, the order the Market suggests them in
--   lat, lng     the city centre, for the map and for Locate me (nearest suggested city)
-- The values are the ones market.tsx used.
--
-- Snapshot: supabase/dumps/2026-10-04-before-market-cities.sql
-- Rollback: UPDATE public.taxonomy_options SET metadata = metadata - 'market_rank' - 'lat' - 'lng'
--           WHERE category_key = 'cities';

BEGIN;

DO $apply$
DECLARE
  r record;
  n int;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('maharashtra__mumbai',  1, 19.0760, 72.8777),
      ('delhi__new_delhi',     2, 28.6139, 77.2090),
      ('karnataka__bengaluru', 3, 12.9716, 77.5946),
      ('tamil_nadu__chennai',  4, 13.0827, 80.2707),
      ('maharashtra__pune',    5, 18.5204, 73.8567),
      ('goa__panaji',          6, 15.4909, 73.8278)
    ) AS v(slug, rank, lat, lng)
  LOOP
    UPDATE public.taxonomy_options
       SET metadata = coalesce(metadata, '{}'::jsonb)
                      || jsonb_build_object('market_rank', r.rank, 'lat', r.lat, 'lng', r.lng)
     WHERE category_key = 'cities' AND slug = r.slug;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 1 THEN RAISE EXCEPTION 'city % matched % rows, expected 1', r.slug, n; END IF;
  END LOOP;
END
$apply$;

COMMIT;
