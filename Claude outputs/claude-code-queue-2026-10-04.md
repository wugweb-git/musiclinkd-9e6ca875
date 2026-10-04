# Claude Code queue — 4 Oct 2026

Compiled by Cowork Claude. Checked against `main` at 27665f4 (Mac clone) and the live database.

## Ground rule for this whole queue (owner, 4 Oct)

**Do not touch Lovable.** Work every item on its own branch and **do not merge to `main` or push `main`** until the owner says so, item by item. Pushing a feature branch is fine — Lovable only tracks `main`.
Commit trailer: `Co-Authored-By: Wugweb <admin@wugweb.com>` only. CHANGELOG in the same commit.
Before reporting done: `bun install`, `bunx tsc --noEmit`, `bun run lint`, `bun run build`, workerd render, 412px render of every touched screen.

## Decision layer for this queue (owner, 4 Oct afternoon) — read before any item

These refine the Notion page "MusicLinkd — Morning Product Decisions — 4 Oct 2026" and win where older code or docs disagree. They live here, not in Notion.

- **Services are the commercial unit.** Profile = identity; Service = commercial offering; Booking = request/transaction for that Service. Services exist for Talent, Business and Band/Collaboration. Examples: Singer (Vocal Recording, Live Performance); Studio (Recording Room, Mixing, Rehearsal); Band (Live Performance, Wedding Performance, Corporate Performance).
- **Price scope.** Prices appear only where the offer is concrete: Service Cards, opportunities, Market listings, rentals. Profile and search cards (Search, Directory, Discover, Home) and profile headers show no price.
- **Booking path.** No generic profile booking or hire sheet. Booking only through `Profile → Services → Service → Details → Book / Request`, one booking = one Service. Message covers open-ended asks.
- **One Inbox.** `/inbox` is the single destination (All, Messages, Enquiries, Booking Requests). `/messages` and `/leads` redirect to it. A Service-originated request is an Inbox conversation with service context. It is not a separate system.
- **Double-booking protection covers every provider.** Any time-based Service gets check → reserve → confirm, whether the provider is a Business, Talent, Band or other Collaboration. Non-time-based Services (async mixing or mastering, design delivery) get no lock and no calendar step. The Service decides, never the profile.
- **Calendar is a convenience layer.** MusicLinkd booking state is the only authority. Device sync mirrors accepted bookings only; busy-time display is an aid, not an authority; the web subscription is a feed the calendar client syncs.
- **Connect / Follow / Message.** Person-to-person professional relationship = Connect. Entity or audience relationship = Follow (bands may be followed too; don't hard-code by entity type). Communication = Message. None is a prerequisite for messaging.
- **Collaboration types:** Band, Duo, Collective, Ensemble, Production Team, Crew. `project` is not a Collaboration type; a one-off creative project is proof of work and lives in Portfolio/Project. The two `project` test rows are deleted, never converted: test data never goes into Portfolio.
- **Amenities and Equipment stay separate.** Production hardware belongs under Equipment.
- **Service ownership.** Services may be owned by Talent, Business or Collaboration. Collaboration Services use the same Service Card and booking model; the provider type changes neither the commercial nor the scheduling architecture. Extend the existing Service model; never build a separate Band Service system, and don't turn bands into Profiles (item 13).
- **Inbox status (decided).** Two separate state machines, never mapped into each other. Enquiry/conversation state: `new` (provider needs to respond) and `replied` (provider has responded; buyer's turn). Booking state: `requested`, `reviewing`, `confirmed`, `declined`, `cancelled`, `completed`. No "In progress" at Inbox level (`reviewing` already covers it). `booked` is a legacy, invalid enquiry state: removed, never mapped (item 10).

---

## 1. Account + data deletion (Play Console requirement) — `fix/account-deletion`

Live state: in-app delete works (`/settings/delete-account` → `deleteMyAccount`), DB rows cascade off `auth.users`/`profiles`. Two gaps:

**1a. Uploaded files survive deletion.** `storage.objects` in `avatars`, `covers`, `gallery`, `business-media`, `verification-documents` are never removed. ID documents left behind breaks Google's policy.
- In `deleteMyAccount` (`src/lib/account.functions.ts`), before `auth.admin.deleteUser`, remove that user's objects in all five buckets — for the user and for the business page they own. Read each bucket's real path convention first; don't guess.
- If a storage delete fails, stop and return an error. Never delete the user with files left.
- Test on a throwaway account with an avatar + a verification upload: zero rows for it in `storage.objects` afterwards.

**1b. Public page `src/routes/delete-account.tsx` → `/delete-account`.** No sign-in gate, own `head()`.
- How to delete: in the app, Settings → Delete account; on the web, a button → sign in → `/settings/delete-account`.
- What is deleted: profile, portfolio, services, messages they sent, posts, follows, listings, notifications, push tokens, saved items, verification requests, uploaded files.
- What is kept, anonymised: past booking requests, reviews they wrote, conversations and collaborations they created. Accounts with upcoming bookings can't be deleted until those are resolved.
- `#some-data` section: portfolio items, photos, services, listings and posts can each be deleted in the app without deleting the account — say where.
- A support contact for people who can't sign in.
- **Draft the copy and show the owner before merging — he writes content.**
- Link it from the footer and Settings → Privacy (no orphan route).

Play Console fields once deployed: account deletion `https://app.musiclinkd.com/delete-account`; partial deletion `https://app.musiclinkd.com/delete-account#some-data`.

## 2. "Remember me" unticked signs out every tab when a second tab opens — `fix/remember-me-tabs`

`src/lib/remember-me.ts`: the `ml:session-alive` marker lives in sessionStorage (per tab), so a new tab looks like a fresh browser start and `signOut({scope:"local"})` clears the shared session for every tab.
- In `endSessionIfClosed()`: when the forget flag is set and the marker is missing, ask other tabs on `BroadcastChannel("ml-session")`, wait ~300 ms. Any reply → set the marker here, keep the session. No reply → sign out. Every tab holding the marker answers.
- Easy fix = the BroadcastChannel check above. Best fix = the same plus tests for both paths: a second tab stays signed in, and closing every tab then reopening signs out. Capacitor (single webview) unaffected.

## 3. Discover drops most trending work — `fix/discover-trending-rest`

`src/routes/discover.index.tsx` splits `trendingWork` into audio / video / reel rails and discards every other kind (live performances, projects, client work, case studies, writing, images, links).
- Add one rail for the kinds the other three don't take. Reuse the existing work card; no new component. Render only when non-empty.
- Change no copy except that rail's heading — **show the owner the heading for approval.**

## 4. Amenities vs equipment (owner, 4 Oct) — `feat/hardware-under-equipment`

**Decision: amenities and equipment stay separate. Production hardware belongs under Equipment.** (An earlier note proposing to merge them is withdrawn — do not do it.)

Verified:
- Service schema already keeps them apart: `profile_services.amenity_slugs` (→ `amenities` taxonomy) and `profile_services.equipment_ids` (→ `bookable_equipment` rows). Nothing to change there.
- Business onboarding (`src/routes/business.new.tsx`) already has separate `amenities` and `equipment` steps after create.
- **But** they only run when `type === "studio"` (line ~224, `if (isStudio) go("amenities")`). Every other business type skips both. **Owner to confirm: should every business type get both steps?** Don't change until confirmed.

**Hardware currently sitting in the `amenities` taxonomy** (candidates to move to Equipment — the owner decides the list, Claude Code does not):
`stage_monitors` (Stage Monitors), `analogue_chain` (Analogue Chain), `drums_included` (Drums Included), `backline_included` (Backline Included), `four_mic_positions` (4 Mic Positions), `multicam_video` (Multicam Video), `dolby_atmos` (Dolby Atmos).
Once the owner picks: one migration that unpublishes those amenity options and maps any `bookables.amenities` / `profile_services.amenity_slugs` values that use them (count first; report counts). Equipment is a free list per business (`bookable_equipment`, typed by `equipment_categories`), so the owner re-adds the actual gear — no auto-conversion of an amenity chip into a fake equipment row.

## 5. System calendar for bookings, all use cases (owner, 4 Oct; revised) — `feat/system-calendar`

**Rule (owner): no .ics downloads.** Nobody downloads a file. Use the system's own calendar.
Scope: every booking type — service bookings (talent, business, band), studio/space sessions (`booking_requests`), rentals (`rental_bookings`, date ranges). MusicLinkd stays the source of truth (4 Oct §5); calendars mirror it.

### Android app — native, three levels (build 5a now; 5b and 5c behind it)

Plugin: **`@ebarooni/capacitor-calendar` 8.7.1** (peer `@capacitor/core >=8`, updated 1 Oct 2026, verified). Buy, don't build.

**5a. One tap, no permission — "Add to calendar".**
- On an **accepted** booking/rental (both sides), the button calls `createEventWithPrompt()`. Android opens **its own calendar app's "new event" screen**, pre-filled: title, start/end (all-day range for rentals), location, notes with the booking link. The user taps Save in their calendar. Uses `Intent.ACTION_INSERT` (checked in the plugin source), so **no calendar permission, no Play form change**.
- After it returns, the button reads "Open in calendar" (`openCalendar({date})`), not a fake "Added" (Android returns no event id from the prompt, so we can't claim it was saved).

**5b. Automatic, opt-in — "Keep my bookings in my calendar".**
- A switch in Settings → Notifications/Calendar. On turn-on: `requestWriteOnlyCalendarAccess()` → user picks a calendar (`listCalendars()`), or we create one named "MusicLinkd" (`createCalendar`) so the user can hide/remove it in one go.
- Every accepted booking is written silently with `createEvent`; a rescheduled one is updated with `modifyEvent`; cancelled/declined ones are removed with `deleteEventsById`. Event ids live **on the device only** (keyed by booking id), not in the database.
- Sync runs when the app opens and when a booking push notification arrives.
- Adds `WRITE_CALENDAR` → declare in the Play Data safety form; needs a new Play build.

**5c. Busy times when picking a slot — opt-in, on device only.**
- When a buyer picks a date/time for a time-based Service, with read access (`requestReadOnlyCalendarAccess()`), show their own busy blocks from `listEventsInRange` as greyed hints. Never uploaded, never stored.
- Advisory only: the server's check → reserve → confirm still decides (§5 overlap protection).
- Adds `READ_CALENDAR` → Data safety form; new Play build.

### Web (browser / installed web app) — no file either

**5d. Calendar subscription — one link, every booking, kept in sync.**
- Each user gets a private feed URL: `https://app.musiclinkd.com/cal/<secret-token>.ics` (server route returning `text/calendar` of their accepted bookings and rentals; token is random, revocable, stored hashed).
- In Settings: **"Add MusicLinkd to Google Calendar"** opens Google's own add-by-URL screen (`https://calendar.google.com/calendar/r?cid=webcal://…`), **"Apple Calendar"** uses the `webcal://` link (subscribe prompt), **"Outlook"** uses Outlook's add-from-web link. The user subscribes once; new, changed and cancelled bookings appear by themselves. Nothing is ever downloaded.
- "Reset link" revokes the old token.
- On a single booking (web only), a small "Google Calendar" deep link (`calendar.google.com/calendar/render?action=TEMPLATE&…`), which on Android opens the Google Calendar app. No .ics button.
- The feed holds only what both sides already see on the booking page.

### Order
1. 5a (Android one-tap) + 5d (web subscription): no permissions; 5a needs a Play build (new plugin), 5d deploys like any web change.
2. 5b, then 5c: permission-based; ship together in the next Play build with the Data safety update.

### Locked rules (owner, 4 Oct)
- **Calendar integration is an availability and convenience layer. MusicLinkd booking state is the only authority.** Applies to Studio, Talent, Band and other Collaboration services alike, whenever the service is time-based.
- 5b mirrors **accepted** MusicLinkd bookings only. It never becomes a second source of truth, and never reads back from the device calendar.
- 5c is an aid, not an authority: device calendar → show busy periods → user picks a slot → MusicLinkd checks its own availability → reserve → confirm. A slot that looks free on the phone can still be refused.
- 5d is a feed; the calendar client does the syncing. Build no web-side calendar-management infrastructure.
- **Release 1:** 5a, 5d, web single-booking Google Calendar link. **Release 2:** 5b, 5c, Play Data safety update, versionCode 2.

Platform check in code: `Capacitor.isNativePlatform()` → native path; otherwise web path. Never show a native-only control on the web.

## 6. Android / Play Console — status, no code needed now

- Signed release `MusicLinkd-1.0-release.aab` (versionCode 1) and upload key are in `Claude outputs/` (`play-keys/` is git-excluded locally). Every future upload needs a higher `versionCode` in `android/app/build.gradle`.
- App loads `https://app.musiclinkd.com`, so web items reach the app on deploy without a rebuild — except item 5a–5c, which add a native plugin and need a new Play build (versionCode 2).

## Not to do

- "Playing in MusicLinkd" fake card — already removed in 906b5f3.
- Trending "30 Sep cutoff" — the date has passed; working as designed.

---

# Added later 4 Oct — app checked against the 4 Oct decisions (§3–§7, §9)

Source of truth: Notion "MusicLinkd — Morning Product Decisions — 4 Oct 2026". Where it conflicts with older code or older decisions, it wins — but **every conflict below needs the owner's yes before code changes**, because some contradict earlier owner decisions.

## 7. Collaboration types (owner, 4 Oct) — `feat/collab-types` — DECIDED except the 2 rows

Decided: the six types are **Band, Duo, Collective, Ensemble, Production Team, Crew**. **`project` is not a Collaboration type** and is not kept as a 7th. A one-off creative project is proof of work and belongs in Portfolio/Project, not Collaboration.
Live: `collabs.type` CHECK allows `'band' | 'project'`; 4 band rows, 2 project rows.

Do:
- Migration (file only, `supabase/migrations/`): widen the CHECK to `band, duo, collective, ensemble, production_team, crew`, with **no `project`**. Union keys in code; labels separate.
- Remove every UI and server path that creates a `type = 'project'` collab. Anything that was a "project" collab becomes Portfolio → add work (project) instead. Report every route you touched, with no orphan routes.
- The `collaboration_types` taxonomy (how people are paid) is a different axis. Don't reuse it.
- Each collab type has its own portfolio; no inheriting members' work (§2).

**The 2 `project` rows: owner decision, DELETE both. Do not move them to Portfolio.** They are test data (`ghvb-f1ed6`, `jnb-e29f5`): creator-only membership, no messages, no meaningful content, created 21 Sep. In the same migration, first delete them (their `collab_members` rows cascade), then narrow the CHECK. Count before and after, and fail the migration if anything other than those two slugs would be removed.

## 8. No price on profile cards (§3) — CONFIRMED by owner — `fix/no-price-on-profile-cards`

- Remove the rate from the **talent card and business card, every size** (`src/components/ml/cards.tsx`, Row and Card; used in Search, Directory, Discover, Home), and from any profile header.
- **Prices stay where the offer is concrete:** Service Cards, opportunities, Market listings, rentals, and anything else priced per item. Don't touch those.
- Remove any now-unused rate plumbing only if nothing else reads it; report what you removed.

## 9. No generic book/hire from the profile (§4) — CONFIRMED by owner — `fix/remove-hire-sheet`

- Remove `HireModal` ("Contact professional", `src/components/ml/hire-modal.tsx`) and its trigger from the talent profile.
- Booking happens only from a Service Card: `Profile → Services → Service → Details → Book / Request`, one booking = one Service.
- Open-ended asks (quote, hire discussion, custom work) go through **Message**, which lands in the one Inbox (item 10).
- Keep `sendEnquiry` if a Service's own request flow uses it; delete only what nothing else calls. Report before/after of the profile action row; don't redesign it.

## 10. One Inbox: communication + leads + enquiries (§6) — CONFIRMED by owner — `feat/one-inbox`

Rule: **Inbox = open-ended communication and lead generation.** No separate system per commercial conversation type (general enquiries, leads, RFQs, RFPs, pricing, availability, hiring, collaboration, custom requirements, follow-ups, business enquiries). A Service-originated request is still an Inbox conversation, carrying service context. It is not a separate messaging product.

Architecture (owner): **Profile = identity → Portfolio = proof → Service = commercial offer → Booking = transaction → Inbox = communication around it.**

Owner's model:
```
INBOX
├── All
├── Messages
├── Enquiries
├── Booking Requests
└── Status: New · In progress · Awaiting response · Closed
```
A Service-originated thread shows the service block at the top (service name, price, duration, requested date/time when time-based), then the conversation.

Build (no new tables if the existing conversation, enquiry and booking-request structures can carry the state; **ask before adding any**):
- `/inbox` is the one screen. `/messages` → `/inbox` and `/leads` → `/inbox` redirects with the matching filter; update every inbound link.
- The separate Leads UI goes. Lead status becomes the Status filter inside the Inbox.
- **Status: DECIDED (owner).** Two state machines, shown separately. Don't map one into the other, and don't invent an Inbox-level status.
  ```
  Inbox
  ├── All
  ├── Messages
  ├── Enquiries          → conversation state
  │   ├── New                (enquiries.status = new: provider hasn't responded)
  │   └── Awaiting response  (enquiries.status = replied: provider responded; buyer's turn)
  └── Booking Requests   → booking state (booking_requests.status, labels only, values unchanged)
      ├── Requested · Reviewing · Confirmed · Declined · Cancelled · Completed
  ```
  - No "In progress" anywhere at Inbox level; `reviewing` already says it for bookings.
  - **`booked` is removed as an enquiry state, not mapped.** It is a hand-set label with no booking behind it, so it can falsely imply a confirmed booking. Cleanup:
    - migration (file only): count `enquiries` rows with `status = 'booked'` (live today: 0; all 3 rows are `new`). If any exist, stop and report rather than converting them. Then narrow the CHECK to `new | replied | closed`;
    - remove `booked` from `EnquiryStatus`, the `setLeadStatus` zod enum (`enquiries.functions.ts`), the `/leads` UI, and the seed rows in `src/data/business.ts`;
    - `closed` stays as the provider's own "done with this enquiry" action and an archive filter. It isn't one of the two conversation states.
  - Keys are union types; labels are kept separate (never key styling off "Awaiting response").
- Show the owner the Inbox list and one Service-originated thread at 412px before merging. The visual design is the owner's; build the structure, not a new look.

| Item | Decision |
|---|---|
| Generic price on profile/search cards | REMOVE (item 8) |
| Generic profile booking/hiring | REMOVE (item 9) |
| Message from profile | KEEP |
| Service-specific booking | KEEP, the only path |
| `/messages`, `/leads` | REDIRECT → `/inbox` |
| Unified Inbox + service context in threads | BUILD |
| Separate lead system/UI | REMOVE |

## 11. Message vs Connect vs Follow (§7) — mostly verified; one gap

Model (owner): person ↔ person professional relationship = **Connect**; entity/audience relationship = **Follow**; communication = **Message**. None is a prerequisite for messaging. Don't hard-code "business = Follow, talent = Connect".
Verified:
- Message needs no connection or follow (DB policies and UI). Keep it that way.
- Talent profile: Connect + Follow. Business profile: Follow.
- **Gap: bands have no Follow.** `follows.target_id` references `profiles`, and a band is a `collabs` row, so a band can't be followed today. Owner's caveat says bands may benefit from Follow.
- **Don't add tables or columns for this.** Report how a band could be followed with the existing model, and wait for the owner's decision.

## 12. Time-based services: date step + double-booking protection for every provider (§5) — DECIDED — `feat/service-slot-protection`

Owner's rule:
1. **The Service decides** whether a date/time is needed. Time-based Service → date/time required. Non-time-based → no calendar step. The profile never decides.
2. **Any time-based Service is protected against overlapping MusicLinkd bookings, whoever provides it:** Business, Talent, Band or other Collaboration. Same mechanism as studios: atomic check → reserve → confirm against that Service's/provider's availability.
   - Protected: studio recording session, singer recording session, guitarist session, band performance at 8 PM.
   - No lock or calendar: async mixing/mastering delivery, logo/design delivery.

Do:
- Report which existing field marks a Service as time-based (`mode`, `pricing_model`, `min_hours`?). If none does it cleanly, propose the smallest change and **ask before adding a column**.
- Make the request flow show the date/time step only for time-based Services.
- Extend the server-side guard (today: `booking_requests_guard` + `bookable_busy`, studios only) so a time-based talent/band/collab service can't be double-booked. Migration file only; the guard's md5 fingerprint check pattern stays.
- Nothing on screen says paid, confirmed or deposited unless the status really is (§4: booking ≠ payment).

## 13. Collaboration-owned services (§5) — DECIDED direction; schema proposal first — `feat/collab-services`

Owner's rule: **Profile = identity; Service = commercial offering; Booking = request/transaction for that Service.** Services exist for Talent, Business and Band/Collaboration.

Gap (structural, not just missing UI): `profile_services.profile_id` → `profiles`, and a band is a `collabs` row. So `Band → Service` is impossible today. `collabs.rate_paise` / `rate_unit` is a generic band price, which the rule forbids.

Decision: **extend Service ownership to Collaboration**. Don't turn bands into Profiles, and don't build a separate band-service system.
```
Service
├── Talent         (profile)
├── Business       (profile)
└── Collaboration  (collab: Band, Duo, Collective, Ensemble, Production Team, Crew)
```
Band → Services (Live Performance, Wedding Performance, Corporate Performance) → Booking: the same Service Card, the same request flow, the same Inbox thread, and the same time-based double-booking protection (item 12).

Do:
1. **Propose the smallest schema change first. Write no migration until the owner says yes.** Expected shape: `profile_services` gains a nullable collab owner, plus a CHECK that exactly one owner is set; RLS lets collab admins manage their collab's services; booking/enquiry rows can point at a collab-owned service. Report what `booking_requests.service_id`, the guard and `bookable_busy` need, and every query that assumes `profile_id` is set.
2. Remove `collabs.rate_paise` / `rate_unit` from every screen (report where shown). Don't drop the columns without the owner's yes.
3. Band page gets a Services section using the existing Service Card, with no new component.

---

## Appendix A — audit of the 4 reported bugs (Cowork Claude, checked on `main` at 9adfefa, 3 Oct)

Two are real (fixes = **item 2** and **item 3** above), one is already fixed, and one rests on a wrong date.

| # | Claim | Verdict |
|---|---|---|
| 1 | Links that can't be embedded show a fake "Playing in MusicLinkd" card | **Already fixed.** The card was removed in 906b5f3 on 30 Sep. A link that can't play in place now shows an "Open on {site}" card that opens it in a new tab (`media-embed.tsx`). The report was run against older code. |
| 2 | Unticking "Remember me" signs you out when you open a second tab | **Real → item 2.** The `ml:session-alive` marker is in sessionStorage, which belongs to one tab. A new tab doesn't have it, so the app thinks the browser was closed and signs out; that clears the shared saved session, so every open tab is signed out. |
| 3 | Trending is empty because 30 Sep 2026 "hasn't arrived" | **Wrong date. No action.** 30 Sep is in the past; the cutoff works. Rails are thin because only plays since 30 Sep count; they fill as people play work. |
| 4 | Discover hides most trending work | **Real → item 3.** `listTrendingWork()` returns every kind, but `discover.index.tsx` only renders audio, video and reel rails. Live performances, projects, client work, case studies, writing, images and links never appear on Discover. |

For items 2 and 3, as for everything in this file: run tsc, lint, build, the workerd render and a 412px render of `/discover`; update CHANGELOG; work on the branch and **do not merge to `main` until the owner approves** (ground rule at the top overrides "merge forward"). Check for a `lovable-sync` branch after any push.

Cowork Claude couldn't fetch from GitHub on the Mac (no login there). If `main` on GitHub has moved past 9adfefa, re-check these against it before fixing. The local clone is now at 27665f4.


---

# Added 4 Oct evening — owner's finishing pass (Waves A–E) and the Lovable session's open items

Source: the owner's messages of 4 Oct evening, which include the Lovable agent's own reports. Lovable's
"done" items below are **its claims, not verified here**; validate before relying on them. Same ground
rule as the top of this file: branch `review/pending-owner-items`, no merge to `main` without the owner.

## Status of this file's items on `review/pending-owner-items` (Claude Code, 4 Oct)

| Item | State |
|---|---|
| 1a files deleted with the account | Done (`f399397`); throwaway-account test not run (would create a live account) |
| 1b `/delete-account` page | Done with draft copy (`e3a9c3b`), linked from Help footer and Settings → Privacy & security; QR row added under Settings → Account |
| 2 Remember me across tabs | Done (`c0489dc`); both paths pass, `scripts/remember-me-tabs.mjs` |
| 3 Discover trending | Done (`50a0c8a`): Lovable's redesign had removed all trending work, so one "Trending work" rail for every kind |
| 8 no price on profile cards | Done (`a73d495`) |
| 9 Hire sheet removed | Done (`c2e4dac`) |
| Help footer legal links (`/legal/undefined`) | Fixed (`f0dd9c0`) |
| Select screen back to owner's version | Done (`0b0345f`) |
| 4, 5, 7, 10, 11, 12, 13 | Open — owner: decide with the queue's own rules, don't ask again |

## Blocker for every tap test: the dev server never hydrates

Pages render server HTML but React never attaches, so no tap works in the Vite dev preview. Tried
`optimizeDeps.holdUntilCrawlEnd: false` + pre-bundling react/react-dom/router: **did not fix it**
(not hydrated after 245 s; Lovable reports the same) — reverted (`e0560e4`). Still undiagnosed: the
preview logs a failed dynamically imported client module. Workaround that works: `bun run build` +
`wrangler dev` on `.output/server` (production bundle hydrates), signed-out screens only, because
local has no accounts.

## Navigation and links (owner's list)
- [x] Settings → "QR Code & Digital ID" row → `/identity/qr`
- [ ] `/portfolio/new` route that redirects to `/portfolio?add=1`
- [ ] Settings: link `/settings/security/` exactly; "Sign-in methods" row points at `/settings` (self-loop) — open the sign-in methods sheet instead
- [ ] Profile action bar: a QR / Digital ID button (from the Lovable audit; owner listed it once)
- [ ] Camera on Add work: put back `capture="environment"` on the hidden file input in `src/components/ml/work-form.tsx`

## Wave A — Inbox and conversations
Validate (not rebuild) the Inbox banner, unread indicator, conversation list, thread, optimistic send,
older-message loading without scroll jump, keyboard-safe composer, back navigation; loading / empty /
offline / send-failure / retry states; initials when a member has no photo. Lovable says it restyled
Inbox (dark banner, unread count, grouped list, white bubbles, 50-message pages) — unverified.
Conversation screen restyle still open.

## Wave B — Hiring and full professional profiles
A hiring brief matches real talent, eligible business profiles and open opportunities; every result
opens its full page and shows only contact methods the owner made public. Business Home's hiring
entry, the multi-step posting form, draft/publish errors, return to matching. **No fabricated job,
no posting on someone's behalf**: a genuine owner-provided need, or clearly marked disposable test
data removed afterwards. Blockers: no business test account; no real hiring post.

## Wave C — Mobile UI and flow corrections
Screen-by-screen review: onboarding, edit profile, bookings, scheduling, booking messages, Academy,
Portfolio Add work, Profile, Settings — grounds, typography, safe areas, icon-labelled inputs,
primary actions, motion + reduced motion, 48px taps. Owner profile: remove the redundant Overview tab,
one primary Edit. Market: branded banners on category pages **and** the main Market page, with
verified live counts (including zero and failed-count states). Business profiles: one "Business name",
never first/last name (Lovable says done in edit profile — unverified).

## Wave D — Android and full audit
Native share, press feedback (vibration), status bar, camera/gallery for Portfolio and profile images
(existing plugins first); message notifications only after checking registration, permission timing,
token ownership, foreground behaviour, delivery. Full route/workflow audit for talent and business:
auth/onboarding, Home, Discover, search/saved/history, identity/QR, profiles/edit, portfolio, services,
bookings/schedule/messages, opportunities/applications/hiring, Market/rentals, collaborations/bands,
verification/reviews, notifications, settings, Academy/help, analytics — dead links, duplicate
actions, missing icons, bad handoffs, stale data, misleading counts, missing states.

## Wave E — Verify, then publish
Signed-in talent and business sessions at 412px: drawers open/close/back and run their action,
Profile/Edit/Share, Settings, Portfolio/Add work/photo, Inbox/thread/reply, booking messages,
onboarding handoff, hiring post and match. Market category counts against live eligible listings.
Publish only after these pass; the owner then checks the Android back gesture with the menu open.

## Docs and design (owner)
- Remove stale `.md` files and `roadmap.md`; update AGENTS.md. (Lovable says it deleted 14 notes and the
  roadmap and moved AGENTS.md sections into folders — check what's actually on `main`.)
- Animations: screen transitions, scroll reveals, hover lift, tap feedback; all off under reduced motion.
- Lovable's three backgrounds: auth screens (light grey), content ground (warm off-white), cards/menus
  (white). **Conflict:** the owner also wrote "updating css … background colour … please do ignore it".
  Resolve before touching `src/styles.css`.

## Conflicts with standing rules — resolve before doing
- "Use Unsplash … a user profile to have a human DP": AGENTS.md and Wave text both forbid photos that
  impersonate a member. Stock imagery only for empty states and banners, never as someone's avatar.
- "Create a real hiring post": only with genuine owner-provided details (Wave B).

## Lovable-built features to validate (not rebuild)
AI hiring match (`/discover/match`, linked from Discover and business Home; matches real profiles and
open posts, "View profile / View opportunity"); AI-drafted hiring copy on `/opportunities/new`;
Academy placeholder screen; Inbox screen in the menu; Market banners with counts.

## Decisions taken by Claude Code (owner, 4 Oct: "decide, don't ask again")

- **Item 4 — done in data already.** Live check: none of the 7 hardware amenities is used (0 places,
  0 services). Six are already unpublished and out of the picker (`is_published = false`,
  `picker: false`): stage_monitors, analogue_chain, drums_included, backline_included,
  multicam_video, dolby_atmos — physical gear, listed as Equipment. `four_mic_positions` stays an
  amenity (a room layout, not gear). The amenities + equipment steps stay for businesses with a
  place only: `bookable_equipment` rows need a `bookable_id`, which a label or agency doesn't have.
- **Item 11 — answer.** `follows.target_id` references `profiles`; a band is a `collabs` row, so the
  current tables can't hold "follows a band". Following each member is not a substitute. It needs
  one nullable `target_collab_id` on `follows` with an exactly-one-target CHECK — the same pattern
  as item 13. Not built (this item forbids new columns).
- **Item 12 — rule.** No column marks a service time-based cleanly: on live data every service has
  no `price_unit`, no `pricing_model`, no `min_hours`. The meaning is in `work_modes`: a service is
  **time-based if its work modes include `in_person` or `touring`** (date/time step + double-booking
  guard); remote-only services (171 of 251) are async: no date step, no lock. To build: the request
  flow reads that rule; the guard (`booking_requests_guard`, `bookable_busy`) is extended to
  time-based talent/band services (migration file, md5 fingerprint pattern kept).
- **Item 13 — schema, decided.** `profile_services.collab_id uuid NULL REFERENCES collabs(id)`,
  `profile_id` becomes NULL-able, `CHECK (num_nonnulls(profile_id, collab_id) = 1)`, RLS: collab
  admins (`collab_can_manage`) manage their collab's services. `booking_requests.service_id`
  already points at the service; queries that assume `profile_id` must handle a collab owner.
  Part 2 done: band rate removed from the band page (`e8a04b4`).

## Status after "proceed with all pending" (Claude Code, 4 Oct, branch `review/pending-owner-items`)

| Item | Commit | State |
|---|---|---|
| 12 time-based services + double-booking guard | `71455d9` | Built. Migration `20261004170000` not applied |
| 13 bands own services | `adc35c8`, `6c03a6f` | Built (DB, band page Services, manage + form band mode, band admins' requests in the Inbox). Migration `20261004180000` not applied |
| 7 collaboration types | `2a42d3b` | Built. Migration `20261004190000` not applied (deletes the 2 test project rows) |
| 10 one Inbox | `829b2a1` | Built. Migration `20261004200000` not applied. Gap: no service block at the top of a service-originated thread (enquiries don't link to a conversation yet) |
| 5a Add to calendar, system calendar | `c72fcfc` | Built; versionCode 2. Needs an Android Studio build |
| 5d calendar subscription | `f8cd6ae` | Built. Migration `20261004210000` not applied |
| 5b/5c device calendar sync, busy hints | `cf524d3` | Built (opt-in, Android app). Needs a device build; Play Data safety: READ/WRITE_CALENDAR |
| Stale docs | this commit | `MIGRATION-bands-own-tables.md` removed (contradicted by items 7 and 13); `roadmap.md` and 14 notes were already removed by Lovable |

**Apply order** (each guarded; stops on any drift): `20261004170000` → `20261004180000` → `20261004190000`
→ `20261004200000` → `20261004210000`. Deploy the branch's code only after they are live.

**Still blocked:** every signed-in check in Waves A–E (needs accounts; the dev server never hydrates);
a real hiring post (needs the owner's genuine need); the Lovable background-colour conflict (owner
said both "use three backgrounds" and "ignore it"); the create screen's tab title "Create a Band".
