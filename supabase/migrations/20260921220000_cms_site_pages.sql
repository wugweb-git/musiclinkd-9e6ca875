-- Site pages on cms_pages. /legal/privacy and /legal/terms read their row instead of holding the
-- text in the route file, and /about, /contact and /legal/cookies are new screens that read theirs.
-- All five render through the help guides' block renderer (para / heading / list / callout / cta).
--
-- 1. legal-privacy and legal-terms: body gets the sections the two screens showed (each a heading
--    and a paragraph), summary the "Short version" line above them, seo_description the screen's
--    meta description, and updated_at the "Last updated 2 September 2026" they showed. The Terms
--    row's title becomes "Terms of Use", the name the screen, Settings and sign-up already use.
--    Every sentence is the route file's wording, unchanged.
-- 2. about, contact, legal-cookies are not changed: with an empty body the screen shows the row's
--    content as paragraphs. blog and careers stay drafts and show nowhere; home ("/") is its own
--    app screen and pricing has no route.
--
-- Idempotent: plain UPDATEs by slug, safe to run twice. Touches no other row, column or policy.
-- The app fails soft before this is applied: Privacy and Terms show their row's content line.
-- Snapshot: supabase/dumps/2026-09-21-before-cms-site-pages.sql
--
-- Rollback (the snapshot's values):
--   UPDATE public.cms_pages SET body = '[]'::jsonb, summary = NULL,
--     seo_description = 'MusicLinkd privacy policy.', updated_at = '2026-06-01 09:00:00+00'
--   WHERE slug = 'legal-privacy';
--   UPDATE public.cms_pages SET body = '[]'::jsonb, summary = NULL, title = 'Terms of Service',
--     seo_description = 'MusicLinkd terms of service.', updated_at = '2026-06-01 09:00:00+00'
--   WHERE slug = 'legal-terms';

BEGIN;

UPDATE public.cms_pages
SET
  summary = 'Short version: your public profile is public, everything else is not, and you can leave with your data at any time.',
  seo_description = 'What MusicLinkd collects, why, and the controls you have over your data.',
  updated_at = '2026-09-02 09:00:00+00',
  body = '[
    {"type": "heading", "text": "What we collect"},
    {"type": "para", "text": "Account details (email or phone), the profile and portfolio you publish, and activity needed to run bookings, messages and search."},
    {"type": "heading", "text": "What stays private by default"},
    {"type": "para", "text": "Your email, phone number, exact address, verification documents and draft work. Nothing here appears on your public profile."},
    {"type": "heading", "text": "Why we use it"},
    {"type": "para", "text": "To show your work to the right people, run discovery and recommendations, keep bookings accurate, and prevent impersonation."},
    {"type": "heading", "text": "Verification documents"},
    {"type": "para", "text": "Documents you submit for verification are used only to confirm identity or business status. They are never shown on your profile and are removed once a decision is made."},
    {"type": "heading", "text": "Your controls"},
    {"type": "para", "text": "Edit or unpublish anything at any time, control profile visibility, turn off recommendation signals, export your data, or delete your account entirely."}
  ]'::jsonb
WHERE slug = 'legal-privacy';

UPDATE public.cms_pages
SET
  title = 'Terms of Use',
  summary = 'Short version: be honest about your work, treat other professionals well, and you keep the rights to everything you create.',
  seo_description = 'The rules for using MusicLinkd: your account, your work, bookings and conduct.',
  updated_at = '2026-09-02 09:00:00+00',
  body = '[
    {"type": "heading", "text": "Your account"},
    {"type": "para", "text": "You must be 16 or older and give accurate details. You are responsible for what happens under your account, so keep your password private."},
    {"type": "heading", "text": "Your work stays yours"},
    {"type": "para", "text": "You keep ownership of every track, clip, image and credit you upload. You give MusicLinkd permission to display it on the surfaces you choose — profile, discovery, search and shared links."},
    {"type": "heading", "text": "Professional conduct"},
    {"type": "para", "text": "No impersonation, no claiming credits you did not earn, no harassment, no spam outreach. Verification exists to protect people who hire in good faith."},
    {"type": "heading", "text": "Bookings and marketplace"},
    {"type": "para", "text": "Agreements for sessions, studio time, rentals and services are between the people involved. MusicLinkd provides the tools, availability and records — not the contract itself."},
    {"type": "heading", "text": "Ending your account"},
    {"type": "para", "text": "You can delete your account at any time from settings. Public content disappears immediately; records tied to completed bookings may be retained for legal and dispute reasons."}
  ]'::jsonb
WHERE slug = 'legal-terms';

COMMIT;
