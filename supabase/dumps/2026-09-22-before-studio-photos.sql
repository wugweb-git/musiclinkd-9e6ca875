-- MusicLinkd live database snapshot (Lovable Cloud, Supabase project ace967d9-a62e-48bb-b076-c3b63b11b185)
-- Taken 2026-09-22 via Lovable query_database, before adding amenities and equipment photos.
-- Migration: supabase/migrations/20260922195000_studio_photos.sql
--
-- What changes: public.studio_photos gets one photo for each equipment item and facility, on the generated studios, whose kind has a
-- matching stock photo (equipment rows added by the business enrichment, and facilities listed in studios.amenities).
-- Before state: studio_photos was empty (0 rows). No existing row is changed.
--
-- To undo (the table was empty, so this removes exactly the rows the migration added):

DELETE FROM public.studio_photos
 WHERE url IN (
  'https://cdn.stocksnap.io/img-thumbs/960w/JSX29OA5MY.jpg',
  'https://cdn.stocksnap.io/img-thumbs/960w/QS3FJYL99Z.jpg',
  'https://images.rawpixel.com/editor_1024/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA0L3Vwd2s2MTcwOTE2NC13aWtpbWVkaWEtaW1hZ2Uta293cXprcGEuanBn.jpg',
  'https://images.rawpixel.com/editor_1024/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA2L3drNTgxNDc5MzItaW1hZ2Uta3A2ZGw4NWYuanBn.jpg',
  'https://images.rawpixel.com/editor_1024/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvbnM5NTY3LWltYWdlLWt3eXJzZWFlLmpwZw.jpg',
  'https://images.rawpixel.com/editor_1024/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvcHg5NTMwMzQtaW1hZ2Uta3d5bnpjdjIuanBn.jpg',
  'https://images.rawpixel.com/editor_1024/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvcHgxMjE1ODg1LWltYWdlLWt3dnkyb2VjLmpwZw.jpg',
  'https://live.staticflickr.com/2824/11171967706_6688db8800_b.jpg',
  'https://live.staticflickr.com/5298/5534410145_7bd4db3945_b.jpg',
  'https://live.staticflickr.com/741/23337678279_736dca36f4_b.jpg',
  'https://live.staticflickr.com/7844/33084915008_0c0f267fae_b.jpg',
  'https://pd.w.org/2023/06/95164817acf140133.97625890-2048x1366.jpg',
  'https://pd.w.org/2025/05/681683358a28d3f27.50719791-2048x1365.jpg'
 );

-- After undo, studio_photos should hold 0 rows again.
