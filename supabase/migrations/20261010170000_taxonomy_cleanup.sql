-- Taxonomy clean-up to match Notion Master Taxonomy (owner, 10 Oct 2026).
--   * availability_status, session_types, budget_type, session_duration_tiers are deleted: not used
--     (availability is one Open to work switch). profiles.budget_tier goes with budget_type.
--   * Amenities offered are Notion's 18 samples; the other 15 stay readable for the places that
--     already list them, but are no longer offered (metadata.picker = false).
-- Snapshot: supabase/dumps/2026-10-10-before-taxonomy-cleanup.sql
BEGIN;
DELETE FROM public.taxonomy_options
  WHERE category_key IN ('availability_status', 'session_types', 'budget_type', 'session_duration_tiers');
DELETE FROM public.taxonomy_categories
  WHERE key IN ('availability_status', 'session_types', 'budget_type', 'session_duration_tiers');
ALTER TABLE public.profiles DROP COLUMN IF EXISTS budget_tier;

UPDATE public.taxonomy_options
SET is_published = true,
    metadata = coalesce(metadata, '{}'::jsonb) - 'picker',
    updated_at = now()
WHERE category_key = 'amenities'
  AND slug IN ('dolby_atmos', 'vocal_booth', 'live_room', 'rehearsal_room', 'parking_space',
               'instruments_support', 'acoustics_optimized', 'fiber_internet', 'stage_monitors',
               'green_room', 'wifi', 'attended_sessions', 'stem_mastering', 'analogue_chain',
               'backline_included', 'four_mic_positions', 'multicam_video', 'air_conditioning');
UPDATE public.taxonomy_options
SET is_published = true,
    metadata = coalesce(metadata, '{}'::jsonb) || '{"picker": false}'::jsonb,
    updated_at = now()
WHERE category_key = 'amenities'
  AND slug NOT IN ('dolby_atmos', 'vocal_booth', 'live_room', 'rehearsal_room', 'parking_space',
                   'instruments_support', 'acoustics_optimized', 'fiber_internet', 'stage_monitors',
                   'green_room', 'wifi', 'attended_sessions', 'stem_mastering', 'analogue_chain',
                   'backline_included', 'four_mic_positions', 'multicam_video', 'air_conditioning');
COMMIT;
NOTIFY pgrst, 'reload schema';
