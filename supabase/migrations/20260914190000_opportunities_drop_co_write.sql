-- Opportunities: remove the co-write collaboration type.
--
-- Owner decision (14 Sep 2026): the two imported opportunities typed co_write (neon-nocturne-vol-3,
-- acoustic-guitarist-ep) keep their pay text ("Co-Write", "Under Discussion") but lose the type.
-- The co_write taxonomy option itself is left as it is.
--
-- Re-reads what it wrote and raises on any difference. Idempotent.

UPDATE public.opportunities SET collaboration_type = NULL, updated_at = now()
WHERE collaboration_type = 'co_write';

DO $verify$
BEGIN
  IF EXISTS (SELECT 1 FROM public.opportunities WHERE collaboration_type = 'co_write') THEN
    RAISE EXCEPTION 'co_write collaboration type still present';
  END IF;
  IF EXISTS (
    SELECT 1 FROM (VALUES ('neon-nocturne-vol-3', 'Co-Write'), ('acoustic-guitarist-ep', 'Under Discussion')) v(slug, note)
    LEFT JOIN public.opportunities o ON o.slug = v.slug
    WHERE o.slug IS NULL OR o.budget_note IS DISTINCT FROM v.note OR o.collaboration_type IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'co-write opportunities not in the expected state';
  END IF;
END
$verify$;
