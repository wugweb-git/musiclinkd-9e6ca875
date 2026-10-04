-- Snapshot before 20261004230000_privacy_policy_sections.sql. Read-only, live, 4 Oct 2026. Site copy
-- only (cms_pages row 'legal-privacy'); no user data.
--
-- updated_at: 2026-09-02 09:00:00+00
-- body (5 sections): What we collect · What stays private by default · Why we use it ·
-- Verification documents · Your controls
--
-- Undo:
UPDATE public.cms_pages SET updated_at = '2026-09-02 09:00:00+00', body = '[
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
]'::jsonb WHERE slug = 'legal-privacy';
