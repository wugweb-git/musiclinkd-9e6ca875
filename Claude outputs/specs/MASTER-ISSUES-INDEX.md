---
doc: MASTER-ISSUES-INDEX
version: 2.0
status: CURRENT
updated: 2026-09-18
folder: specs
originally: new
---

# MusicLinkd — issue index, updated 18 Sep 2026 (status pass)

One line per issue and its status. Spec files for done/superseded issues have been deleted
(their decisions are now either live in the app or recorded here) — this index is now the only
record for those, so treat the verdict column as authoritative for them.

| # | Issue | Spec file | Status |
|---|---|---|---|
| 2 | Icon language audit — MusicLinkd Settings vs. Facebook | `SPEC-icon-language-audit.md` | ⚠️ Unclear — later token commits (five icon sizes) suggest partial action, but the specific chip-background fix isn't independently verified |
| 4 | Platform — domain app.musiclinkd.com, PWA/Android now, Capacitor later, edge-to-edge, gestures | `SPEC-platform-android-pwa.md` | 🔲 Open — aspirational, not started (standing decision: Capacitor wrap later, nothing now) |
| 5 | QR/card screens as bottom drawers; bottom navbar visibility table | `SPEC-bottom-sheet-and-navbar-visibility.md` | 🔲 Not implemented as specced — `identity.qr.tsx` renders as a full `Screen`, not a bottom drawer (it does use `Sheet` internally for share/look sub-actions only); no dedicated navbar-visibility mechanism found |
| 6 | No in-app financial transactions — bookings/sales end at "Confirmed" | *(deleted, done)* | ✅ Done — matches shipped behavior exactly (`booking.$id.review` → `booking.confirmed.$ref`, no `/pay` step) |
| 7 | Overlay pattern rule — bottom drawer / side drawer / modal, when to use which | `SPEC-overlay-pattern-selection.md` | 🔁 Evergreen guidance, not a one-time task |
| 8a | Hide Earnings from Profile/Home | *(was in deleted SPEC-issue8)* | ✅ Done — Earnings/Plans routes removed entirely |
| 8b | Bands → Phase 4 + "Soon" badge | *(was in deleted SPEC-issue8)* | ✅ Superseded — Bands shipped in full instead, never gated behind a badge |
| 8c | Name field split (first/last) | *(was in deleted SPEC-issue8)* | ✅ Done — migration `20260917100100` |
| 8d | Home — merge "Shortcuts" and "Tools" | *(was in deleted SPEC-issue8)* | 🔲 Still open — blocked on a Home screenshot that was never provided |
| 8e | Bug — notifications not working on Home | *(was in deleted SPEC-issue8)* | ✅ Confirmed fixed, 18 Sep — `unreadCount` (`src/lib/notifications.functions.ts`) queries a real `notifications` table (`read_at IS NULL`), not mock data; stale "no live backend yet" comment in `tab-header.tsx` removed |
| 8f | Bug — profile edits not saving | *(was in deleted SPEC-issue8)* | ✅ Confirmed fixed, 18 Sep — `saveMyProfile` (`src/lib/portfolio.functions.ts`) does a real Supabase upsert to `profiles` and throws on error; `profile.edit.tsx` catches and surfaces failures via a status state, never silently swallows them |
| 14 | Portfolio item URL ingestion (audio/video/lyrics/reel), card states, redirect priority | *(deleted, done)* | ✅ Done — link-first ingestion with oEmbed/Open Graph metadata shipped 15 Sep |
| 15 | Persistent login on device (Supabase Auth session/refresh config) | *(deleted, done)* | ✅ Done — `persistSession: true`, `autoRefreshToken: true` in `src/integrations/supabase/client.ts` |
| 16 | Verification → Phase 3 + "Soon" badge | *(deleted, superseded)* | ✅ Superseded — Verification shipped in full (`verification.$type`, `.choose`, `.badge`, `.privacy`), never gated behind a badge |

**Numbering note:** issues 9–13 were sub-items bundled inside the original Issue 8, not separate
files — now split into 8a–8f above since the parent spec file is gone.

## Still open, needing a decision or a screenshot
- **8d** — Home Shortcuts/Tools merge: send a current Home screenshot to unblock.
- **4, 5** — not started; revisit when platform/PWA work or the QR/card screen redesign is
  actually scheduled.
- **2** — needs a direct check of the chip-background fix against the icon-language audit's
  original findings.

## Historical blockers (resolved, kept for record)
The original version of this doc recorded two standing blockers: Notion writes for the Bands/
Verification phase moves being blocked, and the repo not being linked yet. Both are moot now —
the repo has been linked and worked in directly since, and Bands/Verification shipped in full
rather than needing the phase-move recorded at all.
