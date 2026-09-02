# Stabilise and polish every MusicLinkd flow, in order

## Where things actually stand

I checked the build, the types and every screen before writing this:

- The build reports `build OK` and the TypeScript check passes — there are no
  outstanding compile errors right now.
- I loaded all 135 screens: every one responds successfully. No blank pages, no
  server errors.

So the remaining problems are not crashes. They are **reachability and finish**:

- The newest sections are orphaned. Nothing in Home, Discover, Profile or the
  bottom navigation links to Bands, Verification, Reviews, Plans,
  Recommendations or Help — you can only reach them by typing the URL.
- The newer screens were built fast and have not had a real 412px Android
  render pass, so spacing, card widths, sticky actions and bottom-nav clearance
  are inconsistent with the older, more polished flows (Discover, Booking,
  Portfolio).
- The roadmap still lists stale unchecked items for work that is in fact
  finished, which makes it hard to tell what is left.

## What I will do, flow by flow

Each pass is the same: open the flow at 412px, fix clipping / overflow /
bottom-nav overlap / inconsistent card widths, make sure every screen is
reachable from a real entry point, and align it with the Gestalt system.

1. **Flow 01 — Entry & Discover (`/`, `/search`, `/categories`, `/saved`)**
   Render pass, consistent card widths, add the "For you" entry into
   Recommendations from Discover.
2. **Flow 02 — Onboarding (`/onboarding/*`)** Re-verify the stepper, resume and
   completion screens at 412px; confirm the hand-off into Portfolio still lands.
3. **Flow 03 — Portfolio (`/portfolio/*`)** Render pass on overview, work
   detail, reorder and settings; check the media state screens.
4. **Flow 04 — Profile (`/profile/$username`, `/me`, `/profile/edit`,
   `/profile/insights`)** Owner panel becomes the hub: add links to Bands,
   Verification, Reviews, Plans and Help alongside the existing QR link.
5. **Flow 05 — Dashboard (`/feed`)** Surface the new signals in the returning-user
   home: a verification nudge when unverified, pending reviews, and a "For you"
   row that opens Recommendations.
6. **Flow 06 — Messaging & Collaboration (`/messages`, `/collab/*`)** Render
   pass across the workspace screens; check sticky action bars and sheets.
7. **Flow 07 — Marketplace, buy / sell / rent (`/marketplace/*`)** Render pass;
   confirm listing cards, filters and rental calendars hold at 412px.
8. **Flow 08 — Booking (`/booking/*`, `/bookings/*`, `/provider/*`)** Render
   pass; confirm the provider calendar month grid lays out correctly (it builds
   a fixed 42-cell grid, so I will check the leading/trailing days render muted
   rather than shifting the layout), and check the pay / confirm screens.
9. **Flow 15 — Bands (`/bands/*`)** Entry point from Profile and Discover;
   render pass on create, manage and invite.
10. **Flow 16 — Verification (`/verification/*`)** Entry from Profile and the
    dashboard nudge; render pass on the document steps.
11. **Flow 17 — Reviews (`/reviews/*`)** Entry from Profile and from a completed
    booking; render pass on the write form.
12. **Flow 18 — Plans & earnings (`/plans/*`)** Entry from Profile settings;
    render pass on checkout and manage.
13. **Flow 20 — Recommendations (`/recommendations/*`)** Entry from Discover and
    the dashboard; render pass on the explainable cards.
14. **Flow 22 — Help & content (`/help/*`)** Entry from Profile; render pass on
    the article reader.
15. **Flow 23 — QR identity (`/identity/*`)** Already linked from Profile;
    render pass only.

## Technical notes

- Design-only. No new backend, API, payment or storage work; the existing
  signed-in database behaviour for profile and portfolio stays exactly as it is.
- Bottom navigation stays at five destinations (Home, Discover, Connections,
  Market, Profile). New sections are reached from Profile, Discover and the
  dashboard — never as a sixth tab.
- Verification is a real 412px pass driven through the browser, capturing each
  flow's screens and fixing what the screenshots show, not a spot check.
- I will run the typecheck and reload every route again at the end, and rewrite
  `roadmap.md` so its checkboxes match reality.

## What this does not include

- Payments wiring (Razorpay is still an open decision).
- Real media upload/storage — portfolio media stays link-based.
