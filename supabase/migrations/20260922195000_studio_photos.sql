-- Owner, 22 Sep 2026: amenities and equipment photos. A studio's facilities and equipment items show up to six photos
-- (studio_photos; supabase/migrations/20260921150000_studio_proof_photos.sql). These are public-domain and CC0 stock photos, one per kind
-- of item, chosen because they show that kind of thing: they are not photos of the studios themselves, and an owner replaces them
-- with their own from the studio screen. Sources (all CC0 or public domain, no credit required):
--   microphones: stocksnap, CC0 — Technology Studio
--   studio_monitors: rawpixel, CC0 — Private/unidentified recording studio console using
--   headphones: stocksnap, CC0 — Headphones Music
--   consoles: rawpixel, CC0 — 
--   mixers: wordpress, CC0 — A close-up view of a professional audio mixer featuring nume
--   drums: flickr, CC0 — Drum kit before performance
--   amplifiers: flickr, CC0 — Drummer Plays Drums Kit
--   sampler: flickr, PDM — Gier Jenssen's studio, December 2015
--   controllers: flickr, PDM — Gier Jenssen's studio, December 2015
--   live_room: rawpixel, CC0 — 
--   private_lounge: wordpress, CC0 — A contemporary lounge room adorned with a sofa, chair, and a
--   cafe: rawpixel, CC0 — Tables cushions cafe interior Istanbul
--   parking_space: flickr, CC0 — The parking lots were infinitely more interesting than the a
--   catering: rawpixel, CC0 — Catering Buffet
-- No usable photo was found for audio interfaces, preamps, outboard, PA systems, drum machines, rehearsal rooms, green rooms,
-- vocal booths, reference libraries or acoustic treatment, so those have none.
-- Only the generated studios are touched: not wugweb or octave-sound-labs. Equipment photos go on the equipment rows added by
-- 20260922192000_business_profiles_enriched.sql (sort_order 200 and up).
-- Snapshot and undo: supabase/dumps/2026-09-22-before-studio-photos.sql
-- Applied to the live database 2026-09-22: 45 equipment photos on 11 studios and 12 facility photos on 8 studios (0 -> 57 rows).
-- Idempotent: an item that already has a photo is skipped.

INSERT INTO public.studio_photos (studio_id, subject_type, subject_id, url, sort_order)
SELECT e.studio_id, 'equipment', e.id::text, m.url, 0
  FROM public.studio_equipment e
  JOIN public.studios s ON s.id = e.studio_id
  JOIN (VALUES
    ('microphones', 'https://cdn.stocksnap.io/img-thumbs/960w/JSX29OA5MY.jpg'),
    ('studio_monitors', 'https://images.rawpixel.com/editor_1024/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA2L3drNTgxNDc5MzItaW1hZ2Uta3A2ZGw4NWYuanBn.jpg'),
    ('headphones', 'https://cdn.stocksnap.io/img-thumbs/960w/QS3FJYL99Z.jpg'),
    ('consoles', 'https://images.rawpixel.com/editor_1024/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvcHg5NTMwMzQtaW1hZ2Uta3d5bnpjdjIuanBn.jpg'),
    ('mixers', 'https://pd.w.org/2025/05/681683358a28d3f27.50719791-2048x1365.jpg'),
    ('drums', 'https://live.staticflickr.com/5298/5534410145_7bd4db3945_b.jpg'),
    ('amplifiers', 'https://live.staticflickr.com/7844/33084915008_0c0f267fae_b.jpg'),
    ('sampler', 'https://live.staticflickr.com/741/23337678279_736dca36f4_b.jpg'),
    ('controllers', 'https://live.staticflickr.com/741/23337678279_736dca36f4_b.jpg')
  ) AS m(cat, url) ON m.cat = e.category
 WHERE e.sort_order >= 200
   AND s.slug NOT IN ('wugweb', 'octave-sound-labs')
   AND NOT EXISTS (SELECT 1 FROM public.studio_photos p
                    WHERE p.studio_id = e.studio_id AND p.subject_type = 'equipment' AND p.subject_id = e.id::text);

INSERT INTO public.studio_photos (studio_id, subject_type, subject_id, url, sort_order)
SELECT s.id, 'facility', a.slug, m.url, 0
  FROM public.studios s
  CROSS JOIN LATERAL unnest(coalesce(s.amenities, '{}')) AS a(slug)
  JOIN (VALUES
    ('live_room', 'https://images.rawpixel.com/editor_1024/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvcHgxMjE1ODg1LWltYWdlLWt3dnkyb2VjLmpwZw.jpg'),
    ('private_lounge', 'https://pd.w.org/2023/06/95164817acf140133.97625890-2048x1366.jpg'),
    ('cafe', 'https://images.rawpixel.com/editor_1024/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA0L3Vwd2s2MTcwOTE2NC13aWtpbWVkaWEtaW1hZ2Uta293cXprcGEuanBn.jpg'),
    ('parking_space', 'https://live.staticflickr.com/2824/11171967706_6688db8800_b.jpg'),
    ('catering', 'https://images.rawpixel.com/editor_1024/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvbnM5NTY3LWltYWdlLWt3eXJzZWFlLmpwZw.jpg')
  ) AS m(slug, url) ON m.slug = a.slug
 WHERE s.slug NOT IN ('wugweb', 'octave-sound-labs')
   AND NOT EXISTS (SELECT 1 FROM public.studio_photos p
                    WHERE p.studio_id = s.id AND p.subject_type = 'facility' AND p.subject_id = a.slug);
