# Phase 7 inventory — routes, components, flow coverage

**11 Sep 2026 · audit only.** Nothing under `src/` was changed to produce this document. Every
number was read from the files at **`main` @ `315564c`** (after PR #15) and, for Part 3, from the
flow registry in `wugweb-git/musiclinkd` @ `79ae094`. Where something could not be established it
says **unverified**. Where two sources disagree, both are named and neither is picked quietly.

## Headline

- **Phase 8 is ≈ 97 hours: three weeks for one person, shipped as about eight PRs.** It is not one
  PR, and the class changes are not the reason. Part 4 has the arithmetic.
- **176 of the 205 route files need Phase 8 work.** The dominant signal is **1,069 arbitrary
  `text-[…]` sizes in 174 files**. The routes were never swept; `ml/` was, and has none left.
- **Only 4 of those 1,069 lack a rule.** 635 already sit inside a token's range. When PR #3 swept
  `ml/`, it mapped every other size the routes use: ≤13px → `text-1`, 14–19px → `text-2`,
  20–26px → `text-3`. The four without a rule are 9px ×2, 13.5px and 30px.
- **The cost is the render pass and the data split, not the classes.** That means ~29 h of
  before/after checks at 412px on 176 screens, plus ~48 h to split `src/data` (9,153 lines in 21
  modules, read by 182 of the 205 routes) and to replace its 83 relative-time strings.
- **Registry coverage (Part 3): 152 of the 205 designed screens have a route here, 32 are
  unverified, and 21 have none.** Those 21 are the actual missing screens. Another 46 routes
  match no registry screen. The data supports 205 screens; the 188 / 563 figure is stale. List C
  as specified is empty, because no flow is marked `documented`.

## How this was counted

**A parser, not grep.** Every `.ts`/`.tsx` file under `src/routes/`, `src/data/` and
`src/components/ml/` was parsed with the TypeScript compiler API. Only string literals, template
pieces and JSX text were searched, so comments are never counted. The scripts are not committed,
because this document is the only change. Each rule is spelled out below so the counts can be
reproduced.

**205 route files.** That is every `.tsx` under `src/routes/`, recursively: 177 flat, plus 28 in
`marketplace/` and `onboarding/`, including `__root.tsx`. That gives 204 URLs in 38 first-segment
groups. The URL is the string passed to `createFileRoute()` in the file itself. `main` did not
move while this ran: the last fetch was still at `315564c`, with no `lovable-sync` branch.

**Every signal was spot-read before its count was accepted.** Where the pattern turned out to be
wrong, the tables use the verdict from reading the line, not the raw count.

| Signal | What was counted | Checked by reading |
|---|---|---|
| Arbitrary radius | `rounded-[…]` and side variants (`rounded-t-[…]`) in a string | exact pattern |
| Arbitrary type | `text-[…]` holding a length. No colour values exist | exact pattern |
| Stock imagery | URLs whose host starts `images.` or is a known stock host; bare `unsplash`/`pexels` mentions | exact. Photos behind URL-builder functions in `src/data` are counted separately, by photo ID |
| Emoji / text glyphs | Any character outside the `unicode-range` Google Fonts serves for Inter (fetched 11 Sep) that is not a letter or digit. So `→ ★ ✓ ← ✕ ♡` count, and `— ’ … · × ₹` do not, because Inter serves them | exact |
| Dead controls | `<Btn>` or `<Link>` with none of: `onClick`, `to`, `type="submit"`, a spread, or an enclosing element in the same component that is itself actionable. `Btn` has no `to` prop (`ml/ui.tsx:180-194`) | 5 of 5 sampled are inert |
| Deprecated route | `/talent/` in a string, excluding the route's own id | exact |
| Inline design values | Every JSX `style=` attribute | exact |
| Relative-time strings | `N unit ago`, `in N unit`, `yesterday`, `just now`; plus `"5h"` values on `time` / `when` / `postedAt` … keys | routes: 1 of 4 hits real (the other 3 are error or policy copy); data: 11 of 11 sampled real |
| Fabricated state | Numeric literals on rating/review/follower/view/… keys; availability phrases; `4.9 ★` and `(124 reviews)` shapes | routes: 5 real, 2 false (filter-chip labels), 2 unverified. Reading turned up 3 more in `feed.tsx` and 1 in `collab.index.tsx:196` (see Part 1). Data: 10 of 11 sampled real. **This count is a floor.** |

## Where the sources disagree

1. **Phase 7 as a commit.** `PHASE-SPECS-2b-to-7.md` (Phase 7, "no commit") and
   `CLAUDE-CODE-WORK-ORDER.md:339` ("this produces a document, not a commit") both say Phase 7
   ships no commit. The 11 Sep prompt asks for exactly one commit on `docs/phase-7-inventory`. This
   follows the prompt.
2. **`src/data` has 21 modules, not 22.** The claim is at `CLAUDE-CODE-WORK-ORDER.md:341` and
   `PHASE-SPECS-2b-to-7.md:230`.
3. **`src/components/ui/` has 46 files, not 45, and two are in use, not none.** The claim is at
   `AGENTS.md:135` and in the work order's Phase 6. `avatar` is imported by `ml/viewer.tsx` and
   `sonner` by `__root.tsx`. Not all 46 are Radix: `skeleton` is a plain div, `drawer` wraps vaul
   and `calendar` wraps react-day-picker.
4. **"`text-[15px]` / `text-[17px]` straddle type tokens 2 and 3"** (`CLAUDE-CODE-WORK-ORDER.md:399`).
   On the scale `styles.css:55` implements (12–13 / 16–18 / 22–28 / 32–44 / 40–56), 17px sits
   inside `text-2`, and 15px falls between `text-1` and `text-2`. PR #3 already sent both to
   `text-2`.
5. **The mapping table in `PHASE-2-TOKEN-SPEC.md` §3 belongs to a different scale.** It is computed
   on 10 / 14 / 20 / 29px, the superseded scale that `roadmap.md:140` traces to the Lovable project
   knowledge. Don't use it for Phase 8. PR #3's actual replacements (Part 1) are the precedent.
6. **`rounded-xl` / `2xl` / `3xl`.** `PHASE-2-TOKEN-SPEC.md` §4 maps `xl` and `2xl` to 16px. But
   `styles.css:30-35` aliases all three to 32px and says they "fold into `rounded-lg`". That covers
   448 uses: 282 in routes, 166 in components. Folding to 32px changes no pixels; folding to 16px
   restyles every one. **This needs a decision before the codemod runs.**
7. **The `/talent/$id` redirect has already landed.** `roadmap.md:36` and `PHASE-SPECS-2b-to-7.md`
   §5.5 treat it as pending, but `talent.$id.tsx` has redirected to `/profile/$username` since
   `c49b409` (1 Sep). What is still pending is four links (Part 1).
8. **Registry counts: 188 / 563, 205 / 616 and 205 / 651 all appear.** Part 3 says which one the
   data supports.
9. **Two routing conventions.** `AGENTS.md:165` says routes are flat, dot-named files, yet 28 of
   the 205 live in real directories: `marketplace/`, `marketplace/rent/` and `onboarding/`.
10. **Dynamic routes: 90 or 113?** A route table prepared separately on 11 Sep reports 204 routes,
    38 groups and 113 dynamic routes. The files here agree on 204 and 38, but give **90** URLs with
    a parameter: 95 parameters in all, with 5 URLs carrying two. That table is not in this repo,
    so how it reached 113 is unverified.

---

## Part 1 — Route inventory

### Totals

| Signal | Count | Files | What it is |
|---|--:|--:|---|
| Arbitrary radius | 52 | 32 | 46 already have a mapping (below); 6 have none (14px ×4, 12px ×2) |
| Arbitrary type | 1,069 | 174 | see the distribution below |
| Stock imagery | 9 | 2 | all Unsplash, in `band.tsx` and `studio.tsx`. Most stock imagery sits behind `src/data` URL builders (below) |
| Emoji / text glyphs | 56 | 34 | `→` ×9, `★` ×7, `←` ×5, `✓` ×5, `📦` ×4, `🏢` ×3, 17 others |
| Dead controls (`Btn`/`Link`) | 45 | 31 | all are `<Btn>`. There are also 14 dead native `<button>`s in 10 files |
| `/talent/$id` links | 2 | 2 | `discover.nearby.tsx:102` and `recently-viewed.tsx:48`, plus 2 in `data/identity.ts:90,125` |
| Inline `style=` | 70 | 44 | 40 use CSS variables only, 24 are computed, 6 hold literal values |
| Relative-time strings | 1 | 1 | `collab.index.tsx:196`. Most relative-time strings are in `src/data` (83) |
| Fabricated state | 8 (+2 unverified) | 7 | 5 caught by the pattern, 3 more found by reading `feed.tsx`. Most fabricated values are in `src/data` (259 candidates) |

### Findings outside the signal list

These change the size of Phases 5 and 6, or they are wrong today.

- **233 `<Btn>` elements sit inside a `<Link>`, across 122 files.** That puts a `<button>` inside
  an `<a>`, which is invalid HTML and gives two tab stops for one action. `Btn` accepts no `to`,
  `asChild` or ref, so every navigating button in the app gets built this way. These buttons are
  not dead, but Phase 6 has to give `Btn` a link form before a codemod can fix them.
- **`/feed` server-renders an empty page.** `useDashboard` starts in `"loading"`, and the data only
  arrives after a 450ms client-side `setTimeout` (`feed.tsx:55-86`). That data is `dashboardData`,
  a static import already in the bundle (`:24`). So the server can emit nothing but the header and
  `<SkeletonBody />` (`:103-104`). Fetched on 11 Sep, the live `/feed` response carries no visible
  text beyond the header and bottom-nav labels. More problems on the same screen:
  - The three figures `5` matching, `2` applications and `1 shortlisted` are JSX literals
    (`:223-233`); they are in the fab column now.
  - The Bell is labelled "Notifications" but links to `/messages` (`:134-135`), even though
    `/notifications` exists.
  - The `online` listener re-runs `load` and throws its cleanup away, so that timer is never
    cleared (`:80`).
  - `/verification` is a dead member of the `QuietDestination` union (`:382-392`). The nine
    `QuietAction`s use the other nine.
- **The `/talent/` links resolve, but unknown profiles show a stranger.** `getProfile()` falls back
  from username to talent id (`data/profile.ts:593-597`), which is why the four links work. The
  same function also returns **Rahul Iyer's seed profile for any username it does not know**. So
  a mistyped or stale `/profile/<name>` link shows a stranger's profile instead of a not-found —
  the same class of fault as the avatar bug fixed in PR #11.
- **Two URLs for one idea, twice.** `/recommendations` ("For You — Recommendations", linked 4
  times) sits alongside `/recommended` ("Recommended For You", linked once, from `index.tsx:111`).
  `/bands` (the list, linked 5 times) sits alongside `/band`, a static page with 6 Unsplash photos
  linked only from `onboarding/complete.tsx:141`. Which name wins is a decision, not made here.
- **Where route data comes from.** 17 routes import something live (the Supabase client,
  `use-auth`, `*.functions`). 171 import only `src/data` seed modules, and 17 import neither.

### Arbitrary type — the distribution that decides Phase 8

At the 412px target the tokens compute to 12.0 / 16.1 / 22.3 / 32.6 / 40.8px (`styles.css:47,226`).
The last column shows what PR #3 (`f8982c9`) did to the same px value in `ml/`, counted from the
diff wherever a removed line and its replacement pair one-to-one.

| Size | Uses | Files | Inside a token's range? | PR #3 in `ml/` |
|---|--:|--:|---|---|
| 12px | 254 | 104 | `text-1` | → `text-1` ×36 |
| 13px | 246 | 107 | `text-1` | → `text-1` ×39 |
| 11px | 219 | 97 | no — below 12 | → `text-1` ×114 |
| 15px | 91 | 44 | no — between 1 and 2 | → `text-2` ×12 |
| 17px | 59 | 34 | `text-2` | → `text-2` ×10 |
| 14px | 47 | 28 | no — between 1 and 2 | → `text-2` ×14 |
| 10px | 44 | 21 | no — below 12 | → `text-1` ×49 |
| 16px | 39 | 16 | `text-2` | → `text-2` ×4 |
| 19px | 16 | 14 | no — between 2 and 3 | → `text-2` ×4 |
| 20px | 13 | 12 | no — between 2 and 3 | → `text-3` ×1 |
| 24px | 11 | 9 | `text-3` | → `text-3` ×2 |
| 18px | 9 | 8 | `text-2` | → `text-2` ×2 |
| 22px | 8 | 8 | `text-3` | → `text-3` ×2 |
| 28px | 5 | 5 | `text-3` | — |
| 9px | 2 | 1 | no — below 12 | **none** (10px and 11px went to `text-1`) |
| 34px | 2 | 2 | `text-4` | — |
| 13.5px | 1 | 1 | no | **none** (12.5px went to `text-1` in `aab4727`) |
| 26px | 1 | 1 | `text-3` | → `text-3` ×2 |
| 30px | 1 | 1 | no — between 3 and 4 | **none** |
| 32px | 1 | 1 | `text-4` | — |
| **total** | **1,069** | **174** | **635 in range** | **430 more covered by a precedent** |

**This rule is a visible change, which is why the render pass isn't optional.** At 412px, 10px
becomes 12.0px (+20%), 14px becomes 16.1px (+15%) and 19px becomes 16.1px (−15%). Line height
changes too: each `text-N` token carries its own line height (1.45 / 1.5 / 1.25 / 1.1), while
`text-[Npx]` sets none. So a swap can move vertical rhythm even where the size barely changes.
Adopting PR #3's rule for the routes is Vedanshu's decision. The alternative, a design look at
each of the 434 out-of-range values, adds about 14 h (Part 4).

**The arbitrary sizes cluster in the gaps between steps.** At 412px the steps are 12.0 / 16.1 /
22.3 / 32.6 / 40.8px, so the gaps between them are 4.1, 6.2, 10.3 and 8.2px. 138 route uses sit at
14–15px, inside the first gap, and nothing on the scale is within 2px of 14. Another 18 sit at
24–30px, inside the widest gap. With the four-step cap lifted, adding a step there is a decision
rather than a rule change. It is tracked separately from this inventory.

**Radius.** 16px ×24, 8px ×1 and 32px ×1 are on the scale. PR #3 sent 20px to `rounded-md` (×5)
and 24px to `rounded-lg` (×15), which matches `PHASE-2-TOKEN-SPEC.md` §4; the routes hold 20px ×14
and 24px ×6. **14px ×4 and 12px ×2 have no rule.** Separately, 448 `rounded-xl/2xl/3xl` uses
wait on the decision in "Where the sources disagree", item 6.

### By area

| Area (first URL segment) | files | type | rad | style | dead | glyph | Btn-in-Link | Phase 8 est. | other est. |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| `collab` | 30 | 127 | 0 | 9 | 9 | 3 | 53 | 5.4h | 3.3h |
| `marketplace/rent` | 12 | 111 | 0 | 16 | 9 | 13 | 19 | 3.4h | 3.2h |
| `business` | 14 | 91 | 7 | 1 | 11 | 2 | 11 | 2.6h | 3.0h |
| `marketplace` | 9 | 35 | 0 | 4 | 4 | 9 | 7 | 1.8h | 1.6h |
| `bands` | 8 | 46 | 3 | 0 | 7 | 0 | 9 | 1.5h | 1.9h |
| `identity` | 13 | 34 | 12 | 12 | 0 | 0 | 14 | 3.1h | 14m |
| `opportunities` | 13 | 97 | 13 | 1 | 2 | 1 | 35 | 2.2h | 1.1h |
| `services` | 7 | 63 | 3 | 0 | 2 | 2 | 9 | 1.5h | 45m |
| `feed` | 1 | 29 | 0 | 6 | 1 | 0 | 0 | 1.7h | 15m |
| `portfolio` | 9 | 13 | 0 | 4 | 0 | 3 | 13 | 1.5h | 22m |
| `auth` | 10 | 10 | 0 | 6 | 0 | 0 | 0 | 1.9h | 0m |
| `provider` | 8 | 38 | 0 | 0 | 0 | 2 | 7 | 1.6h | 13m |
| `onboarding` | 7 | 14 | 0 | 3 | 0 | 0 | 13 | 1.3h | 13m |
| `studio` | 1 | 15 | 0 | 1 | 2 | 2 | 0 | 47m | 36m |
| `plans` | 4 | 40 | 0 | 0 | 2 | 0 | 6 | 44m | 36m |
| `booking` | 9 | 15 | 0 | 0 | 0 | 1 | 6 | 1.0h | 9m |
| `settings` | 5 | 27 | 0 | 0 | 1 | 0 | 1 | 53m | 16m |
| `verification` | 5 | 91 | 6 | 0 | 0 | 0 | 6 | 1.0h | 6m |
| `reviews` | 6 | 33 | 3 | 0 | 0 | 0 | 3 | 1.1h | 3m |
| `saved` | 1 | 7 | 0 | 1 | 3 | 1 | 0 | 16m | 48m |
| `recommendations` | 2 | 12 | 0 | 0 | 2 | 0 | 5 | 21m | 35m |
| `search` | 1 | 12 | 0 | 0 | 2 | 5 | 0 | 11m | 45m |
| `discover` | 4 | 10 | 2 | 0 | 0 | 0 | 2 | 47m | 7m |
| `bookings` | 4 | 8 | 0 | 1 | 0 | 0 | 8 | 46m | 8m |
| `/` | 1 | 17 | 0 | 2 | 1 | 4 | 0 | 27m | 27m |
| `band` | 1 | 12 | 0 | 1 | 0 | 1 | 0 | 48m | 3m |
| `recently-viewed` | 1 | 2 | 1 | 0 | 1 | 0 | 1 | 13m | 21m |
| `profile` | 3 | 14 | 0 | 1 | 0 | 0 | 2 | 26m | 2m |
| `help` | 3 | 15 | 1 | 0 | 0 | 0 | 3 | 22m | 3m |
| `notifications` | 2 | 12 | 0 | 0 | 0 | 1 | 0 | 21m | 3m |
| `legal` | 2 | 4 | 0 | 0 | 0 | 0 | 0 | 20m | 0m |
| `recommended` | 1 | 5 | 1 | 0 | 0 | 3 | 0 | 11m | 9m |
| `categories` | 1 | 2 | 0 | 1 | 0 | 0 | 0 | 15m | 0m |
| `messages` | 1 | 8 | 0 | 0 | 0 | 0 | 0 | 11m | 0m |
| `singers` | 1 | 0 | 0 | 0 | 0 | 3 | 0 | 0m | 9m |
| `(root)` | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0m | 0m |
| `me` | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0m | 0m |
| `reset-password` | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0m | 0m |
| `talent` | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0m | 0m |
| `welcome` | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0m | 0m |

### Per file

How to read the table:

- **type (n):** total arbitrary sizes, with the number outside a token's range in brackets.
- **fab:** verified hits, with `+n?` for unverified ones.
- **est. effort:** covers every signal in the row, including Phase 4/5 items. S < 20 min, M < 60
  min, L ≥ 60 min. The model is in Part 4.
- Zeros are shown as `·`. File paths are relative to `src/routes/`.

| Route file | URL | rad | type (off-range) | stock | glyph | dead | /talent | style | rel-time | fab | est. effort | notes |
|---|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|---|---|
| `__root.tsx` | `(root layout)` | · | · | · | · | · | · | · | · | · | S · 0m |  |
| `auth.forgot.tsx` | `/auth/forgot` | · | · | · | · | · | · | · | · | · | S · 0m | live data |
| `auth.index.tsx` | `/auth/` | · | 5 (1) | · | · | · | · | · | · | · | S · 11m | live data |
| `auth.locked.tsx` | `/auth/locked` | · | 1 | · | · | · | · | 1 | · | · | S · 15m |  |
| `auth.maintenance.tsx` | `/auth/maintenance` | · | · | · | · | · | · | 1 | · | · | S · 15m |  |
| `auth.offline.tsx` | `/auth/offline` | · | · | · | · | · | · | · | · | · | S · 0m |  |
| `auth.otp.tsx` | `/auth/otp` | · | 1 (1) | · | · | · | · | 1 | · | · | S · 15m |  |
| `auth.phone.tsx` | `/auth/phone` | · | 1 (1) | · | · | · | · | · | · | · | S · 10m |  |
| `auth.signout.tsx` | `/auth/signout` | · | · | · | · | · | · | 1 | · | · | S · 15m | live data |
| `auth.success.tsx` | `/auth/success` | · | 1 | · | · | · | · | 1 | · | · | S · 15m |  |
| `auth.verify-email.tsx` | `/auth/verify-email` | · | 1 | · | · | · | · | 1 | · | · | S · 15m | live data |
| `band.tsx` | `/band` | · | 12 (10) | 6 | 1 | · | · | 1 | · | · | M · 51m | glyphs ← |
| `bands.$id.contact.tsx` | `/bands/$id/contact` | 1 | 2 (1) | · | · | · | · | · | · | · | S · 11m | Btn-in-Link ×1 · seed: band |
| `bands.$id.events.tsx` | `/bands/$id/events` | · | 4 | · | · | 2 | · | · | · | · | M · 40m | dead: L75 Add a show; L84 Add a show · seed: band, opportunities |
| `bands.$id.invite.tsx` | `/bands/$id/invite` | · | 3 (2) | · | · | · | · | · | · | · | S · 12m | Btn-in-Link ×2 · seed: band, discover |
| `bands.$id.manage.tsx` | `/bands/$id/manage` | · | 8 (2) | · | · | 1 | · | · | · | · | M · 28m | dead: L80 … · Btn-in-Link ×2 · seed: band |
| `bands.$id.portfolio.tsx` | `/bands/$id/portfolio` | 1 | 2 | · | · | 3 | · | · | · | · | M · 58m | dead: L74 Add a release; L83 Add a release; L94 Add live work · radius off-rule: 12px · seed: band |
| `bands.$id.tsx` | `/bands/$id` | 1 | 13 (4) | · | · | 1 | · | · | · | · | M · 28m | dead: L110 Follow · Btn-in-Link ×2 · seed: band |
| `bands.new.tsx` | `/bands/new` | · | 9 (2) | · | · | · | · | · | · | · | S · 12m | Btn-in-Link ×1 · seed: band |
| `bands.tsx` | `/bands` | · | 5 (1) | · | · | · | · | · | · | · | S · 12m | Btn-in-Link ×1 · seed: band |
| `booking.$id.addons.tsx` | `/booking/$id/addons` | · | 1 | · | · | · | · | · | · | · | S · 10m | seed: booking |
| `booking.$id.details.tsx` | `/booking/$id/details` | · | · | · | · | · | · | · | · | · | S · 0m | seed: booking |
| `booking.$id.index.tsx` | `/booking/$id/` | · | 5 | · | 1 | · | · | · | · | · | S · 15m | Btn-in-Link ×1 · glyphs ← · seed: booking |
| `booking.$id.pay.tsx` | `/booking/$id/pay` | · | 3 (1) | · | · | · | · | · | · | · | S · 11m | Btn-in-Link ×1 · seed: booking |
| `booking.$id.review.tsx` | `/booking/$id/review` | · | 2 | · | · | · | · | · | · | · | S · 10m | seed: booking |
| `booking.$id.schedule.tsx` | `/booking/$id/schedule` | · | 3 (1) | · | · | · | · | · | · | · | S · 12m | Btn-in-Link ×2 · seed: booking |
| `booking.$id.service.tsx` | `/booking/$id/service` | · | · | · | · | · | · | · | · | · | S · 0m |  |
| `booking.$id.tsx` | `/booking/$id` | · | · | · | · | · | · | · | · | · | S · 0m |  |
| `booking.confirmed.$ref.tsx` | `/booking/confirmed/$ref` | · | 1 | · | · | · | · | · | · | · | S · 12m | Btn-in-Link ×2 · seed: booking |
| `bookings.$ref.cancel.tsx` | `/bookings/$ref/cancel` | · | 1 | · | · | · | · | · | · | · | S · 11m | Btn-in-Link ×1 · seed: booking |
| `bookings.$ref.index.tsx` | `/bookings/$ref/` | · | 4 (1) | · | · | · | · | 1 | · | · | M · 20m | Btn-in-Link ×5 · seed: booking |
| `bookings.$ref.reschedule.tsx` | `/bookings/$ref/reschedule` | · | 2 | · | · | · | · | · | · | · | S · 11m | Btn-in-Link ×1 · seed: booking |
| `bookings.index.tsx` | `/bookings/` | · | 1 (1) | · | · | · | · | · | · | · | S · 11m | Btn-in-Link ×1 · seed: booking |
| `business.$id.analytics.tsx` | `/business/$id/analytics` | 1 | 4 (1) | · | · | · | · | 1 | · | · | S · 16m | seed: business |
| `business.$id.availability.tsx` | `/business/$id/availability` | 1 | 3 | · | · | 1 | · | · | · | · | M · 25m | dead: L90 Add blackout dates · seed: business, services |
| `business.$id.dashboard.tsx` | `/business/$id/dashboard` | · | 3 (1) | · | · | · | · | · | · | · | S · 10m | seed: business |
| `business.$id.enquiry.tsx` | `/business/$id/enquiry` | 1 | 4 (1) | · | · | · | · | · | · | · | S · 14m | Btn-in-Link ×3 · seed: business |
| `business.$id.index.tsx` | `/business/$id/` | · | 27 (11) | · | 1 | 1 | · | · | · | · | M · 33m | dead: L96 Follow · Btn-in-Link ×2 · glyphs → · seed: business |
| `business.$id.leads.tsx` | `/business/$id/leads` | · | 2 | · | · | 1 | · | · | · | · | M · 26m | dead: L87 Mark closed · Btn-in-Link ×1 · seed: business |
| `business.$id.manage.tsx` | `/business/$id/manage` | · | 4 (1) | · | · | · | · | · | · | · | S · 11m | Btn-in-Link ×1 · seed: business |
| `business.$id.portfolio.tsx` | `/business/$id/portfolio` | 1 | 2 | · | · | 5 | · | · | · | · | L · 1.4h | dead: L65 Edit; L68 Hide; L74 Add a credit; L83 Add a credit; L104 Add photos · seed: business |
| `business.$id.reviews.tsx` | `/business/$id/reviews` | 2 | 4 | · | · | · | · | · | · | · | S · 11m | seed: business |
| `business.$id.services.tsx` | `/business/$id/services` | 1 | 4 | · | · | 2 | · | · | · | · | M · 41m | dead: L80 Edit; L83 Pause · seed: business |
| `business.$id.team.tsx` | `/business/$id/team` | · | 8 (4) | · | · | · | · | · | · | · | S · 11m | seed: business |
| `business.$id.verification.tsx` | `/business/$id/verification` | · | 3 | · | · | 1 | · | · | · | · | M · 26m | dead: L85 Upload · Btn-in-Link ×1 · seed: business |
| `business.index.tsx` | `/business/` | · | 5 (2) | · | 1 | · | · | · | · | · | S · 15m | Btn-in-Link ×1 · glyphs ★ · seed: business |
| `business.new.tsx` | `/business/new` | · | 18 (6) | · | · | · | · | · | · | · | S · 14m | Btn-in-Link ×2 · seed: business |
| `categories.tsx` | `/categories` | · | 2 (2) | · | · | · | · | 1 | · | · | S · 15m | seed: discover |
| `collab.$id.activity.tsx` | `/collab/$id/activity` | · | · | · | · | · | · | · | · | · | S · 0m | seed: collab |
| `collab.$id.agreement.tsx` | `/collab/$id/agreement` | · | 10 (1) | · | · | · | · | · | · | · | S · 13m | Btn-in-Link ×2 · seed: collab |
| `collab.$id.discussion.tsx` | `/collab/$id/discussion` | · | 8 (5) | · | · | 1 | · | 2 | · | · | M · 36m | dead: L135 Attach file · seed: collab |
| `collab.$id.files.$fileId.tsx` | `/collab/$id/files/$fileId` | · | 7 (3) | · | · | · | · | 1 | · | · | M · 32m | dead `<button>`: L101 Compare with latest · Btn-in-Link ×1 · seed: collab |
| `collab.$id.files.index.tsx` | `/collab/$id/files/` | · | · | · | · | · | · | · | · | · | S · 1m | Btn-in-Link ×1 · seed: collab |
| `collab.$id.index.tsx` | `/collab/$id/` | · | 8 (2) | · | · | · | · | 3 | · | · | M · 28m | Btn-in-Link ×2 · seed: collab |
| `collab.$id.invite-link.tsx` | `/collab/$id/invite-link` | · | 3 (1) | · | · | 2 | · | · | · | · | M · 40m | dead: L65 Copy link; L68 Share · seed: collab |
| `collab.$id.lifecycle.$action.tsx` | `/collab/$id/lifecycle/$action` | · | 7 (2) | · | 1 | · | · | 1 | · | · | M · 21m | Btn-in-Link ×2 · glyphs ✓ · seed: collab |
| `collab.$id.media.tsx` | `/collab/$id/media` | · | 1 | · | · | · | · | · | · | · | S · 11m | Btn-in-Link ×1 · seed: collab |
| `collab.$id.milestones.$mid.tsx` | `/collab/$id/milestones/$mid` | · | 7 (1) | · | · | · | · | · | · | · | S · 12m | Btn-in-Link ×1 · seed: collab |
| `collab.$id.milestones.new.tsx` | `/collab/$id/milestones/new` | · | · | · | · | · | · | · | · | · | S · 1m | Btn-in-Link ×1 · seed: collab |
| `collab.$id.notes.tsx` | `/collab/$id/notes` | · | 4 (3) | · | · | · | · | 1 | · | · | S · 15m | seed: collab |
| `collab.$id.participants.tsx` | `/collab/$id/participants` | · | 8 (3) | · | · | · | · | · | · | · | S · 14m | Btn-in-Link ×3 · seed: collab |
| `collab.$id.remove.$pid.tsx` | `/collab/$id/remove/$pid` | · | 4 (1) | · | · | · | · | · | · | · | S · 13m | Btn-in-Link ×3 · seed: collab |
| `collab.$id.roles.tsx` | `/collab/$id/roles` | · | 6 (3) | · | · | · | · | · | · | · | S · 13m | Btn-in-Link ×2 · seed: collab |
| `collab.$id.settings.tsx` | `/collab/$id/settings` | · | 11 (2) | · | · | · | · | · | · | · | S · 11m | seed: collab |
| `collab.$id.share.tsx` | `/collab/$id/share` | · | 3 (1) | · | · | 2 | · | · | · | · | M · 40m | dead: L58 Copy link; L61 Share · seed: collab |
| `collab.$id.timeline.tsx` | `/collab/$id/timeline` | · | 5 (4) | · | 2 | · | · | 1 | · | · | M · 24m | Btn-in-Link ×2 · glyphs →✓ · seed: collab |
| `collab.$id.transfer.tsx` | `/collab/$id/transfer` | · | 2 (1) | · | · | · | · | · | · | · | S · 12m | Btn-in-Link ×2 · seed: collab |
| `collab.index.tsx` | `/collab/` | · | 6 (6) | · | · | · | · | · | 1 | 1 | M · 41m | Btn-in-Link ×5 · rel-time L196 · fab L196 · seed: collab |
| `collab.invites.$id.tsx` | `/collab/invites/$id` | · | 8 (4) | · | · | · | · | · | · | · | S · 14m | Btn-in-Link ×3 · seed: collab |
| `collab.invites.accepted.$id.tsx` | `/collab/invites/accepted/$id` | · | 4 (1) | · | · | · | · | · | · | · | S · 13m | Btn-in-Link ×3 · seed: collab |
| `collab.invites.declined.$id.tsx` | `/collab/invites/declined/$id` | · | · | · | · | · | · | · | · | · | S · 2m | Btn-in-Link ×2 · seed: collab |
| `collab.new.collaborators.tsx` | `/collab/new/collaborators` | · | 6 (4) | · | · | 2 | · | · | · | · | M · 43m | dead: L138 Copy link; L141 Disable link · Btn-in-Link ×2 · seed: collab |
| `collab.new.tsx` | `/collab/new` | · | 1 | · | · | · | · | · | · | · | S · 12m | Btn-in-Link ×2 · seed: collab |
| `collab.proposals.$id.counter.tsx` | `/collab/proposals/$id/counter` | · | · | · | · | · | · | · | · | · | S · 2m | Btn-in-Link ×2 · seed: collab |
| `collab.proposals.$id.tsx` | `/collab/proposals/$id` | · | 3 | · | · | 1 | · | · | · | · | M · 29m | dead: L78 Withdraw · Btn-in-Link ×4 · seed: collab |
| `collab.proposals.accepted.$id.tsx` | `/collab/proposals/accepted/$id` | · | 4 | · | · | · | · | · | · | · | S · 13m | Btn-in-Link ×3 · seed: collab |
| `collab.proposals.declined.$id.tsx` | `/collab/proposals/declined/$id` | · | · | · | · | · | · | · | · | · | S · 2m | Btn-in-Link ×2 · seed: collab |
| `collab.proposals.new.tsx` | `/collab/proposals/new` | · | 1 (1) | · | · | · | · | · | · | · | S · 12m | Btn-in-Link ×2 · seed: collab |
| `discover.community.tsx` | `/discover/community` | · | 1 | · | · | · | · | · | · | · | S · 10m | seed: band, business |
| `discover.music.tsx` | `/discover/music` | 1 | 3 | · | · | · | · | · | · | · | S · 13m | radius off-rule: 14px · seed: discover, portfolio |
| `discover.nearby.tsx` | `/discover/nearby` | 1 | 4 (1) | · | · | · | 1 | · | · | · | S · 19m | Btn-in-Link ×1 · radius off-rule: 14px · /talent L102 · seed: discover |
| `discover.projects.tsx` | `/discover/projects` | · | 2 | · | · | · | · | · | · | · | S · 11m | Btn-in-Link ×1 · seed: opportunities |
| `feed.tsx` | `/feed` | · | 29 (9) | · | · | 1 | · | 6 | · | 4 | L · 2.0h | dead: L287 Accept · fab L173,L223,L231,L233 · seed: dashboard · 460 lines |
| `help.$slug.tsx` | `/help/$slug` | · | 8 (4) | · | · | · | · | · | · | · | S · 13m | Btn-in-Link ×2 · seed: cms |
| `help.category.$key.tsx` | `/help/category/$key` | · | · | · | · | · | · | · | · | · | S · 1m | Btn-in-Link ×1 · seed: cms |
| `help.tsx` | `/help` | 1 | 7 (5) | · | · | · | · | · | · | · | S · 11m | seed: cms |
| `identity.analytics.tsx` | `/identity/analytics` | 2 | 5 (1) | · | · | · | · | 1 | · | · | S · 17m | Btn-in-Link ×1 · seed: identity |
| `identity.business.tsx` | `/identity/business` | · | 1 | · | · | · | · | · | · | · | S · 11m | Btn-in-Link ×1 · seed: identity |
| `identity.card.tsx` | `/identity/card` | · | 1 | · | · | · | · | 1 | · | · | S · 15m | seed: identity |
| `identity.contact.save.tsx` | `/identity/contact/save` | 1 | 2 (1) | · | · | · | · | · | · | · | S · 12m | Btn-in-Link ×2 · seed: identity |
| `identity.contact.tsx` | `/identity/contact` | 1 | 6 (2) | · | · | · | · | · | · | · | S · 13m | Btn-in-Link ×2 · seed: identity |
| `identity.customize.tsx` | `/identity/customize` | 3 | 2 | · | · | · | · | 2 | · | · | M · 23m | radius off-rule: 12px · seed: identity |
| `identity.full.tsx` | `/identity/full` | · | 2 | · | · | · | · | 6 | · | · | M · 40m | seed: identity |
| `identity.history.tsx` | `/identity/history` | · | · | · | · | · | · | · | · | · | S · 1m | Btn-in-Link ×1 · seed: identity |
| `identity.print.tsx` | `/identity/print` | 3 | 6 (3) | · | · | · | · | 1 | · | · | S · 16m | seed: identity |
| `identity.q.$code.tsx` | `/identity/q/$code` | 1 | 2 | · | · | · | · | · | · | · | S · 14m | Btn-in-Link ×4 · seed: identity |
| `identity.qr.tsx` | `/identity/qr` | · | 1 | · | · | · | · | 1 | · | · | S · 17m | Btn-in-Link ×2 · seed: identity |
| `identity.scan.tsx` | `/identity/scan` | · | 2 (1) | · | · | · | · | · | · | · | S · 10m | seed: identity |
| `identity.settings.tsx` | `/identity/settings` | 1 | 4 (2) | · | · | · | · | · | · | · | S · 12m | Btn-in-Link ×1 · seed: identity |
| `index.tsx` | `/` | · | 17 (15) | · | 4 | · | · | 2 | · | · | M · 54m | dead `<button>`: L39 🔔 · glyphs 🔔✨→★ · 1× type with no precedent (text-[30px]) · seed: discover |
| `legal.privacy.tsx` | `/legal/privacy` | · | 2 (1) | · | · | · | · | · | · | · | S · 10m |  |
| `legal.terms.tsx` | `/legal/terms` | · | 2 (1) | · | · | · | · | · | · | · | S · 10m |  |
| `marketplace/c.$slug.tsx` | `/marketplace/c/$slug` | · | · | · | 1 | · | · | · | · | · | S · 3m | glyphs 🎚 · seed: market |
| `marketplace/index.tsx` | `/marketplace/` | · | 3 (1) | · | · | · | · | · | · | · | M · 26m | dead `<button>`: L48 Mumbai, Maharashtra · chan · Btn-in-Link ×1 · seed: market |
| `marketplace/l.$id.tsx` | `/marketplace/l/$id` | · | 12 (4) | · | · | · | · | 1 | · | · | M · 33m | dead `<button>`: L79 (icon) · Btn-in-Link ×2 · seed: market |
| `marketplace/mine.tsx` | `/marketplace/mine` | · | 4 (3) | · | 1 | · | · | 1 | · | 1 | M · 34m | Btn-in-Link ×1 · glyphs 📝 · fab L61 · seed: market |
| `marketplace/nearby.tsx` | `/marketplace/nearby` | · | · | · | · | · | · | · | · | · | S · 0m | seed: market |
| `marketplace/rent/active.$id.tsx` | `/marketplace/rent/active/$id` | · | 16 (7) | · | 2 | · | · | 2 | · | · | L · 1.0h | dead `<button>`: L143 Report an issue with this ; L200 + Add return photos (optio · Btn-in-Link ×4 · glyphs →★ · seed: rentals |
| `marketplace/rent/c.$slug.tsx` | `/marketplace/rent/c/$slug` | · | 2 (2) | · | 1 | · | · | · | · | · | S · 14m | Btn-in-Link ×1 · glyphs 📦 · seed: rentals |
| `marketplace/rent/e.$id.tsx` | `/marketplace/rent/e/$id` | · | 22 (9) | · | · | · | · | 4 | · | · | M · 50m | dead `<button>`: L69 (icon) · Btn-in-Link ×3 · seed: rentals |
| `marketplace/rent/index.tsx` | `/marketplace/rent/` | · | 6 (3) | · | · | · | · | 1 | · | · | M · 32m | dead `<button>`: L58 Mumbai, Maharashtra · chan · Btn-in-Link ×1 · seed: rentals |
| `marketplace/rent/list.tsx` | `/marketplace/rent/list` | · | 22 (15) | · | 1 | 1 | · | 4 | · | · | L · 1.4h | dead: L355 Save draft · dead `<button>`: L141 Add; L145 + Add a short video (optio · Btn-in-Link ×2 · glyphs ✓ · seed: rentals |
| `marketplace/rent/listings.tsx` | `/marketplace/rent/listings` | · | 7 (5) | · | 2 | · | · | 2 | · | · | M · 28m | Btn-in-Link ×1 · glyphs 📦📝 · seed: rentals |
| `marketplace/rent/mine.tsx` | `/marketplace/rent/mine` | · | · | · | 1 | · | · | · | · | · | S · 4m | Btn-in-Link ×1 · glyphs 📭 · seed: rentals |
| `marketplace/rent/nearby.tsx` | `/marketplace/rent/nearby` | · | 5 (2) | · | · | · | · | · | · | · | M · 27m | dead `<button>`: L52 Use my current location · Btn-in-Link ×1 · seed: rentals |
| `marketplace/rent/provider.$id.tsx` | `/marketplace/rent/provider/$id` | · | 13 (7) | · | 2 | 1 | · | 1 | · | · | M · 38m | dead: L99 Follow · Btn-in-Link ×1 · glyphs ★📦 · seed: rentals |
| `marketplace/rent/request.$id.tsx` | `/marketplace/rent/request/$id` | · | 10 (8) | · | 2 | · | · | 2 | · | · | M · 29m | Btn-in-Link ×2 · glyphs →✓ · seed: rentals |
| `marketplace/rent/saved.tsx` | `/marketplace/rent/saved` | · | 2 (1) | · | 1 | · | · | · | · | · | S · 14m | Btn-in-Link ×1 · glyphs 🏢 · seed: rentals |
| `marketplace/rent/search.tsx` | `/marketplace/rent/search` | · | 6 (2) | · | 1 | · | · | · | · | · | S · 15m | Btn-in-Link ×1 · glyphs 🔍 · seed: rentals |
| `marketplace/saved.tsx` | `/marketplace/saved` | · | 4 (2) | · | 1 | · | · | · | · | · | S · 14m | Btn-in-Link ×1 · glyphs 🏢 · seed: market |
| `marketplace/search.tsx` | `/marketplace/search` | · | 2 (2) | · | 1 | · | · | · | · | · | S · 13m | glyphs 🔍 · seed: market |
| `marketplace/sell.tsx` | `/marketplace/sell` | · | 6 (4) | · | 5 | 1 | · | 2 | · | · | M · 52m | dead: L189 Save draft · Btn-in-Link ×1 · glyphs 🎸🎙📦🎚🏢 · seed: market |
| `marketplace/seller.$id.tsx` | `/marketplace/seller/$id` | · | 4 (1) | · | · | 1 | · | · | · | · | M · 26m | dead: L49 Follow · Btn-in-Link ×1 · seed: market |
| `me.tsx` | `/me` | · | · | · | · | · | · | · | · | · | S · 0m | live data · seed: profile |
| `messages.tsx` | `/messages` | · | 8 (8) | · | · | · | · | · | · | · | S · 11m | seed: discover |
| `notifications.index.tsx` | `/notifications/` | · | 6 (1) | · | 1 | · | · | · | · | · | S · 14m | glyphs → · seed: notifications |
| `notifications.settings.tsx` | `/notifications/settings` | · | 6 (3) | · | · | · | · | · | · | · | S · 11m | seed: notifications |
| `onboarding/complete.tsx` | `/onboarding/complete` | · | 3 | · | · | · | · | 1 | · | · | M · 21m | Btn-in-Link ×6 · live data · seed: onboarding |
| `onboarding/done.tsx` | `/onboarding/done` | · | 2 | · | · | · | · | · | · | · | S · 11m | Btn-in-Link ×1 |
| `onboarding/index.tsx` | `/onboarding/` | · | 3 (2) | · | · | · | · | 1 | · | · | S · 17m | Btn-in-Link ×2 · seed: onboarding |
| `onboarding/preview.tsx` | `/onboarding/preview` | · | 2 (1) | · | · | · | · | · | · | · | S · 12m | Btn-in-Link ×2 · seed: onboarding |
| `onboarding/resume.tsx` | `/onboarding/resume` | · | 2 (1) | · | · | · | · | 1 | · | · | S · 15m | seed: onboarding |
| `onboarding/skip.tsx` | `/onboarding/skip` | · | 2 (1) | · | · | · | · | · | · | · | S · 12m | Btn-in-Link ×2 · seed: onboarding |
| `onboarding/step.$id.tsx` | `/onboarding/step/$id` | · | · | · | · | · | · | · | · | · | S · 0m | seed: onboarding · 511 lines |
| `opportunities.$id.analytics.tsx` | `/opportunities/$id/analytics` | · | 6 (2) | · | 1 | · | · | 1 | · | · | S · 20m | Btn-in-Link ×1 · glyphs → · seed: opportunities |
| `opportunities.$id.applicants.$aid.tsx` | `/opportunities/$id/applicants/$aid` | 1 | 9 (4) | · | · | · | · | · | · | · | S · 17m | Btn-in-Link ×6 · seed: opportunities |
| `opportunities.$id.applicants.index.tsx` | `/opportunities/$id/applicants/` | · | · | · | · | · | · | · | · | · | S · 1m | Btn-in-Link ×1 · seed: opportunities |
| `opportunities.$id.apply.tsx` | `/opportunities/$id/apply` | 3 | 19 (8) | · | · | · | · | · | · | 1 | M · 30m | Btn-in-Link ×3 · fab L74 · seed: opportunities, portfolio |
| `opportunities.$id.index.tsx` | `/opportunities/$id/` | 1 | 12 (7) | · | · | 1 | · | · | · | · | M · 31m | dead: L216 Copy link · Btn-in-Link ×5 · seed: opportunities |
| `opportunities.$id.manage.tsx` | `/opportunities/$id/manage` | · | 7 (1) | · | · | · | · | · | · | · | S · 13m | Btn-in-Link ×2 · seed: opportunities |
| `opportunities.applications.$aid.tsx` | `/opportunities/applications/$aid` | · | 11 (2) | · | · | · | · | · | · | · | S · 14m | Btn-in-Link ×3 · seed: opportunities, portfolio |
| `opportunities.applications.index.tsx` | `/opportunities/applications/` | · | · | · | · | · | · | · | · | · | S · 1m | Btn-in-Link ×1 · seed: opportunities |
| `opportunities.index.tsx` | `/opportunities/` | 1 | 5 (3) | · | · | 1 | · | · | · | · | M · 29m | dead: L117 Change preferences · Btn-in-Link ×3 · seed: opportunities |
| `opportunities.mine.tsx` | `/opportunities/mine` | · | 2 | · | · | · | · | · | · | · | S · 14m | Btn-in-Link ×4 · seed: opportunities |
| `opportunities.new.tsx` | `/opportunities/new` | 7 | 22 (9) | · | · | · | · | · | · | · | S · 17m | Btn-in-Link ×4 · seed: opportunities |
| `opportunities.saved.tsx` | `/opportunities/saved` | · | · | · | · | · | · | · | · | · | S · 1m | Btn-in-Link ×1 · seed: opportunities |
| `opportunities.search.tsx` | `/opportunities/search` | · | 4 | · | · | · | · | · | · | · | S · 11m | Btn-in-Link ×1 · seed: opportunities |
| `plans.checkout.tsx` | `/plans/checkout` | · | 12 (4) | · | · | · | · | · | · | · | S · 13m | Btn-in-Link ×2 · seed: monetization |
| `plans.earnings.tsx` | `/plans/earnings` | · | 8 (2) | · | · | 1 | · | · | · | · | M · 27m | dead: L70 Change payout account · Btn-in-Link ×1 · seed: monetization |
| `plans.manage.tsx` | `/plans/manage` | · | 12 (4) | · | · | · | · | · | · | · | S · 12m | Btn-in-Link ×1 · seed: monetization |
| `plans.tsx` | `/plans` | · | 8 (2) | · | · | 1 | · | · | · | · | M · 28m | dead: L121 This is your current plan · Btn-in-Link ×2 · seed: monetization |
| `portfolio.$id.edit.tsx` | `/portfolio/$id/edit` | · | · | · | · | · | · | · | · | · | S · 0m | live data · seed: portfolio |
| `portfolio.$id.tsx` | `/portfolio/$id` | · | 3 (1) | · | 1 | · | · | · | · | · | S · 16m | Btn-in-Link ×3 · glyphs ↗ · live data · seed: portfolio |
| `portfolio.analytics.tsx` | `/portfolio/analytics` | · | 2 (1) | · | · | · | · | · | · | · | S · 11m | Btn-in-Link ×1 · live data · seed: portfolio |
| `portfolio.index.tsx` | `/portfolio/` | · | 2 | · | 1 | · | · | · | · | · | S · 19m | Btn-in-Link ×6 · glyphs ⚙ · live data · seed: portfolio |
| `portfolio.new.$kind.tsx` | `/portfolio/new/$kind` | · | · | · | · | · | · | · | · | · | S · 0m | live data · seed: portfolio |
| `portfolio.new.index.tsx` | `/portfolio/new/` | · | 1 (1) | · | · | · | · | 1 | · | · | S · 15m | seed: portfolio |
| `portfolio.reorder.tsx` | `/portfolio/reorder` | · | 1 (1) | · | · | · | · | · | · | · | S · 11m | Btn-in-Link ×1 · live data · seed: portfolio |
| `portfolio.select.tsx` | `/portfolio/select` | · | 1 (1) | · | 1 | · | · | 1 | · | · | S · 19m | Btn-in-Link ×1 · glyphs ✓ · live data · seed: portfolio |
| `portfolio.settings.tsx` | `/portfolio/settings` | · | 3 (3) | · | · | · | · | 2 | · | · | M · 21m | Btn-in-Link ×1 · seed: portfolio |
| `profile.$username.tsx` | `/profile/$username` | · | · | · | · | · | · | · | · | · | S · 0m | live data · seed: profile |
| `profile.edit.tsx` | `/profile/edit` | · | 10 (10) | · | · | · | · | · | · | · | S · 12m | Btn-in-Link ×1 · live data · seed: onboarding · 549 lines |
| `profile.insights.tsx` | `/profile/insights` | · | 4 (2) | · | · | · | · | 1 | · | · | S · 16m | Btn-in-Link ×1 · seed: profile |
| `provider.availability.tsx` | `/provider/availability` | · | 3 | · | · | · | · | · | · | · | S · 11m | Btn-in-Link ×1 · seed: booking |
| `provider.bookings.$ref.tsx` | `/provider/bookings/$ref` | · | 2 | · | · | · | · | · | · | · | S · 13m | Btn-in-Link ×3 · seed: booking |
| `provider.bookings.calendar.tsx` | `/provider/bookings/calendar` | · | 13 (8) | · | 2 | · | · | · | · | · | S · 17m | glyphs ←→ · seed: booking |
| `provider.bookings.index.tsx` | `/provider/bookings/` | · | 3 (2) | · | · | · | · | · | · | · | S · 10m | seed: booking |
| `provider.bookings.requests.$ref.tsx` | `/provider/bookings/requests/$ref` | · | 2 (1) | · | · | · | · | · | · | 0+1? | M · 28m | Btn-in-Link ×3 · fab? L168 (unverified) · seed: booking |
| `provider.bookings.requests.index.tsx` | `/provider/bookings/requests/` | · | 1 (1) | · | · | · | · | · | · | · | S · 10m | seed: booking |
| `provider.policies.tsx` | `/provider/policies` | · | 4 (1) | · | · | · | · | · | · | · | S · 10m | seed: booking |
| `provider.pricing.tsx` | `/provider/pricing` | · | 10 (2) | · | · | · | · | · | · | · | S · 11m | seed: booking |
| `recently-viewed.tsx` | `/recently-viewed` | 1 | 2 | · | · | 1 | 1 | · | · | · | M · 34m | dead: L92 Clear history · Btn-in-Link ×1 · radius off-rule: 14px · /talent L48 · seed: discover |
| `recommendations.settings.tsx` | `/recommendations/settings` | · | 5 (2) | · | · | 1 | · | · | · | · | M · 27m | dead: L65 Clear recommendation feedb · Btn-in-Link ×1 · seed: recommendations |
| `recommendations.tsx` | `/recommendations` | · | 7 (3) | · | · | 1 | · | · | · | · | M · 30m | dead: L143 Save · Btn-in-Link ×4 · seed: recommendations |
| `recommended.tsx` | `/recommended` | 1 | 5 (4) | · | 3 | · | · | · | · | · | S · 20m | glyphs ✕♡⚡ · seed: discover |
| `reset-password.tsx` | `/reset-password` | · | · | · | · | · | · | · | · | · | S · 0m | live data |
| `reviews.$id.edit.tsx` | `/reviews/$id/edit` | 1 | 1 | · | · | · | · | · | · | · | S · 10m | seed: reviews |
| `reviews.$id.reply.tsx` | `/reviews/$id/reply` | 1 | 4 | · | · | · | · | · | · | · | S · 11m | seed: reviews |
| `reviews.$id.report.tsx` | `/reviews/$id/report` | 1 | 4 (1) | · | · | · | · | · | · | · | S · 11m | seed: reviews |
| `reviews.request.tsx` | `/reviews/request` | · | 2 | · | · | · | · | · | · | · | S · 10m | seed: reviews |
| `reviews.tsx` | `/reviews` | · | 15 (4) | · | · | · | · | · | · | · | S · 13m | Btn-in-Link ×1 · seed: reviews |
| `reviews.write.$id.tsx` | `/reviews/write/$id` | · | 7 (2) | · | · | · | · | · | · | · | S · 13m | Btn-in-Link ×2 · seed: reviews |
| `saved.tsx` | `/saved` | · | 7 (7) | · | 1 | · | · | 1 | · | · | L · 1.1h | dead `<button>`: L109 Message; L112 Share; L115 ✕ · glyphs ✕ · seed: discover |
| `search.tsx` | `/search` | · | 12 (11) | · | 5 | 2 | · | · | · | · | M · 56m | dead: L172 Message; L173 ♡ Save · glyphs ←⚙★▶♡ · seed: discover |
| `services.$id.enquiry.tsx` | `/services/$id/enquiry` | 3 | 4 (1) | · | · | · | · | · | · | · | S · 12m | Btn-in-Link ×1 · seed: services |
| `services.$id.manage.tsx` | `/services/$id/manage` | · | 3 | · | · | · | · | · | · | · | S · 10m | seed: services |
| `services.$id.tsx` | `/services/$id` | · | 19 (6) | · | · | · | · | · | · | · | S · 16m | Btn-in-Link ×4 · seed: services |
| `services.availability.tsx` | `/services/availability` | · | 13 (6) | · | · | · | · | · | · | 0+1? | M · 27m | Btn-in-Link ×1 · fab? L33 (unverified) · seed: services |
| `services.conflicts.tsx` | `/services/conflicts` | · | 2 | · | · | 2 | · | · | · | · | M · 41m | dead: L82 Offer another time; L85 Keep both · Btn-in-Link ×1 |
| `services.index.tsx` | `/services/` | · | 6 (4) | · | 1 | · | · | · | · | · | S · 15m | Btn-in-Link ×1 · glyphs ★ · seed: services |
| `services.new.tsx` | `/services/new` | · | 16 (6) | · | 1 | · | · | · | · | · | S · 16m | Btn-in-Link ×1 · glyphs → · seed: services |
| `settings.account.tsx` | `/settings/account` | · | 7 (2) | · | · | · | · | · | · | · | S · 11m | seed: settings |
| `settings.delete-account.tsx` | `/settings/delete-account` | · | 4 (4) | · | · | · | · | · | · | · | S · 10m |  |
| `settings.index.tsx` | `/settings/` | · | 4 (3) | · | · | · | · | · | · | · | S · 10m | seed: settings |
| `settings.privacy.tsx` | `/settings/privacy` | · | 6 (1) | · | · | 1 | · | · | · | · | M · 27m | dead: L65 Request a copy · Btn-in-Link ×1 · seed: settings |
| `settings.security.tsx` | `/settings/security` | · | 6 (3) | · | · | · | · | · | · | · | S · 11m | seed: settings |
| `singers.tsx` | `/singers` | · | · | · | 3 | · | · | · | · | · | S · 9m | glyphs ☰▦▾ · seed: discover |
| `studio.tsx` | `/studio` | · | 15 (14) | 3 | 2 | 2 | · | 1 | · | 1 | L · 1.4h | dead: L155 Message; L158 Share · glyphs ←★ · fab L62 |
| `talent.$id.tsx` | `/talent/$id` | · | · | · | · | · | · | · | · | · | S · 0m | redirects to /profile/\$username |
| `verification.$type.tsx` | `/verification/$type` | 5 | 57 (7) | · | · | · | · | · | · | · | M · 24m | Btn-in-Link ×5 · radius off-rule: 14px · seed: verification · 603 lines |
| `verification.badge.tsx` | `/verification/badge` | · | 6 (2) | · | · | · | · | · | · | · | S · 11m | seed: verification |
| `verification.choose.tsx` | `/verification/choose` | 1 | 11 (3) | · | · | · | · | · | · | · | S · 11m | seed: verification |
| `verification.index.tsx` | `/verification/` | · | 10 (4) | · | · | · | · | · | · | · | S · 12m | Btn-in-Link ×1 · seed: verification |
| `verification.privacy.tsx` | `/verification/privacy` | · | 7 (3) | · | · | · | · | · | · | · | S · 11m | seed: verification |
| `welcome.tsx` | `/welcome` | · | · | · | · | · | · | · | · | · | S · 0m | live data |
| **205 files** | | **52** | **1069 (434)** | **9** | **56** | **45** | **2** | **70** | **1** | **8+2?** | **62.5h** | |

### Beyond the route files — `src/data` (21 modules)

This is where Phase 8's content-layer split, relative-time and photo work actually lives.

- **Photos.** The photo-ID column counts unique IDs per module. Across `src/` there are **51
  distinct Unsplash photos**, reused 132 times across modules, so the same portrait turns up as
  different people.
- **Emoji fields** are the "not as fields in data modules" case that `AGENTS.md:148` forbids.
- **Fabricated counts** are pattern hits, not individually read. In a sample of 11, 10 were real.

| Module | lines | importers (routes + ml/) | rel-time strings | fabricated (candidates) | emoji fields | Unsplash photo IDs | /talent | est. split |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| `collab` | 1226 | 30 + 3 | 13 | 9 | 6 | 18 | · | 5h |
| `onboarding` | 918 | 7 + 1 | · | · | 13 | · | · | 3.5h |
| `booking` | 908 | 19 + 2 | 3 | 19 | · | 6 | · | 3.5h |
| `rentals` | 856 | 12 + 1 | 6 | 55 | 6 | 18 | · | 3.5h |
| `profile` | 661 | 3 + 2 | · | 24 | · | 15 | · | 2.5h |
| `opportunities` | 588 | 15 + 1 | 18 | 35 | 20 | 11 | · | 2.5h |
| `market` | 485 | 9 + 1 | 9 | 28 | 6 | 20 | · | 2h |
| `identity` | 394 | 13 + 1 | 2 | 2 | · | · | 2 | 1.5h |
| `portfolio` | 394 | 12 + 2 | · | 20 | 10 | · | · | 1.5h |
| `business` | 328 | 15 + 0 | 5 | 9 | 6 | 9 | · | 1.5h |
| `verification` | 324 | 5 + 0 | 2 | 1 | · | · | · | 1.5h |
| `dashboard` | 304 | 1 + 0 | 4 | 4 | · | · | · | 1h |
| `band` | 268 | 9 + 0 | 2 | 3 | · | 9 | · | 1h |
| `discover` | 244 | 11 + 1 | · | 29 | 20 | 13 | · | 1h |
| `cms` | 233 | 3 + 0 | · | · | · | · | · | 1h |
| `settings` | 205 | 4 + 0 | 3 | · | · | · | · | 1h |
| `services` | 195 | 7 + 0 | · | 13 | 11 | · | · | 1h |
| `reviews` | 174 | 6 + 0 | 6 | 8 | · | 6 | · | 0.5h |
| `notifications` | 159 | 2 + 0 | 8 | · | 8 | 3 | · | 0.5h |
| `monetization` | 150 | 4 + 0 | · | · | · | · | · | 0.5h |
| `recommendations` | 139 | 2 + 0 | 2 | · | · | 4 | · | 0.5h |
| **21 modules** | **9153** | | **83** | **259** | **106** | **132** | **2** | **36.5h** |

**There is no local photography library in this repo.** `public/` holds only `favicon.ico` and
`robots.txt`. The only photo folders on disk belong to the other repo's website:
`frontend/website/assets/img/inspiration` (511 files), `editorials` (28) and `speakers` (23).
Whether those are licensed for app use is **unverified**. Until that is settled, Phase 8's "local
library, never stock" rule has nothing to swap to.

### Residue in `src/components/ml/` (swept in Phase 2)

- **0 arbitrary type or radius values.** Phase 2 held.
- **34 glyphs in 9 files**, and each renders on every screen that uses its component. They
  include `TopBar`'s `←` (`ui.tsx:86`) and `SearchBar`'s `⌕` and `🎙` (`ui.tsx:111,121`). 175
  routes use `TopBar` and 163 use `Screen`, so every screen with a back link shows the fallback
  glyph.
- **5 dead controls.**
  - `TalentRow`'s "Message" `Btn` and `♡` button (`cards.tsx:55,58`), on `search` and `singers`.
  - The person-profile `ShareSheet`'s "Share card", "Save contact" and "Download QR"
    (`profile.tsx:704-706`).
  - In the same sheet, "Copy link" changes its label but writes nothing to the clipboard
    (`profile.tsx:696-703`).
- **`HireModal` names the wrong person.** It says *"Ananya usually responds within 6 hours"*
  whoever is being hired (`hire-modal.tsx:33`). It appears on `band`, `search`, `studio` and the
  person profile.
- **79 inline `style=` in 14 files.** These are in Phase 6.2's scope.
- **3 Unsplash photos** in `onboarding.tsx:562-572`.

---

## Part 2 — Component map (`src/components/ml/`: 22 files, 8,310 lines)

There are **229 exports**: 208 components, 9 functions or constants, 4 hooks, 7 types and 1
re-export. References are resolved through each file's imports rather than by name. Ten names are
exported from more than one file (`StatusPill` ×3, `EmptyState` ×4, `OfflineBanner` ×3 …), so a
name search would miscount.

| Flag | Count | Which |
|---|--:|---|
| Dead — no reference anywhere in `src/` | 8 | `BookableEntityCard` (booking), `LogoMark` (logo), `ListingSkeleton` (market), `AudioPreview` (portfolio), `ProfileSkeleton` and `MiniPlayer` (profile), `RentalRequestCard` and `RentalLocationRow` (rental). Each was confirmed by a whole-word search of `src/`. |
| Exported but used only inside its own file | 12 | `Brand`, `passwordChecks` (auth); `Waveform` (collab); `OfflineBanner`, `SavingBanner` (onboarding); `MediaStatePill`, `FeaturedToggle` (portfolio); `VerificationBadge`, `StatusBadge`, `TagChip` (profile); `BottomNav` (ui); `initialsOf` (viewer). The `export` keyword can go. |
| One call site | 70 | 52 are used by a single route and could move into it. The other 18 are used by another `ml/` file; 15 of those are `profile.tsx` pieces used only by `person-profile.tsx`, which is one component split across two files rather than reuse. |

### The four named pairs

| Pair | Verdict | Evidence |
|---|---|---|
| `AvailabilityBadge` / `StatusPill` | **Confirmed duplicate** | Same outer classes, same dot, same three colour pairs (`ui.tsx:162-178`, `kit.tsx:12-40`). AvailabilityBadge is StatusPill with a fixed map, and its unknown-status fallback is never reached: all 4 call sites pass the typed `Talent.availability`. But there are **three** `StatusPill`s. `collab.tsx:42` and `portfolio.tsx:61` overlap only partly (different API, spacing and tokens). And "Booked" already renders three ways: grey here, red in `bands.tsx:89-96`, amber in `bands.$id.tsx:147-150`. Consolidating forces that design decision. |
| `Chip` / `Segmented` | **Refuted as a duplicate — partial overlap** | Segmented's item classes copy Chip's (`kit.tsx:68-72` vs `ui.tsx:139-143`). But Segmented is a whole single-select group with `role="tablist"` (13 uses, 13 routes). Chip is an atom used 110 times in 62 files for single-select, multi-select, actions and static labels. **26 `<Chip>`s have no `onClick`** and render as buttons that do nothing (e.g. `search.tsx:56-60`). |
| `Sheet` / `Dialog` | **Partial overlap; both hand-roll an installed Radix primitive** | They share an overlay shell and backdrop button (`ui.tsx:226-231`, `kit.tsx:224-232`); panels and APIs differ. Only Dialog sets `role="dialog"` / `aria-modal`. **Neither traps focus, closes on Escape, locks scroll or renders in a portal.** Neither file contains any state, ref, effect or portal code. The only hook either file imports is `useRouterState`, used for the nav highlight (`ui.tsx:1`). The Radix `ui/sheet` and `ui/dialog` have **0 live uses**. The ml `Sheet` has 38 uses in 28 files; the ml `Dialog` has 23 in 17. |
| `Loading` / `ui/skeleton` | **Partial** — Loading is rows of it | `kit.tsx:148-156` renders N × `h-20 animate-pulse rounded-md bg-subtle` inside an `aria-busy` wrapper, with 5 uses. The **confirmed** duplicate of `ui/skeleton` is a different component: `Skeleton` in `qr.tsx:466`, same markup with a different colour token. |

**What the Phase 6 plan doesn't account for** (each point verified by reading):

- **`Btn` can't act as a Radix trigger.** It forwards no ref and passes no other props through (`ui.tsx:180-211`). So
  `<DialogTrigger asChild><Btn/></DialogTrigger>` loses focus return and `aria-expanded`. The same
  missing link form causes the 233 `Btn`-in-`Link` cases in Part 1. Fixing `Btn` is the first step
  of Phase 6, not a detail.
- **8 of the 23 `Dialog` uses are confirmations** — e.g. `settings.security.tsx:84`, `bands.$id.manage.tsx:179`.
  They fit `ui/alert-dialog`, which deliberately does not close on an outside click, so moving them
  changes behaviour users have today.
- **`ui/skeleton` paints `bg-primary/10`, a pink tint**, and has never rendered in this app. Change its
  default before routing ten skeletons through it.
- **There are six `as any` casts on router links, not one** — see below. Phase 6.1 names only `Row`.
- **Moving `Sheet` into a portal:** no ancestor in the same file carries a transform or filter.
  Ancestors in other components are **unverified**.

### Other names exported more than once

| Name | Verdict | What differs |
|---|---|---|
| `Card` (collab, kit) | **Confirmed duplicate** | `div` vs `section`; `rounded-3xl` vs `rounded-lg`, both 32px |
| `OfflineBanner` (booking, collab, onboarding) | Partial | Each hard-codes its own copy. Collab's says "2 changes not yet synced", which nothing backs (`collab.tsx:517-529`) |
| `ErrorState` (booking, collab) | Partial | required vs optional props; only booking's has `role="alert"` |
| `EmptyState` (booking, collab, kit, market) | Partial | the icon slot and CTA prop differ; market's takes an emoji |
| `StickyBar` (booking, collab) | Partial | `fixed` vs `sticky`. Booking's `disabled` never sets the attribute (`booking.tsx:899-900`) |
| `StateCard` (portfolio, qr) | Partial | `action` vs `children`; only portfolio's has an error tone |
| `AudioPlayer` (collab, portfolio) | Partial | **Collab's has no media element and plays nothing** (`collab.tsx:306-328`) |
| `ProjectCard` (collab, profile) | Different job | a workspace link vs a static credit |
| `OpportunityCard` (opportunity, profile) | Different job | a job listing vs a profile callout |
| Skeleton family (10 components) | One primitive, ten layouts | All use `animate-pulse bg-subtle` and none uses `ui/skeleton`. The ARIA is inconsistent: `aria-hidden`, `aria-busy`, or nothing |

### Hand-rolled where an installed primitive already covers it

Only **2 of the 46** `ui/` files are imported from outside `ui/`: `avatar`, by `ml/viewer.tsx`, and
`sonner`, by `__root.tsx`. The other 44, including every primitive below, have no live importer.

| Hand-rolled | Installed | Verified gap |
|---|---|---|
| `Sheet`, plus 11 components built on it (`FilterSheet`, `HireModal`, `MarketFilterSheet`, `SortSheet`, `OfferSheet`, `ReportSheet`, `ShareSheet`, `MoreSheet`, `RentalFilterSheet`, `RentalReportSheet`, `PhotoPicker`) | `sheet`, `drawer` | no role, focus trap, Escape, scroll lock or portal |
| `Dialog` | `dialog`, `alert-dialog` | no focus trap, Escape, scroll lock or portal |
| `Segmented`, `Chip`, and the tab strip in `PersonProfileExperience` | `tabs`, `toggle-group`, `toggle` | no roving focus or arrow keys; Chip exposes no selected state |
| `SwitchRow` (`collab.tsx:744`) and the local toggle in `filter-sheet.tsx:79` | `switch` | a drawn track with no `role="switch"` and no `aria-checked` |
| `OptionList`, `ChoiceGrid`, `FulfilmentPicker`, the `HireModal` options, `WorkForm`'s visibility picker, `SortSheet` / `ReportSheet` | `checkbox`, `radio-group` | choice shown only by `aria-pressed`, a drawn circle, or a `✓` character |
| `MilestoneRow`'s done toggle | `checkbox` | exposes no state at all |
| `Meter`, `MatchBar`, and the bars in `ProjectCard`, `UploadPanel`, `PasswordRequirements` | `progress` | width-styled divs; no `role="progressbar"`, no `aria-value*` |
| `AvailabilityCalendar`, `RentalCalendar` | `calendar` | no grid semantics or arrow keys. RentalCalendar's days are unlabelled and selection is shown by colour alone |
| 11 profile-photo `<img>`s (`ParticipantRow`, `PosterRow`, `ProviderSummary` …) | `avatar` | no fallback when the image fails to load |
| `VerifiedBadge`, `VerificationBadge`, `SocialLinks` | `tooltip` | a native `title` only |

Nothing in `ml/` hand-rolls a popover, dropdown menu, accordion, slider, scroll area, OTP input or
carousel. No route hand-rolls a modal; every one goes through the ml `Sheet` or `Dialog`.

### Every `as any` and `eslint-disable` in `ml/`

| Where | What | Reason given |
|---|---|---|
| `kit.tsx:117-118` | `no-explicit-any` disabled; `Row` casts `to={to as any}` and `params as any` | none. AGENTS.md calls it a known defect. `Row` has 61 uses in 25 routes |
| `qr.tsx:315-316` | `no-explicit-any` disabled; `to={to as any}` | none |
| `qr.tsx:447-448` | `no-explicit-any` disabled; `to={a.to as any}` | none |
| `booking-context.tsx:72` | `react-hooks/exhaustive-deps` disabled on a `useMemo` | None. It leaves `set` and `toggleAddOn` out of the dependency list. Both only call `setDraft` with updater functions (`:48-55`), so the stale reference is harmless — confirmed by reading, not assumed |
| `portfolio.tsx:135, 372, 395` | `jsx-a11y/media-has-caption` disabled | "user-supplied external link (YouTube/Spotify/SoundCloud); no caption track exists to attach, and an empty `<track>` would assert captions that are not there" |
| `onboarding.tsx:159` | `draft[field] as unknown as string[]` | none. A double cast rather than an `any`, but the same escape hatch |

Outside `ml/`, and so in 6.1's scope: `help.$slug.tsx:93-94` and `recommendations.tsx:139-140` also
cast `to` to `any`. Separately, `TopBar` passes its plain `back: string` prop straight to
`<Link to>` (`ui.tsx:75,82`) on 175 routes. Whether the router checks those links is
**unverified**.

### The larger duplication: two component systems

The guide already ships a component library, as four CSS files in `frontend/guide/system/` of
`wugweb-git/musiclinkd` (read at `79ae094`). This app re-implements much of it by hand in `ml/`.

| Guide file | Size | What it holds | Last content change |
|---|---|---|---|
| `ml-tokens.css` | 200 lines · 9 KB | the foundation variables | `beec4ed`, 31 Aug |
| `ml-core.css` | 1,373 lines · 66 KB | 50 primitive families — `.ml-media`, `.ml-chip`, `.ml-btn`, `.ml-avatar` … | `38f25e8`, 1 Sep |
| `ml-widgets.css` | 2,635 lines · 152 KB | 122 distinct `.ml-*` base names; the guide itself counts 116 widget families | `38f25e8`, 1 Sep |
| `ml-fixes.css` | 379 lines · 21 KB | the fix layer — "Load AFTER ml-tokens.css, ml-core.css and ml-widgets.css" (`:4`) | `e218b9c`, 1 Sep |

- **The library is self-contained.** `ml-widgets.css` makes 67 distinct `var()` references. 66 are
  defined in `ml-tokens.css`, and the 67th (`--ml-cal-cell`) is local. There is no `@import`.
- **The names collide, but the values mostly don't.** Eight of the nine app/guide pairs already hold
  the same value:

  | App name | Guide name |
  |---|---|
  | `--card` | `--color-white` |
  | `--surface-subtle` | `--color-surface` |
  | `--border` | `--color-line` |
  | `--muted-foreground` | `--color-muted` |
  | `--primary` | `--color-pink` |
  | `--pink-strong` | `--color-pink-pressed` |
  | `--pink-container` | `--color-pink-container` |
  | `--easing-standard` | `--ease-standard` |

  **The ninth pair is the page ground.** `--background` is `#ECECF1` here, while `--color-paper` is
  `#FCFCFD` there. `#FCFCFD` is the value PR #8 replaced for contrast; `tokens.json` describes that
  change but never applied it. `--type-1..4`, `--elevation-*` and `--duration-*` match exactly.
- **Three differences would be undone by an import:**
  - the page ground (above);
  - `--font-display`, which is still `'Inter Tight'` in the guide (`ml-tokens.css:93`), although
    this app dropped it in PR #13;
  - font weight. The guide's `--weight-4` is 800 (`ml-tokens.css:84`) and the widgets use it 17
    times, but this app loads Inter only up to 700. Adopt the guide and every `--weight-4` title
    renders at 700 unless 800 is loaded.
- **The app lacks whole token families that the widgets depend on:** `--space-1..4` (`--space-2`
  alone is used 136 times), `--weight-*`, `--radius-1..4`, `--size-*`, `--icon-*`, `--avatar-*`,
  `--z-*`, `--border-1/2`, `--media-aspect-*`, `--safe-*`, and all but two `--status-*`.
- **`ml-core.css` is not scoped to its own classes.** It styles `*, *::before, *::after` (`:22`),
  `[hidden]` (`:30`) and `body` (`:32`), so importing it restyles this app's base, not just `.ml-*`.
  On top of that, Tailwind v4 keeps its utilities in a cascade layer, so any stylesheet imported
  without a layer outranks every utility, whatever the specificity. An import therefore has to go
  into `@layer components`.
- **The guide is not moving underneath this.** `ml-fixes.css` was last written at 10 Sep 20:13 UTC
  (its mtime, which is 01:43 IST), but its content hasn't changed since `e218b9c` on 1 Sep, and the
  guide repo's tree is clean. Pin `79ae094` anyway.

Where the twelve widgets from the design-guide list land in this app, checked against the code.
The guide's own "recycled on" counts are in brackets.

| Widget (guide reuse) | App counterpart today | Verdict |
|---|---|---|
| profile hero (51 screens) | `ProfileHero` `profile.tsx:187` puts the name below the cover and the stats in a separate `StatRow`. Also the preview header in `search.tsx:103`, and `BookableHero` `booking.tsx:123` | `ProfileHero` diverges; the other two match |
| media card (10) | hand-built three times: "Trending" in `index.tsx:83` (`from-navy/85`, `text-[15px]`, `text-[11px]`), `FeaturedCard` `profile.tsx:291`, and `band.tsx:127` | matches — the cleanest single swap |
| audio player (7) | two `AudioPlayer`s (collab's plays nothing), `AudioTrackCard` (plays nothing) and `MiniPlayer` (0 uses). `Waveform` can't scrub | diverges |
| surface effects (6) | 26 hand-rolled `backdrop-blur` surfaces. `shadow-elevation-2` is defined but used 0 times | glass diverges; lift and grain are absent |
| inset card (5) | `ListingCard` `market.tsx:147` and `EquipmentCard` `rental.tsx:78`. The photo runs to the card edge, and there is no price pill | diverges |
| "what are you looking for?" grid (1) | `categories.tsx:28`, the rail at `index.tsx:52`, and `CategoryTile`. They show an emoji on pink, not photos | diverges |
| lede (1) | none; the closest are 13 bold spans in captions | diverges |
| featured studio card (0) | `BookableEntityCard` `booking.tsx:162`, which is dead | unused on both sides |
| tooltip · popover · help button · sticker (0) | native `title` attributes; `MoreSheet` built on the hand-rolled `Sheet`; nothing else | unused on both sides |

The other widgets in `ml-widgets.css` are not mapped here; that is the next document. They include
the app shell, tab bar, sheet, toast, empty state, tabs, calendar, chat, timeline, rating, player
and QR.

**The decision this document does not make.** There are three options:

- **Import the classes.** Fast, and it stays in sync with the guide. But it adds a second styling
  mechanism, against `AGENTS.md`'s "one styling mechanism" rule.
- **Port each widget to React and Tailwind.** Keeps one mechanism, but porting by hand is how the
  duplication happened.
- **Import only the tokens.** Gives a shared foundation, but no widgets.

Whichever it is, it has to be decided before Phase 8's codemod (see Part 4).

### Every export

References count JSX tags, calls and other value uses in files other than the defining one. Uses
inside the defining file appear as "internal".

<details><summary>229 exports — expand</summary>

| Export | Defined | Kind | Refs · files | Where used | Flags |
|---|---|---|--:|---|---|
| `AuthScreen` | `auth.tsx:9` | component | 15 · 12 | auth.forgot, auth.index, auth.locked, auth.maintenance, auth.offline, +7 |  |
| `Brand` | `auth.tsx:34` | component | 0 · 0 (+1 internal) | — | used only in its own file — drop `export` |
| `AuthHeading` | `auth.tsx:48` | component | 13 · 11 | auth.forgot, auth.index, auth.locked, auth.maintenance, auth.offline, +6 |  |
| `Divider` | `auth.tsx:57` | component | 1 · 1 | auth.index | 1 call site |
| `NoticeTone` | `auth.tsx:69` | type | 0 · 0 (+2 internal) | — |  |
| `AuthNotice` | `auth.tsx:78` | component | 8 · 7 | auth.forgot ×2, auth.index, auth.otp, auth.phone, auth.verify-email, +2 |  |
| `LabeledInput` | `auth.tsx:105` | component | 3 · 3 | auth.forgot, auth.index, auth.phone |  |
| `PasswordInput` | `auth.tsx:143` | component | 3 · 2 | auth.index, reset-password ×2 |  |
| `PasswordCheck` | `auth.tsx:186` | type | 0 · 0 (+1 internal) | — |  |
| `passwordChecks` | `auth.tsx:188` | function/const | 0 · 0 (+2 internal) | — | used only in its own file — drop `export` |
| `passwordScore` | `auth.tsx:197` | function/const | 2 · 2 | auth.index, reset-password |  |
| `PasswordRequirements` | `auth.tsx:201` | component | 2 · 2 | auth.index, reset-password |  |
| `LegalNote` | `auth.tsx:243` | component | 2 · 2 | auth.index, welcome |  |
| `TrustNote` | `auth.tsx:259` | component | 8 · 8 | auth.forgot, auth.locked, auth.maintenance, auth.offline, auth.phone, +3 |  |
| `AuthErrorKind` | `auth.tsx:270` | type | 0 · 0 (+1 internal) | — |  |
| `classifyAuthError` | `auth.tsx:279` | function/const | 6 · 3 | auth.forgot ×2, auth.index ×2, reset-password ×2 |  |
| `BookingDraft` | `booking-context.tsx:4` | type | 0 · 0 (+4 internal) | — |  |
| `useBookingDraft` | `booking-context.tsx:29` | hook | 7 · 7 | booking.\$id.addons, booking.\$id.details, booking.\$id.index, booking.\$id.pay, booking.\$id.review, +2 |  |
| `BookingDraftProvider` | `booking-context.tsx:35` | component | 1 · 1 | booking.\$id | 1 call site |
| `BookingStatusPill` | `booking.tsx:49` | component | 4 · 4 (+2 internal) | booking.confirmed.\$ref, bookings.\$ref.index, provider.bookings.\$ref, provider.bookings.calendar |  |
| `PaymentPill` | `booking.tsx:63` | component | 2 · 2 | bookings.\$ref.index, provider.bookings.\$ref |  |
| `BookingTimeline` | `booking.tsx:71` | component | 2 · 2 | bookings.\$ref.index, provider.bookings.\$ref |  |
| `BookableHero` | `booking.tsx:123` | component | 1 · 1 | booking.\$id.index | 1 call site |
| `EntityMetaRow` | `booking.tsx:146` | component | 1 · 1 | booking.\$id.index | 1 call site |
| `BookableEntityCard` | `booking.tsx:162` | component | 0 · 0 | — | **dead** |
| `ResourceCard` | `booking.tsx:184` | component | 1 · 1 | booking.\$id.service | 1 call site |
| `AvailabilityCalendar` | `booking.tsx:253` | component | 3 · 3 | booking.\$id.schedule, bookings.\$ref.reschedule, provider.availability | grid of aria-pressed buttons (ui/calendar) |
| `SlotPicker` | `booking.tsx:367` | component | 2 · 2 | booking.\$id.schedule, bookings.\$ref.reschedule |  |
| `DurationPicker` | `booking.tsx:413` | component | 1 · 1 | booking.\$id.schedule | 1 call site |
| `AddOnCard` | `booking.tsx:470` | component | 1 · 1 | booking.\$id.addons | 1 call site |
| `PriceBreakdownCard` | `booking.tsx:516` | component | 5 · 5 | booking.\$id.addons, booking.\$id.review, bookings.\$ref.index, provider.bookings.\$ref, provider.bookings.requests.\$ref |  |
| `PolicyCard` | `booking.tsx:568` | component | 5 · 5 | booking.\$id.index, booking.\$id.review, bookings.\$ref.cancel, bookings.\$ref.index, provider.availability |  |
| `AcknowledgeRow` | `booking.tsx:592` | component | 1 · 1 | booking.\$id.review | 1 call site |
| `BookingSummaryCard` | `booking.tsx:618` | component | 1 · 1 | booking.\$id.review | 1 call site |
| `Detail` | `booking.tsx:660` | component | 38 · 7 (+4 internal) | booking.\$id.review ×4, booking.confirmed.\$ref ×8, bookings.\$ref.cancel ×6, bookings.\$ref.index ×6, bookings.\$ref.reschedule ×2, +2 |  |
| `BookingListCard` | `booking.tsx:669` | component | 2 · 2 | bookings.index, provider.bookings.index |  |
| `ProviderRequestCard` | `booking.tsx:714` | component | 2 · 2 | provider.bookings.index, provider.bookings.requests.index |  |
| `PaymentSummaryCard` | `booking.tsx:759` | component | 1 · 1 | booking.\$id.pay | 1 call site |
| `OfflineBanner` | `booking.tsx:782` | component | 2 · 2 | booking.\$id.schedule, bookings.index | partial — 3 OfflineBanners |
| `ErrorState` | `booking.tsx:808` | component | 2 · 2 | booking.\$id.schedule, bookings.index | partial vs collab#ErrorState |
| `EmptyState` | `booking.tsx:829` | component | 10 · 9 | booking.\$id.schedule, bookings.\$ref.cancel, bookings.\$ref.index, bookings.\$ref.reschedule, bookings.index, +4 | partial — 4 EmptyStates |
| `BookingSkeleton` | `booking.tsx:848` | component | 3 · 3 | bookings.index, provider.bookings.index, provider.bookings.requests.index | skeleton family — one primitive, 10 layouts |
| `CalendarSkeleton` | `booking.tsx:858` | component | 1 · 1 | booking.\$id.schedule | 1 call site; skeleton family — one primitive, 10 layouts |
| `StickyBar` | `booking.tsx:875` | component | 12 · 12 | booking.\$id.addons, booking.\$id.details, booking.\$id.index, booking.\$id.pay, booking.\$id.review, +7 | partial vs collab#StickyBar; `disabled` never sets the attribute |
| `StepDots` | `booking.tsx:909` | component | 5 · 5 | booking.\$id.addons, booking.\$id.details, booking.\$id.review, booking.\$id.schedule, booking.\$id.service |  |
| `TalentRow` | `cards.tsx:5` | component | 2 · 2 | search, singers |  |
| `TalentCard` | `cards.tsx:70` | component | 2 · 2 | feed, index |  |
| `TalentGridCard` | `cards.tsx:103` | component | 1 · 1 | singers | 1 call site |
| `DeletedState` | `collab-extra.tsx:8` | component | 11 · 11 | collab.\$id.agreement, collab.\$id.invite-link, collab.\$id.media, collab.\$id.milestones.\$mid, collab.\$id.remove.\$pid, +6 |  |
| `MediaTile` | `collab-extra.tsx:23` | component | 1 · 1 | collab.\$id.media | 1 call site |
| `OutcomePanel` | `collab-extra.tsx:55` | component | 7 · 7 | collab.\$id.remove.\$pid, collab.\$id.transfer, collab.invites.accepted.\$id, collab.invites.declined.\$id, collab.proposals.accepted.\$id, +2 |  |
| `ConfirmPanel` | `collab-extra.tsx:77` | component | 2 · 2 | collab.\$id.remove.\$pid, collab.\$id.transfer |  |
| `WorkspaceShell` | `collab-workspace.tsx:17` | component | 10 · 10 | collab.\$id.activity, collab.\$id.agreement, collab.\$id.discussion, collab.\$id.files.index, collab.\$id.index, +5 |  |
| `StatusPill` | `collab.tsx:42` | component | 1 · 1 (+1 internal) | ml/collab-workspace | 1 call site; partial overlap with kit#StatusPill |
| `Tag` | `collab.tsx:56` | component | 13 · 6 (+2 internal) | collab.\$id.files.\$fileId ×3, collab.\$id.index ×4, collab.\$id.milestones.\$mid, collab.\$id.roles, collab.invites.\$id ×3, +1 |  |
| `Card` | `collab.tsx:68` | component | 34 · 22 (+5 internal) | collab.\$id.agreement ×3, collab.\$id.discussion, collab.\$id.files.\$fileId, collab.\$id.index ×2, collab.\$id.invite-link, +17 | **duplicate** of kit#Card (confirmed) |
| `Label` | `collab.tsx:74` | component | 60 · 23 (+5 internal) | collab.\$id.activity, collab.\$id.agreement ×8, collab.\$id.files.\$fileId ×2, collab.\$id.files.index, collab.\$id.index ×4, +18 |  |
| `ParticipantStack` | `collab.tsx:86` | component | 2 · 2 (+1 internal) | collab.\$id.index, collab.invites.accepted.\$id |  |
| `ParticipantRow` | `collab.tsx:118` | component | 3 · 1 | collab.\$id.participants ×3 |  |
| `ProjectCard` | `collab.tsx:193` | component | 1 · 1 | collab.index | 1 call site; same name as profile#ProjectCard, different job |
| `FileRow` | `collab.tsx:243` | component | 2 · 2 | collab.\$id.files.index, collab.\$id.index |  |
| `Waveform` | `collab.tsx:288` | component | 0 · 0 (+1 internal) | — | used only in its own file — drop `export` |
| `AudioPlayer` | `collab.tsx:306` | component | 1 · 1 | collab.\$id.files.\$fileId | 1 call site; partial vs portfolio#AudioPlayer; no media element — plays nothing |
| `MilestoneRow` | `collab.tsx:334` | component | 2 · 2 | collab.\$id.index, collab.\$id.timeline | done toggle exposes no state (ui/checkbox) |
| `ActivityItem` | `collab.tsx:390` | component | 2 · 2 | collab.\$id.activity, collab.\$id.index |  |
| `ProposalSummary` | `collab.tsx:409` | component | 2 · 2 | collab.proposals.\$id, collab.proposals.accepted.\$id |  |
| `CollabSkeleton` | `collab.tsx:448` | component | 1 · 1 | collab.index | 1 call site; skeleton family — one primitive, 10 layouts |
| `EmptyState` | `collab.tsx:468` | component | 13 · 8 | collab.\$id.activity, collab.\$id.discussion, collab.\$id.files.index, collab.\$id.media, collab.\$id.notes, +3 | partial — 4 EmptyStates |
| `ErrorState` | `collab.tsx:492` | component | 1 · 1 (+1 internal) | collab.index | 1 call site; partial vs booking#ErrorState |
| `OfflineBanner` | `collab.tsx:515` | component | 1 · 1 | collab.index | 1 call site; partial — 3 OfflineBanners; hard-codes “2 changes not yet synced” |
| `PermissionState` | `collab.tsx:534` | component | 15 · 15 | collab.\$id.activity, collab.\$id.discussion, collab.\$id.files.\$fileId, collab.\$id.files.index, collab.\$id.index, +10 |  |
| `PinnedNote` | `collab.tsx:543` | component | 2 · 2 | collab.\$id.discussion, collab.\$id.index |  |
| `UploadPanel` | `collab.tsx:559` | component | 1 · 1 | collab.\$id.files.index | 1 call site |
| `Field` | `collab.tsx:633` | component | 36 · 7 | collab.\$id.lifecycle.\$action, collab.\$id.milestones.new ×4, collab.invites.\$id, collab.new ×8, collab.proposals.\$id.counter ×6, +2 |  |
| `TextInput` | `collab.tsx:656` | component | 27 · 9 | collab.\$id.discussion, collab.\$id.lifecycle.\$action, collab.\$id.milestones.new ×3, collab.\$id.notes, collab.invites.\$id, +4 |  |
| `StickyBar` | `collab.tsx:690` | component | 11 · 11 | collab.\$id.lifecycle.\$action, collab.\$id.milestones.new, collab.\$id.remove.\$pid, collab.\$id.transfer, collab.invites.\$id, +6 | partial vs booking#StickyBar |
| `RowLink` | `collab.tsx:698` | component | 14 · 2 | collab.\$id.files.\$fileId ×4, collab.\$id.settings ×10 |  |
| `SwitchRow` | `collab.tsx:744` | component | 9 · 3 | collab.\$id.invite-link ×2, collab.\$id.settings ×4, collab.\$id.share ×3 | hand-rolls ui/switch: no role=switch, no aria-checked |
| `FilterSheet` | `filter-sheet.tsx:21` | component | 2 · 2 | search, singers |  |
| `HireModal` | `hire-modal.tsx:11` | component | 4 · 4 | band, search, studio, ml/person-profile | options are drawn radios with no ARIA state; inherits Sheet gaps |
| `Tone` | `kit.tsx:10` | type | 1 · 1 (+2 internal) | ml/opportunity |  |
| `StatusPill` | `kit.tsx:21` | component | 67 · 40 | bands.\$id.events, bands.\$id.manage ×2, bands.\$id ×4, bands, business.\$id.dashboard, +35 | canonical pill; ui#AvailabilityBadge duplicates it; collab#/portfolio#StatusPill partial |
| `Card` | `kit.tsx:42` | component | 199 · 69 | bands.\$id.contact ×3, bands.\$id.events ×2, bands.\$id.invite, bands.\$id.manage ×4, bands.\$id.portfolio ×2, +64 | collab#Card duplicates it |
| `Segmented` | `kit.tsx:50` | component | 13 · 13 | bands.\$id.events, bands.\$id.manage, bands.\$id.portfolio, bands.\$id, bands, +8 | partial overlap with ui#Chip; ui/tabs or ui/toggle-group covers it |
| `Row` | `kit.tsx:81` | component | 61 · 25 | bands.\$id.invite, bands.\$id.manage ×4, bands.\$id ×3, bands.new, business.\$id.dashboard ×7, +20 | `to as any` + `params as any` (kit.tsx:118) |
| `EmptyState` | `kit.tsx:130` | component | 68 · 54 | bands.\$id.contact, bands.\$id.events ×3, bands.\$id.invite, bands.\$id.manage ×2, bands.\$id.portfolio ×3, +49 | partial — 4 EmptyStates |
| `Loading` | `kit.tsx:148` | component | 5 · 5 | bands, opportunities.\$id.applicants.index, opportunities.applications.index, opportunities.index, recommendations | partial vs ui/skeleton (rows of it) |
| `Stars` | `kit.tsx:158` | component | 5 · 4 | business.\$id.reviews, reviews.\$id.edit, reviews.\$id.reply, reviews ×2 |  |
| `Meter` | `kit.tsx:174` | component | 6 · 5 | bands.new, business.\$id.analytics ×2, opportunities.\$id.analytics, plans.manage, reviews | progress bar without role/aria-value* (ui/progress) |
| `ReasonChip` | `kit.tsx:200` | component | 4 · 3 | opportunities.\$id.applicants.\$aid, recommendations, ml/opportunity ×2 |  |
| `Dialog` | `kit.tsx:208` | component | 23 · 17 | bands.\$id.invite, bands.\$id.manage ×3, bands.new, business.\$id.manage ×2, business.new, +12 | hand-rolls ui/dialog: no focus trap, Escape, scroll lock or portal; 8 confirm uses fit ui/alert-dialog |
| `LogoMark` | `logo.tsx:9` | component | 0 · 0 | — | **dead** |
| `SaveButton` | `market.tsx:7` | component | 4 · 3 (+3 internal) | marketplace/l.\$id, marketplace/rent/e.\$id, ml/rental ×2 |  |
| `ConditionBadge` | `market.tsx:39` | component | 5 · 4 (+2 internal) | marketplace/l.\$id, marketplace/rent/e.\$id, marketplace/rent/list, ml/rental ×2 |  |
| `Rating` | `market.tsx:50` | component | 10 · 6 (+3 internal) | marketplace/l.\$id ×2, marketplace/rent/active.\$id, marketplace/rent/e.\$id ×2, marketplace/rent/provider.\$id ×2, marketplace/seller.\$id, +1 |  |
| `LocationRow` | `market.tsx:67` | component | 6 · 4 (+2 internal) | marketplace/l.\$id, marketplace/rent/e.\$id, marketplace/rent/list, ml/rental ×3 |  |
| `PriceBlock` | `market.tsx:76` | component | 2 · 2 (+3 internal) | marketplace/l.\$id, marketplace/sell |  |
| `TrustPill` | `market.tsx:93` | component | 4 · 3 | marketplace/l.\$id, marketplace/sell, marketplace/seller.\$id ×2 |  |
| `CategoryTile` | `market.tsx:105` | component | 1 · 1 | marketplace/index | 1 call site |
| `ListingCard` | `market.tsx:147` | component | 3 · 3 | marketplace/c.\$slug, marketplace/index, marketplace/seller.\$id |  |
| `ListingTile` | `market.tsx:197` | component | 4 · 2 | marketplace/index ×3, marketplace/l.\$id |  |
| `ListingRow` | `market.tsx:225` | component | 4 · 4 | marketplace/mine, marketplace/nearby, marketplace/saved, marketplace/search |  |
| `SellerSummary` | `market.tsx:258` | component | 2 · 2 | marketplace/l.\$id, marketplace/seller.\$id |  |
| `EmptyState` | `market.tsx:295` | component | 11 · 10 | marketplace/c.\$slug, marketplace/mine, marketplace/rent/c.\$slug, marketplace/rent/listings ×2, marketplace/rent/mine, +5 | partial — 4 EmptyStates; takes an emoji prop |
| `ListingSkeleton` | `market.tsx:321` | component | 0 · 0 | — | **dead**; skeleton family — one primitive, 10 layouts |
| `MarketFilterSheet` | `market.tsx:344` | component | 3 · 3 | marketplace/c.\$slug, marketplace/index, marketplace/search |  |
| `SortSheet` | `market.tsx:425` | component | 4 · 4 | marketplace/c.\$slug, marketplace/rent/c.\$slug, marketplace/rent/search, marketplace/search |  |
| `OfferSheet` | `market.tsx:460` | component | 1 · 1 | marketplace/l.\$id | 1 call site |
| `ReportSheet` | `market.tsx:549` | component | 1 · 1 | marketplace/l.\$id | 1 call site |
| `SectionRow` | `market.tsx:583` | component | 11 · 2 | marketplace/index ×5, marketplace/rent/index ×6 |  |
| `SyncState` | `onboarding.tsx:35` | type | 0 · 0 (+3 internal) | — |  |
| `OnboardingProvider` | `onboarding.tsx:50` | component | 7 · 7 | onboarding/complete, onboarding/done, onboarding/index, onboarding/preview, onboarding/resume, +2 |  |
| `useOnboarding` | `onboarding.tsx:191` | hook | 7 · 7 | onboarding/complete, onboarding/done, onboarding/index, onboarding/preview, onboarding/resume, +2 |  |
| `resumeTarget` | `onboarding.tsx:197` | function/const | 3 · 3 (+1 internal) | onboarding/index, onboarding/resume, onboarding/skip |  |
| `StepShell` | `onboarding.tsx:207` | component | 1 · 1 | onboarding/step.\$id | 1 call site |
| `ChipPicker` | `onboarding.tsx:305` | component | 10 · 1 | onboarding/step.\$id ×10 |  |
| `ChoiceGrid` | `onboarding.tsx:341` | component | 1 · 1 | onboarding/step.\$id | 1 call site; single choice via aria-pressed (ui/radio-group) |
| `OptionList` | `onboarding.tsx:381` | component | 5 · 1 | onboarding/step.\$id ×5 | hand-rolls checkbox/radio: aria-pressed only |
| `InlineField` | `onboarding.tsx:427` | component | 5 · 1 | onboarding/step.\$id ×5 |  |
| `PhotoPicker` | `onboarding.tsx:504` | component | 1 · 1 | onboarding/step.\$id | 1 call site |
| `SelectField` | `onboarding.tsx:595` | component | 2 · 1 | onboarding/step.\$id ×2 |  |
| `OfflineBanner` | `onboarding.tsx:642` | component | 0 · 0 (+1 internal) | — | used only in its own file — drop `export`; partial — 3 OfflineBanners |
| `ErrorBanner` | `onboarding.tsx:657` | component | 1 · 1 (+1 internal) | onboarding/step.\$id | 1 call site |
| `SavingBanner` | `onboarding.tsx:673` | component | 0 · 0 (+1 internal) | — | used only in its own file — drop `export` |
| `SyncBanner` | `onboarding.tsx:686` | component | 2 · 2 | onboarding/resume, onboarding/step.\$id |  |
| `StepSkeleton` | `onboarding.tsx:721` | component | 1 · 1 | onboarding/step.\$id | 1 call site; skeleton family — one primitive, 10 layouts |
| `LocationHint` | `onboarding.tsx:731` | component | 1 · 1 | onboarding/step.\$id | 1 call site |
| `ReadinessCard` | `onboarding.tsx:744` | component | 1 · 1 | onboarding/complete | 1 call site |
| `HandoffCard` | `onboarding.tsx:788` | component | 4 · 1 | onboarding/complete ×4 |  |
| `statusTone` | `opportunity.tsx:20` | function/const | 3 · 3 | opportunities.\$id.index, opportunities.\$id.manage, opportunities.mine |  |
| `useSavedOpportunities` | `opportunity.tsx:29` | hook | 4 · 4 | opportunities.\$id.index, opportunities.index, opportunities.saved, opportunities.search |  |
| `MatchBar` | `opportunity.tsx:53` | component | 1 · 1 | opportunities.\$id.index | 1 call site; progress bar without role (ui/progress) |
| `PosterRow` | `opportunity.tsx:74` | component | 1 · 1 | opportunities.\$id.index | 1 call site |
| `OpportunityCard` | `opportunity.tsx:95` | component | 3 · 3 | opportunities.index, opportunities.saved, opportunities.search | same name as profile#OpportunityCard, different job; save toggle has no aria-pressed |
| `ApplicationCard` | `opportunity.tsx:154` | component | 1 · 1 | opportunities.applications.index | 1 call site |
| `ApplicantCard` | `opportunity.tsx:182` | component | 1 · 1 | opportunities.\$id.applicants.index | 1 call site |
| `PersonProfileExperience` | `person-profile.tsx:58` | component | 2 · 2 | me, profile.\$username |  |
| `analyticsFor` | `portfolio.tsx:15` | re-export | 1 · 1 | portfolio.\$id | 1 call site |
| `WorkCard` | `portfolio.tsx:19` | component | 2 · 1 | portfolio.index ×2 |  |
| `StatusPill` | `portfolio.tsx:61` | component | 1 · 1 (+1 internal) | portfolio.\$id | 1 call site; partial overlap with kit#StatusPill |
| `PortfolioSkeleton` | `portfolio.tsx:78` | component | 6 · 6 | portfolio.\$id.edit, portfolio.\$id, portfolio.analytics, portfolio.index, portfolio.reorder, +1 | skeleton family — one primitive, 10 layouts |
| `StateCard` | `portfolio.tsx:88` | component | 9 · 6 (+1 internal) | portfolio.\$id.edit, portfolio.\$id ×2, portfolio.analytics ×2, portfolio.index ×2, portfolio.reorder, +1 | partial vs qr#StateCard |
| `SignedOutCard` | `portfolio.tsx:112` | component | 2 · 2 | portfolio.index, portfolio.new.\$kind |  |
| `AudioPreview` | `portfolio.tsx:128` | component | 0 · 0 | — | **dead** |
| `SelectableChips` | `portfolio.tsx:141` | component | 2 · 1 | ml/work-form ×2 |  |
| `PortfolioHeader` | `portfolio.tsx:178` | component | 1 · 1 | portfolio.index | 1 call site |
| `MediaStatePill` | `portfolio.tsx:214` | component | 0 · 0 (+2 internal) | — | used only in its own file — drop `export` |
| `MediaUploader` | `portfolio.tsx:242` | component | 1 · 1 | ml/work-form | 1 call site |
| `AudioPlayer` | `portfolio.tsx:332` | component | 1 · 1 | portfolio.\$id | 1 call site; partial vs collab#AudioPlayer |
| `VideoPlayer` | `portfolio.tsx:378` | component | 1 · 1 | portfolio.\$id | 1 call site |
| `CreditRow` | `portfolio.tsx:407` | component | 1 · 1 | portfolio.\$id | 1 call site |
| `ContributorPicker` | `portfolio.tsx:416` | component | 1 · 1 | ml/work-form | 1 call site |
| `FeaturedToggle` | `portfolio.tsx:488` | component | 0 · 0 (+1 internal) | — | used only in its own file — drop `export` |
| `ReorderList` | `portfolio.tsx:512` | component | 1 · 1 | portfolio.reorder | 1 call site |
| `WorkAnalytics` | `portfolio.tsx:572` | component | 2 · 2 | portfolio.\$id, portfolio.analytics |  |
| `ProfileSection` | `profile.tsx:20` | component | 24 · 1 | ml/person-profile ×24 |  |
| `ProfileEmpty` | `profile.tsx:46` | component | 9 · 1 | ml/person-profile ×9 |  |
| `ProfileSkeleton` | `profile.tsx:72` | component | 0 · 0 | — | **dead**; skeleton family — one primitive, 10 layouts |
| `VerificationBadge` | `profile.tsx:93` | component | 0 · 0 (+1 internal) | — | used only in its own file — drop `export` |
| `StatusBadge` | `profile.tsx:110` | component | 0 · 0 (+1 internal) | — | used only in its own file — drop `export` |
| `TagChip` | `profile.tsx:129` | component | 0 · 0 (+5 internal) | — | used only in its own file — drop `export` |
| `ChipGroup` | `profile.tsx:148` | component | 7 · 1 | ml/person-profile ×7 |  |
| `InfoRow` | `profile.tsx:174` | component | 1 · 1 | ml/person-profile | 1 call site |
| `ProfileHero` | `profile.tsx:187` | component | 1 · 1 | ml/person-profile | 1 call site |
| `StatRow` | `profile.tsx:270` | component | 1 · 1 | ml/person-profile | 1 call site |
| `FeaturedCard` | `profile.tsx:291` | component | 1 · 1 | ml/person-profile | 1 call site |
| `AudioTrackCard` | `profile.tsx:315` | component | 2 · 1 | ml/person-profile ×2 |  |
| `MiniPlayer` | `profile.tsx:352` | component | 0 · 0 | — | **dead** |
| `VideoCard` | `profile.tsx:408` | component | 1 · 1 | ml/person-profile | 1 call site |
| `GalleryGrid` | `profile.tsx:430` | component | 1 · 1 | ml/person-profile | 1 call site |
| `ProjectCard` | `profile.tsx:446` | component | 2 · 1 | ml/person-profile ×2 | same name as collab#ProjectCard, different job |
| `ServiceCard` | `profile.tsx:471` | component | 2 · 1 | ml/person-profile ×2 |  |
| `ExperienceCard` | `profile.tsx:495` | component | 1 · 1 | ml/person-profile | 1 call site |
| `CollaboratorCard` | `profile.tsx:510` | component | 1 · 1 | ml/person-profile | 1 call site |
| `ReviewCard` | `profile.tsx:536` | component | 1 · 1 | ml/person-profile | 1 call site |
| `OpportunityCard` | `profile.tsx:563` | component | 1 · 1 | ml/person-profile | 1 call site; same name as opportunity#OpportunityCard, different job |
| `MarketEntryCard` | `profile.tsx:587` | component | 1 · 1 | ml/person-profile | 1 call site |
| `SocialLinks` | `profile.tsx:609` | component | 1 · 1 | ml/person-profile | 1 call site |
| `ShareSheet` | `profile.tsx:653` | component | 1 · 1 | ml/person-profile | 1 call site; “Copy link” writes nothing to the clipboard; 3 dead Btns |
| `MoreSheet` | `profile.tsx:714` | component | 1 · 1 | ml/person-profile | 1 call site |
| `CompletionCard` | `profile.tsx:762` | component | 1 · 1 | ml/person-profile | 1 call site |
| `QrCode` | `qr.tsx:18` | component | 3 · 3 (+1 internal) | identity.contact, identity.full, identity.print |  |
| `QrIdentityCard` | `qr.tsx:80` | component | 4 · 4 | identity.business, identity.card, identity.customize, identity.qr |  |
| `ScanFrame` | `qr.tsx:158` | component | 1 · 1 | identity.scan | 1 call site |
| `CameraSurface` | `qr.tsx:176` | component | 1 · 1 | identity.scan | 1 call site |
| `ScannerControls` | `qr.tsx:185` | component | 1 · 1 | identity.scan | 1 call site |
| `DestinationPreviewCard` | `qr.tsx:233` | component | 1 · 1 | identity.q.\$code | 1 call site |
| `StateCard` | `qr.tsx:269` | component | 10 · 6 | identity.card, identity.contact.save ×2, identity.history, identity.q.\$code ×2, identity.qr, +1 | partial vs portfolio#StateCard |
| `ActionRow` | `qr.tsx:287` | component | 16 · 5 (+6 internal) | identity.contact.save ×5, identity.contact, identity.history, identity.qr ×8, identity.scan |  |
| `CopyLinkRow` | `qr.tsx:328` | component | 3 · 3 | identity.business, identity.card, identity.qr |  |
| `nativeShare` | `qr.tsx:358` | function/const | 5 · 5 (+2 internal) | identity.card, identity.contact, identity.full, identity.q.\$code, identity.qr |  |
| `ShareActions` | `qr.tsx:377` | component | 2 · 2 | identity.business, identity.qr |  |
| `DownloadNote` | `qr.tsx:426` | component | 4 · 4 | identity.business, identity.card, identity.print, identity.qr |  |
| `PrimaryPair` | `qr.tsx:435` | component | 1 · 1 | identity.q.\$code | 1 call site |
| `Skeleton` | `qr.tsx:466` | component | 6 · 3 | identity.card, identity.q.\$code ×2, identity.qr ×3 | **duplicate** of ui/skeleton (confirmed; colour token differs) |
| `RentalAvailabilityBadge` | `rental.tsx:15` | component | 4 · 3 (+3 internal) | marketplace/rent/e.\$id, marketplace/rent/list, marketplace/rent/request.\$id ×2 |  |
| `RentalPriceBlock` | `rental.tsx:39` | component | 1 · 1 (+3 internal) | marketplace/rent/e.\$id | 1 call site |
| `RentalStatusPill` | `rental.tsx:57` | component | 2 · 2 (+2 internal) | marketplace/rent/active.\$id, marketplace/rent/listings |  |
| `EquipmentCard` | `rental.tsx:78` | component | 1 · 1 | marketplace/rent/index | 1 call site |
| `EquipmentTile` | `rental.tsx:127` | component | 5 · 2 | marketplace/rent/e.\$id, marketplace/rent/index ×4 |  |
| `EquipmentRow` | `rental.tsx:152` | component | 8 · 6 | marketplace/rent/c.\$slug, marketplace/rent/listings, marketplace/rent/nearby, marketplace/rent/provider.\$id, marketplace/rent/saved ×2, +1 |  |
| `ProviderSummary` | `rental.tsx:196` | component | 3 · 3 (+1 internal) | marketplace/rent/active.\$id, marketplace/rent/e.\$id, marketplace/rent/request.\$id |  |
| `ProviderCard` | `rental.tsx:219` | component | 2 · 2 | marketplace/rent/nearby, marketplace/rent/saved |  |
| `RentalCalendar` | `rental.tsx:247` | component | 3 · 3 | marketplace/rent/active.\$id, marketplace/rent/list, marketplace/rent/request.\$id | day buttons unlabelled; selection by colour only (ui/calendar) |
| `PriceBreakdown` | `rental.tsx:330` | component | 1 · 1 | marketplace/rent/request.\$id | 1 call site |
| `FulfilmentPicker` | `rental.tsx:389` | component | 1 · 1 | marketplace/rent/request.\$id | 1 call site; drawn radio, no ARIA state (ui/radio-group) |
| `BookingCard` | `rental.tsx:462` | component | 1 · 1 | marketplace/rent/mine | 1 call site |
| `RentalRequestCard` | `rental.tsx:501` | component | 0 · 0 | — | **dead** |
| `RentalSkeleton` | `rental.tsx:537` | component | 2 · 2 | marketplace/rent/index, marketplace/rent/search | skeleton family — one primitive, 10 layouts |
| `RentalFilterSheet` | `rental.tsx:565` | component | 3 · 3 | marketplace/rent/c.\$slug, marketplace/rent/index, marketplace/rent/search | “More filters” has no aria-expanded |
| `rentalSortOptions` | `rental.tsx:688` | function/const | 4 · 2 | marketplace/rent/c.\$slug ×2, marketplace/rent/search ×2 |  |
| `RentalReportSheet` | `rental.tsx:698` | component | 2 · 2 | marketplace/rent/e.\$id, marketplace/rent/provider.\$id |  |
| `RentalLocationRow` | `rental.tsx:727` | component | 0 · 0 | — | **dead** |
| `Screen` | `ui.tsx:5` | component | 240 · 165 | band, bands.\$id.contact ×3, bands.\$id.events ×2, bands.\$id.invite, bands.\$id.manage ×2, +160 |  |
| `BottomNav` | `ui.tsx:28` | component | 0 · 0 (+1 internal) | — | used only in its own file — drop `export` |
| `TopBar` | `ui.tsx:67` | component | 254 · 176 | bands.\$id.contact ×3, bands.\$id.events ×2, bands.\$id.invite, bands.\$id.manage ×2, bands.\$id.portfolio ×2, +171 |  |
| `SearchBar` | `ui.tsx:98` | component | 13 · 13 | bands.\$id.invite, bands, collab.index, collab.new.collaborators, help, +8 |  |
| `Chip` | `ui.tsx:126` | component | 110 · 62 | bands.\$id.contact, bands.new, bookings.index, business.\$id.availability, business.\$id.enquiry, +57 | partial overlap with kit#Segmented; no ARIA state; 26 uses have no onClick; ui/toggle(-group) covers it |
| `VerifiedBadge` | `ui.tsx:150` | component | 29 · 22 | band, bands.\$id.invite, bands.\$id ×2, collab.invites.\$id, collab.new.collaborators, +17 | ✓ glyph; native title only |
| `AvailabilityBadge` | `ui.tsx:162` | component | 4 · 3 | recommended, search, ml/cards ×2 | **duplicate** of kit#StatusPill (confirmed) |
| `Btn` | `ui.tsx:180` | component | 526 · 179 | auth.forgot ×3, auth.index ×4, auth.locked ×2, auth.maintenance, auth.offline ×2, +174 | no `to`/`asChild`/ref — routes wrap it in <Link> 233× |
| `Sheet` | `ui.tsx:213` | component | 38 · 28 | booking.\$id.schedule, business.\$id.team ×2, collab.\$id.files.index, collab.\$id.participants, collab.index ×2, +23 | hand-rolls ui/sheet: no role, focus trap, Escape, scroll lock or portal |
| `SectionHeader` | `ui.tsx:241` | component | 10 · 3 | feed ×5, identity.qr, index ×4 |  |
| `initialsOf` | `viewer.tsx:18` | function/const | 0 · 0 (+1 internal) | — | used only in its own file — drop `export` |
| `firstNameOf` | `viewer.tsx:27` | function/const | 1 · 1 | feed | 1 call site |
| `Viewer` | `viewer.tsx:32` | type | 0 · 0 (+1 internal) | — |  |
| `useViewer` | `viewer.tsx:47` | hook | 1 · 1 (+1 internal) | feed | 1 call site |
| `ViewerAvatar` | `viewer.tsx:74` | component | 2 · 2 | feed, index |  |
| `WorkForm` | `work-form.tsx:17` | component | 2 · 2 | portfolio.\$id.edit, portfolio.new.\$kind |  |

</details>

---

## Part 3 — Flow coverage: registry vs routes

**Inputs.** The registry snapshot is `dist/preview/data/flows-map.json` in `wugweb-git/musiclinkd`,
generated 2026-08-31 at 06:39 UTC. Types come from `admin/types/firestore.ts` (`FlowDoc`,
`FlowScreenDoc`). **The live Firestore collections (`flows`, `flows/{id}/screens`) were not
queried.** They hold production data behind credentials that this audit did not use. Everything
below is measured against the 31 Aug export; any screen added since then is unverified.

### Which count the data supports

| Source | Screens | States | As of |
|---|--:|--:|---|
| `flows-map.json`, the Firestore export this part maps | **205** | **616** | 31 Aug, 06:39 UTC |
| `screen-registry.json`, build output in the same folder | 205 | **651** | 10 Sep, 20:02 UTC |
| `docs/04-Wireframes/MASTER-REGISTRY.md` §2 | "188" in its heading; its tables list only 1–135, plus variants 98-1…98-4 | "563" in its prose | 31 Aug |
| `webapp/README.md:34` | 188 | 563 | "Where this build stands (2026-08-31)" |

**205 screens is supported.** Both data files carry the same 205 keys.

**No single state count is supported.** The two generated files disagree on 129 of the 205
screens (616 vs 651), and 563 appears only in prose.

**188 / 563 is stale.** The README that states it also says the audit script outranks its own
paragraph, and the MASTER-REGISTRY tables stop at 135.

205 registry screens against 205 route files is a coincidence of totals, not a one-to-one
mapping: 21 screens below have no route, and 46 routes have no screen. The audits in
`Claude outputs/` say "188/563 is the Android registry; 205 is Lovable routes — different
things". That is only half right, because 205 is also the registry's own current count.

### Defects in the registry itself

- **`screenNumber` 1 is assigned twice**, to `home/home_dashboard` and `auth/splash`. The type
  says numbers are "globally unique … assigned once and never reused" (`firestore.ts:681-687`).
- **Numbers 136–139 are unassigned.** The four public-profile templates (talent, band,
  business, venue) carry neither a `screenNumber` nor a `variantOf`, although the type says
  variants carry `variantOf`.
- **Flow `order` runs 0–8, then 10–24.** Home is 0 and there is no 9, against the type comment
  "1-24, no gaps" (`firestore.ts:663`).
- **Status exists only per flow.** `FlowDoc.status` is one of `documented`, `partial`, `missing` or
  `app-mocked`, and `FlowScreenDoc` has no status at all, so a mismatch can only be judged per flow.
- **No flow is `documented`.** 9 are `app-mocked`, 10 `partial` and 5 `missing`. So list C, as
  specified — "registry says documented, route is still mocked" — is **empty**. The mismatches
  that do exist run the other way (C below).
- **Some registry screens land on the same route, which suggests duplicates in the registry.**
  This is a judgement from the mapping, not confirmed with whoever owns the registry:
  - Three notification-settings screens (`notifications/notification_settings`,
    `notification_feeds_settings`, `user_settings/notification_settings`) all map to
    `notifications.settings.tsx`, and `notification_categories` overlaps them.
  - `user_settings/help_center` and `cms_pages/content_home` both map to `help.tsx`.
    `user_settings/legal_pages` and `cms_pages/legal_pages_site` map to the same two legal routes.
  - `discover/studio_profile_discover` and `booking/studio_profile` are both called
    "Studio Profile". `discover/discover_opportunities` and `opportunities/opportunities_home`
    both map to `opportunities.index.tsx`.
  - `auth/registration_write` and `onboarding/submit_publish` are the same end-of-onboarding
    profile write (`onboarding/complete.tsx:46-55`).
  - Five more pairs: `public_profile_view_band` ↔ `band/band_profile_layout`,
    `public_profile_view_business` ↔ `business_overview`, `public_profile_view` ↔
    `public_profile_preview` (the registry says so itself), `business_dashboard` ↔
    `business_owner_insights`, and `my_services` ↔ `service_offerings_editor`.
  - `edit_identity`, `talent_profile_editor` and `external_links_editor` are one accordion in
    `profile.edit.tsx`. `write_review`, `studio_facility_review` and `marketplace_review_screen`
    are one `reviews.write.$id.tsx`, which adapts to the item being reviewed.
- **Two mockups contradict their own registry entries.** `session_configuration`'s mockup is a
  provider's "New service" form, not the booking step its title and notes describe.
  `registration_write`'s mockup is an "Account created → Continue to onboarding" page. That
  matches `auth.success.tsx`, a route that writes nothing.

### How screens were matched

Two agents each took half the registry (flows 0–8 and 10–24). For every screen, they read the
candidate route files before grading it — and the screen's HTML mockup, where the title was
ambiguous:

- **title** — the route's own head title, TopBar or Screen title, or h1 names the screen;
- **content** — no title match, but the route visibly implements the screen's notes and states;
- **unverified** — there are plausible candidates, but the match is not established;
- **none** — no route implements it, after searching its title, notes and state names.

One route may implement several screens (wizard steps, tabs, sheets), and one screen may span
several routes; both count. Every cited route file exists.

I re-read fourteen of the grades (seven per half) against the cited lines, and all held. I also
cross-checked all 21 "none" verdicts by keyword search of `src/routes/`. One is borderline and
keeps its grade with a caveat: **credit attribution**. Its mockup says "Credit each collaborator —
assign a project role to everyone on this project". The add-work form records only the author's
own credit roles plus contributor names, with no role per contributor (`work-form.tsx:96-134`).

### Coverage by flow

"Routes matched" counts distinct route files graded title or content. "Of which live" means the
route imports Supabase, `use-auth` or a `*.functions` module directly.

| # | Flow | Registry status | Screens | title | content | unverified | none | Routes matched | of which live |
|--:|---|---|--:|--:|--:|--:|--:|--:|--:|
| 0 | Home (`home`) | app-mocked | 1 | 0 | 1 | 0 | 0 | 1 | 0 |
| 1 | User Auth (`auth`) | partial | 10 | 7 | 2 | 0 | 1 | 8 | 6 |
| 2 | User Onboarding (`onboarding`) | partial | 16 | 4 | 10 | 1 | 1 | 4 | 1 |
| 3 | Add Portfolio (`portfolio`) | app-mocked | 12 | 2 | 7 | 1 | 2 | 6 | 4 |
| 4 | Discover (`discover`) | app-mocked | 21 | 10 | 4 | 6 | 1 | 12 | 0 |
| 5 | Opportunities (`opportunities`) | missing | 7 | 6 | 1 | 0 | 0 | 10 | 0 |
| 6 | Communication & Collaboration (`communication`) | partial | 11 | 3 | 2 | 2 | 4 | 19 | 0 |
| 7 | Marketplace — Buy/Sell/Rent (`marketplace`) | app-mocked | 12 | 10 | 2 | 0 | 0 | 21 | 0 |
| 8 | Booking (`booking`) | partial | 14 | 7 | 4 | 3 | 0 | 12 | 0 |
| 10 | Profile Management (`profile_management`) | partial | 10 | 1 | 4 | 4 | 1 | 3 | 2 |
| 11 | Services, Availability (`services_availability`) | partial | 6 | 3 | 2 | 1 | 0 | 9 | 0 |
| 12 | Business Profiles (Studios, Labels) (`business_profiles`) | partial | 10 | 2 | 7 | 1 | 0 | 10 | 0 |
| 13 | Notifications (`notifications`) | app-mocked | 6 | 2 | 1 | 1 | 2 | 2 | 0 |
| 14 | Public Profile (`public_profile`) | partial | 9 | 1 | 5 | 2 | 1 | 7 | 2 |
| 15 | Band (`band`) | partial | 5 | 3 | 2 | 0 | 0 | 5 | 0 |
| 16 | Verifications (`verifications`) | app-mocked | 2 | 1 | 1 | 0 | 0 | 4 | 0 |
| 17 | Reviews (`reviews`) | app-mocked | 11 | 3 | 5 | 3 | 0 | 6 | 0 |
| 18 | Subscription (`subscription`) | missing | 4 | 2 | 2 | 0 | 0 | 3 | 0 |
| 19 | Search (`search`) | app-mocked | 2 | 0 | 2 | 0 | 0 | 1 | 0 |
| 20 | Recommendation Engine (`recommendation_engine`) | missing | 2 | 2 | 0 | 0 | 0 | 3 | 0 |
| 21 | Settings & Support (`user_settings`) | missing | 19 | 7 | 3 | 5 | 4 | 11 | 0 |
| 22 | CMS Pages (`cms_pages`) | partial | 7 | 2 | 1 | 2 | 2 | 5 | 0 |
| 23 | QR Code & Profile Sharing (`qr_share`) | missing | 4 | 3 | 1 | 0 | 0 | 13 | 0 |
| 24 | Saved & Favorites (`saved_favorites`) | app-mocked | 4 | 1 | 1 | 0 | 2 | 3 | 0 |
| | **all** | | **205** | **82** | **70** | **32** | **21** | **153** | |

**152 of the 205 screens have a route (82 by title, 70 by content); 32 are unverified and 21 have
none.**

The flows the registry rates weakest turn out to be complete here. Opportunities, Subscription,
Recommendations and QR are fully routed. Communication is the real gap: 4 of its 11 screens have
no route, and there is no conversation view anywhere. "Message" buttons either go back to the
thread list or, in four places, do nothing (Part 1). The URLs mislead as well: `/feed` is the Home
dashboard, not a networking feed.

### A. Registry screens with no route here — the actual missing screens

| # | Screen | Flow (status) | States | What was searched / why none |
|--:|---|---|--:|---|
| 1 | Splash (`splash`) | `auth` (partial) | 2 | Searched 'splash', 'resuming', 'Restoring your session', 'restore session' across src/routes and src/components: no hits. __root.tsx has no loading/splash shell; the reset-password skeleton (:76-84) and onboarding/resume.tsx (resumes an onboarding draft) are not a session splash. |
| 13 | Instrument Proficiency (per-instrument years/level) (`instrument_proficiency`) | `onboarding` (partial) | 1 | Searched 'proficiency', 'years', 'level', 'per-instrument', 'skill level' in src/routes/onboarding and src/data/onboarding.ts. The instruments step only picks a primary instrument (step.\$id.tsx:265-276); the 'experience' step (src/data/onboarding.ts:686-699) is one overall level, not per instrument. |
| 27 | Credit Attribution (`credit_attribution`) | `portfolio` (app-mocked) | 1 | Searched 'credit', 'CreditRow', 'attribution', per-collaborator 'role' in portfolio routes and components. Contributors are saved as bare names (work-form.tsx:65; portfolio.tsx:427-429); CreditRow accepts a role but portfolio.\$id.tsx:156 passes none. 'Your role' (work-form.tsx:96-104) covers only the author's own credi |
| 30 | Success State (`success`) | `portfolio` (app-mocked) | 1 | Searched 'published', 'Success', 'is now live', 'View project' in portfolio routes and work-form. Success is only a toast 'Work published' followed by a redirect to /portfolio/\$id (src/components/ml/work-form.tsx:72-73); no success screen. |
| 155 | Community Detail (`community_detail`) | `discover` (app-mocked) | 2 | Searched 'community', 'Join', 'joined', 'members' in src/routes: no community-detail route and no join action (only collab-invite copy). discover.community.tsx rows open /bands/\$id and /business/\$id instead. |
| 78 | Connection Requests (`connection_requests_tab`) | `communication` (partial) | 1 | Searched 'connection request', 'Requests', 'wants to connect', 'Accept', 'Network' in src/routes. No Network / Requests screen. The only trace is an inline Accept on a home-dashboard activity row ('Ananya Sharma wants to connect', src/data/dashboard.ts:103; button src/routes/feed.tsx:286-290). |
| 79 | Collaborators (`collaborators_tab`) | `communication` (partial) | 1 | Searched 'Collaborators', 'connections', 'Network' in src/routes. No list of your network's collaborators; collab.\$id.participants.tsx lists one project's people, not your network. |
| 82 | Chat Conversation (`chat_conversation`) | `communication` (partial) | 3 | Searched 'conversation', 'thread', 'chat', 'composer', 'send message' in src/routes: no conversation route. messages.tsx rows are plain divs (:60) and every 'Message' / 'Open conversation' button links back to the /messages list. |
| 83 | Networking Feed (post / view) (`networking_feed`) | `communication` (partial) | 2 | Searched 'feed', 'post', 'Posting', 'Networking' in src/routes. /feed (feed.tsx) is the home dashboard despite its URL; collab.\$id.discussion.tsx has 'Post update' but is scoped to one project. No networking feed. |
| 37 | Venue Profile Editor (`venue_profile_editor`) | `profile_management` (partial) | 1 | Searched 'venue', 'Edit venue', 'capacity', 'Stage size', 'hire fee'. business.new.tsx can create a business of type Venue (src/data/business.ts:25) but asks no venue fields (capacity, stage, PA/backline, typical nights, hire fee). |
| 169 | Notification (`notification_detail`) | `notifications` (app-mocked) | 8 | No /notifications/\$id route; searched 'notifications/\$', 'notificationId', 'Accept request', notification detail. Tapping an item goes straight to n.to in the owning flow (notifications.index.tsx:50-53). |
| 104 | Notification Preferences (onboarding step) (`notification_preferences_onboarding`) | `notifications` (app-mocked) | 3 | No notification step in onboarding (step ids src/data/onboarding.ts:514-792). Searched 'notif', 'permission', 'push', 'Allow notifications', 'Stay in the loop', 'test notification' in src/routes, src/components, src/data/onboarding.ts. |
| — | Public Profile — Venue template (`public_profile_view_venue`) | `public_profile` (partial) | 1 | Searched 'venue', 'capacity', 'Stage size', 'hire fee'. /business/\$id is type-agnostic (businessTypeLabel only) and renders no venue fields; the seeded venue 'Antisocial' exists only in relatedBusinesses (src/data/business.ts:298-304), not as a page. |
| 51 | Appearance Settings (`appearance_settings`) | `user_settings` (missing) | 3 | Searched 'Appearance', 'theme', 'Dark mode', 'accent', 'Larger text', 'Reduce motion', 'High contrast'. Only app language exists, as a row on settings.account.tsx (src/data/settings.ts:125-131). |
| 54 | Contact Support / Raise Ticket (`raise_ticket`) | `user_settings` (missing) | 3 | Searched 'ticket', 'Raise ticket', 'Contact support', 'SUP-', 'support_tickets'. auth.locked.tsx:55-57 'Contact support' only opens /help; supportTopics (src/data/settings.ts:199-204) is unused. |
| 55 | Report User (`report_user`) | `user_settings` (missing) | 3 | Searched 'Report account', 'Report user', 'Report profile', 'moderation'. Only entry is a 'Report profile' row in the profile More sheet (src/components/ml/profile.tsx:723-731) that just closes the sheet: no reasons, form or success state. |
| 57 | Feedback (`feedback`) | `user_settings` (missing) | 3 | Searched 'feedback', 'Send feedback'. Only hits are recommendation feedback (recommendations.tsx:176-191, recommendations.settings.tsx:62-66), unrelated to product feedback. |
| 94 | About / Pricing / Careers (`about_pricing_careers`) | `cms_pages` (partial) | 3 | Searched 'About', 'Careers', 'open roles', 'pricing'. No About/Careers pages; /plans (plans.tsx) is the in-app plan picker, mapped to subscription/plans. |
| 97 | Admin Pages Editor (`admin_pages_editor`) | `cms_pages` (partial) | 1 | Searched 'admin', 'Pages', 'page_content', 'editor'. No admin or CMS authoring routes exist in this app. |
| 156 | Collection (`collection_detail`) | `saved_favorites` (app-mocked) | 5 | Searched 'collection', 'Collections', 'lists', '/saved/\$'. saved.tsx subtitle claims '4 lists' (:31) but no list/collection route or UI exists. |
| 158 | Saved item (`saved_item_detail`) | `saved_favorites` (app-mocked) | 2 | Searched 'Saved item', 'Open original', 'Remove from saved', '/saved/\$'. Saved cards open nothing (saved.tsx:106-117 buttons have no handlers). |

By kind:

- **Communication's network screens:** connection requests, collaborators, chat conversation and
  networking feed.
- **Venue-type profiles:** the venue editor and the venue template.
- **Notifications:** notification detail and the onboarding notification step.
- **Settings and support:** appearance, raise ticket, report user, feedback.
- **CMS:** About / Pricing / Careers and the admin pages editor.
- **Saved & Favorites:** collection detail and saved-item detail.
- **Singles:** splash, instrument proficiency, the portfolio success state, community detail and
  credit attribution.

**Unverified — counted as neither covered nor missing:**

| # | Screen | Flow | Candidate route(s) | Why unverified |
|--:|---|---|---|---|
| 17 | Persona Badges (`persona_badges`) | `onboarding` | `onboarding/step.$id.tsx` | The option set overlaps the mockup badges (Collaborations, Touring, Session Work, Teaching, Recording, Production) but is framed as availability, not discovery badges, and nothing shows them rendered as profile badges. Not established. |
| 28 | Project Media Preview (`media_preview`) | `portfolio` | `portfolio.new.$kind.tsx` | The form attaches media and a cover URL but has no artwork-theme picker and no project-card preview as designed. Not established. |
| 140 | Global Search (`global_search`) | `discover` | `search.tsx` | No idle (recent / suggested searches) or no_results state, and typing does not filter the static list (:69). Not established as the global-search screen. |
| 142 | People / Talent (`people_talent`) | `discover` | `search.tsx`, `singers.tsx`, `categories.tsx` | No route is titled People/Talent or has the designed role tabs; people browsing is split across these three. Not established. |
| 143 | Businesses (`businesses`) | `discover` | `business.index.tsx`, `discover.community.tsx` | Title collision: business.index is the owner's list of businesses you run (description :14, 'Create a business' empty state :82-89), not a discovery list; discover.community only has a section. |
| 144 | Studios & Spaces (`studios_spaces`) | `discover` | `marketplace/c.$slug.tsx`, `discover.nearby.tsx` | No Discover route lists studios or spaces. The only list is Market's /marketplace/c/spaces, and the registry says Discover and Market must not converge. /studio is a single hard-coded studio page. |
| 145 | Services (`services`) | `discover` | `services.index.tsx`, `marketplace/c.$slug.tsx` | Title collision: services.index is the provider's own service manager (head 'Your services' :11, Add service, Active / Paused / Draft filters :26). The only list of other people's services is Market's category page. |
| 153 | Project Detail (`project_detail`) | `discover` | `opportunities.$id.index.tsx` | Project cards open the opportunity detail (brief / requirements / Apply), not a project page with team, open roles and 'Join collaboration' as designed. Not established. |
| 80 | AI Matchmaker Tab (`ai_matchmaker_tab`) | `communication` | `recommended.tsx`, `recommendations.tsx` | Match-with-reason UI exists, but as Discover / recommendation screens (recommendation_engine flow), not as a tab of a Network screen. Registry state is 'unreachable'. |
| 84 | Artist Profile (from Networking Feed) (`networking_feed_artist_profile`) | `communication` | `profile.$username.tsx` | No networking feed exists to open it from, so this entry point is absent; the generic person profile (public_profile flow) is the only artist-profile view. |
| 60 | Studio Discovery (`studio_discovery`) | `booking` | `marketplace/c.$slug.tsx` | The booking flow has no studio list: 'Find a studio' (feed.tsx:335) and 'Discover studios & spaces' (bookings.index.tsx:88-89) both open /studio, a single hard-coded studio page. The only studio list is Market's spaces category, with no featured / nearby / popular sections. Not established. |
| 61 | Filters (bottom sheet) (`filters`) | `booking` | `marketplace/c.$slug.tsx` | No studio filter sheet in the booking routes. Market's generic filter sheet has distance and price but no amenity chips. Not established. |
| 62 | Search Results (`search_results`) | `booking` | `marketplace/c.$slug.tsx` | No studio search-results route in the booking flow; discover.nearby.tsx:72-96 shows a 'Studios around you' section only. Not established. |
| 34 | Profile Type Selection (Talent/Band/Business/Venue) (`profile_type_selection`) | `profile_management` | `onboarding/step.$id.tsx` | No Talent/Band/Business/Venue choice and no profileType anywhere (grep 'profile type\|profileType' = 0 hits). Nearest analogue is two optional intent steps that hand off to Business/Band setup while keeping the personal profile - additive, not an exclusive type. |
| 35 | Business Profile Editor (`business_profile_editor`) | `profile_management` | `business.$id.manage.tsx`, `business.new.tsx` | No editor for an existing business: the Details row reuses the empty creation wizard (state starts blank, business.new.tsx:39-46), which lacks about/contact/hours, services, GST, team size and links from the mockup. |
| 36 | Band Profile Editor (`band_profile_editor`) | `profile_management` | `bands.$id.manage.tsx`, `bands.new.tsx` | Line-up is managed in the Members tab (bands.\$id.manage.tsx:54-96); no form edits an existing band's name/bio/genres/tech rider/stage plot. |
| 40 | Public Profile Preview (`public_profile_preview`) | `profile_management` | `me.tsx`, `profile.$username.tsx` | Owner can open a public page, but there is no preview screen and no profileType-driven talent/band/business/venue templates; /profile/\$username always renders the person template. |
| 44 | Studio Services & Amenities (`studio_services_amenities`) | `services_availability` | `booking.$id.index.tsx` | Mockup is an owner amenities editor ('Save amenities'); no route edits amenities. Studio services and facilities are only displayed on the booking entry page (Booking flow). |
| 197 | Business gallery (`business_gallery`) | `business_profiles` | `business.$id.portfolio.tsx` | Owner-side portfolio page (Credits/Gallery tabs), not a public shareable gallery route; mockup's rooms/equipment/sessions grouping and Share/Book actions absent. booking.\$id.index.tsx:140-153 and studio.tsx:103-115 show photo rails only. |
| 170 | Notification categories (`notification_categories`) | `notifications` | `notifications.settings.tsx` | Per-category channel control exists, but not per-event rows ('which events') or a category-as-state screen as in the mockup. Categories from src/data/notifications.ts:29-37. |
| 121 | Media Gallery (photo/video full-screen viewer) (`media_gallery`) | `public_profile` | `profile.$username.tsx`, `me.tsx` | Gallery is a grid section inside the profile's Portfolio tab (GalleryGrid, profile.tsx:430-444); no full-screen viewer and no gallery route. |
| 123 | Collaborators (cross-project graph) (`collaborators_graph`) | `public_profile` | `profile.$username.tsx`, `me.tsx` | Only a horizontal rail inside the profile, hidden when empty; no collaborators screen, shared-work counts or empty state as in the mockup. |
| 109 | Review Detail (`review_detail`) | `reviews` | `reviews.$id.edit.tsx`, `reviews.$id.report.tsx`, `reviews.$id.reply.tsx` | edit/delete/reported exist as separate \$id routes, but there is no single-review view with ratings and actions (default state), and reviews.tsx cards do not link to these routes. |
| 112 | Completed Project Review (`completed_project_review`) | `reviews` | `reviews.write.$id.tsx` | The generic writer could review a project, but no project/collaboration item or project criteria exist, so this variant never renders. |
| 117 | Public Reputation (cross-reference) (`public_reputation`) | `reviews` | `profile.$username.tsx`, `business.$id.index.tsx` | Person profile shows reviews but no aggregate rating (StatRow = connections/followers/plays/credits, profile.tsx:270-287); business profile shows rating + count but no review list. No combined reputation summary. |
| 53 | FAQ (`faq`) | `user_settings` | `help.$slug.tsx` | No general FAQ list or FAQ search. verification.privacy.tsx:54-64 has a verification-only 'Common questions' block. |
| 59 | App Version / About (`app_version`) | `user_settings` | `settings.index.tsx` | Version string only, as a footer on Settings; no About screen (build code, release date, links). |
| 159 | Username (`username`) | `user_settings` | `settings.account.tsx`, `profile.edit.tsx` | The handle is editable, but there is no musiclinkd.com/<username> preview, availability check, taken or saved state. |
| 162 | Blocked accounts (`blocked_accounts`) | `user_settings` | `settings.privacy.tsx` | Only a hard-coded empty message; no list and no unblock. Block actions exist only as inert sheet rows (profile.tsx:728, market.tsx:576-578). |
| 163 | Data & privacy (`data_privacy`) | `user_settings` | `settings.privacy.tsx`, `recommendations.settings.tsx` | No export lifecycle (requested/processing/ready/expired) and no personalised/limited/off choice. |
| 93 | Marketing Homepage (`marketing_homepage`) | `cms_pages` | `welcome.tsx` | In-app signed-out landing (auth entry; signed-in users redirect to /feed, :115-117), not the static marketing site. '/' (index.tsx) is Discover, not a homepage. |
| 96 | Blog / Changelog (`blog_changelog`) | `cms_pages` | `help.$slug.tsx` | No blog/changelog list, announcement or archived states; the release note is one guide inside Help. |

### B. Routes with no registry screen — undocumented drift

46 routes (not counting `__root.tsx`) are not cited by any registry screen, not even as an
unverified candidate. Routes that appear only as unverified candidates are in the table above
instead.

Most of these are depth the registry never modelled rather than new product:

- system states for auth — locked, maintenance, offline, sign-out, success;
- management and follow-up pages — manage, edit, analytics, cancel, reschedule, enquiry, earnings;
- the collaboration workspace's 12 sub-pages;
- the onboarding entry, resume and skip routes.

Two are plumbing. `talent.$id.tsx` only redirects. `booking.$id.tsx` is the layout that wraps the
booking steps in `BookingDraftProvider`.

<details><summary>46 routes — expand</summary>

| Route file | URL | Data |
|---|---|---|
| `auth.locked.tsx` | `/auth/locked` | static |
| `auth.maintenance.tsx` | `/auth/maintenance` | static |
| `auth.offline.tsx` | `/auth/offline` | static |
| `auth.signout.tsx` | `/auth/signout` | live |
| `auth.success.tsx` | `/auth/success` | static |
| `bands.$id.contact.tsx` | `/bands/$id/contact` | seed |
| `bands.$id.invite.tsx` | `/bands/$id/invite` | seed |
| `bands.$id.portfolio.tsx` | `/bands/$id/portfolio` | seed |
| `bands.tsx` | `/bands` | seed |
| `booking.$id.tsx` | `/booking/$id` | static |
| `bookings.$ref.cancel.tsx` | `/bookings/$ref/cancel` | seed |
| `bookings.$ref.index.tsx` | `/bookings/$ref/` | seed |
| `bookings.$ref.reschedule.tsx` | `/bookings/$ref/reschedule` | seed |
| `business.$id.availability.tsx` | `/business/$id/availability` | seed |
| `business.$id.enquiry.tsx` | `/business/$id/enquiry` | seed |
| `collab.$id.agreement.tsx` | `/collab/$id/agreement` | seed |
| `collab.$id.discussion.tsx` | `/collab/$id/discussion` | seed |
| `collab.$id.invite-link.tsx` | `/collab/$id/invite-link` | seed |
| `collab.$id.milestones.$mid.tsx` | `/collab/$id/milestones/$mid` | seed |
| `collab.$id.milestones.new.tsx` | `/collab/$id/milestones/new` | seed |
| `collab.$id.remove.$pid.tsx` | `/collab/$id/remove/$pid` | seed |
| `collab.$id.roles.tsx` | `/collab/$id/roles` | seed |
| `collab.$id.settings.tsx` | `/collab/$id/settings` | seed |
| `collab.$id.share.tsx` | `/collab/$id/share` | seed |
| `collab.$id.transfer.tsx` | `/collab/$id/transfer` | seed |
| `collab.new.collaborators.tsx` | `/collab/new/collaborators` | seed |
| `collab.new.tsx` | `/collab/new` | seed |
| `onboarding/index.tsx` | `/onboarding/` | seed |
| `onboarding/resume.tsx` | `/onboarding/resume` | seed |
| `onboarding/skip.tsx` | `/onboarding/skip` | seed |
| `opportunities.$id.analytics.tsx` | `/opportunities/$id/analytics` | seed |
| `opportunities.$id.manage.tsx` | `/opportunities/$id/manage` | seed |
| `opportunities.saved.tsx` | `/opportunities/saved` | seed |
| `plans.earnings.tsx` | `/plans/earnings` | seed |
| `portfolio.$id.edit.tsx` | `/portfolio/$id/edit` | live |
| `portfolio.analytics.tsx` | `/portfolio/analytics` | live |
| `portfolio.select.tsx` | `/portfolio/select` | live |
| `provider.bookings.$ref.tsx` | `/provider/bookings/$ref` | seed |
| `provider.bookings.calendar.tsx` | `/provider/bookings/calendar` | seed |
| `recently-viewed.tsx` | `/recently-viewed` | seed |
| `services.$id.enquiry.tsx` | `/services/$id/enquiry` | seed |
| `services.$id.manage.tsx` | `/services/$id/manage` | seed |
| `services.conflicts.tsx` | `/services/conflicts` | static |
| `talent.$id.tsx` | `/talent/$id` | static |
| `verification.badge.tsx` | `/verification/badge` | seed |
| `verification.privacy.tsx` | `/verification/privacy` | seed |

</details>

### C. Status mismatches

| Flow | Registry says | Routes show | Mismatch |
|---|---|---|---|
| Add Portfolio (`portfolio`) | app-mocked | 9/12 screens routed; 6 routes, 4 live | "app-mocked", but 4 matched routes read or write live data; "app-mocked", but 2 of 12 screens have no route |
| Discover (`discover`) | app-mocked | 14/21 screens routed; 12 routes, 0 live | "app-mocked", but 1 of 21 screen has no route |
| Opportunities (`opportunities`) | missing | 7/7 screens routed; 10 routes, 0 live | "missing", but 7 of 7 screens have a route |
| Notifications (`notifications`) | app-mocked | 3/6 screens routed; 2 routes, 0 live | "app-mocked", but 2 of 6 screens have no route |
| Subscription (`subscription`) | missing | 4/4 screens routed; 3 routes, 0 live | "missing", but 4 of 4 screens have a route |
| Recommendation Engine (`recommendation_engine`) | missing | 2/2 screens routed; 3 routes, 0 live | "missing", but 2 of 2 screens have a route |
| Settings & Support (`user_settings`) | missing | 10/19 screens routed; 11 routes, 0 live | "missing", but 10 of 19 screens have a route |
| QR Code & Profile Sharing (`qr_share`) | missing | 4/4 screens routed; 13 routes, 0 live | "missing", but 4 of 4 screens have a route |
| Saved & Favorites (`saved_favorites`) | app-mocked | 2/4 screens routed; 3 routes, 0 live | "app-mocked", but 2 of 4 screens have no route |

**As specified, list C is empty, because no flow is `documented`.** The table shows the registry
lagging the app instead:

- The five flows marked `missing` (Opportunities, Subscription, Recommendations, Settings, QR)
  have routes for 27 of their 36 screens.
- Add Portfolio is marked `app-mocked`, yet 4 of its routes read and write Supabase.
- In the other direction, four `app-mocked` flows have screens with no route: Portfolio (2),
  Discover (1), Notifications (2) and Saved (2).

Status is a flow-level field, so none of this can be judged per screen.

---

## Part 4 — Is Phase 8 one PR or three weeks?

**Three weeks: ≈ 97 hours of one person's work, landing as about eight PRs.**

It is not one PR, and not because the class changes are difficult. The type, radius and alias
changes are a single codemod, and every rule it needs already exists except the item-6 decision
above. Three things drive the size:

1. **The before/after render pass at 412px on every screen the codemod touches.** That is 176
   files. `AGENTS.md` makes it mandatory ("a render pass at 412px on every touched screen"), and
   `package.json` has no test or screenshot tooling to automate it. It comes to **~29 h, about
   three-quarters of the route-level work**.
2. **Splitting `src/data` into UI copy, seed content and runtime data.** That is 9,153 lines in 21
   modules, imported by 182 routes and 15 `ml/` files. No codemod can decide which export is copy
   and which is seed, so this takes **~40 h**. It is the part that makes this three weeks rather
   than one.
3. **Photos are blocked, not slow.** There are 51 distinct Unsplash photos and no local library to
   replace them with (Part 1).

Phase 8 as written (`CLAUDE-CODE-WORK-ORDER.md`, Phase 8) has four parts: apply the Phase 2 token
mapping across the routes; split `src/data/*`; turn relative-time strings into timestamps; and
replace stock photos with the local library.

| Work | Basis | Hours |
|---|---|--:|
| Codemod: type + radius + `rounded-xl/2xl/3xl` fold | write, dry-run and apply one script | 3.0 |
| Review the mapped diff | 1,111 mapped values (1,065 type + 46 radius) × 0.1 min, plus 10 values with no rule × ~3 min | 2.3 |
| **412px before/after render pass** | 176 touched route files × 10 min | **29.3** |
| Inline `style=` in routes → token classes | 70 × 5 min | 5.8 |
| Route-level fabricated state and relative time | 10 fabricated (8 verified + 2 unverified) × 15 min, plus 1 relative × 10 min | 2.7 |
| **`src/data` split** into copy / seed / runtime | 21 modules at ~250 lines/h = 36.5 h, plus 4 h to rewrite imports in 182 routes and 15 `ml/` files and fix `tsc` | **40.5** |
| Relative time → stored timestamps + one formatter | 83 strings × 5 min + 1 h | 7.9 |
| Photo swap | map 51 distinct photos to library files and repoint the URL builders, plus 12 direct URLs in routes and `ml/`, × 5 min — **only once a library exists** | 5.3 |
| **Total** | | **≈ 97** |

At about six focused hours a day, that is **16 working days**. Review, CI and the Lovable sync
check after each push take up the rest of the day.

**Suggested PR sequence:**

| PR | Scope | Why separate |
|---|---|---|
| 8.1 | codemod: type, radius, alias fold (176 route files) | purely mechanical; one screenshot set; easy to revert whole |
| 8.2 | inline `style=` → classes (44 route files) | hand edits, each one a judgement |
| 8.3 | relative time → timestamps + formatter (14 data modules) | a shape change every consumer sees |
| 8.4–8.7 | `src/data` split in four batches, largest first: `collab` (1,226 lines, 33 importers); `booking` + `rentals` + `market`; `opportunities` + `services` + `reviews` + `recommendations` + `notifications`; the rest | each module splits differently; `main` has to keep working between batches |
| 8.8 | photos | blocked until a licensed library exists |

**Two levers, and what they buy:**

- **Automate the render pass.** A Playwright capture of all 205 routes at 412px, before and after,
  turns 29 h of looking into ~6 h of reviewing diffs, plus ~4 h to set it up. That saves about
  **19 h**, taking the total to ≈ 77 h, about 2½ weeks. It adds a dev dependency, so it is
  Vedanshu's call.
- **Two people.** The visual half (8.1–8.2, ~43 h) and the data half (8.3–8.7, ~48 h) touch
  different files, except where routes import the modules being split. In parallel that is
  **about two weeks elapsed**. The data half alone is ~8 working days, which sets the floor.

**What would make it bigger:**

- Deciding the guide question in Part 2 (import, port, or tokens only) after 8.1 instead of before
  it. The codemod would then target names that are about to change, and 8.1 would be done twice.
- Rejecting PR #3's type rule for the routes adds ~14 h of per-value design review.
- Folding `rounded-xl/2xl` to 16px instead of 32px turns 448 render-neutral renames into visible
  changes. They sit on the same 176 screens, though, so the render pass already covers them.
- Pulling Phase 4–6 work into Phase 8, which the plan does not do. For scale, that work is:
  - 196 glyphs (56 in routes, 34 in `ml/`, 106 in data);
  - 64 dead controls (59 in routes, 5 in `ml/`) plus 26 inert Chips;
  - 233 `Btn`-in-`Link` in routes;
  - four `/talent/` links.

  That is **~22 h at route level alone**, and the `Btn` link form is a Phase 6 prerequisite.

The last plan collapsed at Wave 2. The riskiest step in this one is 8.4, the first data split.
If `collab` takes much longer than ~5 h, re-estimate the rest from that number rather than from
this table.
