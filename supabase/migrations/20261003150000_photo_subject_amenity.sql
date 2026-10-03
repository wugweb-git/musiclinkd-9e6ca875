-- PROPOSED, NOT APPLIED. Rename the photo subject type 'facility' to 'amenity' (owner, 3 Oct 2026:
-- an amenity is an on-site comfort or convenience — parking, a cafe, a lounge — and its photos
-- are amenity photos). 12 rows today. Ships together with the code commit on this branch, which
-- says 'amenity' wherever it said 'facility'; apply the migration first, then publish the code.
-- Between the two the live code still says 'facility': amenity photos don't show and adding one
-- fails (the new check refuses it). Equipment photos are unaffected. Publish straight after.
--
-- Snapshot before applying: supabase/dumps/YYYY-MM-DD-before-photo-subject-amenity.sql — the
-- constraint definition and the count of rows per subject_type. No user data.
--
-- Rollback:
--   ALTER TABLE public.bookable_photos DROP CONSTRAINT bookable_photos_subject_type_check;
--   UPDATE public.bookable_photos SET subject_type = 'facility' WHERE subject_type = 'amenity';
--   ALTER TABLE public.bookable_photos ADD CONSTRAINT bookable_photos_subject_type_check
--     CHECK (subject_type IN ('equipment', 'facility'));

BEGIN;

CREATE TEMP TABLE _before ON COMMIT DROP AS
SELECT count(*) FILTER (WHERE subject_type = 'facility') AS facility,
       count(*) AS total
  FROM public.bookable_photos;

-- The old check names the subject types; drop it whatever it is called, then allow the new one.
DO $c$
DECLARE c text;
BEGIN
  FOR c IN SELECT conname FROM pg_constraint
            WHERE conrelid = 'public.bookable_photos'::regclass AND contype = 'c'
              AND pg_get_constraintdef(oid) LIKE '%subject_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.bookable_photos DROP CONSTRAINT %I', c);
  END LOOP;
END
$c$;

UPDATE public.bookable_photos SET subject_type = 'amenity' WHERE subject_type = 'facility';

ALTER TABLE public.bookable_photos ADD CONSTRAINT bookable_photos_subject_type_check
  CHECK (subject_type IN ('equipment', 'amenity'));

DO $check$
DECLARE b record;
BEGIN
  SELECT * INTO b FROM _before;
  IF (SELECT count(*) FROM public.bookable_photos WHERE subject_type = 'amenity') <> b.facility
     OR (SELECT count(*) FROM public.bookable_photos) <> b.total
     OR EXISTS (SELECT 1 FROM public.bookable_photos WHERE subject_type = 'facility') THEN
    RAISE EXCEPTION 'photo subject rename did not carry every row over';
  END IF;
END
$check$;

COMMIT;
