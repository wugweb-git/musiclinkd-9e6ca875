-- MusicLinkd live database snapshot (Lovable Cloud, Supabase project ace967d9-a62e-48bb-b076-c3b63b11b185)
-- Taken 2026-09-22 via Lovable query_database, before migration 20260922251000_collab_invite_links.sql.
--
-- Scope: every row of public.collab_members (13 rows), and the trigger function
-- public.notify_collab_member as it stood. The migration adds a new table (collab_invite_links),
-- a guard trigger on collab_members and two functions; it changes no existing row.
-- public.collab_invite_links did not exist at snapshot time.
--
-- To undo the migration:
--   DROP FUNCTION IF EXISTS public.join_collab_by_link(text);
--   DROP FUNCTION IF EXISTS public.collab_link_preview(text);
--   DROP TRIGGER IF EXISTS collab_members_guard_self ON public.collab_members;
--   DROP FUNCTION IF EXISTS public.collab_members_guard_self();
--   DROP TABLE IF EXISTS public.collab_invite_links;
--   then run the notify_collab_member definition below.

-- public.collab_members (13 rows)
INSERT INTO public.collab_members (collab_id, profile_id, role, instrument, since_year, sort_order, created_at, status, invited_by) VALUES ('035dfe6b-04c5-5fcc-b41f-27e32a435685', '388fbd0a-9c57-5f5d-84e7-45a43890c4a8', 'owner', 'Lead Vocalist & Slide Guitar', NULL, 0, '2026-09-16 03:18:30.099331+00', 'active', NULL);
INSERT INTO public.collab_members (collab_id, profile_id, role, instrument, since_year, sort_order, created_at, status, invited_by) VALUES ('035dfe6b-04c5-5fcc-b41f-27e32a435685', '9078142e-bb3a-59c1-b330-2c9bb54af016', 'member', 'Keyboards & Hammond B3', NULL, 1, '2026-09-16 03:18:30.099331+00', 'active', NULL);
INSERT INTO public.collab_members (collab_id, profile_id, role, instrument, since_year, sort_order, created_at, status, invited_by) VALUES ('035dfe6b-04c5-5fcc-b41f-27e32a435685', '41bb93a2-c008-5cd9-8527-df24dd257435', 'member', 'Alto Saxophone', NULL, 2, '2026-09-16 03:18:30.099331+00', 'active', NULL);
INSERT INTO public.collab_members (collab_id, profile_id, role, instrument, since_year, sort_order, created_at, status, invited_by) VALUES ('035dfe6b-04c5-5fcc-b41f-27e32a435685', '472ea245-75bc-42ee-8fbb-db6d571ee5d0', 'member', 'Double Bass', NULL, 3, '2026-09-16 03:18:30.099331+00', 'active', NULL);
INSERT INTO public.collab_members (collab_id, profile_id, role, instrument, since_year, sort_order, created_at, status, invited_by) VALUES ('035dfe6b-04c5-5fcc-b41f-27e32a435685', 'd7b2a092-5bed-5b7b-8789-77faad938c7c', 'member', 'Drums & Percussion', NULL, 4, '2026-09-16 03:18:30.099331+00', 'active', NULL);
INSERT INTO public.collab_members (collab_id, profile_id, role, instrument, since_year, sort_order, created_at, status, invited_by) VALUES ('03e8e48e-2c72-4fd2-adef-8e5fb93bc82f', 'e94add2a-8b45-4648-8429-fcb6c30dc128', 'owner', NULL, NULL, 0, '2026-09-21 23:43:33.146698+00', 'active', NULL);
INSERT INTO public.collab_members (collab_id, profile_id, role, instrument, since_year, sort_order, created_at, status, invited_by) VALUES ('1a18f576-c433-50ae-9be7-e1d22cad05bc', '576fc434-bf67-50a6-8f58-6f31c6f73dfe', 'owner', 'Producer, guitar', '2019', 0, '2026-09-16 04:10:53.739032+00', 'active', NULL);
INSERT INTO public.collab_members (collab_id, profile_id, role, instrument, since_year, sort_order, created_at, status, invited_by) VALUES ('1a18f576-c433-50ae-9be7-e1d22cad05bc', 'ba5786ec-11fd-5ee9-b013-176f102e6fa9', 'admin', 'Lead vocals', '2019', 1, '2026-09-16 04:10:53.739032+00', 'active', NULL);
INSERT INTO public.collab_members (collab_id, profile_id, role, instrument, since_year, sort_order, created_at, status, invited_by) VALUES ('1a18f576-c433-50ae-9be7-e1d22cad05bc', '6bff4ad2-63de-5f0d-80f9-1e27c222bcfc', 'member', 'Bass', '2021', 2, '2026-09-16 04:10:53.739032+00', 'active', NULL);
INSERT INTO public.collab_members (collab_id, profile_id, role, instrument, since_year, sort_order, created_at, status, invited_by) VALUES ('1a18f576-c433-50ae-9be7-e1d22cad05bc', '86d5ed33-51cf-58a1-8173-27df428e378b', 'member', 'Drums', '2022', 3, '2026-09-16 04:10:53.739032+00', 'active', NULL);
INSERT INTO public.collab_members (collab_id, profile_id, role, instrument, since_year, sort_order, created_at, status, invited_by) VALUES ('71573c4d-f836-5cfe-9ba1-02b246a57353', '76d1e631-1a32-59ab-8cf5-96ce884da4e4', 'owner', 'Synths', '2022', 0, '2026-09-16 04:10:53.739032+00', 'active', NULL);
INSERT INTO public.collab_members (collab_id, profile_id, role, instrument, since_year, sort_order, created_at, status, invited_by) VALUES ('71573c4d-f836-5cfe-9ba1-02b246a57353', 'ad14622c-32a2-5745-ab7a-ac0a07a26d24', 'member', 'Live drums', '2023', 1, '2026-09-16 04:10:53.739032+00', 'active', NULL);
INSERT INTO public.collab_members (collab_id, profile_id, role, instrument, since_year, sort_order, created_at, status, invited_by) VALUES ('dae2d234-489d-4900-ad8a-699f707909a3', 'e94add2a-8b45-4648-8429-fcb6c30dc128', 'owner', NULL, NULL, 0, '2026-09-21 23:43:11.341375+00', 'active', NULL);

-- public.notify_collab_member, as it stood
CREATE OR REPLACE FUNCTION public.notify_collab_member()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_collab record;
BEGIN
  SELECT id, name, type INTO v_collab FROM public.collabs WHERE id = NEW.collab_id;

  IF TG_OP = 'INSERT' AND NEW.status = 'invited' THEN
    PERFORM public.notify(NEW.profile_id, NEW.invited_by, 'collab_invite',
      public.display_name_of(NEW.invited_by) || ' invited you to ' || v_collab.name,
      'Open it to join or say no.', '/collab/' || v_collab.id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status = 'invited' THEN
    PERFORM public.notify(NEW.invited_by, NEW.profile_id, 'collab_joined',
      public.display_name_of(NEW.profile_id) || ' joined ' || v_collab.name,
      NULL, '/collab/' || v_collab.id);
  END IF;
  RETURN NULL;
END
$function$;
