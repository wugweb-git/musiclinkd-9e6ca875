-- The Pioneer XDJ-RX3 rental's photo URL (photo-1571266028243-e4733b0f0bb0) now returns 404 from
-- Unsplash, so its product card showed an empty image. Point it at a working DJ photo already used
-- in the app. One row; nothing else changes.
-- Snapshot: the old value is the URL above (image_url on slug 'pioneer-xdj-rx3'); to undo, set it back.

BEGIN;
UPDATE public.marketplace_listings
   SET image_url = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80'
 WHERE slug = 'pioneer-xdj-rx3'
   AND image_url LIKE '%photo-1571266028243-e4733b0f0bb0%';
COMMIT;
