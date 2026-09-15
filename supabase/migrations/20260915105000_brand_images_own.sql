-- Business brand images: replace the example.com placeholders with our own images.
--
-- Owner's call (15 Sep 2026). Firebase brand assets for Wugweb and Yash Raj Sound Studios point at
-- example.com, which does not serve them, so the business page showed broken images.
--   logo_url, thumbnail_url, icon_url -> the business profile's avatar_url
--   hero_banner_url                   -> the image of a studio the profile owns (null if it owns none)
-- supabase/generators/import_catalog.py now does the same, so a regenerated 20260914180000 matches.
--
-- Re-reads what it wrote and raises on any difference. Idempotent.

UPDATE public.profile_business b
SET logo_url      = CASE WHEN b.logo_url      ~ '^https?://(www\.)?example\.com/' THEN p.avatar_url ELSE b.logo_url END,
    thumbnail_url = CASE WHEN b.thumbnail_url ~ '^https?://(www\.)?example\.com/' THEN p.avatar_url ELSE b.thumbnail_url END,
    icon_url      = CASE WHEN b.icon_url      ~ '^https?://(www\.)?example\.com/' THEN p.avatar_url ELSE b.icon_url END,
    hero_banner_url = CASE WHEN b.hero_banner_url ~ '^https?://(www\.)?example\.com/'
                      THEN (SELECT s.image_url FROM public.studios s
                            WHERE s.owner_profile_id = b.profile_id AND s.image_url IS NOT NULL
                            ORDER BY s.created_at LIMIT 1)
                      ELSE b.hero_banner_url END
FROM public.profiles p
WHERE p.id = b.profile_id
  AND (b.logo_url ~ '^https?://(www\.)?example\.com/' OR b.thumbnail_url ~ '^https?://(www\.)?example\.com/'
       OR b.icon_url ~ '^https?://(www\.)?example\.com/' OR b.hero_banner_url ~ '^https?://(www\.)?example\.com/');

DO $verify$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profile_business
    WHERE concat_ws(' ', logo_url, thumbnail_url, icon_url, hero_banner_url) ~ 'https?://(www\.)?example\.com/'
  ) THEN
    RAISE EXCEPTION 'example.com brand images remain';
  END IF;
  IF EXISTS (
    SELECT 1 FROM (VALUES
      ('2baecd1b-d9b3-5f47-9578-5c724efb3c28'::uuid,
       'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
       'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
       'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
       'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400'),
      ('86a5d555-61eb-5619-b452-3a9387baa66f'::uuid,
       'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
       NULL, NULL,
       'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400')
    ) AS v(profile_id, logo_url, hero_banner_url, thumbnail_url, icon_url)
    LEFT JOIN public.profile_business b ON b.profile_id = v.profile_id
    WHERE b.profile_id IS NULL
       OR b.logo_url IS DISTINCT FROM v.logo_url OR b.hero_banner_url IS DISTINCT FROM v.hero_banner_url
       OR b.thumbnail_url IS DISTINCT FROM v.thumbnail_url OR b.icon_url IS DISTINCT FROM v.icon_url
  ) THEN
    RAISE EXCEPTION 'brand images not in the expected state';
  END IF;
END
$verify$;
