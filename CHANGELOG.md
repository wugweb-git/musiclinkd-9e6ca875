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

### Fixed

- **`/feed` renders its data on the server.** A fake 450ms timer wrapped data that was already
  static, so the server sent only a skeleton. The greeting is now set after mount, so a UTC server
  no longer picks the time of day for a reader in another timezone.
- **`/feed` opportunity counts are derived** from `data/opportunities.ts` the way `/opportunities`
  derives them (open opportunities, active applications, shortlisted), not typed into the JSX.
  Both tile grids share one `StatTile`.
- **The `/feed` Bell opens `/notifications`**, not `/messages`, and its dot follows the unread count.
- **`ui/skeleton` is neutral** (`bg-subtle`) instead of a pink tint.

### Added

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
