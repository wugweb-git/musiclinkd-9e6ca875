-- First and last name (Issue 8). Not applied: the owner applies it after the live dump.
-- display_name stays the name shown everywhere; the app writes it as "first last".
-- Backfill splits an existing display_name at its first space. Last name is optional.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text;

UPDATE public.profiles
SET first_name = split_part(btrim(display_name), ' ', 1),
    last_name = nullif(btrim(substr(btrim(display_name), length(split_part(btrim(display_name), ' ', 1)) + 1)), '')
WHERE first_name IS NULL AND display_name IS NOT NULL AND btrim(display_name) <> '';
