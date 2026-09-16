---
doc: MASTER-ISSUES-INDEX
version: 1.0
status: CURRENT
updated: 2026-09-16
folder: specs
originally: new
---

# MusicLinkd — issue index, 16 Sep 2026

One line per issue, its spec file, and its reference screenshots where any exist. Full detail is
in each `SPEC-*.md` — this is the map, not a replacement for reading them.

| # | Issue | Spec file | Screenshots |
|---|---|---|---|
| 1 | Feature 1 — connect Spotify (flow, scopes, states) | `SPEC-feature1-spotify-connect.md` | Snapchat reference screenshots (settings entry + OAuth consent) shown earlier in this thread — not available as files in this delivery; described in the spec instead. |
| 2 | Icon language audit — MusicLinkd Settings vs. Facebook | `SPEC-icon-language-audit.md` | `issue2-musiclinkd-settings.png`, `issue2-facebook-settings.png`, `issue2-facebook-friends.png` |
| 3 | Marketplace top nav, category drawer, location picker (reference pattern) | `SPEC-marketplace-nav-and-location-picker.md` | `issue3-facebook-marketplace-topnav.png`, `issue3-facebook-category-drawer.png`, `issue3-facebook-location-picker.png` |
| 4 | Platform — domain app.musiclinkd.com, PWA/Android now, Capacitor later, edge-to-edge, gestures | `SPEC-platform-android-pwa.md` | none |
| 5 | QR/card screens as bottom drawers; bottom navbar visibility table | `SPEC-bottom-sheet-and-navbar-visibility.md` | none |
| 6 | No in-app financial transactions — bookings/sales end at "Confirmed" | `SPEC-no-financial-transactions.md` | none |
| 7 | Overlay pattern rule — bottom drawer / side drawer / modal, when to use which | `SPEC-overlay-pattern-selection.md` | none |
| 8 | Bundle: hide Earnings, Bands → Phase 4 + "Soon" badge, Home merge (blocked on your screenshot), 2 bugs (notifications, profile save), name field split | `SPEC-issue8-earnings-bands-home-profile.md` | none yet — Home screenshot still needed for the merge part |
| 14 | Portfolio item URL ingestion (audio/video/lyrics/reel), card states, redirect priority, Discover "trending" idea | `SPEC-issue14-portfolio-url-ingestion-and-playback.md` | none |
| 15 | Persistent login on device (Supabase Auth session/refresh config) | `SPEC-issue15-persistent-session.md` | none |
| 16 | Verification → Phase 3 + "Soon" badge (reuses Issue 8's badge pattern) | `SPEC-issue16-verification-soon-badge.md` | none |

**Numbering note, for honesty:** issues 9–13 were sub-items bundled inside Issue 8 (earnings,
Bands, Home merge, the two bugs, name split), not separate files — that's why the file list jumps
from 8 to 14. 13 distinct actionable items total across 11 files, plus 2 open items (Home
screenshot, Feature 1's original mockup artifact) not yet resolved.

## Standing blockers across the batch

- **Notion (Release Phases page) is not updated yet.** Two attempts to record the Bands →
  Phase 4 move and the Verification → Phase 3 placement were both blocked/denied on this end.
  The live Notion doc still reflects the pre-16-Sep phase assignments for both. Needs a third
  attempt or a check on what's declining the write.
- **Your computer isn't linked this session**, so none of these `.md` files are in the repo's
  `Claude outputs/` folder yet — they only exist as chat deliveries so far. Link it and I'll
  commit all 11 files there in one pass so Claude Code can pick up the whole batch at once.
- **Issue 3 and Issue 8's Home item are waiting on your MusicLinkd screenshots** — Issue 3 has
  the Facebook reference but nothing of yours to diff against yet; Issue 8's Home merge has
  neither.

Send the 2–3 more screenshots whenever — I'll map each to whichever issue it belongs to (new or
existing) the same way as above.
