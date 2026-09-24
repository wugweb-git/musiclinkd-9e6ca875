-- Owner, 24 Sep 2026: "fill my cookie page". The Cookie Policy page existed with an empty body,
-- so /legal/cookies rendered a title and nothing else — while the app was about to gain analytics.
--
-- Written from the code, not from a template: every item below was checked against source at the
-- time of writing, and the page says nothing the app does not actually do. See the snapshot for
-- the full list of what was verified.
--
-- Snapshot and undo: supabase/dumps/2026-09-24-before-cookie-policy.sql

BEGIN;

UPDATE public.cms_pages
   SET body = '[
  {"type":"para","text":"This page says what MusicLinkd stores on your device, and why. It is short because there is not much: we use no advertising cookies and no cross-site tracking."},

  {"type":"heading","text":"Keeping you signed in"},
  {"type":"para","text":"When you sign in we store a session so you are not asked again on every screen. This one cannot be switched off — without it there is no way to know the account is yours, and the app cannot work at all."},

  {"type":"heading","text":"Things kept on your device only"},
  {"type":"para","text":"Most of what MusicLinkd saves locally never leaves your device and is never sent to us. It is there so the app remembers what you were doing:"},
  {"type":"list","items":[
    "Drafts you have not published yet — a listing, a service, a business page, an opportunity application",
    "Your answers while you are partway through joining",
    "The city you chose in Market",
    "What you have looked at recently, and your recent searches",
    "Accounts you have signed in with on this device, for the account switcher",
    "Your notification choices and which notifications you have read",
    "Whether you said yes or no to analytics"
  ]},
  {"type":"para","text":"Clearing your browser data removes all of it. Nothing is lost that is not also on your profile."},

  {"type":"heading","text":"Analytics"},
  {"type":"para","text":"Analytics is off until you turn it on in Settings, under Privacy. Nothing is loaded and no analytics cookie is set before you do."},
  {"type":"para","text":"If you turn it on, Google Analytics records which screens are opened. Page addresses are stripped first, so a profile reads as the shape of the page and never as the person on it, and anything you type — searches included — is dropped before it is sent. Turning it off again stops reporting straight away and clears those cookies."},

  {"type":"heading","text":"When you play something"},
  {"type":"para","text":"Work on MusicLinkd is linked from YouTube, Spotify and SoundCloud rather than hosted by us. Opening a player loads it from them, and they may set their own cookies at that point, under their own policies. This only happens when you open one — not from browsing. YouTube is loaded from its no-cookie address, which sets fewer."},

  {"type":"heading","text":"Fonts"},
  {"type":"para","text":"The typeface is served by Google Fonts, so your browser requests it from Google on each visit."},

  {"type":"heading","text":"What we do not do"},
  {"type":"list","items":[
    "No advertising cookies",
    "No following you across other websites",
    "No selling or sharing what you do here with data brokers"
  ]},

  {"type":"cta","label":"Open privacy settings","link":{"to":"/settings/privacy"}}
]'::jsonb
 WHERE slug = 'legal-cookies';

COMMIT;
