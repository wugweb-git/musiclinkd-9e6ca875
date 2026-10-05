# Full bug audit, sync check, top-bar search, profile/directory/verification redesign

## 1. Why updates are not visible on the live site
- The saved code and the preview are up to date (latest save "Lovable update" is on main).
- The live site (app.musiclinkd.com) only changes when the app is **published**. Publishing has been on hold since the earlier audit, so the live site still shows the older version.
- Fix: finish the audit below, then publish once the checks pass. I will confirm by loading the live site after publishing and comparing it with the preview.

## 2. Test every screen (100+ screens)
- Run an automated phone-size (412px) pass over every page, signed in as your account and signed out.
- For each page record: opens without error, no console errors, every button/link goes somewhere real, back works, loading/empty/error states show.
- Output a pass/fail list in the reply (not a saved report), then fix every failure found.

## 3. Missing rules
- Check the project rules against the code (colours, icons, 48px taps, no fake numbers, rounded corners) with the existing drift check and lint, and fix what breaks them.
- Save your standing rules (brand, no invented data, no fake jobs) as project memory so they are applied every session.

## 4. Settings links that go nowhere
- "Sign-in methods" and "Calendar" point back to Settings itself: wire them to the real sign-in methods sheet and calendar-sync screen.
- "Business profiles" points to Discover: point it at your own business profile (or creating one).
- Re-check every other Settings, Privacy and Security row opens the right screen.

## 5. Bottom slide-up menus everywhere
- Audit every slide-up menu (profile, portfolio, market, booking, bands, gallery, QR, help, inbox, etc.): opens, closes by swipe/tap-outside/back gesture, each item works, no dead or duplicate items, consistent look.

## 6. Search in the top bar
- Replace the separate search rows with a search icon in each main tab's top bar; tapping it expands into a full-width field in the bar, Escape/close collapses it, submitting opens the search results.

## 7. Profile page redesign (reference: partner directory profile)
- Rebuild the public profile on mobile using that layout: cover + avatar header, name, headline, badges, clear contact/hire buttons, sections for about, services, work, reviews, location.
- Only real profile data is shown; empty sections are hidden or show an honest empty state.

## 8. People directory (reference: ambassadors directory)
- Replicate and improve the directory grid for browsing professionals: search, filter chips (role, city), cards with real photo or fallback initials, role, city, verified badge.

## 9. Verification application (reference: partner application form)
- Reuse that step-by-step application form style for the verification flow: clear steps, progress, document upload, review summary, submit. Uses existing verification records; no new tables.

## Technical notes
- Sync: branch is main-synced; live site requires publish (held until gates pass).
- Settings rows in `src/data/settings.ts` lines 95/102 self-link; business row links `/discover`.
- Top-bar search: extend `SearchIconButton`/`SearchField` in `tab-header.tsx` into an inline expanding field in the tab header.
- Reference pages will be opened in a browser at mobile width to copy structure; built with existing Brand OS tokens (Inter, ink, pink as signal only, Lucide icons), not their colours.
- Checks before publish: tsc, lint, token drift, build, Playwright sweep.
