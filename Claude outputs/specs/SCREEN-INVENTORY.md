# Screen inventory

**Generated from live code, 28 Sep 2026.** 153 route files, plus 2 system screens with no route file.

**One screen serving both personas is listed once**, with a Serves column — not twice. 96 of 154 serve both; 16 are business-only, and every one of those is business-only because its table is, not by product decision.
Regenerate rather than hand-edit — the 25 Sep pass drifted within three days.

## Decisions settled this session

Recorded here because they were agreed in conversation and belong in the file, not the chat.

### The fork

The talent/business fork happens **once, at onboarding**, and is then locked. It is not a dimension
re-decided on every screen.

```
person type ──┬── talent   ──► the screens, subject = my profile
              └── business ──► the same screens, subject = my business page
```

The specific type — singer, guitarist, studio, label — is **data on the profile**, never a branch in
the code and never a screen of its own.

### Three classes of screen

| Class | Fork applies? | Content decided by |
|---|---|---|
| **System** | No — type unknown or irrelevant | Nothing about the person |
| **Published** | No — viewer-agnostic | The **subject** being viewed |
| **Owner** | **Yes** | The **session's** locked type |

Onboarding is in none of them: it is where the fork is made. A Published screen never needs a cohort
gate, because the subject is in the URL.

### Naming

**Done 28 Sep:** `person-profile.tsx` → `talent-profile.tsx`, `use-my-identity` →
`use-my-talent-identity`, `useMyIdentity` → `useMyTalentIdentity`, `PersonProfile` →
`TalentProfile`, `PersonProfileExperience` → `TalentProfileExperience`. The talent side is now named
rather than being whatever is left over.

- A screen, route, table, column or function is **never named after one type**. `studio` is a
  business type exactly as `singer` is a talent type; the generic is **talent** / **business**.
- Where something exists for both cohorts, **both** names are qualified — `talent-profile` and
  `business-profile`. The bare word is the parent that serves both.
- A persona type is a **filter**, not a screen. `/categories` and the bespoke `/studio` list are gone;
  the type buttons on `/discover` and the shareable `/discover/$slug` replace them.

### One screen, subject as a parameter

`/profile` is the reference implementation: one route that resolves the fork from the session.
`/identity/qr` + `/identity/business` are the deviation — two hand-written files for one screen, and
they have **already drifted** (the QR screen had extras the business one never got).

The fix is the pattern the Market already uses — `?view=Rent`, not `/marketplace-rent`:

```
/identity/qr              subject from session (default)
/identity/qr?as=business  the business subject, addressable
```

Not `-business` as a suffix: that would be a third naming style alongside `/business/$id` (segment)
and `?view=` (param), and it names a screen after a cohort.

**Status: done, 28 Sep.** `useQrSubject(as)` (`src/hooks/use-qr-subject.ts`) normalises the two
identity hooks — they returned the same facts under different names (`role`/`category`,
`photo`/`logo`) — so one screen serves both. `/identity/business` is now a redirect, the style
control hides for a subject with no style of its own, and the empty state and its CTA follow the
subject ("Claim your username first / Set Username" vs "No business on this account / Switch
Account"). `ActionRow` gained a `search` prop rather than growing a second styled copy.

### Three gate patterns in the business area — still inconsistent

**Resolved 28 Sep — two patterns, and the second is correct.**

| Pattern | Routes | A talent account sees |
|---|---|---|
| `BusinessOnlyGate` + `useRequireBusiness` | `bookings/*`, `availability`, `policies`, `pricing`, **`leads`** (9) | Hard gate |
| No route gate; data scoped server-side | the 12 `business/$id/*` | Full shell, no data |

`business/leads` rolled its own empty state; it now uses the shared gate, so the same idea is
expressed one way. The `$id` screens keep no route gate on purpose — the subject is in the URL, and
the data is scoped server-side.

The `$id` screens are **not** an authorization hole: `listMyLeads` filters on `context.userId` and
ignores the URL's `$id`, and the queries are `enabled: owner`. A non-owner gets an owner-shaped
screen with nothing in it — a UX defect.

### Why the 8 gated screens cannot have a talent variant yet

`booking_requests` has **no `provider_profile_id`** — a booking can only point at `studio_id` /
`room_id`. So no row in that table could ever belong to a talent account, and
`listStudioBookings` filters `studios.owner_profile_id = me`. `profile_services` exists for both
cohorts but **nothing books it**.

The gate is the schema showing through, not a UI opinion. Removing it would render a permanently
empty provider workspace. Two ways out, both DB writes and both unstarted:

1. Add `provider_profile_id` to `booking_requests`, nullable alongside `studio_id` — smallest change.
2. Make `profile_services` bookable with its own bookings table — cleaner, bigger, two booking paths.

### The `studio` naming leak — measured, unstarted

298 occurrences across 88 files, and it is in the schema:

| Kind | Name | Refs |
|---|---|---|
| Table | `studios` | 196 |
| Column | `booking_requests.studio_id` | 57 |
| Column | `booking_requests.studio_name` | 19 |
| Table | `studio_rooms` | 15 |
| Server fn | `listStudioBookings` | 11 |

Also `kind: isBusiness ? "studio" : "person"` in `public-profile.tsx`, and `"person" | "studio"` in
`recently-viewed.functions.ts` and `device-history.ts`. **Blocked:** `recently_viewed.kind` is part
of that table's primary key and stores those literal strings, so renaming is a migration.

### Deep audit — 28 Sep, after deploy

Ran structurally (same imports + server functions + size band) and by repeated path segment.

**Fixed now:**

| Was | Now |
|---|---|
| `legal.terms` · `legal.privacy` · `legal.cookies` — three 15-line files differing only in a CMS key and a title | **`legal.$slug`** — one screen, three slugs. The settings-row type gained `params` so a `$slug` route can sit in a settings list |

**Merged 28 Sep:** `marketplace/rent/provider.$id` → `marketplace/seller.$id`.

A seller and a rental provider are the same party in one marketplace. Both screens already called
the **same** `getSellerListings`, `listReviewsFor` and `getTaxonomyLabels`; only the header loader
differed (`getRentalProvider` vs the seller's). The report/block action with `RentalReportSheet` —
the one thing provider had that seller lacked — moved across. Provider's
`category === "gear_rental"` filter is deliberately dropped: a person's listings show whether they
sell or rent them out.

**Create is not edit — `/business/policies` stays.** `business.new` calls only `createMyBusiness`
and never loads an existing business, so it is create-only. `/business/policies` is the *edit* path
for the same field. Deleting it would make editing a cancellation policy restart business creation.
Folding it in needs `business.new` to load and update an existing business first — a change to that
flow, not a deletion. Same shape as `/marketplace/mine` (seller) vs `/marketplace/rent/mine`
(renter): opposite jobs wearing one word.

**Looks like a duplicate but is not** — recorded so it is not "fixed" by mistake:

| Pair | Why they differ |
|---|---|
| `/marketplace/mine` ↔ `/marketplace/rent/mine` | Opposite roles. `mine` is the **seller's** one place (listings + incoming rental requests, no tabs — owner, 22 Sep). `rent/mine` is the **renter's** bookings, tabbed Upcoming/Active/Completed/Cancelled. Same relationship as `/bookings` (customer) ↔ `/business/bookings` (provider). |
| `/business/$id/leads` ↔ `/business/leads` | The second is a gated shortcut that resolves "my business" and redirects into the first. |
| `/business/$id/availability` | Already a redirect to `/business/availability`. |

**Already folded:** 8 of the 12 `marketplace/rent/*` files are redirects into Market — `c/$slug`,
`e/$id`, `index`, `list`, `listings`, `nearby`, `saved`, `search`. Only 4 are real screens:
`active.$id`, `mine`, `provider.$id`, `request.$id`.

**Repeated last segments** are mostly legitimate — `new`, `edit`, `manage`, `search`, `mine` recur
because they are verbs on different objects. The two worth watching:

- `enquiry` — `/business/$id/enquiry` and `/services/$id/enquiry` both call `sendEnquiry`
- `analytics` — `/opportunities/$id/analytics` and `/portfolio/analytics`


### Data sync — onboarding ↔ profile ↔ edit, both cohorts (28 Sep)

What the app counts as a complete profile (`profileGaps`, `src/lib/profile-map.ts`) — **10 fields,
identical for both cohorts**:

> Display name · Username · Profile photo · Primary role · City · Professional bio · Genres ·
> Languages · Availability · Links

Against what each onboarding flow actually asks:

| Field | Talent onboarding (`/onboarding/step/$id`) | Business onboarding (`/business/new`) | Edit (`/profile/edit`) |
|---|---|---|---|
| Display name | ✓ identity | ✓ name | ✓ first + last |
| Username | ✓ identity | ✓ | ✓ |
| Profile photo | ✓ identity | **✗** | ✓ |
| Primary role / type | ✓ role | ✓ type | ✓ Type |
| City | ✓ identity ("where you're based") | ✓ city + state + PIN | ✓ State, PIN |
| Bio | ✓ identity ("a short bio") | **✗** — tagline only | ✓ Bio, Headline |
| Genres | ✓ | ✓ | ✓ |
| Languages | ✓ | ✓ | ✓ |
| Availability | **✗** | **✗** | ✓ — and now a toggle on `/home` |
| Links | ✓ contact | **✗** | ✓ |
| Instruments | ✓ (skipped when the role has none) | — | ✓ |
| Work modes · Intent | ✓ | **✗** | ✓ Work modes |
| Policies | — | ✓ | ✓ *(moved into the form 28 Sep)* |
| Maps link | — | ✓ | ✓ |
| Experience | ✗ | ✗ | ✓ |

**Out of sync, in order of consequence:**

1. **A business is scored against fields its own onboarding never asks for.** Photo, bio and links
   are in `profileGaps` and in the edit form, but `/business/new` collects none of them — so a
   business finishes setup and is immediately told its profile is incomplete.
2. **Availability is required of both and asked of neither.** It is now a toggle on `/home`, which
   is the fix, but no flow prompts for it.
3. **Experience** exists only in the edit form — not collected, not scored.
4. **Tagline vs bio.** Business onboarding writes a tagline; `profileGaps` wants a bio over 40
   characters. Different fields, so a tagline does not satisfy it.

The edit form is the superset and is already correct for both cohorts: shared fields for everyone,
plus Google Maps link and Policies shown only when `useRequireBusiness` says the account is a
business. It **gates fields, not the screen** — which is why `/profile/edit` serves Both.


### Business onboarding owns these — 28 Sep

`/business/new` is the business onboarding flow, and its step list already contains **`policies`**,
with its own state and save. So `/business/policies` is a second place to edit the same thing
(owner: "part of business onboarding"). Same for the create flow itself — `/business/new` belongs
inside onboarding rather than standing alone.

Not done: `/business/new` is a 600-line creation flow, and folding it into the onboarding step
machine means that machine gains a business branch. Deleting `/business/policies` first needs a
check that `business.new` can be re-entered to *edit* an existing business, not only create one —
otherwise editing a policy would restart creation.

Already correct, and needed no work: verification is **not** part of `/profile/edit`, and account
deactivation already lives in `settings/delete-account`. Both were properties of the deleted
`/business/$id/manage` menu.

### Availability is a toggle, not a screen — done 28 Sep

`/home` carries it in the ink stage for both cohorts: "Not taking work" ⇄ "Taking work", writing
`profiles.availability`. Verified to persist across a reload. This is what `/services/availability`
was standing in for before it was deleted.


### Availability — 28 Sep

`/services/availability` is deleted. It was an 80-line **read-only mirror** of one profile field
whose only action was "Edit availability on your profile" — a detour to `/profile/edit`. Its three
entry points now go straight there with `?section=availability`.

`/business/availability` is **kept**, and is not the same thing. It is a 563-line editor for weekly
opening hours, booking rules and closed dates (`updateMyWeeklyHours`, `updateMyBookingRules`) —
not a status toggle. Availability-as-a-toggle and availability-as-opening-hours share a word and
nothing else; the toggle has no screen, the hours editor needs one until those tables change.


### Bookmarks consolidated — 28 Sep

`/marketplace/saved` and `/opportunities/saved` are deleted. **`/saved` (Bookmarked) is the one
screen**, with tabs Talent · Bands · Studios · Businesses · Listings · Works · **Opportunities**.

`/marketplace/saved` read the same `saved_items` table as `/saved` — a straight duplicate.
`/opportunities/saved` read **localStorage** via `useSavedOpportunities`, so the Opportunities tab
reads that source: one screen, two stores, no DB change. `/marketplace/rent/saved` now redirects to
`/saved` too.


### Business routes — audited 28 Sep

Seven duplicates deleted. The talent screen now serves both subjects: **`/portfolio` · `/services` ·
`/reviews` · `/verification` · `/home`**.

| Deleted | Replaced by |
|---|---|
| `business.$id.portfolio` | `/portfolio` |
| `business.$id.services` | `/services` |
| `business.$id.reviews` | `/reviews` — reviews is a shared module |
| `business.$id.verification` | `/verification` |
| `business.$id.dashboard` | `/home` |
| `business.$id.analytics` | nothing — it was a single `EmptyState`, no data |
| `business.$id.team` | nothing |

**16 business routes remain.** Each one, and why it is still there:

| Route | State |
|---|---|
| `/business/$id` | **already shared** — 18-line shell on `PublicProfileScreen`, same as `/profile/$username` |
| `/business/$id/availability` | **already a redirect** to `/business/availability` |
| `/business/$id/manage` | **duplicate of `/profile/edit`** — the last one. A menu, not a form |
| `/business/$id/enquiry` | **duplicate of `/services/$id/enquiry`** — both call `sendEnquiry` |
| `/business/$id/leads` | business-only — reads `enquiries` |
| `/business/leads` | gated shortcut into the above |
| `/business` · `/business/new` | directory and create |
| `/business/availability` · `policies` · `pricing` | business-only — write to `studios` / `profile_business` |
| `/business/bookings/*` (5) | provider workspace — `booking_requests` |

### Correction — availability is not shared

An earlier version of the function map listed availability as shared between cohorts. It is not:
`updateMyWeeklyHours` writes to **`studios`** and **`profile_business`**, so it is business-scoped.
`/services/availability` (talent) is an 80-line read-only summary that links to `/profile/edit`;
`/business/availability` is the real editor. Same word, two different things.

### Correction — `booking_requests` points at a business

The blocker was previously written as "business-only, transitively, via `studios`". That framing was
wrong: **a studio is a type of business**, so `booking_requests` points at a *business*. The fix is
renaming the `studios` table to the business it actually models, not bolting a `provider_profile_id`
alongside it.

### URL structure

```
MINE — one screen, subject from the session, no cohort in the URL
  /profile · /portfolio · /services · /reviews · /verification · /home

THEIRS — subject in the path, viewer-agnostic
  /profile/$username · /@handle · /business/$id · /discover/$slug

BUSINESS-ONLY — capabilities whose tables are business-shaped
  /business/$id/{manage,leads,enquiry} · /business/{availability,policies,pricing,leads,new}
  /business/bookings/*
```

`/profile` carries **no `-t` / `-b` marker**. The session decides the subject, and as of 28 Sep it
renders the business subject in place rather than redirecting to a second screen.


### Subject pairs — one screen or two?

Same job, different subject. Three pairs, three states.

| Pair | State |
|---|---|
| `/profile/$username` ↔ `/business/$id` | **Already one screen.** Both are 18-line shells rendering `PublicProfileScreen` with the same loader and head. |
| `/identity/qr` ↔ `/identity/business` | **Collapsed 28 Sep.** One screen, `?as=business`. |
| `/portfolio` ↔ `/business/$id/portfolio` | **Deduplicated 28 Sep** — the business copy is deleted; `/portfolio` serves both. |
| `/profile/edit` ↔ `/business/$id/manage` | **Open — the last duplicate.** A sectioned form vs a menu of links. |
| `/home` ↔ `/business/$id/dashboard` | **Deduplicated 28 Sep** — dashboard deleted; `/home` serves both. |

**The edit pair is the real gap.** `/profile/edit` (960 lines) is one sectioned form with `?section=`
opening a section in place. `/business/$id/manage` (229 lines) is a **menu of links** — Dashboard,
Details, Amenities, Availability — that navigates away to separate screens. Same job, two shapes:
talent edits in place, business hops between screens. Making `manage` the same sectioned form with
`?section=` would match the pattern the rest of the app now uses.


### Talent ↔ business function map

242 server functions (4 Oct 2026; 238 when this was written). Mapped by capability, the asymmetry is visible: where the two cohorts share a
function it is because the table is profile-shaped; where business has one and talent has none it is
because the table is studio-shaped.

| Capability | Talent | Business | Shape |
|---|---|---|---|
| Profile / page | `getMyProfile` | `getMyBusiness` | separate |
| Public view | `getPublicProfile` | `getPublicBusiness` | separate |
| Save | `saveMyProfile` | `updateMyBusiness` | separate |
| Create | — | `createMyBusiness` | **business only** |
| Directory | `listPeopleByRole` | `listPublicBusinesses` | separate |
| **Services** | `listMyServices` | `listMyServices` | **shared** |
| **Portfolio** | `listMyPortfolio` | `listMyPortfolio` | **shared** |
| **Gallery** | `listMyGallery` | `listMyGallery` | **shared** |
| **Bookings (customer)** | `listMyBookings` | `listMyBookings` | **shared** |
| Bookings (provider) | — | `listStudioBookings` | **business only** |
| Leads / enquiries | — | `listMyLeads` | **business only** |
| Availability | `getMyProfile` (read-only summary) | `updateMyWeeklyHours` | **business only** — writes `studios` + `profile_business` |
| Booking rules | — | `updateMyBookingRules` | **business only** |
| Equipment | — | `saveMyStudioEquipment` | **business only** |
| Identity hook | `useMyTalentIdentity` | `useMyBusinessIdentity` | separate |
| Gate hook | — | `useRequireBusiness` | **business only** |
| Profile component | `talent-profile.tsx` | `business-profile.tsx` | separate |

**Five capabilities are already shared** — services, portfolio, gallery, customer bookings and
availability all run one function for both cohorts, because they hang off `profiles`. Any screen
built on those needs no cohort branch at all.

**Six are business-only, and every one traces to the `studios` table**, not to a product decision.
`listStudioBookings` filters `studios.owner_profile_id`; `listMyLeads` reads `enquiries`; equipment
and booking rules hang off `studios`. Those become shared the moment `booking_requests` gains a
`provider_profile_id`.

**19 server functions carry `studio` in their name** — `addMyStudioBlock`, `getMyStudio`,
`getStudioCalendar`, `listStudioBookings`, `updateStudioRoomRate` and the rest. Each is named after
one business type rather than after the capability.

**Done 28 Sep:** `/business/$id/portfolio` now renders the shared `WorkCard` instead of a second
hand-written card. Both portfolios were already reading the same table through the same function —
the difference was labels ("Credits" vs work list) and duplicated markup, not data.


## Changed 28 Sep — deleted

`/categories`, `/categories/$slug` (→ `/discover/$slug`) · `/discover/community` ·
`/discover/nearby` · `/recently-viewed` · `/recommendations/swipe` · `/recommendations/settings` ·
`/recommended` · `/feed` · `/band` · `/identity/history` · `/identity/analytics` ·
`/identity/print` · `/identity/settings` · `/portfolio/new` · `/profile/insights`

Every inbound link was rewired, not left dangling.

## Changed 28 Sep — behaviour

- **Discover** has persona-type filter buttons (All + 11 types); `/discover/$slug` is the shareable URL
- **`+ new` is a drawer, never a screen** — `WorkTypeSheet` for work, the new `CollabKindSheet` for
  collabs. `/portfolio?add=1` opens the work drawer; the collab drawer opens `/collab/new?type=…`,
  and the wizard's "Kind" step is gone
- **Saved → Bookmarked** everywhere: screen titles, meta titles, the Market chip, the Opportunities
  row, and the save-button aria-labels. The Events tab is gone from Bookmarked
- `/studio` and `/singers` are redirect-only to `/discover`
- Talent, Events and Communities chips removed from Discover

## System screens (no route file)

| Screen | Where |
|---|---|
| 404 — Page not found | `notFoundComponent`, `__root.tsx` |
| This page didn't load | `errorComponent`, `__root.tsx` |

Both are raw markup rather than the `ml/*` kit — the only screens that do not compose from it.

## Still open

- `booking_requests.provider_profile_id` — the blocker for talent provider screens
- The `studio` → `business` rename (blocked on `recently_viewed.kind` being in a primary key)
- `/auth/verify-email` says "Enter your email code" — the sign-in model has no email codes
- `/booking/$id/service` says "Choose a room or service" — the booking model has no rooms in the UI

---

## Route map — 146 files, grouped by module

**One file serving both personas is listed once.** *Serves* says who it is for; *How one file serves
both* says what differentiates the subject inside that file; *UI* opens it on the local dev server.

A screen counts as **Business** only when it actually **gates** (`<BusinessOnlyGate>`). Using
`useRequireBusiness` to *detect* the cohort and show an extra field does not make a screen
business-only — `/profile/edit` does exactly that for the Google Maps link, and serves both.

| Serves | Count |
|---|---|
| **Both** | 102 |
| → redirect | 19 |
| System | 15 |
| Business | 10 |

The 10 gated screens: `/business/availability` · `/business/policies` · `/business/pricing` ·
`/business/bookings` (+4 children) · `/leads` · `/services/conflicts`. Every one is gated because its
**table** is business-shaped, not by product decision.

### Entry & auth (15)

| Route | Screen | Serves | How one file serves both | UI |
|---|---|---|---|---|
| `/` | MusicLinkd | System |  | [open](http://localhost:8080) |
| `/accounts` | On this device | **Both** | same rows, both cohorts | [open](http://localhost:8080/accounts) |
| `/auth` | Sign in with email | System |  | [open](http://localhost:8080/auth) |
| `/auth/forgot` | Reset your password | System |  | [open](http://localhost:8080/auth/forgot) |
| `/auth/locked` | Account temporarily locked | System |  | [open](http://localhost:8080/auth/locked) |
| `/auth/maintenance` | Scheduled maintenance | System |  | [open](http://localhost:8080/auth/maintenance) |
| `/auth/offline` | You're offline | System |  | [open](http://localhost:8080/auth/offline) |
| `/auth/otp` | Enter your code | System |  | [open](http://localhost:8080/auth/otp) |
| `/auth/phone` | Sign in | System |  | [open](http://localhost:8080/auth/phone) |
| `/auth/signout` | Sign out | System |  | [open](http://localhost:8080/auth/signout) |
| `/auth/success` | — | → redirect |  | [open](http://localhost:8080/auth/success) |
| `/auth/verify-email` | Enter your email code | System |  | [open](http://localhost:8080/auth/verify-email) |
| `/dev/new-user` | Test as a new user | **Both** | same rows, both cohorts | [open](http://localhost:8080/dev/new-user) |
| `/reset-password` | Set a new password | System |  | [open](http://localhost:8080/reset-password) |
| `/welcome` | Welcome to MusicLinkd | System |  | [open](http://localhost:8080/welcome) |

### Onboarding (7)

| Route | Screen | Serves | How one file serves both | UI |
|---|---|---|---|---|
| `/onboarding` | Set up your MusicLinkd profile | **Both** | same rows, both cohorts | [open](http://localhost:8080/onboarding) |
| `/onboarding/complete` | Profile published | **Both** | same rows, both cohorts | [open](http://localhost:8080/onboarding/complete) |
| `/onboarding/done` | Welcome to MusicLinkd | **Both** | same rows, both cohorts | [open](http://localhost:8080/onboarding/done) |
| `/onboarding/preview` | This is how other music professionals see you | **Both** | same rows, both cohorts | [open](http://localhost:8080/onboarding/preview) |
| `/onboarding/resume` | Pick up where you left off | **Both** | same rows, both cohorts | [open](http://localhost:8080/onboarding/resume) |
| `/onboarding/skip` | Finish your profile later | **Both** | same rows, both cohorts | [open](http://localhost:8080/onboarding/skip) |
| `/onboarding/step/$id` | Build your profile | **Both** | subject in path | — |

### Discover (6)

| Route | Screen | Serves | How one file serves both | UI |
|---|---|---|---|---|
| `/discover` | Discover Talent | **Both** | same rows, both cohorts | [open](http://localhost:8080/discover) |
| `/discover/$slug` | New work from the community | **Both** | subject in path | — |
| `/search` | Search Results | **Both** | same rows, both cohorts | [open](http://localhost:8080/search) |
| `/search/why/$id` | Why am I seeing this | **Both** | subject in path | — |
| `/singers` | — | → redirect |  | [open](http://localhost:8080/singers) |
| `/studio` | — | → redirect |  | [open](http://localhost:8080/studio) |

### Profile (8)

| Route | Screen | Serves | How one file serves both | UI |
|---|---|---|---|---|
| `/$handle` | — | **Both** | subject from session / URL | — |
| `/home` | Your Dashboard | **Both** | same rows, both cohorts | [open](http://localhost:8080/home) |
| `/me` | — | → redirect |  | [open](http://localhost:8080/me) |
| `/profile` | My Professional Profile | **Both** | subject from session / URL | [open](http://localhost:8080/profile) |
| `/profile/$username` | — | **Both** | subject from session / URL | — |
| `/profile/edit` | Edit profile | **Both** | cohort-aware fields | [open](http://localhost:8080/profile/edit) |
| `/saved` | Bookmarked | **Both** | same rows, both cohorts | [open](http://localhost:8080/saved) |
| `/talent/$id` | — | → redirect | subject in path | — |

### Portfolio (5)

| Route | Screen | Serves | How one file serves both | UI |
|---|---|---|---|---|
| `/portfolio` | Show the work you're proud of | **Both** | same rows, both cohorts | [open](http://localhost:8080/portfolio) |
| `/portfolio/$id` | Work detail | **Both** | subject in path | — |
| `/portfolio/$id/edit` | Edit work | **Both** | subject in path | — |
| `/portfolio/analytics` | Last 30 days | **Both** | same rows, both cohorts | [open](http://localhost:8080/portfolio/analytics) |
| `/portfolio/new/$kind` | Step 1 of 2 · Details | **Both** | subject in path | — |

### Services & booking (15)

| Route | Screen | Serves | How one file serves both | UI |
|---|---|---|---|---|
| `/booking/$id` | Book a studio session | **Both** | subject in path | — |
| `/booking/$id` | — | **Both** | subject in path | — |
| `/booking/$id/addons` | Optional | **Both** | subject in path | — |
| `/booking/$id/details` | Session details | **Both** | subject in path | — |
| `/booking/$id/review` | Review booking | **Both** | subject in path | — |
| `/booking/$id/schedule` | Availability | **Both** | subject in path | — |
| `/booking/$id/service` | What do you want to book? | **Both** | subject in path | — |
| `/booking/confirmed/$ref` | Booking request sent | **Both** | subject in path | — |
| `/bookings` | Studios, rooms and sessions | **Both** | same rows, both cohorts | [open](http://localhost:8080/bookings) |
| `/services` | What people can book you for | **Both** | same rows, both cohorts | [open](http://localhost:8080/services) |
| `/services/$id` | Service | **Both** | subject in path | — |
| `/services/$id/enquiry` | Enquiry | **Both** | subject in path | — |
| `/services/$id/manage` | Manage | **Both** | subject in path | — |
| `/services/conflicts` | Overlaps across your services | Business |  | [open](http://localhost:8080/services/conflicts) |
| `/services/new` | Edit service | **Both** | same rows, both cohorts | [open](http://localhost:8080/services/new) |

### Business (12)

| Route | Screen | Serves | How one file serves both | UI |
|---|---|---|---|---|
| `/business/$id/availability` | — | → redirect | subject in path | — |
| `/business/$id/enquiry` | Enquiry | **Both** | subject in path | — |
| `/business/availability` | Availability | Business |  | [open](http://localhost:8080/business/availability) |
| `/business/bookings` | Requests and sessions for the spaces you run | Business |  | [open](http://localhost:8080/business/bookings) |
| `/business/bookings/$ref` | Session | Business | subject in path | — |
| `/business/bookings/calendar` | Your studio | Business |  | [open](http://localhost:8080/business/bookings/calendar) |
| `/business/bookings/requests` | Requests | Business |  | [open](http://localhost:8080/business/bookings/requests) |
| `/business/bookings/requests/$ref` | Request | Business | subject in path | — |
| `/business/new` | Create a business | **Both** | same rows, both cohorts | [open](http://localhost:8080/business/new) |
| `/business/policies` | Your space | Business |  | [open](http://localhost:8080/business/policies) |
| `/business/pricing` | Pricing | Business |  | [open](http://localhost:8080/business/pricing) |
| `/leads` | Leads | Business |  | [open](http://localhost:8080/leads) |

### Opportunities (12)

| Route | Screen | Serves | How one file serves both | UI |
|---|---|---|---|---|
| `/opportunities` | Who needs what, right now | **Both** | same rows, both cohorts | [open](http://localhost:8080/opportunities) |
| `/opportunities/$id` | Opportunity | **Both** | subject in path | — |
| `/opportunities/$id/analytics` | Performance | **Both** | subject in path | — |
| `/opportunities/$id/applicants` | Applicants | **Both** | subject in path | — |
| `/opportunities/$id/applicants/$aid` | Applicant | **Both** | subject in path | — |
| `/opportunities/$id/apply` | Apply | **Both** | subject in path | — |
| `/opportunities/$id/manage` | Manage | **Both** | subject in path | — |
| `/opportunities/applications` | Applications never expire silently | **Both** | same rows, both cohorts | [open](http://localhost:8080/opportunities/applications) |
| `/opportunities/applications/$aid` | Your application | **Both** | subject in path | — |
| `/opportunities/mine` | Posted by you | **Both** | same rows, both cohorts | [open](http://localhost:8080/opportunities/mine) |
| `/opportunities/new` | Published | **Both** | same rows, both cohorts | [open](http://localhost:8080/opportunities/new) |
| `/opportunities/search` | Search opportunities | **Both** | same rows, both cohorts | [open](http://localhost:8080/opportunities/search) |

### Collabs & bands (12)

| Route | Screen | Serves | How one file serves both | UI |
|---|---|---|---|---|
| `/bands` | Groups, line-ups and open seats | **Both** | same rows, both cohorts | [open](http://localhost:8080/bands) |
| `/bands/$id` | Band | **Both** | subject in path | — |
| `/bands/$id/contact` | Contact | **Both** | subject in path | — |
| `/bands/$id/events` | Shows | **Both** | subject in path | — |
| `/bands/$id/invite` | Invite members | **Both** | subject in path | — |
| `/bands/$id/manage` | Manage band | **Both** | subject in path | — |
| `/bands/$id/portfolio` | Portfolio | → redirect | subject in path | — |
| `/bands/new` | Create a band | **Both** | same rows, both cohorts | [open](http://localhost:8080/bands/new) |
| `/collab` | Bands and projects you are in | **Both** | same rows, both cohorts | [open](http://localhost:8080/collab) |
| `/collab/$id` | Collaboration | **Both** | subject in path | — |
| `/collab/join/$token` | Join | **Both** | subject in path | — |
| `/collab/new` | Start a collab | → redirect |  | [open](http://localhost:8080/collab/new) |

### Marketplace (20)

| Route | Screen | Serves | How one file serves both | UI |
|---|---|---|---|---|
| `/marketplace` | Market | **Both** | same rows, both cohorts | [open](http://localhost:8080/marketplace) |
| `/marketplace/c/$slug` | — | **Both** | subject in path | — |
| `/marketplace/l/$id` | Listing unavailable | **Both** | subject in path | — |
| `/marketplace/mine` | My listings | **Both** | same rows, both cohorts | [open](http://localhost:8080/marketplace/mine) |
| `/marketplace/nearby` | Nearby | **Both** | same rows, both cohorts | [open](http://localhost:8080/marketplace/nearby) |
| `/marketplace/rent` | — | → redirect |  | [open](http://localhost:8080/marketplace/rent) |
| `/marketplace/rent/active/$id` | Rental not found | **Both** | subject in path | — |
| `/marketplace/rent/c/$slug` | — | → redirect | subject in path | — |
| `/marketplace/rent/e/$id` | — | → redirect | subject in path | — |
| `/marketplace/rent/list` | — | → redirect |  | [open](http://localhost:8080/marketplace/rent/list) |
| `/marketplace/rent/listings` | — | → redirect |  | [open](http://localhost:8080/marketplace/rent/listings) |
| `/marketplace/rent/mine` | My rentals | **Both** | same rows, both cohorts | [open](http://localhost:8080/marketplace/rent/mine) |
| `/marketplace/rent/nearby` | — | → redirect |  | [open](http://localhost:8080/marketplace/rent/nearby) |
| `/marketplace/rent/provider/$id` | Provider | **Both** | subject in path | — |
| `/marketplace/rent/request/$id` | Rental | **Both** | subject in path | — |
| `/marketplace/rent/saved` | — | → redirect |  | [open](http://localhost:8080/marketplace/rent/saved) |
| `/marketplace/rent/search` | — | → redirect |  | [open](http://localhost:8080/marketplace/rent/search) |
| `/marketplace/search` | Search | **Both** | same rows, both cohorts | [open](http://localhost:8080/marketplace/search) |
| `/marketplace/sell` | Create a Listing | **Both** | same rows, both cohorts | [open](http://localhost:8080/marketplace/sell) |
| `/marketplace/seller/$id` | Seller | **Both** | subject in path | — |

### Messages & notifications (4)

| Route | Screen | Serves | How one file serves both | UI |
|---|---|---|---|---|
| `/conversation/$id` | Conversation | **Both** | subject in path | — |
| `/messages` | Messages | **Both** | same rows, both cohorts | [open](http://localhost:8080/messages) |
| `/notifications` | Notifications | **Both** | same rows, both cohorts | [open](http://localhost:8080/notifications) |
| `/notifications/settings` | Channels and quiet hours | **Both** | same rows, both cohorts | [open](http://localhost:8080/notifications/settings) |

### Reviews (6)

| Route | Screen | Serves | How one file serves both | UI |
|---|---|---|---|---|
| `/reviews` | Only from completed work | **Both** | same rows, both cohorts | [open](http://localhost:8080/reviews) |
| `/reviews/$id/edit` | Edit review | **Both** | subject in path | — |
| `/reviews/$id/reply` | — | → redirect | subject in path | — |
| `/reviews/$id/report` | Report | **Both** | subject in path | — |
| `/reviews/request` | Only people you actually worked with | **Both** | same rows, both cohorts | [open](http://localhost:8080/reviews/request) |
| `/reviews/write/$id` | Write a review | **Both** | subject in path | — |

### Identity / QR (6)

| Route | Screen | Serves | How one file serves both | UI |
|---|---|---|---|---|
| `/identity/business` | — | → redirect |  | [open](http://localhost:8080/identity/business) |
| `/identity/contact` | Digital card | **Both** | same rows, both cohorts | [open](http://localhost:8080/identity/contact) |
| `/identity/contact/save` | Review before saving | **Both** | same rows, both cohorts | [open](http://localhost:8080/identity/contact/save) |
| `/identity/q/$code` | Scanned code | **Both** | subject in path | — |
| `/identity/qr` | Your MusicLinkd ID | **Both** | `?as=business` | [open](http://localhost:8080/identity/qr) |
| `/identity/scan` | MusicLinkd codes only | **Both** | same rows, both cohorts | [open](http://localhost:8080/identity/scan) |

### Verification (5)

| Route | Screen | Serves | How one file serves both | UI |
|---|---|---|---|---|
| `/verification` | Trust signals across your profile | **Both** | same rows, both cohorts | [open](http://localhost:8080/verification) |
| `/verification/$type` | Verification | **Both** | subject in path | — |
| `/verification/badge` | One meaning, everywhere | **Both** | same rows, both cohorts | [open](http://localhost:8080/verification/badge) |
| `/verification/choose` | Pick the badge that fits you | **Both** | same rows, both cohorts | [open](http://localhost:8080/verification/choose) |
| `/verification/privacy` | What happens to what you upload | **Both** | same rows, both cohorts | [open](http://localhost:8080/verification/privacy) |

### Settings, help, legal (12)

| Route | Screen | Serves | How one file serves both | UI |
|---|---|---|---|---|
| `/about` | — | System |  | [open](http://localhost:8080/about) |
| `/contact` | — | System |  | [open](http://localhost:8080/contact) |
| `/help` | Written for working musicians | **Both** | same rows, both cohorts | [open](http://localhost:8080/help) |
| `/help/$slug` | Not found | **Both** | subject in path | — |
| `/help/category/$key` | — | **Both** | subject in path | — |
| `/legal/$slug` | — | System | subject in path | — |
| `/settings` | Account and preferences | **Both** | cohort-aware fields | [open](http://localhost:8080/settings) |
| `/settings/account` | Sign-in and basics | **Both** | same rows, both cohorts | [open](http://localhost:8080/settings/account) |
| `/settings/delete-account` | This cannot be undone | **Both** | same rows, both cohorts | [open](http://localhost:8080/settings/delete-account) |
| `/settings/privacy` | Who sees and contacts you | **Both** | same rows, both cohorts | [open](http://localhost:8080/settings/privacy) |
| `/settings/security` | Password and devices | **Both** | same rows, both cohorts | [open](http://localhost:8080/settings/security) |
| `/settings/spotify` | Spotify | **Both** | same rows, both cohorts | [open](http://localhost:8080/settings/spotify) |

### Other (1)

| Route | Screen | Serves | How one file serves both | UI |
|---|---|---|---|---|
| `/.lovable/oauth/consent` | Connect an app | → redirect |  | [open](http://localhost:8080/.lovable/oauth/consent) |