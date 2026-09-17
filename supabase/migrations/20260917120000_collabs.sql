-- Collabs: one model for groups of talent working together. A band is a collab of type 'band'
-- (ongoing, public); a project room is type 'project' (time-bound, usually private).
-- Owner decision, 17 Sep 2026: a band is a collab type, not the other way round.
--
-- The band tables are renamed, not rebuilt, so every row and id carries over. Read-only views
-- named bands / band_members / band_events / band_releases keep older code working until it moves
-- to the collab names.
-- Backup: supabase/dumps/2026-09-17-before-collabs.sql

BEGIN;

-- ===== TABLES =====

ALTER TABLE public.bands RENAME TO collabs;
ALTER TABLE public.band_members RENAME TO collab_members;
ALTER TABLE public.band_events RENAME TO collab_events;
ALTER TABLE public.band_releases RENAME TO collab_releases;

ALTER TABLE public.collab_members RENAME COLUMN band_id TO collab_id;
ALTER TABLE public.collab_events RENAME COLUMN band_id TO collab_id;
ALTER TABLE public.collab_releases RENAME COLUMN band_id TO collab_id;

ALTER INDEX IF EXISTS public.band_members_one_owner RENAME TO collab_members_one_owner;
ALTER INDEX IF EXISTS public.band_members_profile_idx RENAME TO collab_members_profile_idx;
ALTER INDEX IF EXISTS public.band_events_band_idx RENAME TO collab_events_collab_idx;
ALTER INDEX IF EXISTS public.band_releases_band_idx RENAME TO collab_releases_collab_idx;

ALTER TABLE public.collabs
  ADD COLUMN type text NOT NULL DEFAULT 'band' CHECK (type IN ('band', 'project')),
  ADD COLUMN visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  ADD COLUMN status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  ADD COLUMN ends_on date;

-- Existing rows are bands; a new collab states its type.
ALTER TABLE public.collabs ALTER COLUMN type DROP DEFAULT;

CREATE INDEX IF NOT EXISTS collabs_type_idx ON public.collabs (type, visibility);

-- ===== ACCESS FUNCTIONS =====
-- Same rules as before (creator, or a member; owner/admin to manage), now on the collab tables.

DROP POLICY IF EXISTS "Creator and members write" ON public.collab_events;
DROP POLICY IF EXISTS "Readable by everyone" ON public.collab_events;
DROP POLICY IF EXISTS "Managers add" ON public.collab_members;
DROP POLICY IF EXISTS "Managers remove, members leave" ON public.collab_members;
DROP POLICY IF EXISTS "Managers update" ON public.collab_members;
DROP POLICY IF EXISTS "Readable with the member's profile" ON public.collab_members;
DROP POLICY IF EXISTS "Creator and members write" ON public.collab_releases;
DROP POLICY IF EXISTS "Readable by everyone" ON public.collab_releases;
DROP POLICY IF EXISTS "Creator and members update" ON public.collabs;
DROP POLICY IF EXISTS "Creator and owner delete" ON public.collabs;
DROP POLICY IF EXISTS "Creators insert" ON public.collabs;
DROP POLICY IF EXISTS "Readable by everyone" ON public.collabs;

DROP FUNCTION IF EXISTS public.band_can_write(uuid);
DROP FUNCTION IF EXISTS public.band_can_manage(uuid);
DROP FUNCTION IF EXISTS public.band_is_owner(uuid);

CREATE OR REPLACE FUNCTION public.collab_can_write(p_collab_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.collabs c WHERE c.id = p_collab_id AND c.created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM public.collab_members m
               WHERE m.collab_id = p_collab_id AND m.profile_id = auth.uid()));
$fn$;

CREATE OR REPLACE FUNCTION public.collab_can_manage(p_collab_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.collabs c WHERE c.id = p_collab_id AND c.created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM public.collab_members m
               WHERE m.collab_id = p_collab_id AND m.profile_id = auth.uid()
                 AND m.role IN ('owner', 'admin')));
$fn$;

CREATE OR REPLACE FUNCTION public.collab_is_owner(p_collab_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.collabs c WHERE c.id = p_collab_id AND c.created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM public.collab_members m
               WHERE m.collab_id = p_collab_id AND m.profile_id = auth.uid() AND m.role = 'owner'));
$fn$;

-- A public collab is readable by anyone; a private one only by its creator and members.
CREATE OR REPLACE FUNCTION public.collab_is_readable(p_collab_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.collabs c WHERE c.id = p_collab_id AND c.visibility = 'public')
    OR public.collab_can_write(p_collab_id);
$fn$;

ALTER FUNCTION public.bands_guard_admin_fields() RENAME TO collabs_guard_admin_fields;
CREATE OR REPLACE FUNCTION public.collabs_guard_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') IN ('authenticated', 'anon')
     AND ((TG_OP = 'INSERT' AND NEW.is_verified)
          OR (TG_OP = 'UPDATE' AND NEW.is_verified IS DISTINCT FROM OLD.is_verified)) THEN
    RAISE EXCEPTION 'is_verified is set by MusicLinkd, not by the collab';
  END IF;
  RETURN NEW;
END
$fn$;

ALTER TRIGGER bands_guard_admin_fields ON public.collabs RENAME TO collabs_guard_admin_fields;
ALTER TRIGGER update_bands_updated_at ON public.collabs RENAME TO update_collabs_updated_at;

-- ===== POLICIES =====

CREATE POLICY "Public collabs readable, private to members" ON public.collabs
  FOR SELECT TO public USING (visibility = 'public' OR public.collab_can_write(id));
CREATE POLICY "Creators insert" ON public.collabs
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Creator and members update" ON public.collabs
  FOR UPDATE TO authenticated USING (public.collab_can_write(id)) WITH CHECK (public.collab_can_write(id));
CREATE POLICY "Creator and owner delete" ON public.collabs
  FOR DELETE TO authenticated USING (public.collab_is_owner(id));

CREATE POLICY "Readable with the collab and the member's profile" ON public.collab_members
  FOR SELECT TO public USING (public.collab_is_readable(collab_id) AND public.profile_is_readable(profile_id));
CREATE POLICY "Managers add" ON public.collab_members
  FOR INSERT TO authenticated WITH CHECK (public.collab_can_manage(collab_id));
CREATE POLICY "Managers update" ON public.collab_members
  FOR UPDATE TO authenticated USING (public.collab_can_manage(collab_id)) WITH CHECK (public.collab_can_manage(collab_id));
CREATE POLICY "Managers remove, members leave" ON public.collab_members
  FOR DELETE TO authenticated USING (public.collab_can_manage(collab_id) OR profile_id = auth.uid());

CREATE POLICY "Readable with the collab" ON public.collab_events
  FOR SELECT TO public USING (public.collab_is_readable(collab_id));
CREATE POLICY "Creator and members write" ON public.collab_events
  FOR ALL TO authenticated USING (public.collab_can_write(collab_id)) WITH CHECK (public.collab_can_write(collab_id));

CREATE POLICY "Readable with the collab" ON public.collab_releases
  FOR SELECT TO public USING (public.collab_is_readable(collab_id));
CREATE POLICY "Creator and members write" ON public.collab_releases
  FOR ALL TO authenticated USING (public.collab_can_write(collab_id)) WITH CHECK (public.collab_can_write(collab_id));

-- ===== COMPATIBILITY VIEWS =====
-- Read-only, and security_invoker so the collab policies above still decide what is visible.

CREATE VIEW public.bands WITH (security_invoker = true) AS
  SELECT id, slug, name, tagline, bio, genres, city, formed_year, avatar_url, cover_url, looking_for,
         availability, rate_paise, rate_unit, is_verified, created_by, created_at, updated_at
  FROM public.collabs WHERE type = 'band';

CREATE VIEW public.band_members WITH (security_invoker = true) AS
  SELECT m.collab_id AS band_id, m.profile_id, m.role, m.instrument, m.since_year, m.sort_order, m.created_at
  FROM public.collab_members m JOIN public.collabs c ON c.id = m.collab_id AND c.type = 'band';

CREATE VIEW public.band_events WITH (security_invoker = true) AS
  SELECT e.id, e.collab_id AS band_id, e.title, e.venue, e.city, e.event_date, e.event_time,
         e.date_precision, e.status, e.ticket_note, e.sort_order, e.created_at
  FROM public.collab_events e JOIN public.collabs c ON c.id = e.collab_id AND c.type = 'band';

CREATE VIEW public.band_releases WITH (security_invoker = true) AS
  SELECT r.id, r.collab_id AS band_id, r.title, r.kind, r.release_year, r.cover_url, r.sort_order, r.created_at
  FROM public.collab_releases r JOIN public.collabs c ON c.id = r.collab_id AND c.type = 'band';

GRANT SELECT ON public.bands, public.band_members, public.band_events, public.band_releases TO anon, authenticated;

COMMIT;
