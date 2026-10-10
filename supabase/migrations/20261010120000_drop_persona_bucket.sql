-- persona_bucket is retired (owner, 10 Oct 2026): every persona picks from one list per category
-- (taxonomy_options), so nothing narrows instruments or genres by role or language any more.
-- The app stopped calling it in the same change. Undo: supabase/dumps/2026-10-10-before-drop-persona-bucket.sql
DROP FUNCTION IF EXISTS public.persona_bucket(text, text[], text[], integer);
