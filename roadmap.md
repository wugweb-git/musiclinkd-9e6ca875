# MusicLinkd roadmap

## Done
- FLOW 03 (Discover) — discover home, categories, search, filters, profiles
- Dashboard / returning-user home
- Marketplace (buy/sell) + Rental marketplace
- Person Profile (public + owner mode) and profile edit
- FLOW 08 — Booking: data layer, components, customer flow (entry → service → schedule →
  details → add-ons → review → pay → confirmed), my bookings, booking detail,
  reschedule, cancel, provider workspace, request review, availability manager

## In progress
- Backend (Lovable Cloud) — enabled
  - [x] `profiles` + `portfolio_items` tables, RLS, grants, signup trigger
  - [x] `/auth` email+password and Google sign-in, `useAuth` hook
  - [x] `src/lib/portfolio.functions.ts` server functions (portfolio + profile CRUD)
  - [x] onboarding completion writes profile to the database
- FLOW 03 — Add Portfolio (UI per latest spec, DB-backed when signed in)
  - [x] overview (header stats, featured, all work), type picker, work form, draft/publish
  - [x] work detail (audio/video player, credits, performance), edit, reorder + featured,
        settings, share, portfolio analytics, share-work picker
  - [x] media uploader state machine (not-uploaded/uploading/processing/ready/failed/unavailable)
  - [ ] real media upload/storage (deliberately out of scope — links only)
- FLOW 08 — Booking: re-check latest spec gaps (payment success/failure, conflict,
  no-availability, rebook, provider pricing/policies screens)
- FLOW 02 — User Onboarding
  - [x] `src/data/onboarding.ts` master data, step model, contracts
  - [x] `src/components/ml/onboarding.tsx` UI kit + draft store
  - [x] welcome, stepper (`/onboarding/step/$id`), preview, complete, resume, skip
  - [x] `/onboarding/done` final screen + portfolio hand-off
  - [x] render pass on 412px viewport (no overflow, no console errors)

## 13 Sep 2026 — landed and live (published build `e0e347e`)
- [x] CI: `.github/workflows/ci.yml` runs bun install, typecheck, lint and build on every push and PR
      to `main`. Lint blocks on correctness rules only; formatting is reported but doesn't block,
      because Lovable's agent doesn't run Prettier.
- [x] 26 child routes rendered their parent's screen (`/bands/new`, every band profile, `/reviews/*`,
      `/plans/*`, `/help/*`, `/search/*` …). The cause was 12 parents without `<Outlet />`; they are
      now `X.index.tsx`. See `CHANGELOG.md`.
- [x] `viewport-fit=cover` added. The 10 `env(safe-area-inset-*)` uses were resolving to 0 on
      notched phones.
- [x] `profiles` RLS: migration `20260910131500` **applied to the live database**. The SELECT policy
      is now `visibility = 'public' OR auth.uid() = id`, and the version is recorded in
      `supabase_migrations.schema_migrations`.
- [x] Pending-screens plan (7 Sep) audited against the code: 24 done · 9 partial · 4 not done. See
      `docs/pending-screens-audit-2026-09-13.md` and the section below.

## 13 Sep 2026 — app start, link buttons, route audit (published build `a6dc3d0`)
- [x] The app opens on a session check at `/`: a saved sign-in goes to `/feed` and everyone else to
      `/welcome`. Discover moved to `/discover`. This is the owner's decision: the app must not start
      on Discover.
- [x] Welcome is the front door. It has "Already have an account? Sign in", and signed-out prompts
      open it.
- [x] 241 `<Link><Btn/></Link>` pairs became `<BtnLink>` (one element, one tab stop).
- [x] Link targets: "Saved items" now opens `/saved` (was Discover), and onboarding's "Start
      business setup" opens `/business/new` (was `/categories`).
- [x] Route, journey and screen audit. It lives in the guide repo at
      `Claude outputs/audits/route-audit-2026-09-13.md`, with a per-route inventory of 209 routes.
- [ ] From the audit, the link and logic fixes Claude Code can make (§7.1–7.2):
  - 18 wrong link targets. Worst: every **Book** button opens `/booking/svc-1`, which shows
    "This space is unavailable".
  - No link reaches `/settings`, which holds Business, Services and Sign out.
  - The business dashboard and its 7 sub-pages can only be reached by typing the URL.
  - New users signing up with Google or an email link skip onboarding, and the splash doesn't
    check `onboarding_complete`.
  - 22 of 24 unknown-id URLs return 200 instead of 404.
  - 9 demo controls show in the live UI.
- [ ] Owner decisions (§8): where account type is chosen (registration or onboarding step 1);
      onboarding, Home and nav per type; whether signed-out visitors can open public pages
      (handoff 11a); where Settings is entered from; whether demo controls are removed or kept
      behind a flag.

## Next
- Profile follow-ups (from user)
  - [x] `src/routes/profile.insights.tsx` — owner analytics
  - [x] redirect `/talent/$id` → `/profile/$username` (the route has only redirected since 1 Sep)
  - [x] repoint the remaining `/talent/$id` links. Done 13 Sep (`d526f17`); the redirect is kept
        for old external links.
  - [x] `exactOptionalPropertyTypes` errors in `person-profile.tsx` (`tsc --noEmit` is clean)
  - [x] `/profile/$username` returns 404 for a username with neither a real row nor a seed, instead of
        Rahul Iyer's profile. The 11 people and businesses the app links to are seeded in the live DB
        (migration `20260913090949`), with their own content in `src/data/linked-profiles.ts`.
        `/profile/me` redirects to `/me`. (13 Sep)
  - [x] No profile borrows Rahul Iyer's sections. Seed profiles, `fromTalent()` and real profiles
        with no seed (`profileFromRow`, also used by `/me` when signed in) start from
        `emptySections()`, so a section the record lacks renders its empty state. The hero, share
        sheet and About tab handle a missing photo, cover, role, availability, bio, details and links,
        and the Verified tick shows only for verified tiers. (13 Sep)
- Home and theming (13 Sep)
  - [x] The Home headline showed a hard-coded 9 "new opportunities" linking to the swipe deck. It now
        counts the open opportunities (the same list as the tiles) and links to `/opportunities`.
  - [ ] Dark mode, deferred by the owner. `@custom-variant dark` is declared in `src/styles.css`, but
        no `.dark` palette exists, so the 10 `dark:` utilities never apply. Either build it or
        delete them.
  - [x] `20260913090949` recorded in `supabase_migrations.schema_migrations` (13 Sep).
  - [x] Owner decision (13 Sep): the 11 authored profiles in `src/data/linked-profiles.ts`, live in
        the database and published, stay unmarked as a deliberate pre-launch choice. They are invented
        people and businesses, indistinguishable from real profiles. The options not taken were to
        mark them visibly as samples, or to remove them (their 11 links would then 404). No further
        profile content is authored; missing data renders as empty states.
- FLOW 03 — Add Portfolio
  - [x] `src/data/portfolio.ts`, `src/components/ml/portfolio.tsx`
  - [x] portfolio routes (overview, add, work detail, edit, reorder, settings, select)

## Pending-screens plan (7 Sep) — audit 13 Sep
Full table: `docs/pending-screens-audit-2026-09-13.md`. **UI work below goes to Lovable, not Claude
Code.**
- [ ] **Wire in ~20 finished screens that no link reaches:**
  - business enquiry
  - services enquiry / manage / conflicts
  - band portfolio / events / contact
  - review reply / edit / report / request
  - discover music / projects / community / nearby
  - "why am I seeing this"
  - application detail / withdraw
- [ ] Partial — business services Edit/Pause do nothing; business gallery Edit/Hide/Add do nothing;
      business Follow does nothing, there is no Share, and `relatedBusinesses` is never rendered;
      Recently viewed is a static slice; no FAQ or announcements listing; no invoice receipt
      detail; no onboarding offline state
- [ ] Not done — archive a work · save-conflict screen · verification/services prompt at the end of
      onboarding
- [x] Splash/session check at `/` (13 Sep, `c17c96d`). It reuses the auth brand mark, and a designed splash is still Lovable's job.
- [ ] No screen has a real loading skeleton or offline banner; the kit has neither primitive

## FLOW 23 — QR / Digital Identity & Sharing (requested Sep 2, design-only)
- [x] `src/data/identity.ts` — canonical QR destination model (type/entityId/publicRoute/status), seeded demo destinations
- [x] `src/components/ml/qr.tsx` — QR matrix renderer, identity card, scan frame, destination preview, share sheet
- [x] Routes: digital ID entry, personal/business QR, fullscreen, share sheet, scanner + scanning,
      results (profile/business/service/marketplace/portfolio), invalid/expired/private/deleted/deactivated,
      customization, share card, digital business card, save contact, print preview, settings, analytics, scan history
- [x] Camera permission / denied / gallery-image scan fallbacks, loading / offline / network + share error states

## FLOWS 15 / 16 / 17 / 18 / 20 / 22 (requested Sep 2, design-only, one coherent app)
- [x] FLOW 15 Band — /bands, /bands/$id, /bands/new, /bands/$id/manage, /bands/$id/invite
- [x] FLOW 16 Verification — VERIFY-01..17: /verification (hub), /verification/choose, /verification/$type?step&mode (5-step wizard, status branches, resubmit/renew), /verification/badge, /verification/privacy. Verified end-to-end at 412px.
- [x] FLOW 17 Reviews — /reviews, /reviews/write/$id
- [x] FLOW 18 Subscription / monetisation — /plans, /plans/checkout, /plans/manage, /plans/earnings
- [x] FLOW 20 Recommendations — /recommendations, /recommendations/settings
- [x] FLOW 22 CMS / content pages — /help, /help/$slug, /help/category/$key

## Onboarding — the actual step sequence (written down 10 Sep, per Phase 9 §9.4)

**This section records what the flow IS, not what it should be. The ordering decision is
Vedanshu's; this is the input to it.** The phase spec (Phase 9) is authoritative for the entry
gate, the auth prerequisite and the splash decision — deliberately not restated here, because
this repo already has three documents disagreeing about tokens and does not need a fourth
disagreeing about routing.

**Route path:** `/onboarding` → `step/$id` × N → `preview` → `complete` → `done`.
`preview` is reached automatically from the last step (`step.$id.tsx:115`), and `complete`
carries `back="/onboarding/preview"`. `resume` and `skip` are peers, entered from inside a step.

**20 steps in 7 groups** (`src/data/onboarding.ts:512-800`). 4 required, 16 optional.
Order is array order; `visibleSteps()` filters, it never reorders.

| # | Step | Group | Req? | Notes |
|---|---|---|---|---|
| 1 | `identity` | Identity | **required** | name + username |
| 2 | `photo` | Identity | optional | |
| 3 | `role` | Profession | **required** | primary role |
| 4 | `secondary-roles` | Profession | optional | |
| 5 | `instruments` | Expertise | optional | **conditional** — only if a selected role has `r.instruments` |
| 6 | `specialisation` | Expertise | optional | **conditional** — only if `specialisationByRole[primaryRole]` exists |
| 7 | `genres` | Expertise | optional | |
| 8 | `languages` | Expertise | optional | |
| 9 | `location` | Context | **required** | |
| 10 | `work-mode` | Context | optional | |
| 11 | `availability` | Intent | optional | |
| 12 | `intent` | Intent | optional | |
| 13 | `experience` | Intent | optional | |
| 14 | `bio` | Profile | optional | |
| 15 | `links` | Profile | optional | |
| 16 | `contact` | Profile | optional | |
| 17 | `discovery` | Personalisation | optional | |
| 18 | `visibility` | Personalisation | **required** | |
| 19 | `business` | Personalisation | optional | |
| 20 | `band` | Personalisation | optional | |

### Mechanical faults found while writing this down — report only, do not fix

- [ ] **Skip stops working the moment the entry gate lands.** `skip.tsx` writes nothing, so
      `onboarding_complete` stays false — correct on its own. But it tells the user *"You can
      use MusicLinkd right away"* and exits to `/feed`, and under the Phase 9 branch table a
      false flag bounces them to `/onboarding/resume` — whose only two buttons are *Continue
      setup* and *Start over* (`resume.tsx:83-98`). **Neither exits to the app.** Exempting
      `/onboarding/*` from the gate does not help; `/feed` is the gated side. Resolving this is
      a product decision (grace state? a `skipped` flag distinct from incomplete? gate lets
      incomplete users through?) and is Vedanshu's call.
- [ ] **`skip.tsx:57` promises a surface that does not exist** — *"You'll find 'Complete your
      profile' in Settings."* Nothing anywhere in `src/` links into `/onboarding`. Recorded as
      false copy; not rewritten, per the standing no-copy-changes rule.
- [ ] **`onboarding_complete = true` is written in exactly one place**, `complete.tsx:51`. Any
      path that reaches the app without passing through `complete` leaves the user permanently
      incomplete.
- [ ] **`handoffs` is a dead `StepId`** (`onboarding.ts:498`) — in the union, no `StepDef`, no
      other reference in `src/`.
- [ ] **The rest of `dashboardData.user` is still fabricated.** The avatar and greeting name now
      resolve to the real viewer (`src/components/ml/viewer.tsx`, 10 Sep), but `user.available`
      (`feed.tsx:185`), `user.role` (`feed.tsx:188`) and `data.user.profileCompletion`
      (`feed.tsx:311,316`) still read hardcoded values from `dashboard.ts:55-61` — every user is
      "Music Producer · Mix Engineer", open to collaborations, 72% complete. Wiring these needs
      real dashboard data, not a bug fix; left for the backend/route-sweep work.
- [ ] **`preview` is a peer route, not a step** — no `StepDef`, no entry in `steps`, so it is
      invisible to `visibleSteps()`, `stepIndex()` and `completionPercent()`. It is nonetheless
      in the linear path. Whether it becomes a step is Vedanshu's call.

## Notes
- Payments: seller is in India, so Lovable's built-in Stripe/Paddle are unavailable.
  Razorpay recommended (UPI, cards, INR) — awaiting user's decision before wiring.
- `/onboarding/complete` and `/onboarding/done` are **sequential, not duplicates** — do not
  delete either. Full detail in Phase 9 §9.4.
- [x] Navy migrated to `ink` `#0D0D0D` on 13 Sep (`81c8953`). No `navy` remains in `src/`.
- [x] **Phase 8 prerequisites, settled 13 Sep:**
  - **Radius:** the Material 3 shape scale, with cards at 16px (`90a4676`).
  - **Navy:** migrated to ink.
  - **Photos:** there is no "never Unsplash" rule, and it has been removed from `AGENTS.md` and
    the Lovable knowledge. The team library at `frontend/website/assets/img/` (guide repo) is
    available. The Unsplash connector needs its account email confirmed before it can be used.
  - **Still open for Phase 8 itself:** the 204-route sweep of arbitrary `text-[…]` sizes, the
    inline `style`, and the `src/data` split.
- [x] Route naming settled 13 Sep (`e2471e7`):
  - `/band` redirects to `/bands`.
  - The swipe deck lives at `/recommendations/swipe`, and `/recommended` redirects there.
- [x] One spacing system (numeric only) and one secondary-text class (`text-muted-foreground`)
  (`d526f17`).
- [ ] The guide repo's `tokens.json` radius is still `8/16/32/pill`. The app now uses the Material 3
  scale, so `foundation.radius` should adopt it upstream to keep the two in sync.
- [ ] `--color-paper` in `tokens.json` is internally inconsistent three ways. Its description says
  the value was changed to `#ECECF1` because `#FCFCFD` sat 1.03:1 from the card fill and made every
  card an invisible container — but its own `$value` and the generated `ml-tokens.css` both still
  say `#FCFCFD`. The same description claims `#ECECF1` is "the SAME value as `--color-line`";
  `line` is `#D5D5DE`, a different grey (1.238:1 apart). The app now uses `#ECECF1` as the ground
  on the brand owner's instruction; `tokens.json` should be corrected upstream to match.
- [x] `--muted-foreground` on the `#ECECF1` ground: fixed by PR #15, which adopted `tokens.json`
  `muted` `#66666F`. It measures **4.83:1** on the ground and 5.68:1 on the white card, so both
  clear AA. `--text-secondary` is now an alias of it.
- [x] The Lovable **project knowledge** now matches the code (replaced 13 Sep). Changes:
  - five type ramps including `--type-5`
  - loaded weights 400–700
  - no heading letter-spacing, which was removed from the code in `1831fd6`
  - app ground `#ECECF1`
  - 46 primitives
  - `profiles` RLS gated by visibility
  - `viewport-fit=cover`
  - the new rule that parent routes need `<Outlet />` or an index leaf
  - a CI note

  The previous text is kept in the 13 Sep handoff.
- [ ] The Lovable **project description** field still holds the original superseded brief verbatim
  — `Primary: #5B4BFF`, `Secondary: #8B5CF6`, `Radius: 16px`, `Google Sans Roboto`,
  `Material Design 3`. It is the same corrupted text that was in `README.md` (same missing "D" in
  "esign a premium Android…"), so the README was pasted from it. Phase 1 fixed the repo copy;
  this one is project metadata and out of the repo's reach.
- [ ] `js-yaml` 4.3.0 carries two high-severity advisories (GHSA-5p4m-2wfm-xmqj,
  GHSA-2883-xcg3-v3hh — CPU exhaustion, not RCE). Lovable's scan attributes them to
  `@tanstack/react-start`, which has no direct js-yaml dependency; the real chains are
  `@eslint/eslintrc` (lint-time) and
  `react-start → start-plugin-core → xmlbuilder2@^4.0.3 → js-yaml@^4.1.1` (build-time). **Neither
  is in the request path.** The fix is js-yaml 5.x (latest 5.4.1); the advisory says it was not
  backported to 4.x, and xmlbuilder2 pins `^4.1.1`, so forcing it needs an override that risks the
  build. Deferred deliberately — revisit when xmlbuilder2 accepts js-yaml 5.
- [x] Accessibility linting: `eslint-plugin-jsx-a11y` is registered in `eslint.config.js`, and CI
  now runs it on every push. Contrast and the 48dp touch floor are still not machine-checked.

## Verify / follow-up (requested Sep 2)
- Person Profile: confirm `/profile/$username`, `/me` owner mode, `/profile/edit`,
  `/profile/insights`, `/talent/$id` redirect and Discover/Search link mapping all render
- 412px Android render pass: dashboard, onboarding, profile, portfolio (clipping, bottom-nav overlap)

## Dashboard IA refactor + Booking gaps (Sep 2)
- [x] `/feed` rebuilt as orchestrator: greeting → single headline update → Continue (next booking) →
      For you tiles + matches → activity list → demoted manage/quick actions
- [x] `src/data/dashboard.ts` selectors pull the next session from the Booking data
- [x] Provider: `/provider/bookings/requests`, `/provider/bookings/calendar`, `/provider/pricing`, `/provider/policies`

- [x] FLOW 01 Authentication — AUTH-01..22: /welcome, /auth?mode, /auth/phone, /auth/otp, /auth/verify-email, /auth/forgot, /reset-password, /auth/success, /auth/signout, /auth/locked, /auth/offline, /auth/maintenance, /legal/terms, /legal/privacy, /settings/delete-account. Real email + Google auth; phone is preview-only. Verified at 412px.

- [x] FLOW 05 Opportunities — /opportunities (home, categories, tabs), /opportunities/search (filters, sort, empty), /opportunities/$id (brief, requirements, fit, report, share), /opportunities/$id/apply (portfolio → pitch → review → sent), /opportunities/applications (+ detail, withdraw), /opportunities/saved, /opportunities/mine, /opportunities/new (6-step wizard → published), /opportunities/$id/applicants (+ applicant detail, shortlist, decline, hire hand-off), /opportunities/$id/manage (pause/close), /opportunities/$id/analytics. Home links added.

## Next flows
- [x] FLOW 11 Services & Availability — /services, /services/$id, /services/new (5-step), /services/availability
- [x] FLOW 12 Business Profiles — /business, /business/$id, /business/new (6-step), /business/$id/manage, /business/$id/team
- [x] FLOW 13 Notifications — /notifications, /notifications/settings
- [x] FLOW 21 Settings & Support — /settings, /settings/account, /settings/privacy, /settings/security
