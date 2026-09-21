-- Owner, 22 Sep 2026: the 122 services added by 20260922190000_talent_services_rest.sql meet the Add service
-- rules like every other live service: specific categories (first one is `category`), deliverables, a delivery
-- time from the four choices, no pricing model or unit (one starting price). Sound design gets a starting price
-- from the person's hourly rate; the 7 services with no starting price become drafts for their owner to finish.
-- Snapshot and undo: supabase/dumps/2026-09-22-before-talent-services-rules.sql
-- Applied to the live database 2026-09-22. Idempotent: it only matches rows with no categories and no deliverables.

BEGIN;

WITH m(name, cats, deliv) AS (
  VALUES
    ('Session vocals', ARRAY['session_vocals','backing_vocals']::text[], ARRAY['Lead and harmony takes','Dry WAV takes','Comp-ready session']::text[]),
    ('Live vocal set', ARRAY['private_parties','weddings','corporate_events']::text[], ARRAY['Live vocal set','Setlist agreed in advance','Sound check']::text[]),
    ('Lyric writing for your song', ARRAY['lyrics']::text[], ARRAY['Original lyrics','One round of revisions','Clean lyric sheet']::text[]),
    ('Hooks and topline lyrics', ARRAY['topline','lyrics']::text[], ARRAY['Chorus hook','Topline lyric','Clean lyric sheet']::text[]),
    ('Music production for your track', ARRAY['music_production','arrangements']::text[], ARRAY['Produced track','Mix-ready session','Stems']::text[]),
    ('Beat making', ARRAY['beat_making','music_production']::text[], ARRAY['Custom beat','Stems','Tempo and key notes']::text[]),
    ('Original composition', ARRAY['composition','arrangements']::text[], ARRAY['Composed piece','Demo recording','Notation or session on request']::text[]),
    ('Scoring for film and ads', ARRAY['film_scoring','composition']::text[], ARRAY['Score and cues','Written to picture','Stems for the mix']::text[]),
    ('Recording session engineering', ARRAY['session_recording','studio_recording']::text[], ARRAY['Engineer for the session','Tracked session files','Basic edit']::text[]),
    ('Stereo mixing', ARRAY['stereo_mixing']::text[], ARRAY['Stereo mix','Stems','Two revision rounds']::text[]),
    ('Sound design for film and ads', ARRAY['sound_design','film_scoring']::text[], ARRAY['Custom sound design','Effects delivered to picture','Stems']::text[]),
    ('Session guitar', ARRAY['session_recording','remote_tracks']::text[], ARRAY['Guitar parts','WAV stems','One round of changes']::text[]),
    ('Live guitarist for gigs', ARRAY['band_gigs','concerts']::text[], ARRAY['Guitar for the show','Own rig','One rehearsal']::text[]),
    ('Session drums', ARRAY['session_recording']::text[], ARRAY['Drum parts','WAV stems','One round of changes']::text[]),
    ('Live drummer for gigs', ARRAY['band_gigs','concerts']::text[], ARRAY['Drums for the show','One rehearsal']::text[]),
    ('Session keys', ARRAY['session_recording','remote_tracks']::text[], ARRAY['Keys parts','WAV stems','One round of changes']::text[]),
    ('Live keys for gigs', ARRAY['band_gigs','concerts']::text[], ARRAY['Keys for the show','Patches programmed ahead','One rehearsal']::text[]),
    ('Sitar for recordings', ARRAY['session_recording','remote_tracks']::text[], ARRAY['Sitar parts','WAV stems','One round of changes']::text[]),
    ('Sitar performance for events', ARRAY['weddings','private_parties','corporate_events']::text[], ARRAY['Live sitar set','Setlist agreed in advance','Sound check']::text[]),
    ('Folk vocal set', ARRAY['weddings','concerts','private_parties']::text[], ARRAY['Live folk vocal set','Setlist agreed in advance','Sound check']::text[]),
    ('Folk vocals for recordings', ARRAY['session_vocals']::text[], ARRAY['Folk vocal takes','Dry WAV','One round of changes']::text[]),
    ('Guest verse', ARRAY['session_vocals']::text[], ARRAY['Rap verse','Dry stems','Guide mix']::text[]),
    ('Rap hooks and features', ARRAY['session_vocals','topline']::text[], ARRAY['Hook or feature','Dry stems','Guide mix']::text[])
)
UPDATE public.profile_services s
   SET categories = m.cats,
       category = m.cats[1],
       deliverables = m.deliv,
       turnaround = CASE s.turnaround
                      WHEN '3 days' THEN '3–5 days' WHEN '4 days' THEN '3–5 days' WHEN '5 days' THEN '3–5 days'
                      WHEN 'Same week' THEN '1 week' WHEN '1 week' THEN '1 week'
                      WHEN '2 weeks' THEN '2 weeks' WHEN '2 weeks'' notice' THEN '2 weeks' WHEN '3 weeks'' notice' THEN '2 weeks'
                      ELSE s.turnaround END,
       price_unit = NULL, pricing_model = NULL, min_hours = NULL,
       updated_at = now()
  FROM m
 WHERE s.name = m.name
   AND s.pricing_model_taxonomy = 'pricing_models'
   AND cardinality(s.categories) = 0
   AND cardinality(s.deliverables) = 0;

UPDATE public.profile_services s
   SET price_paise = (round(p.rate_paise * 6 / 10000.0) * 10000)::bigint, updated_at = now()
  FROM public.profiles p
 WHERE p.id = s.profile_id AND s.category = 'sound_design' AND s.price_paise IS NULL
   AND p.rate_unit = 'hour' AND p.rate_paise IS NOT NULL
   AND s.created_at >= now() - interval '6 hours';

UPDATE public.profile_services
   SET status = 'draft', updated_at = now()
 WHERE price_paise IS NULL AND status = 'active'
   AND created_at >= now() - interval '6 hours'
   AND cardinality(deliverables) > 0;

COMMIT;
