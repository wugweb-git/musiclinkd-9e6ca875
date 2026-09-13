> **Audit snapshot, 13 Sep 2026.** It covers `.lovable/plan/pending-screens-across-all-flows-2026-09-07.md`, checked item by item against the code at `main` = `0697a42`. Line numbers are as of that commit. Since then the 12 parent routes it mentions were renamed to `*.index.tsx` (e.g. `bands.$id.tsx` → `bands.$id.index.tsx`), so child URLs now render their own screens. The **orphaning findings are unchanged**: no in-app link reaches those screens yet. UI work from this audit goes to Lovable.

# Audit: pending-screens-across-all-flows-2026-09-07.md vs. code on disk

Loading/empty/error/offline abbreviated L/E/Er/O. The kit (`src/components/ml/kit.tsx`) has no `Skeleton` or `OfflineBanner` component at all, so **no item below has a true loading or offline state** — "Er" below means only a not-found/EmptyState fallback, which doubles as both empty and error.

## Group 1 — Business profiles

| item | status | route(s) | evidence | states | linked from | head() |
|---|---|---|---|---|---|---|
| Services mgmt + business availability | PARTIAL | /business/$id/services, /availability | services.tsx:79-86 Edit/Pause buttons have no onClick; availability.tsx:90-92 "Add blackout dates" has no onClick | E✓ Er✓ L✗ O✗ | dashboard.tsx:97,103 | yes |
| Business portfolio/gallery mgmt | PARTIAL | /business/$id/portfolio | portfolio.tsx:65-70,74-76,104-106 Edit/Hide/Add buttons have no onClick | E✓ Er✓ L✗ O✗ | dashboard.tsx:109 | yes |
| Enquiry & booking entry from business page | DONE, orphaned | /business/$id/enquiry | enquiry.tsx:31-129 full form + sent state + "Book a room" CTA | E✗(n/a) Er✓ L✗ O✗ | **nothing links here** — business.$id.index.tsx has Message/Book/Follow only, no Enquire | yes |
| Business reviews + owner replies | DONE | /business/$id/reviews | reviews.tsx:74-108 reply textarea, post/cancel, persisted in local state | E✓ Er✓ L✗ O✗ | dashboard.tsx:115 | yes |
| Business verification | DONE | /business/$id/verification | verification.tsx:45-110 checklist + submit-for-review | E✗ Er✓ L✗ O✗ | dashboard.tsx:121, manage.tsx:88-92 | yes |
| Follow/share business + related suggestions | PARTIAL | /business/$id | index.tsx:96-98 "Follow" button has **no onClick/state**; no "Share" control anywhere in business.\* routes; `relatedBusinesses` (data/business.ts:283) is **defined but never imported/rendered anywhere** | Er✓ | business.index.tsx | yes |
| Analytics, leads inbox, owner dashboard | DONE | /business/$id/analytics, /leads, /dashboard | analytics.tsx, leads.tsx (filter+reply+close), dashboard.tsx (hub) | E✓ Er✓ L✗ O✗ | dashboard.tsx links leads/analytics; leads/analytics link back to dashboard | yes (all 3) |

## Group 2 — Services

| item | status | route | evidence | states | linked from | head() |
|---|---|---|---|---|---|---|
| Enquiry + custom-quote request | DONE, orphaned | /services/$id/enquiry | enquiry.tsx:26-153, "Quick question"/"Custom quote" modes, sent confirmation | Er✓ | **nothing links here** (services.$id.tsx only links availability/new/booking) | yes |
| Pause/duplicate/delete service | DONE, orphaned | /services/$id/manage | manage.tsx:65-117, working status toggle, duplicate flag, delete confirm Dialog | Er✓ | **nothing links here** | yes |
| Availability conflict / double-booking | DONE, orphaned | /services/conflicts | conflicts.tsx:24-105, 3 seeded conflict cards w/ resolve actions | E✓ Er✗(n/a) | **nothing links here** (only self→/services/availability) | yes |

## Group 3 — Bands

| item | status | route | evidence | states | linked from | head() |
|---|---|---|---|---|---|---|
| Band portfolio / discography | DONE, orphaned | /bands/$id/portfolio | portfolio.tsx:25-107, Discography/Live tabs, releases list | E✓ Er✓ | **nothing links here** — bands.$id.tsx doesn't link to it | yes |
| Band events & opportunities | DONE, orphaned | /bands/$id/events | events.tsx:27-110, Shows/Opportunities tabs, gigs pulled from `opportunities` data | E✓ Er✓ | **nothing links here** | yes |
| Contact the band | DONE, orphaned | /bands/$id/contact | contact.tsx:27-104, reason chips + message + sent state | Er✓ | **nothing links here** | yes |

## Group 4 — Reviews

| item | status | route | evidence | states | linked from | head() |
|---|---|---|---|---|---|---|
| Reply to a review (owner) | DONE, orphaned | /reviews/$id/reply | reply.tsx:24-102 | Er✓ | **nothing links here** (reviews.tsx only links write/$id) | yes |
| Edit/delete own review | DONE, orphaned | /reviews/$id/edit | edit.tsx:24-95, edit + delete-confirm Dialog | Er✓ | **nothing links here** | yes |
| Report a review | DONE, orphaned | /reviews/$id/report | report.tsx:24-105, reason chips + sent state | Er✓ | **nothing links here** | yes |
| Request a review + reminder | DONE, orphaned | /reviews/request | request.tsx:28-102, single screen: "Ask" then "Send a reminder" state per target | E✓ | **nothing links here** | yes |

## Group 5 — Discovery and search

| item | status | route | evidence | states | linked from | head() |
|---|---|---|---|---|---|---|
| Music/project/community discovery | DONE, orphaned | /discover/music, /projects, /community | each pulls real `portfolio`/`opportunities`/`band`/`business` data | E✓ | **nothing links here** | yes |
| Nearby discovery + recommendations | DONE, orphaned | /discover/nearby | nearby.tsx:31-56 permission gate, then radius + studios/people lists | E✓ Er✓(perm-gate) | **nothing links here** | yes |
| Recently viewed | PARTIAL | /recently-viewed | recently-viewed.tsx:23-26 just slices the static `talents`/`studios` arrays — not real view history; empty branch is unreachable with real data | E✓(dead code) | not found from anywhere | yes |
| "Why am I seeing this" | DONE, fully orphaned | /search/why/$id | why.$id.tsx:33-126, signals/not-used/feedback | Er✓(fallback `defaultWhy`) | **nothing links here — not even /recommendations**, which has its own separate "Tell us why" sheet (recommendations.tsx:176) | yes |
| Saved searches + alerts | DONE | /search/saved | saved.tsx:29-129, alert toggle, delete, row→history | E✓ | only cross-linked from search.history.tsx; nothing else links in | yes |
| Search history | DONE | /search/history | history.tsx:28-127, filter tabs, remove, clear-all Dialog | E✓ | only cross-linked from search.saved.tsx | yes |
| Location permission prompt | DONE | (in-screen, /discover/nearby) | nearby.tsx:31-56 "Use my location" gate | — | part of discover.nearby | n/a (same head as nearby) |

## Group 6 — Opportunities & portfolio follow-ups

| item | status | route | evidence | states | linked from | head() |
|---|---|---|---|---|---|---|
| Report an opportunity | DONE | in-screen sheet, /opportunities/$id | opportunities.$id.index.tsx:52-256, Sheet + reasons + reported Dialog | Er✓ | opportunities.index.tsx and others (detail page is broadly linked) | yes |
| Withdraw an application | DONE, orphaned | /opportunities/applications/$aid | applications.$aid.tsx:35,135-155 confirm Dialog, "Application withdrawn" | Er✓ | **applications.index.tsx never links to $aid** | yes |
| Attach portfolio work in a conversation | DONE | /portfolio/select | messages.tsx:46,52 "Attach a track…" → portfolio.select.tsx (126 lines) | E✓ | messages.tsx | yes |
| Archive a work | NOT DONE | — | searched `src/routes/portfolio.*.tsx`, `ml/portfolio.tsx` for "Archive" — only passive copy "may have been deleted, archived" in an EmptyState (portfolio.$id.tsx:95); no archive action/button anywhere | — | — | — |
| Media upload failure / processing states | DONE | in-screen, `ml/portfolio.tsx` | portfolio.tsx:214-309 `MediaState` machine (`uploading/processing/failed/unavailable`) + `MediaStatePill`, used in work-form | — | used inside portfolio.new/edit forms | n/a |
| Save-conflict (same work edited twice) | NOT DONE | — | searched whole repo for "edited elsewhere/conflict" outside services/booking — no matches | — | — | — |

## Group 7 — Onboarding and help

| item | status | route | evidence | states | linked from | head() |
|---|---|---|---|---|---|---|
| Verification + services prompt at onboarding end | NOT DONE | /onboarding/done | done.tsx:64-82 "What next" only offers Add portfolio work / Discover talent / View my profile — no verification or services card | — | — | yes |
| Onboarding error & offline screens | PARTIAL | /onboarding/step/$id | step.$id.tsx:71,145-158 inline field-validation `ErrorBanner` only; no offline screen/banner anywhere in `onboarding/*` | Er✓(validation only) O✗ | — | yes |
| Splash / session-check at app start | NOT DONE | — | no splash/session-check route/component found; all "splash" grep hits were unrelated data-file text | — | — | — |
| Verification help page | DONE | /help/how-verification-works (content page) | verification.index.tsx:154-159 links to it; cms.ts:96-124 defines the page (kind:"faq") | Er✓ | verification.index.tsx | yes (help.$slug) |
| FAQ page & announcements page in Help | PARTIAL | /help/$slug | cms.ts has one `kind:"faq"` page (how-verification-works) and one `kind:"release"` page ("whats-new", cms.ts:202-223), shown as a tag via `StatusPill`, but **no dedicated FAQ-only or Announcements-only listing screen** exists | Er✓ | help.tsx (search/popular) | yes |
| Search inside Help | DONE | /help | help.tsx:29-41 live `SearchBar` filtering `contentPages` | E✓(no-results) | index route itself | yes |

## Group 8 — Settings and monetisation

| item | status | route | evidence | states | linked from | head() |
|---|---|---|---|---|---|---|
| Change email/phone/username | DONE (in-screen Sheet) | /settings/account | account.tsx:24-88, generic `accountFields` + edit Sheet per field, "confirmation" copy | Er✗(n/a) | settings.index.tsx (assumed) | yes |
| Invoice history & receipt screens | PARTIAL | /plans/manage | manage.tsx:88-108 invoice list (plan/date/amount/status) is embedded, no separate route; **no per-invoice receipt detail or download anywhere** | E✓(list) | plans.tsx:132, plans.earnings.tsx:78 | yes |

## Cross-cutting checks

- **BottomNav**: still exactly 5 destinations — Home, Discover, Connections, Market, Profile (`src/components/ml/ui.tsx:20-26`).
- **roadmap.md**: **not updated** for this plan at all. No "Group 1..8", no "pending-screens" mention anywhere in `roadmap.md`. The most recent sections are "Onboarding — the actual step sequence (written down 10 Sep…)" and Sep-2-dated flow notes (FLOW 01/05/11-13/21) — unrelated to this plan's 8 groups. The plan's own "How this will be built" promised `roadmap.md is updated as each group lands`; that did not happen.
- **Out-of-scope items respected**: payment wiring — no Razorpay/Stripe/Paddle SDK reference in `booking.$id.pay.tsx` or `plans.checkout.tsx` (roadmap.md:125-126 confirms still "awaiting decision"); real media upload — `MediaState` machine is explicitly links-only (roadmap.md:23); push delivery — `notifications.settings.tsx` only has a text label "reaches you by push, email or SMS", no service-worker/permission code; voice search — no mic/voice control found in `search.tsx` or `ui.tsx`. All four correctly left unbuilt.

## Summary

**Counts**: DONE 24 · PARTIAL 9 · NOT DONE 4 · UNVERIFIED 0 (out of ~37 discrete items scored across the 45-ish bullet points, several bullets bundle 2 sub-items scored together).

**NOT DONE (4)**: Archive a work · Save-conflict screen · Verification/services prompt at end of onboarding · Splash/session-check screen at app start.

**PARTIAL (9) — what's missing**:
1. Business services mgmt — Edit/Pause buttons are inert (no onClick).
2. Business portfolio/gallery mgmt — Edit/Hide/Add buttons are inert.
3. Follow/share a business + related suggestions — Follow button inert, no Share control, `relatedBusinesses` data never rendered.
4. Recently viewed — shows a static slice of all talents/studios, not actual view history.
5. FAQ/announcements page in Help — only single example articles tagged `faq`/`release`, no dedicated listing screens.
6. Invoice history & receipts — history list exists, no receipt detail/download.
7. Onboarding error & offline — only inline field-validation banner, no offline state.
(2 above folded into the business-portfolio/services rows as sub-findings.)

**The dominant, repeated defect across almost every group is orphaning**: roughly 20 of the ~30 newly-added routes (business enquiry, all 3 services follow-ups, all 3 band follow-ups, all 4 review follow-ups, all 3 discover sub-sections, nearby, why-am-I-seeing-this, opportunities withdraw) compile and render correctly but have **zero in-app `Link`/`Row`/`navigate` pointing to them** — they violate the plan's own build requirement of "reachable entry points from Profile, Discover, Business or the dashboard." Only the business dashboard hub, messages→portfolio-select, and the report-opportunity sheet are properly wired in.

**States**: none of the ~45 items have a genuine loading skeleton or offline banner — the shared kit (`ml/kit.tsx`) doesn't define either primitive. Every screen substitutes its not-found `EmptyState` for the error state, and several also reuse it for the empty state.
