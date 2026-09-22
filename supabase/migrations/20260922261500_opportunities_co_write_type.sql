-- Opportunities: co-write is an opportunity type again (owner, 22 Sep 2026).
--
-- 20260914190000_opportunities_drop_co_write.sql cleared collaboration_type co_write on the two
-- opportunities that had it; this puts it back. Their pay text ("Co-Write", "Under Discussion")
-- was kept then and is not touched now. The co_write option in taxonomy_options
-- (collaboration_types) was never removed and stays published; it is checked, not written.
--
-- Snapshot: supabase/dumps/2026-09-22-before-co-write-type.sql
-- Re-reads what it wrote and raises on any difference. Idempotent.

UPDATE public.opportunities SET collaboration_type = 'co_write', updated_at = now()
WHERE slug IN ('neon-nocturne-vol-3', 'acoustic-guitarist-ep')
  AND collaboration_type IS DISTINCT FROM 'co_write';

DO $verify$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.taxonomy_options
    WHERE category_key = 'collaboration_types' AND slug = 'co_write' AND is_published
  ) THEN
    RAISE EXCEPTION 'co_write collaboration type option missing or unpublished';
  END IF;
  IF EXISTS (
    SELECT 1 FROM (VALUES ('neon-nocturne-vol-3', 'Co-Write'), ('acoustic-guitarist-ep', 'Under Discussion')) v(slug, note)
    LEFT JOIN public.opportunities o ON o.slug = v.slug
    WHERE o.slug IS NULL OR o.budget_note IS DISTINCT FROM v.note
       OR o.collaboration_type IS DISTINCT FROM 'co_write'
  ) THEN
    RAISE EXCEPTION 'co-write opportunities not in the expected state';
  END IF;
END
$verify$;
