-- Privacy Policy (cms_pages 'legal-privacy'): adds who the data is shared with, how long it is
-- kept, how to delete it, and how to reach us — needed for the Play Store listing (owner, 4 Oct
-- 2026: "make it and leave it"). The five existing sections are kept as they are; these are
-- appended. Every service named was checked against the code on 4 Oct: Lovable Cloud/Supabase
-- (data), Cloudflare (hosting), Google and LinkedIn sign-in, OpenAI (ai-match, hiring copy),
-- Google Analytics (consent-gated, src/lib/analytics.ts), OpenStreetMap Nominatim, India Post PIN
-- lookup and Google Places (src/lib/maps-link.functions.ts, postcode.functions.ts).
--
-- Runs once: does nothing if the "Who we share it with" section is already there.
-- Snapshot: supabase/dumps/2026-10-04-before-privacy-policy-sections.sql

UPDATE public.cms_pages
SET updated_at = now(),
    body = body || '[
  {"type": "heading", "text": "Who we share it with"},
  {"type": "para", "text": "We don''t sell your data. These services handle it so the app can work:"},
  {"type": "list", "items": [
    "Lovable Cloud, built on Supabase, stores your account, profile, messages and uploads.",
    "Cloudflare serves the app to your browser and phone.",
    "Google and LinkedIn, if you sign in with them, share your name and email with us.",
    "OpenAI, when you use AI matching or writing help, receives the brief you type and the public profile details being matched.",
    "Google Analytics, only if you allow analytics, sees how the app is used.",
    "OpenStreetMap, the India Post PIN code service and Google Maps, when you look up a place or PIN code, receive what you typed or the spot you picked."
  ]},
  {"type": "heading", "text": "How long we keep it"},
  {"type": "para", "text": "We keep your data while your account is open. Anything you delete in the app is removed then. Deleting your account removes your profile and every file you uploaded at once; past booking requests stay with the other person as their record, without your name."},
  {"type": "heading", "text": "Deleting your data"},
  {"type": "para", "text": "Delete your whole account, or only some of your data, from Settings at any time."},
  {"type": "cta", "label": "How to delete your data", "link": {"to": "/delete-account"}},
  {"type": "heading", "text": "Contact us"},
  {"type": "para", "text": "Questions about your data or this policy? Write to us from the Contact page."},
  {"type": "cta", "label": "Contact MusicLinkd", "link": {"to": "/contact"}}
]'::jsonb
WHERE slug = 'legal-privacy'
  AND NOT body @> '[{"type": "heading", "text": "Who we share it with"}]'::jsonb;
