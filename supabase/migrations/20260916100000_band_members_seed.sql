-- The Kite Notes and Static Bloom get members from profiles that exist in this database.
--
-- Owner, 16 Sep 2026: both bands showed "0 members" because their seeded line-ups named people with no
-- profile. Each seat now goes to a talent profile already here, matched on role, instrument and city, and
-- nobody plays in two bands. The seat's instrument text and start year are kept from the band's line-up.
--   The Kite Notes (Mumbai, indie folk)  rohan.sharma  owner  Producer, guitar   2019
--                                        maya.sharma   admin  Lead vocals        2019
--                                        vivaan.bose   member Bass               2021
--                                        riya.kapoor   member Drums              2022
--   Static Bloom (Bengaluru, electronic) sanjana.sen   owner  Synths             2022
--                                        anika.rao     member Live drums         2023
-- vivaan.bose is in Ahmedabad; he is the only talent profile here who plays bass and is free.
--
-- Stops if a profile is missing, has another username, is a business account, or already plays in another
-- band. Re-reads what it wrote and raises on any difference. Idempotent.

DO $import$
DECLARE
  payload jsonb := $json$[
    {"band_slug":"the-kite-notes","username":"rohan.sharma","role":"owner","instrument":"Producer, guitar","since_year":2019,"sort_order":0},
    {"band_slug":"the-kite-notes","username":"maya.sharma","role":"admin","instrument":"Lead vocals","since_year":2019,"sort_order":1},
    {"band_slug":"the-kite-notes","username":"vivaan.bose","role":"member","instrument":"Bass","since_year":2021,"sort_order":2},
    {"band_slug":"the-kite-notes","username":"riya.kapoor","role":"member","instrument":"Drums","since_year":2022,"sort_order":3},
    {"band_slug":"static-bloom","username":"sanjana.sen","role":"owner","instrument":"Synths","since_year":2022,"sort_order":0},
    {"band_slug":"static-bloom","username":"anika.rao","role":"member","instrument":"Live drums","since_year":2023,"sort_order":1}
  ]$json$;
  v_bad text;
BEGIN
  SELECT string_agg(r.username, ', ') INTO v_bad
  FROM jsonb_to_recordset(payload) AS r(band_slug text, username text, role text, instrument text, since_year int, sort_order int)
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.username = r.username);
  IF v_bad IS NOT NULL THEN
    RAISE EXCEPTION 'band members seed: no profile for %', v_bad;
  END IF;

  SELECT string_agg(r.band_slug, ', ') INTO v_bad
  FROM (SELECT DISTINCT band_slug FROM jsonb_to_recordset(payload) AS x(band_slug text)) r
  WHERE NOT EXISTS (SELECT 1 FROM public.bands b WHERE b.slug = r.band_slug);
  IF v_bad IS NOT NULL THEN
    RAISE EXCEPTION 'band members seed: no band with slug %', v_bad;
  END IF;

  SELECT string_agg(r.username, ', ') INTO v_bad
  FROM jsonb_to_recordset(payload) AS r(band_slug text, username text, role text, instrument text, since_year int, sort_order int)
  JOIN public.profiles p ON p.username = r.username
  WHERE EXISTS (SELECT 1 FROM public.profile_business b WHERE b.profile_id = p.id);
  IF v_bad IS NOT NULL THEN
    RAISE EXCEPTION 'band members seed: % is a business account', v_bad;
  END IF;

  SELECT string_agg(r.username, ', ') INTO v_bad
  FROM jsonb_to_recordset(payload) AS r(band_slug text, username text, role text, instrument text, since_year int, sort_order int)
  JOIN public.profiles p ON p.username = r.username
  JOIN public.band_members m ON m.profile_id = p.id
  JOIN public.bands b ON b.id = m.band_id AND b.slug <> r.band_slug;
  IF v_bad IS NOT NULL THEN
    RAISE EXCEPTION 'band members seed: % already plays in another band', v_bad;
  END IF;

  INSERT INTO public.band_members (band_id, profile_id, role, instrument, since_year, sort_order)
  SELECT b.id, p.id, r.role, r.instrument, r.since_year, r.sort_order
  FROM jsonb_to_recordset(payload) AS r(band_slug text, username text, role text, instrument text, since_year int, sort_order int)
  JOIN public.bands b ON b.slug = r.band_slug
  JOIN public.profiles p ON p.username = r.username
  ON CONFLICT (band_id, profile_id) DO UPDATE SET role = EXCLUDED.role, instrument = EXCLUDED.instrument,
    since_year = EXCLUDED.since_year, sort_order = EXCLUDED.sort_order;

  IF (SELECT count(*) FROM jsonb_to_recordset(payload) AS r(band_slug text, username text, role text, instrument text, since_year int, sort_order int)
      JOIN public.bands b ON b.slug = r.band_slug
      JOIN public.profiles p ON p.username = r.username
      JOIN public.band_members m ON m.band_id = b.id AND m.profile_id = p.id
      WHERE (m.role, m.instrument, m.since_year, m.sort_order) IS NOT DISTINCT FROM (r.role, r.instrument, r.since_year, r.sort_order))
     <> jsonb_array_length(payload) THEN
    RAISE EXCEPTION 'band members seed: stored rows differ from the payload';
  END IF;

  IF EXISTS (SELECT 1 FROM public.bands b
             WHERE b.slug IN ('the-kite-notes', 'static-bloom', 'the-bangalore-blues-project')
               AND NOT EXISTS (SELECT 1 FROM public.band_members m WHERE m.band_id = b.id)) THEN
    RAISE EXCEPTION 'band members seed: a band still has no members';
  END IF;
END
$import$;
