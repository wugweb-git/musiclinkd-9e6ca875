# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Changed — 13 Sep 2026 token and route decisions

- **Radius is now the Material 3 shape scale:** 4/8/12/16/20/28/32/full.
  - Cards, rows and images went from 32px to 16px (`rounded-lg`, 372 call sites).
  - Small tiles, thumbnails and inputs are 12px (`rounded-md`, 66).
  - The Sheet top and the Dialog panel are 28px (`rounded-2xl`).
  - `rounded-md` call sites (14) moved to `rounded-lg`, so they keep their 16px.
  - Vendored `components/ui/` and arbitrary `rounded-[…]` are untouched. See `90a4676`.
- **Navy is now ink `#0D0D0D`.**
  - 33 classes, `Btn variant="navy"` renamed to `"ink"` (5 call sites), and `--gradient-navy`
    renamed to `--gradient-ink`.
  - Dark buttons, cards and scrims are neutral black instead of blue-tinted. See `81c8953`.
- **One spacing system.** `--spacing-xs/sm/md/lg` had zero uses and are removed. No visual change.
- **One secondary-text class.** 185 `text-text2` and 16 `var(--text-secondary)` became
  `text-muted-foreground` / `var(--muted-foreground)`, and both aliases are removed. No visual
  change. See `d526f17`.
- **Routes:**
  - `/band`, a hard-coded page for a band that isn't in the data, redirects to `/bands`.
  - The onboarding "Create band" button now goes to `/bands/new`.
  - The swipe deck moved from `/recommended` to `/recommendations/swipe`, and the old URL
    redirects.
  - The last `/talent/$id` links point at `/profile/$username`. See `e2471e7`, `d526f17`.
- **`AGENTS.md`:** records the M3 radius roles, ink, numeric-only spacing and
  `text-muted-foreground`. The "never Unsplash" line is removed; no such rule exists, and the
  team library in the guide repo is noted instead.
- **`AGENTS.md` chip radius:** chips move from `sm` (8px) to `full`, with buttons, pills and badges.
  Every chip, pill and badge in `src/components/ml/` already renders `rounded-full`, and the M3
  change kept chips as pills. The old line would have had new screens build 8px chips.

### Fixed — new-user journey: tokens, logo, onboarding

- **Band is not an onboarding step.** A band is a profile type, a group of individuals, set up after
  registration. The "Are you in a band or crew?" step, its `bandIntent` field and the "Create your band
  profile" card on Profile published are removed. Onboarding is 17 steps.
- **No prefilled person.** A new user's draft started as "Ananya Sharma" / `ananya.sharma`, so Identity
  showed as done before anyone typed. Name and username start empty.
- **Profile published.** Internal spec labels ("FLOW 03", "FLOW 16") no longer show on cards. The
  readiness actions open Portfolio, Services and Verification (all opened `/me`), and "Start
  verification" opens `/verification`. "Later" only shows when it does something.
- **Correct logo.** The auth and splash brand mark is the MusicLinkd waveform (`LogoMark`), not a generic
  music-note icon.
- **Tokens, not hard-coded values**, on splash, welcome, auth, onboarding and Home: arbitrary `text-[Npx]`
  and Tailwind `text-xs/lg/xl` use the `text-1..4` scale; `max-w-[430px]` is `max-w-app`; inline
  `style={{ background: "var(--…)" }}` is a class. New theme colours: `pink-container`, `pink-strong`,
  `success-container`, `warn-container`, `danger-container`. The auth notice's `#F59E0B` and `#16A34A`
  are the warn and success tokens. `StatusPill` and the talent card's language chip use classes too.
- **Icons, not emoji.** The role step ("What do you do?") and `VerifiedBadge` use lucide icons.

### Fixed — discovery entry points (route audit §7.1)

- **Discover.** Quick categories open the nearest real section: Talent and Events open `/categories`,
  Bands opens `/bands`, Marketplace and Rentals open the market, and Studios, Labels, Venues and
  Communities open `/discover/community`. Trending "See all" opens `/discover/music`, and
  the Nearby location opens `/discover/nearby`.
- **Recommendations.** Each reason chip opens "Why am I seeing this?" (`/search/why/$id`).
- **Search.** A history button in the header opens `/search/history`.
- **Profile owner.** Public opens your public profile at `/profile/$username`, or profile edit if you have no
  username yet. Stats has a "Full insights" link to `/profile/insights`.
- **Reviews.** Cards link to the reply, report and edit pages instead of an in-page sheet. The page links to
  "Ask for a review" (`/reviews/request`).
- **Collab.** Pending proposals come from the proposals data and open `/collab/proposals/$id`. Before this,
  one hard-coded card was shown.
- **Marketplace.** "Recently viewed" opens `/recently-viewed`.
- **Provider calendar.** Blocks for pending requests open the request (`/provider/bookings/requests/$ref`),
  not the booking detail.
- **Opportunities.** Links "Projects you can join" (`/discover/projects`).

### Fixed — navigation hubs (route audit §7.1)

- **Settings has an entry point.** Profile's owner panel has a Settings row. Before this, nothing linked to
  `/settings`, the only way to Business, Services and Sign out.
- **Profile owner panel targets.** "Manage portfolio" now opens `/portfolio`, "Manage services" opens `/services`,
  and "Availability" opens `/services/availability`. All three used to open profile edit.
- **Business owners reach their dashboard.** Manage has a Dashboard row, which leads to leads, analytics,
  services, availability, portfolio, reviews and verification. Business verification opens
  `/business/$id/verification`, not the generic chooser. The Back buttons on Manage and Team go to the
  business itself: they linked to the literal path `/business/$id`.
- **Service detail.** "Preview booking" opens the service's own enquiry. It opened the studio booking flow
  with a service id, which always showed "This space is unavailable".
- **Bands.** Message opens the band's contact page, and "Band portfolio" and the empty Music tab open the
  band's own portfolio, not your personal one. The Shows tab links to the band's full shows and
  opportunities page.
- **Booking conflicts.** Services availability links to `/services/conflicts`.

### Changed — app start

- **The app opens on a session check, not Discover.** `/` shows the brand mark while the browser
  session loads, then replaces itself with `/feed` (saved sign-in) or `/welcome` (everyone else).
- **Discover moved to `/discover`.** The bottom-nav tab, 21 links and back buttons, the feed tile and
  the scanned-code fallbacks follow it. The 404 page's home link stays on `/`, so it routes by session.
- **Welcome is the front door.** It gained "Already have an account? Sign in" for returning email
  users, and the signed-out prompts (avatar, portfolio card, profile edit, saving a work) open
  `/welcome` instead of the email form. The password-reset page still returns to email sign-in.
- **"Saved items"** in recommendation settings opens `/saved`; it pointed at Discover.

### Fixed

- **Link buttons are one element.** 241 `<Link><Btn/></Link>` pairs in 129 files (a `<button>`
  inside an `<a>`: invalid HTML, two tab stops, and screen readers announce both) are now
  `<BtnLink>`, a `createLink` anchor that shares `Btn`'s classes and keeps typed `to`/`params`.
  Hrefs are unchanged. Layout is unchanged except in `flex-1`/`flex-[2]` rows: the padding now sits
  on the flex item, so equal-share rows are truly equal (on `/recommendations`, Open is the same
  width as Save and Hide instead of 72px), and 1:2 pairs shift by about 15px.
- **`/feed` renders its data on the server.** A fake 450ms timer wrapped data that was already
  static, so the server sent only a skeleton. The greeting is now set after mount, so a UTC server
  no longer picks the time of day for a reader in another timezone.
- **`/feed` opportunity counts are derived** from `data/opportunities.ts` the way `/opportunities`
  derives them (open opportunities, active applications, shortlisted), not typed into the JSX.
  Both tile grids share one `StatTile`.
- **The `/feed` Bell opens `/notifications`**, not `/messages`, and its dot follows the unread count.
- **`ui/skeleton` is neutral** (`bg-subtle`) instead of a pink tint.
- **An unknown `/profile/$username` is a 404**, not Rahul Iyer's profile. The route loads the real
  row first, and a username with neither a row nor a seed profile throws `notFound()`.
  `/profile/me` redirects to `/me`.
- **No profile shows another person's sections.** Ananya, every Discover talent and real profiles with
  no seed used to spread Rahul Iyer's fixture. They now start from `emptySections()`, and a missing
  section renders its empty state. `/me` builds from the signed-in user's own record. The profile
  header and share sheet handle a missing photo, cover, role, location and availability, and the
  Verified tick shows only for verified tiers.
- **The Home headline counts real data.** "N new opportunities" counts the open opportunities (the
  list the tiles use) and links to `/opportunities`, instead of a hard-coded 9 linking to the swipe
  deck.
- **No casts on router links.** `Row`, `ActionRow`, `PrimaryPair`, the collab settings row, and the
  collaborator and marketplace-entry links take the router's typed `to` and `params`. The
  recommendation cards and help-page CTAs carry typed links. Typing them exposed two wrong
  destinations: the studio recommendation opened `/booking` (no such route) and now opens `/studio`,
  and the opportunity recommendation opened Home and now opens `/opportunities`.
- **QR destinations resolve.** Rahul's personal QR opened `/profile/rahuliyer` and the Stratocaster
  listing opened `/marketplace/fender-strat-62`; both 404. They now open `/profile/rahul-iyer` and
  `/marketplace/l/fender-strat-62`.
- **`HireModal` names who you are contacting.** It hard-coded Ananya Sharma's name, a "responds
  within 6 hours" claim and a pre-filled message addressed to her, on every profile, search result and
  the studio page. The caller now passes the subject.
- **One status pill.** `AvailabilityBadge` duplicated `StatusPill`; its 4 call sites use `StatusPill`
  with `availabilityTone()`, which renders identically.
- **Removed dead code:** `RentalRequestCard`, `RentalLocationRow`, `BookableEntityCard` and
  `MiniPlayer` had no callers, and `/feed`'s `QuietDestination` had an unused `"/verification"`.

### Added

- **Profiles for the 11 people and businesses the app links to**: opportunity posters, applicants
  and collab participants. Their content is in `src/data/linked-profiles.ts`, and each is a public
  row in the live `profiles` table (migration `20260913090949_seed_linked_profiles`, generated from
  that module). Their auth users have no email or password, so nobody can sign in as them.

- `docs/pending-screens-audit-2026-09-13.md`: the 7 Sep pending-screens plan checked item by item
  against the code. Result: 24 done · 9 partial · 4 not done, plus ~20 finished screens that no
  link reaches
- `AGENTS.md` routing rule: a route file with children must render `<Outlet />` or be an index
  leaf. The missing rule is how 26 routes came to render their parent's screen
- Design tokens reconciled to v9 in `src/styles.css`, taken verbatim from
  `frontend/guide/system/ml-tokens.css` (generated from `tokens/tokens.json`): radius scale
  8/16/32/pill, four fluid type ramps (`--type-1..4` = 12–13 / 16–18 / 22–28 / 32–44px), four
  elevation steps, motion durations and easings, a focus-ring token, spacing and opacity steps,
  `--container-app` and `--spacing-nav-clear`
- `--status-category-*` (the only sanctioned purple) and `--selected-*` (pink means selected)
  semantic token pairs
- `AGENTS.md` — GitHub↔Lovable sync protocol and code rules
- `CHANGELOG.md`
- `.prettierignore` entries fencing prose out of the formatter: `.lovable/`, `roadmap.md`,
  `docs/`, `src/routes/README.md`. The `.lovable/plan` documents are the only record of why 18
  flows were built design-only and exist nowhere else.

### Added

- `eslint-plugin-jsx-a11y` registered in `eslint.config.js`. Accessibility is now machine-checked
  for the first time; `heading-has-content` and `anchor-has-content` are scoped off for the
  vendored `src/components/ui/` primitives, whose content arrives via `{...props}`

### Changed

- `--text-secondary` is now `var(--muted-foreground)` instead of a second copy of `#66666f`, so the
  two can't drift apart. No visual change
- **Headings use Inter's normal tracking; all heading letter-spacing tuning is removed** (decided
  13 Sep, replacing the 11 Sep "keep" decision). Removed:
  - `-0.02em` on `h1..h4` (`styles.css`), which was compensation for Inter Tight;
  - `tracking-tight` on the auth wordmark and `AuthHeading` (`ml/auth.tsx`);
  - `tracking-tight` on the `/welcome` wordmark and hero (`welcome.tsx`);
  - `tracking-tight` on the root error heading (`__root.tsx`).

  Headings set very slightly wider. Positive tracking on uppercase eyebrow labels
  (`tracking-[0.14em]`) is kept, since that aids legibility of caps; vendored `components/ui/` is
  untouched
- `styles.css` header comments corrected: type has five ramps, not four. `@custom-variant dark` is
  documented as deliberately inert, because there is no dark mode, and removing the line would let
  `dark:` utilities match in OS dark mode
- Claude Code's commit attribution is pinned in `.claude/settings.json` (`attribution.commit` = the
  Wugweb trailer, `sessionUrl: false`), so the harness asks for the single trailer `AGENTS.md`
  requires instead of a Claude co-author line
- Horizontal rails snap to item edges. All **65** rails in `src/` paired `overflow-x-auto` with
  `no-scrollbar`, which removes the only affordance that content continues — so a rail stopped
  wherever the finger left it and clipped the card mid-item. A new `rail` utility adds
  `scroll-snap-type: x mandatory` plus a child `scroll-snap-align`, so applying one class to the
  container is the whole change
- Hairlines are `#D5D5DE` (`tokens.json` `line`), not `oklch(0.9445 …)`. The old value measured
  **1.147:1** against the card fill — below the step at which an edge is visible, so every divider,
  card outline and input border was decorative rather than structural. Now **1.458:1**
- `--secondary`, `--muted`, `--accent` and `--surface-subtle` snapped to `#F8F8FB` (`tokens.json`
  `surface`), the sunken step between paper and a white card. Four near-identical greys, one token
- Page ground is `#ECECF1`, not `#FCFCFD`. The old value measured **1.025:1** against the `#FFFFFF`
  card fill, so every card, row and summary was an invisible container and screens read as text
  floating on white. The card step is now 1.177:1 — cards read as white shapes on grey
- `--muted-foreground` darkened to `oklch(0.56 …)`: it measured **4.04:1** on card white, under the
  4.5:1 AA floor, and it is the colour of nearly every caption in the app. Now 4.66:1
- `AGENTS.md` now states explicitly that `Co-Authored-By: Wugweb <admin@wugweb.com>` is the only
  commit trailer, and that no assistant/tool identity may be added as a second one

### Fixed

- The viewport meta lacked `viewport-fit=cover`, so every `env(safe-area-inset-*)` in the app
  resolved to 0. That is 10 uses, including the bottom nav (`ml/ui.tsx`) and the `/feed` header. On
  notched iPhones the nav sat under the home indicator. This is a web fix and is independent of the
  Capacitor decision
- **26 routes rendered their parent's screen instead of their own.** In TanStack's flat routing,
  `bands.new.tsx` is a child of `bands.tsx`, so it renders inside the parent's `<Outlet />`. None of
  12 parents had one, so the child's content was silently dropped and the parent's UI showed at the
  child's URL, with the child's `<title>`. Confirmed on the live site before fixing:
  - `/bands/new` showed the Bands list, not the create wizard.
  - Every band profile (`/bands/$id`) showed the Bands list, so band profiles, along with their
    contact, events, invite, manage and portfolio pages, were unreachable.
  - The same happened under `/reviews/*` (4 pages), `/plans/*` (3), `/help/*` (2),
    `/recommendations/settings`, `/services/$id/{enquiry,manage}`, `/portfolio/$id/edit`,
    `/collab/new/collaborators`, `/collab/proposals/$id/counter`, `/identity/contact/save`, and
    Lovable's new `/search/{history,saved,why/$id}`.

  Each parent is renamed `X.tsx` → `X.index.tsx` with `createFileRoute("/x/")`, the existing
  `opportunities.index.tsx` convention. Parent URLs are unchanged, and `routeTree.gen.ts` was
  regenerated by the build. Checked against the regenerated tree: 207 routes, 0 children under a
  parent without `<Outlet />`. All 14 sampled parent/child URLs render their own screen on the
  dev server.
- CI (`.github/workflows/ci.yml`, added 2026-09-13) failed on Lovable's first push after it landed:
  214 Prettier errors and one `prefer-const` in the files that push wrote (`search.history`,
  `search.saved`, `search.why.$id`, `src/data/search-meta.ts`, `src/integrations/supabase/types.ts`,
  `previewAuthStorage.ts`). Formatting was cleared with `eslint --fix`, scoped to those files only.
  `previewAuthStorage.ts`'s `timer` is now `const`, declared where it is assigned.
- The CI Lint step now gates on correctness rules only (`prettier/prettier` off). Formatting runs
  as a separate step that reports but doesn't fail the build. Lovable's agent never runs Prettier,
  so the old gate would have gone red on every Lovable push
- Discover and Recently-viewed screens rendered `undefined` to users: `discover.music.tsx` read
  `t.label` where the data has `name`, and `discover.nearby.tsx` / `recently-viewed.tsx` read
  `s.image` where the data has `photo`. Shipped in `d10513f` ("Added audio autoplay", a commit
  that actually added five discover routes).
- `bun run lint` reduced from 1932 problems to 0 errors: ran the project formatter across
  `src/**/*.{ts,tsx}`, removed three `eslint-disable-next-line jsx-a11y/media-has-caption`
  comments that suppressed a rule no loaded plugin provides, and resolved one `prefer-const`.
- Repaired `AGENTS.md`, which had a corrupted, duplicated `LOVABLE:BEGIN/END` block
- `README.md` no longer ships the superseded Android design brief (old palette, radius, and type
  values)

### Changed

- Card radius is 32px (was 24px); `rounded-2xl` is 32px (was 40px). `xl`/`2xl`/`3xl` are retained
  as on-scale aliases of 32px so ~450 existing usages don't fall back to Tailwind's defaults
- Cards lift with `--elevation-2`; the 1px border is now the fallback, not the only treatment
- All arbitrary `rounded-[…]` and `text-[…]` values removed from `src/components/ml/`
- One selected state across the app: pink, not navy. `Chip`, `Segmented` and the three ad-hoc
  chip copies in `booking`/`collab-workspace`/`onboarding` now match the bottom nav
- Owner-row icons on `/me` are muted rather than pink, so pink reads as accent again
- `--accent` is a neutral hover surface; purple is confined to the category badge
- Renamed the `--text-2` _colour_ token to `--text-secondary`. Mapping the type ramp into Tailwind's `--text-*` namespace collided with it, and one would have silently won
- Category badge contrast was 3.72:1, below the 4.5:1 `AGENTS.md` mandates. The new `--status-category-*` pair measures 8.77:1

### Known gaps

- `--muted-foreground` measures **4.04:1** on card white — below the 4.5:1 AA floor for normal-size
  text, and it is the colour of nearly every caption in the app. It passes the 3:1 non-text floor,
  so icon use is fine. `oklch(0.56 0.0257 285.59)` would give 4.66:1. Not changed here: it repaints
  secondary text on every screen and deserves its own review.
- `tokens.json` and its documentation disagree in three places, all recorded rather than resolved
  here: the published guide says "there is no purple in the palette" while `tokens.json` carries
  purple reinstated 2026-08-31 on the brand owner's instruction; `color.paper`'s description
  narrates a change to `#ECECF1` that neither its own `$value` nor the generated CSS reflects; and
  `README.md` promises `foundation.gestalt.*` full-fidelity scales that do not exist in
  `tokens.json` at all
- `--navy` is retired in the system (`--color-ink #0D0D0D` "replaces --black, --text and the
  retired --navy", and `action.primary = ink` — the primary button is black, not pink). Not
  migrated here: it is a colour-identity change on every screen
- No accessibility linting: `eslint-plugin-jsx-a11y` is not registered in `eslint.config.js`, so
  the WCAG AA, contrast, `:focus-visible` and 48dp touch-target rules `AGENTS.md` mandates are not
  machine-checked. Tracked in `roadmap.md`.
- 18 `react-refresh/only-export-components` warnings remain (non-blocking; clearing them means
  splitting 10 component files to isolate their exports).
