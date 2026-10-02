-- Snapshot before the bookables rename (p1/bookables, Migration 1).
-- Taken read-only from the live database on 2026-10-02 by Claude (Cowork) via the Lovable database
-- query tool, because supabase/checks/bookables-snapshot.sql (51d75e5) is on p1/bookables and not
-- visible to that tool. The queries below cover the same ground: counts, studio-named columns,
-- foreign keys, indexes, triggers, access rules, views, and full live function definitions.
-- Definitions and counts only. No user data.
--
-- Also run: supabase/checks/applied-since-20260918160000.sql -> EMPTY (every expected object is live).

-- ─── Row counts ─────────────────────────────────────────────────────────────────────────────
--   studios 21 · studio_rooms 25 · studio_blocks 0 · studio_equipment 116 · studio_photos 57
--   reviews 43 (all targets) · booking_requests 10 · business-media objects 0

-- ─── Views on these tables ──────────────────────────────────────────────────────────────────
--   none (no view in public references studio*)

-- ─── Columns (public) ───────────────────────────────────────────────────────────────────────
-- studios: id uuid NOT NULL default gen_random_uuid() · owner_profile_id uuid NOT NULL · slug text NOT NULL
--   name text NOT NULL · description text · location text · geo_lat float8 · geo_lng float8
--   image_url text · images text[] NOT NULL default '{}' · amenities text[] NOT NULL default '{}'
--   services text[] NOT NULL default '{}' · add_ons jsonb NOT NULL default '[]'
--   blackout_dates jsonb NOT NULL default '[]' · weekly_hours jsonb NOT NULL default '{}'
--   operating_hours text · notice_hours int NOT NULL default 0 · cancellation_policy text
--   console_type text · hourly_rate_paise bigint · rating numeric · review_count int NOT NULL default 0
--   response_time text · verified_gold bool NOT NULL default false · archived_at timestamptz
--   created_at timestamptz NOT NULL default now() · updated_at timestamptz NOT NULL default now()
-- studio_rooms: id uuid NOT NULL default gen_random_uuid() · studio_id uuid NOT NULL · name text NOT NULL
--   kind text · description text · capacity int · hourly_rate_paise bigint · tiers jsonb NOT NULL default '[]'
--   amenities text[] NOT NULL default '{}' · gear text[] NOT NULL default '{}' · photo_url text
--   sort_order int NOT NULL default 0
-- studio_blocks: id uuid NOT NULL default gen_random_uuid() · studio_id uuid NOT NULL · room_id uuid
--   starts_at timestamp NOT NULL · ends_at timestamp NOT NULL · reason text
--   created_at timestamptz NOT NULL default now()
-- studio_equipment: id uuid NOT NULL default gen_random_uuid() · studio_id uuid NOT NULL · name text NOT NULL
--   category text · quantity int · included bool NOT NULL default true · sort_order int NOT NULL default 0
-- studio_photos: id uuid NOT NULL default gen_random_uuid() · studio_id uuid NOT NULL
--   subject_type text NOT NULL · subject_id text NOT NULL · url text NOT NULL
--   sort_order int NOT NULL default 0 · created_at timestamptz NOT NULL default now()
-- Studio-named columns on other tables:
--   booking_requests.studio_id uuid NULL · booking_requests.studio_name text NULL
--   reviews.target_studio_id uuid NULL

-- ─── Foreign keys ───────────────────────────────────────────────────────────────────────────
-- booking_requests_room_id_fkey:   booking_requests(room_id)        → studio_rooms(id)  ON DELETE SET NULL
-- booking_requests_studio_id_fkey: booking_requests(studio_id)      → studios(id)       ON DELETE SET NULL
-- reviews_target_studio_id_fkey:   reviews(target_studio_id)        → studios(id)       ON DELETE CASCADE
-- studio_blocks_room_id_fkey:      studio_blocks(room_id)           → studio_rooms(id)  ON DELETE CASCADE
-- studio_blocks_studio_id_fkey:    studio_blocks(studio_id)         → studios(id)       ON DELETE CASCADE
-- studio_equipment_studio_id_fkey: studio_equipment(studio_id)      → studios(id)       ON DELETE CASCADE
-- studio_photos_studio_id_fkey:    studio_photos(studio_id)         → studios(id)       ON DELETE CASCADE
-- studio_rooms_studio_id_fkey:     studio_rooms(studio_id)          → studios(id)       ON DELETE CASCADE
-- studios_owner_business_fkey:     studios(owner_profile_id)        → profile_business(profile_id) ON DELETE CASCADE
-- studios_owner_profile_id_fkey:   studios(owner_profile_id)        → profiles(id)      ON DELETE CASCADE

-- ─── Indexes ────────────────────────────────────────────────────────────────────────────────
-- CREATE INDEX booking_requests_studio_idx ON public.booking_requests USING btree (studio_id, session_date);
-- CREATE UNIQUE INDEX reviews_one_per_studio ON public.reviews USING btree (author_profile_id, target_studio_id) WHERE ((author_profile_id IS NOT NULL) AND (target_studio_id IS NOT NULL));
-- CREATE INDEX reviews_target_studio_idx ON public.reviews USING btree (target_studio_id, created_at DESC);
-- CREATE UNIQUE INDEX studio_blocks_pkey ON public.studio_blocks USING btree (id);
-- CREATE INDEX studio_blocks_studio_idx ON public.studio_blocks USING btree (studio_id, starts_at);
-- CREATE UNIQUE INDEX studio_equipment_pkey ON public.studio_equipment USING btree (id);
-- CREATE INDEX studio_equipment_studio_idx ON public.studio_equipment USING btree (studio_id, sort_order);
-- CREATE UNIQUE INDEX studio_photos_pkey ON public.studio_photos USING btree (id);
-- CREATE INDEX studio_photos_subject_idx ON public.studio_photos USING btree (studio_id, subject_type, subject_id, sort_order);
-- CREATE UNIQUE INDEX studio_rooms_pkey ON public.studio_rooms USING btree (id);
-- CREATE INDEX studio_rooms_studio_idx ON public.studio_rooms USING btree (studio_id, sort_order);
-- CREATE INDEX studios_live_rating_idx ON public.studios USING btree (rating DESC NULLS LAST) WHERE (archived_at IS NULL);
-- CREATE UNIQUE INDEX studios_one_per_owner ON public.studios USING btree (owner_profile_id);
-- CREATE INDEX studios_owner_idx ON public.studios USING btree (owner_profile_id);
-- CREATE UNIQUE INDEX studios_pkey ON public.studios USING btree (id);
-- CREATE UNIQUE INDEX studios_slug_key ON public.studios USING btree (slug);

-- ─── Triggers ───────────────────────────────────────────────────────────────────────────────
-- CREATE TRIGGER booking_requests_guard BEFORE UPDATE ON public.booking_requests FOR EACH ROW EXECUTE FUNCTION booking_requests_guard();
-- CREATE TRIGGER booking_requests_names BEFORE INSERT ON public.booking_requests FOR EACH ROW EXECUTE FUNCTION booking_requests_names();
-- CREATE TRIGGER notify_booking AFTER INSERT OR UPDATE OF status ON public.booking_requests FOR EACH ROW EXECUTE FUNCTION notify_booking();
-- CREATE TRIGGER notify_review AFTER INSERT OR UPDATE OF response ON public.reviews FOR EACH ROW EXECUTE FUNCTION notify_review();
-- CREATE TRIGGER reviews_guard BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION reviews_guard();
-- CREATE TRIGGER reviews_refresh_stats AFTER INSERT OR DELETE OR UPDATE OF rating, target_profile_id, target_studio_id ON public.reviews FOR EACH ROW EXECUTE FUNCTION refresh_review_stats();
-- CREATE TRIGGER keep_counted_columns BEFORE UPDATE ON public.studios FOR EACH ROW EXECUTE FUNCTION keep_counted_columns();
-- CREATE TRIGGER studios_guard_admin_fields BEFORE INSERT OR UPDATE ON public.studios FOR EACH ROW EXECUTE FUNCTION studios_guard_admin_fields();
-- Note: keep_counted_columns() body does not mention "studio"; its definition is not captured here.

-- ─── Access rules (pg_policies) ─────────────────────────────────────────────────────────────
-- public.booking_requests "Requester and studio read" SELECT authenticated
--   USING ((requester_profile_id = auth.uid()) OR studio_is_mine(studio_id))
-- public.booking_requests "Studio answers, requester cancels" UPDATE authenticated
--   USING (studio_is_mine(studio_id) OR (requester_profile_id = auth.uid()))
--   CHECK (studio_is_mine(studio_id) OR (requester_profile_id = auth.uid()))
-- public.reviews "Readable with its profile or studio" SELECT public
--   USING ((target_studio_id IS NOT NULL) OR profile_is_readable(target_profile_id))
-- public.reviews "The reviewed may reply" UPDATE authenticated
--   USING ((target_profile_id = auth.uid()) OR studio_is_mine(target_studio_id))
--   CHECK ((target_profile_id = auth.uid()) OR studio_is_mine(target_studio_id))
-- public.reviews "Write about work you have done" INSERT authenticated
--   CHECK ((author_profile_id = auth.uid()) AND (rating >= 1) AND (rating <= 5) AND
--          (((target_profile_id IS NOT NULL) AND can_review_profile(target_profile_id)) OR
--           ((target_studio_id IS NOT NULL) AND can_review_studio(target_studio_id))))
-- public.studio_blocks "Owner manages their blocks" ALL authenticated
--   USING studio_is_mine(studio_id) CHECK studio_is_mine(studio_id)
-- public.studio_equipment "Owners write their own" ALL authenticated
--   USING/CHECK (EXISTS (SELECT 1 FROM studios s WHERE s.id = studio_equipment.studio_id AND s.owner_profile_id = auth.uid()))
-- public.studio_equipment "Readable by everyone" SELECT public USING true
-- public.studio_photos "Anyone reads studio photos" SELECT anon,authenticated USING true
-- public.studio_photos "Owner manages their studio photos" ALL authenticated
--   USING studio_is_mine(studio_id) CHECK studio_is_mine(studio_id)
-- public.studio_rooms "Owners write their own" ALL authenticated
--   USING/CHECK (EXISTS (SELECT 1 FROM studios s WHERE s.id = studio_rooms.studio_id AND s.owner_profile_id = auth.uid()))
-- public.studio_rooms "Readable by everyone" SELECT public USING true
-- public.studios "Owners write their own" ALL authenticated
--   USING (auth.uid() = owner_profile_id) CHECK (auth.uid() = owner_profile_id)
-- public.studios "Readable by everyone" SELECT public USING true
-- storage.objects "Owners read/upload/replace/delete their business media" (SELECT/INSERT/UPDATE/DELETE, authenticated)
--   bucket_id = 'business-media' AND EXISTS (SELECT 1 FROM studios s
--     WHERE s.id::text = (storage.foldername(objects.name))[1] AND studio_is_mine(s.id))

-- ─── Functions whose body mentions "studio" (12) — full live definitions ─────────────────────

CREATE OR REPLACE FUNCTION public.booking_requests_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR public.studio_is_mine(OLD.studio_id) THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status NOT IN ('cancelled', 'requested') THEN
    RAISE EXCEPTION 'Only the studio can answer a booking request' USING ERRCODE = '42501';
  END IF;
  IF NEW.reply IS DISTINCT FROM OLD.reply AND NEW.reply IS NOT NULL THEN
    RAISE EXCEPTION 'Only the studio can reply to a booking request' USING ERRCODE = '42501';
  END IF;
  IF NEW.studio_id IS DISTINCT FROM OLD.studio_id
     OR NEW.requester_profile_id IS DISTINCT FROM OLD.requester_profile_id
     OR NEW.studio_name IS DISTINCT FROM OLD.studio_name
     OR NEW.requester_name IS DISTINCT FROM OLD.requester_name THEN
    RAISE EXCEPTION 'A booking request keeps its studio and requester' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION public.booking_requests_names()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.studio_name IS NULL AND NEW.studio_id IS NOT NULL THEN
    SELECT s.name INTO NEW.studio_name FROM public.studios s WHERE s.id = NEW.studio_id;
  END IF;
  IF NEW.requester_name IS NULL AND NEW.requester_profile_id IS NOT NULL THEN
    SELECT coalesce(p.display_name, p.username) INTO NEW.requester_name
      FROM public.profiles p WHERE p.id = NEW.requester_profile_id;
  END IF;
  RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION public.can_review_studio(p_studio_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.studios WHERE id = p_studio_id AND owner_profile_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.contact_phone(p_profile uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_me uuid := auth.uid();
  v_rule text;
  v_phone text;
BEGIN
  IF v_me IS NULL OR p_profile IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT coalesce(p.discovery_prefs->>'show_phone', 'booked') INTO v_rule
  FROM public.profiles p WHERE p.id = p_profile;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  IF v_me <> p_profile THEN
    IF v_rule = 'never' THEN
      RETURN NULL;
    END IF;
    IF v_rule <> 'always' AND NOT (
      EXISTS (
        SELECT 1 FROM public.booking_requests r
        JOIN public.studios s ON s.id = r.studio_id
        WHERE r.status IN ('confirmed', 'completed')
          AND ((s.owner_profile_id = p_profile AND r.requester_profile_id = v_me)
            OR (s.owner_profile_id = v_me AND r.requester_profile_id = p_profile)))
      OR EXISTS (
        SELECT 1 FROM public.rental_bookings b
        JOIN public.marketplace_listings l ON l.id = b.listing_id
        WHERE b.status IN ('confirmed', 'active', 'completed')
          AND ((l.seller_profile_id = p_profile AND b.renter_profile_id = v_me)
            OR (l.seller_profile_id = v_me AND b.renter_profile_id = p_profile)))
      OR EXISTS (
        SELECT 1 FROM public.opportunity_applications a
        JOIN public.opportunities o ON o.id = a.opportunity_id
        WHERE a.status = 'accepted'
          AND ((o.creator_profile_id = p_profile AND a.applicant_profile_id = v_me)
            OR (o.creator_profile_id = v_me AND a.applicant_profile_id = p_profile)))
      OR EXISTS (
        SELECT 1 FROM public.connections c
        WHERE c.status = 'accepted'
          AND ((c.requester_id = p_profile AND c.addressee_id = v_me)
            OR (c.requester_id = v_me AND c.addressee_id = p_profile)))
    ) THEN
      RETURN NULL;
    END IF;
  END IF;
  SELECT coalesce(
    (SELECT pp.business_phone FROM public.profile_private pp
     WHERE pp.id = p_profile
       AND EXISTS (SELECT 1 FROM public.profile_business pb WHERE pb.profile_id = p_profile)),
    (SELECT CASE WHEN u.phone LIKE '+%' THEN u.phone ELSE '+' || u.phone END
     FROM auth.users u
     WHERE u.id = p_profile AND u.phone_confirmed_at IS NOT NULL AND coalesce(u.phone, '') <> '')
  ) INTO v_phone;
  RETURN v_phone;
END
$function$;

CREATE OR REPLACE FUNCTION public.notify_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_studio record;
BEGIN
  SELECT id, name, owner_profile_id INTO v_studio FROM public.studios WHERE id = NEW.studio_id;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify(v_studio.owner_profile_id, NEW.requester_profile_id, 'booking_requested',
      public.display_name_of(NEW.requester_profile_id) || ' asked for a session',
      to_char(NEW.session_date, 'DD Mon') || coalesce(' · ' || NEW.purpose, ''),
      '/business/bookings/requests/' || NEW.id);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'cancelled' THEN
      PERFORM public.notify(v_studio.owner_profile_id, NEW.requester_profile_id, 'booking_answered',
        public.display_name_of(NEW.requester_profile_id) || ' cancelled a session',
        to_char(NEW.session_date, 'DD Mon'), '/business/bookings/requests/' || NEW.id);
    ELSE
      PERFORM public.notify(NEW.requester_profile_id, v_studio.owner_profile_id, 'booking_answered',
        v_studio.name || ' marked your session ' || NEW.status,
        NEW.reply, '/booking/confirmed/' || NEW.id);
    END IF;
  END IF;
  RETURN NULL;
END
$function$;

CREATE OR REPLACE FUNCTION public.notify_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_studio_owner uuid;
BEGIN
  SELECT owner_profile_id INTO v_studio_owner FROM public.studios WHERE id = NEW.target_studio_id;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify(coalesce(NEW.target_profile_id, v_studio_owner), NEW.author_profile_id,
      'review_received', NEW.author_name || ' left you a review', NEW.body, '/reviews');
  ELSIF NEW.response IS DISTINCT FROM OLD.response AND NEW.response IS NOT NULL THEN
    PERFORM public.notify(NEW.author_profile_id, coalesce(NEW.target_profile_id, v_studio_owner),
      'review_reply', 'Your review got a reply', NEW.response, '/reviews');
  END IF;
  RETURN NULL;
END
$function$;

CREATE OR REPLACE FUNCTION public.recompute_review_stats(p_profile uuid, p_studio uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_profile IS NOT NULL THEN
    UPDATE public.profiles p
    SET rating = s.avg_rating, review_count = s.n
    FROM (
      SELECT round(avg(r.rating), 1) AS avg_rating, count(*)::int AS n
      FROM public.reviews r WHERE r.target_profile_id = p_profile
    ) s
    WHERE p.id = p_profile
      AND (p.rating, p.review_count) IS DISTINCT FROM (s.avg_rating, s.n);
  END IF;
  IF p_studio IS NOT NULL THEN
    UPDATE public.studios st
    SET rating = s.avg_rating, review_count = s.n
    FROM (
      SELECT round(avg(r.rating), 1) AS avg_rating, count(*)::int AS n
      FROM public.reviews r WHERE r.target_studio_id = p_studio
    ) s
    WHERE st.id = p_studio
      AND (st.rating, st.review_count) IS DISTINCT FROM (s.avg_rating, s.n);
  END IF;
END
$function$;

CREATE OR REPLACE FUNCTION public.refresh_review_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM public.recompute_review_stats(NEW.target_profile_id, NEW.target_studio_id);
  END IF;
  IF TG_OP = 'DELETE'
     OR (TG_OP = 'UPDATE' AND (OLD.target_profile_id IS DISTINCT FROM NEW.target_profile_id
                               OR OLD.target_studio_id IS DISTINCT FROM NEW.target_studio_id)) THEN
    PERFORM public.recompute_review_stats(OLD.target_profile_id, OLD.target_studio_id);
  END IF;
  RETURN NULL;
END
$function$;

CREATE OR REPLACE FUNCTION public.reviews_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  reviewed boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  reviewed := OLD.target_profile_id = auth.uid() OR public.studio_is_mine(OLD.target_studio_id);
  IF NEW.response IS DISTINCT FROM OLD.response AND NOT coalesce(reviewed, false) THEN
    RAISE EXCEPTION 'Only the reviewed business can reply' USING ERRCODE = '42501';
  END IF;
  IF OLD.author_profile_id IS DISTINCT FROM auth.uid()
     AND (to_jsonb(NEW) - 'response') IS DISTINCT FROM (to_jsonb(OLD) - 'response') THEN
    RAISE EXCEPTION 'Only the author can edit a review' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION public.studio_busy(p_studio uuid, p_from date, p_to date)
 RETURNS TABLE(room_id uuid, starts_at timestamp without time zone, ends_at timestamp without time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT b.room_id,
         b.session_date + coalesce(b.start_time, time '00:00'),
         CASE
           WHEN b.start_time IS NULL THEN (b.session_date + 1)::timestamp
           ELSE b.session_date + b.start_time
                + CASE
                    WHEN b.end_time IS NOT NULL AND b.end_time > b.start_time
                      THEN b.end_time - b.start_time
                    WHEN b.end_time IS NOT NULL
                      THEN (b.end_time - b.start_time) + interval '1 day'
                    ELSE make_interval(hours => coalesce(b.hours, 1))
                  END
         END
    FROM public.booking_requests b
   WHERE b.studio_id = p_studio
     AND b.status IN ('confirmed', 'completed')
     AND b.session_date BETWEEN p_from - 1 AND p_to
  UNION ALL
  SELECT k.room_id, k.starts_at, k.ends_at
    FROM public.studio_blocks k
   WHERE k.studio_id = p_studio
     AND k.starts_at < (p_to + 1)::timestamp
     AND k.ends_at > p_from::timestamp;
$function$;

CREATE OR REPLACE FUNCTION public.studio_is_mine(p_studio_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.studios
    WHERE id = p_studio_id AND owner_profile_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.studios_guard_admin_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' AND NEW.verified_gold THEN
      RAISE EXCEPTION 'verified_gold is set by MusicLinkd, not by the studio owner';
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.verified_gold IS DISTINCT FROM OLD.verified_gold THEN
      RAISE EXCEPTION 'verified_gold is set by MusicLinkd, not by the studio owner';
    END IF;
  END IF;
  RETURN NEW;
END
$function$;
