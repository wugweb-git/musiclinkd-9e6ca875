-- Amenities, equipment and policies (owner, 22 Sep 2026).
-- Amenities are what the place has (Live Room, Parking, Wi-Fi); equipment is gear with a make,
-- category, quantity and included-or-extra; services are what the studio does; policies are its
-- rules. The amenities list mixed all four, so:
--   * equipment-like amenities become studio_equipment items (included) and leave the list;
--   * service-like amenities become studio_services and leave the list;
--   * equipment_categories gains Consoles, Amplifiers and Outboard (instruments come from the
--     instruments list, as in Market);
--   * profile_business.policies holds a business's rules, one per line, with suggestions in
--     taxonomy category business_policies.
-- Moved amenity options are unpublished, not deleted.
--
-- Rollback:
--   Restore studios.amenities / studios.services for the 8 studios from
--   supabase/dumps/2026-09-22-before-amenities-equipment-policies.sql;
--   DELETE FROM public.studio_equipment WHERE sort_order >= 100 AND name IN ('Drum kit','Backline',
--     'Dolby Atmos monitoring','Analogue chain','Microphones','Stage monitors')
--     AND studio_id IN (<the 8 studio ids in the snapshot>);
--   UPDATE public.taxonomy_options SET is_published = true WHERE category_key = 'studio_amenities';
--   DELETE FROM public.taxonomy_options WHERE (category_key = 'studio_services' AND slug IN
--     ('resident_engineers','attended_sessions','stem_mastering','producer','same_day_audio','multicam_video'))
--     OR (category_key = 'equipment_categories' AND slug IN ('consoles','amplifiers','outboard'))
--     OR category_key = 'business_policies';
--   DELETE FROM public.taxonomy_categories WHERE key = 'business_policies';
--   ALTER TABLE public.profile_business DROP COLUMN IF EXISTS policies;

-- 1. New equipment categories.
INSERT INTO public.taxonomy_options (category_key, slug, label, sort_order) VALUES
  ('equipment_categories', 'consoles', 'Consoles', 10),
  ('equipment_categories', 'amplifiers', 'Amplifiers', 11),
  ('equipment_categories', 'outboard', 'Outboard', 12)
ON CONFLICT DO NOTHING;

-- 2. New studio services.
INSERT INTO public.taxonomy_options (category_key, slug, label, sort_order) VALUES
  ('studio_services', 'resident_engineers', 'Resident Engineers', 4),
  ('studio_services', 'attended_sessions', 'Attended Sessions', 5),
  ('studio_services', 'stem_mastering', 'Stem Mastering', 6),
  ('studio_services', 'producer', 'Producer', 7),
  ('studio_services', 'same_day_audio', 'Same-Day Audio', 8),
  ('studio_services', 'multicam_video', 'Multicam Video', 9)
ON CONFLICT DO NOTHING;

-- 3. Equipment-like amenities become equipment items on the studios that had them.
INSERT INTO public.studio_equipment (studio_id, name, category, quantity, included, sort_order)
SELECT s.id, m.name, m.category, m.quantity, true, 100 + m.ord
FROM public.studios s
JOIN (VALUES
  ('drums_included', 'Drum kit', 'drums', NULL::int, 1),
  ('backline_included', 'Backline', 'backline', NULL::int, 2),
  ('dolby_atmos', 'Dolby Atmos monitoring', 'studio_monitors', NULL::int, 3),
  ('analogue_chain', 'Analogue chain', 'outboard', NULL::int, 4),
  ('four_mic_positions', 'Microphones', 'microphones', 4, 5),
  ('stage_monitors', 'Stage monitors', 'pa_systems', NULL::int, 6)
) AS m(amenity, name, category, quantity, ord) ON m.amenity = ANY (s.amenities);

-- 4. Service-like amenities become the studio's services.
UPDATE public.studios s
SET services = (
  SELECT array_agg(DISTINCT x) FROM unnest(
    coalesce(s.services, '{}') ||
    ARRAY(SELECT a FROM unnest(s.amenities) a WHERE a IN
      ('resident_engineers','attended_sessions','stem_mastering','producer','same_day_audio','multicam_video'))
  ) x
)
WHERE s.amenities && ARRAY['resident_engineers','attended_sessions','stem_mastering','producer','same_day_audio','multicam_video'];

-- 5. Both leave the amenities list.
UPDATE public.studios s
SET amenities = ARRAY(SELECT a FROM unnest(s.amenities) a WHERE a NOT IN
  ('drums_included','backline_included','dolby_atmos','analogue_chain','four_mic_positions','stage_monitors',
   'resident_engineers','attended_sessions','stem_mastering','producer','same_day_audio','multicam_video'))
WHERE s.amenities && ARRAY['drums_included','backline_included','dolby_atmos','analogue_chain','four_mic_positions',
  'stage_monitors','resident_engineers','attended_sessions','stem_mastering','producer','same_day_audio','multicam_video'];

UPDATE public.taxonomy_options SET is_published = false
WHERE category_key = 'studio_amenities' AND slug IN
  ('drums_included','backline_included','dolby_atmos','analogue_chain','four_mic_positions','stage_monitors',
   'resident_engineers','attended_sessions','stem_mastering','producer','same_day_audio','multicam_video');

-- 6. Policies.
ALTER TABLE public.profile_business ADD COLUMN IF NOT EXISTS policies text[] NOT NULL DEFAULT '{}';
COMMENT ON COLUMN public.profile_business.policies IS 'The business''s rules, one per entry, shown on its page.';

INSERT INTO public.taxonomy_categories (key, label, description) VALUES
  ('business_policies', 'Policy suggestions', 'One-tap starting points for a business''s policies; the owner edits them.')
ON CONFLICT (key) DO NOTHING;
INSERT INTO public.taxonomy_options (category_key, slug, label, sort_order) VALUES
  ('business_policies', 'no_smoking', 'No smoking or alcohol inside the rooms.', 1),
  ('business_policies', 'reschedule_24h', 'Reschedule at least 24 hours before your session.', 2),
  ('business_policies', 'arrive_early', 'Please arrive 10 minutes before your slot.', 3),
  ('business_policies', 'on_time', 'Sessions start and end on time.', 4),
  ('business_policies', 'outside_musicians', 'Outside musicians are welcome.', 5),
  ('business_policies', 'gear_stays', 'Studio gear stays in the building; ask before moving it.', 6),
  ('business_policies', 'food_lounge', 'Food and drinks only in the lounge.', 7),
  ('business_policies', 'id_on_arrival', 'Carry a photo ID for check-in.', 8)
ON CONFLICT DO NOTHING;
