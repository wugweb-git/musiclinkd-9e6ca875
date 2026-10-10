-- Snapshot before 20261010120000_drop_persona_bucket.sql: the only object it touches.
-- Undo: run this file. No table or row is touched by the drop; nothing in the database depends on
-- the function (pg_depend, 10 Oct 2026). person_type_instruments and genre_languages stay.
CREATE OR REPLACE FUNCTION public.persona_bucket(p_primary text, p_secondary text[] DEFAULT '{}'::text[], p_languages text[] DEFAULT '{}'::text[], p_limit integer DEFAULT 12)
 RETURNS TABLE(category_key text, slug text, label text, display_order integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE
  v_roles text[] := array_append(coalesce(p_secondary, '{}'), p_primary);
BEGIN
  IF p_limit IS NULL OR p_limit < 1 THEN
    RAISE EXCEPTION 'persona_bucket: p_limit must be at least 1, got %', p_limit;
  END IF;
  IF cardinality(coalesce(p_secondary, '{}')) > 2 THEN
    RAISE EXCEPTION 'persona_bucket: at most 2 secondary person types, got %', cardinality(p_secondary);
  END IF;
  IF (SELECT count(DISTINCT x) FROM unnest(coalesce(p_secondary, '{}')) x) <> cardinality(coalesce(p_secondary, '{}')) THEN
    RAISE EXCEPTION 'persona_bucket: secondary person types repeat: %', p_secondary;
  END IF;
  IF p_primary = ANY (coalesce(p_secondary, '{}')) THEN
    RAISE EXCEPTION 'persona_bucket: secondary person type % repeats the primary', p_primary;
  END IF;
  IF EXISTS (
    SELECT 1 FROM unnest(v_roles) r
    WHERE NOT EXISTS (SELECT 1 FROM taxonomy_options o
                      JOIN taxonomy_categories c ON c.key = o.category_key AND c.is_published
                      WHERE o.category_key = 'person_types' AND o.slug = r AND o.is_published)
  ) THEN
    RAISE EXCEPTION 'persona_bucket: unknown or unpublished person type in %', v_roles;
  END IF;

  RETURN QUERY
  WITH candidates AS (
    SELECT o.category_key AS cat, o.slug AS opt_slug, o.label AS opt_label, o.sort_order AS rank_order,
           CASE WHEN EXISTS (SELECT 1 FROM person_type_instruments p0
                             WHERE p0.instrument_slug = o.slug AND p0.person_type_slug = p_primary)
                THEN 0 ELSE 1 END AS tier
    FROM taxonomy_options o
    JOIN taxonomy_categories c ON c.key = o.category_key AND c.is_published
    WHERE o.category_key = 'instruments' AND o.is_published
      AND EXISTS (SELECT 1 FROM person_type_instruments pti
                  WHERE pti.instrument_slug = o.slug AND pti.person_type_slug = ANY (v_roles))
    UNION ALL
    SELECT o.category_key, o.slug, o.label, o.sort_order,
           CASE WHEN o.metadata->>'scope' = 'regional' THEN 0 ELSE 1 END
    FROM taxonomy_options o
    JOIN taxonomy_categories c ON c.key = o.category_key AND c.is_published
    WHERE o.category_key = 'genres' AND o.is_published
      AND (o.metadata->>'scope' = 'universal'
           OR EXISTS (SELECT 1 FROM genre_languages gl
                      JOIN taxonomy_options lo ON lo.category_key = 'languages' AND lo.slug = gl.language_slug
                      WHERE gl.genre_slug = o.slug AND lo.is_published
                        AND gl.language_slug = ANY (coalesce(p_languages, '{}'))))
  ),
  ranked AS (
    SELECT c.*, (row_number() OVER (PARTITION BY c.cat ORDER BY c.tier, c.rank_order))::int AS rn
    FROM candidates c
  )
  SELECT r.cat, r.opt_slug, r.opt_label, r.rn
  FROM ranked r
  WHERE r.rn <= CASE WHEN r.cat = 'genres' THEN GREATEST(p_limit, 20) ELSE p_limit END
  ORDER BY r.cat, r.rn;
END
$function$;
