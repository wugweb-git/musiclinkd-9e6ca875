-- Genres: one list of 14 for every persona (owner, 10 Oct 2026), replacing the 47-genre list
-- the owner called stale ("the Notion itself is wrong"). Every stored genre is mapped to one of the
-- 14 so no profile, band, collaboration or opportunity loses its genres; anything unmapped becomes
-- Other. genre_languages (genre → language, used only by the retired persona_bucket) is dropped.
-- Undo: supabase/dumps/2026-10-10-before-genres-14.sql (definitions, mapping and counts).

CREATE TEMP TABLE genre_map(old text PRIMARY KEY, new text NOT NULL) ON COMMIT DROP;
INSERT INTO genre_map VALUES
  ('bollywood', 'bollywood'),
  ('punjabi_pop', 'pop'),
  ('hindustani_classical', 'classical'),
  ('carnatic_classical', 'classical'),
  ('sufi_devotional', 'sufi'),
  ('bhajan', 'devotional'),
  ('ghazal', 'classical'),
  ('qawwali', 'sufi'),
  ('bhangra', 'folk'),
  ('kollywood', 'regional'),
  ('tollywood', 'regional'),
  ('mollywood', 'regional'),
  ('sandalwood', 'regional'),
  ('rabindra_sangeet', 'regional'),
  ('lavani', 'folk'),
  ('garba', 'folk'),
  ('bihu', 'folk'),
  ('bhojpuri_folk', 'folk'),
  ('gaana', 'regional'),
  ('baul', 'folk'),
  ('natya_sangeet', 'regional'),
  ('rajasthani_folk', 'folk'),
  ('indie_pop', 'indie'),
  ('hiphop', 'hiphop'),
  ('trap', 'hiphop'),
  ('rock', 'rock'),
  ('metal', 'rock'),
  ('edm', 'electronic'),
  ('lofi', 'electronic'),
  ('acoustic', 'indie'),
  ('fusion', 'fusion'),
  ('rnb', 'pop'),
  ('jazz', 'jazz'),
  ('blues', 'jazz'),
  ('reggae', 'other'),
  ('indie', 'indie'),
  ('electronic', 'electronic'),
  ('ambient', 'electronic'),
  ('pop_vocals', 'pop'),
  ('house', 'electronic'),
  ('techno', 'electronic'),
  ('desi_bass', 'electronic'),
  ('carnatic_fusion', 'fusion'),
  ('semi_classical', 'classical'),
  ('gully_rap', 'hiphop'),
  ('folk', 'folk'),
  ('punjabi_folk', 'folk'),
  ('Alt Pop', 'pop'),
  ('Ambient', 'electronic'),
  ('Electronic', 'electronic'),
  ('Indie Folk', 'indie');

CREATE OR REPLACE FUNCTION pg_temp.remap(arr text[]) RETURNS text[] LANGUAGE sql AS $$
  SELECT coalesce(array_agg(n ORDER BY first), '{}')
  FROM (SELECT coalesce(m.new, 'other') AS n, min(o.i) AS first
        FROM unnest(arr) WITH ORDINALITY o(g, i) LEFT JOIN genre_map m ON m.old = o.g
        GROUP BY 1) s
$$;

-- The 14 first, so every remapped value already exists.
INSERT INTO public.taxonomy_options (category_key, slug, label, sort_order, is_published, metadata)
VALUES
  ('genres', 'bollywood', 'Bollywood', 1, true, '{}'::jsonb),
  ('genres', 'classical', 'Classical', 2, true, '{}'::jsonb),
  ('genres', 'folk', 'Folk', 3, true, '{}'::jsonb),
  ('genres', 'rock', 'Rock', 4, true, '{}'::jsonb),
  ('genres', 'indie', 'Indie', 5, true, '{}'::jsonb),
  ('genres', 'jazz', 'Jazz', 6, true, '{}'::jsonb),
  ('genres', 'fusion', 'Fusion', 7, true, '{}'::jsonb),
  ('genres', 'sufi', 'Sufi', 8, true, '{}'::jsonb),
  ('genres', 'devotional', 'Devotional', 9, true, '{}'::jsonb),
  ('genres', 'electronic', 'Electronic', 10, true, '{}'::jsonb),
  ('genres', 'hiphop', 'Hip-Hop', 11, true, '{}'::jsonb),
  ('genres', 'regional', 'Regional', 12, true, '{}'::jsonb),
  ('genres', 'pop', 'Pop', 13, true, '{}'::jsonb),
  ('genres', 'other', 'Other', 14, true, '{}'::jsonb)
ON CONFLICT (category_key, slug) DO UPDATE
  SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order, is_published = true,
      metadata = '{}'::jsonb, updated_at = now();

UPDATE public.profiles      SET genres = pg_temp.remap(genres) WHERE genres IS NOT NULL AND cardinality(genres) > 0;
UPDATE public.bands         SET genres = pg_temp.remap(genres) WHERE genres IS NOT NULL AND cardinality(genres) > 0;
UPDATE public.collabs       SET genres = pg_temp.remap(genres) WHERE genres IS NOT NULL AND cardinality(genres) > 0;
UPDATE public.opportunities SET genres = pg_temp.remap(genres) WHERE genres IS NOT NULL AND cardinality(genres) > 0;

DROP TABLE IF EXISTS public.genre_languages;

DELETE FROM public.taxonomy_options
WHERE category_key = 'genres'
  AND slug NOT IN ('bollywood', 'classical', 'folk', 'rock', 'indie', 'jazz', 'fusion', 'sufi', 'devotional', 'electronic', 'hiphop', 'regional', 'pop', 'other');
