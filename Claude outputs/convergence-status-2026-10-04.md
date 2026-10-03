# Convergence brief (29 Sep) — status on 4 Oct, `main` at `d606bf6`

Read-only sweep of brief sections 2, 3, 3.5, 4, 5 and 7 against today's code. The brief's
file:line references are from 29 Sep; items were found by content. P0 and section 1 are done.

**Token facts the rest depends on** (`src/styles.css:84-88`): `control-sm` 40px, `touch` **44px**,
`control` 48px, `control-lg` 56px. So `min-h-touch` is not 48. The `hit-area` utility
(`styles.css:1016`) extends a control's hit area to at least 48×48 without growing it.

**What `2d13f06` did** (CHANGELOG "tokens and brand (P1-14)"): TrustPill neutral, "Offer sent" →
warn tone, Spotify radios `accent-ink`; `--primary`/`--ring`/`--selected-bg` → `var(--ink)`; pulse
1.4s; all `font-extrabold` removed; every `tracking-*` in app code removed except the splash label
(with its reason); 10/11px classified and kept; AGENTS.md amended for decisions 2 and 3. It did not
touch GearCta's raw pink shadow, the h1/h2 base letter-spacing, radius, unused type utilities,
elevation, avatar tokens or `--gradient-brand`.

## Section 2 — Component and state cleanup

| Item | Status | Evidence | What's left |
|---|---|---|---|
| CoverHero safe area | Remaining | `profile.tsx:623` back `top-5 h-10`; `:628` actions `top-5` | Top inset; back is 40px with no hit-area |
| Sheets top/bottom insets | Remaining (partial) | ml `Sheet` (`ui.tsx:840`) has the bottom inset | Top inset |
| TextLink 48px | Verified | `links.tsx:37` uses `hit-area` | — |
| Rental days | Fixed `55c2d62` | `booking.tsx:351` `h-12` | — |
| Duration chips | Remaining | `booking.tsx:508` `min-h-touch` (44) | → 48 |
| Listing photo remove / tag remove | Remaining | `listing-form.tsx:782` 32px; `:915` 20px | hit-area |
| Proof-photo remove | Remaining | `bookable-setup.tsx:483` 24px | hit-area |
| Market filter chips, Clear all, FilterButton | Remaining | `market.tsx:1071` ~28px; `:1047`; `:1088` 40px | hit-area |
| ServiceCard Book / Details | Remaining | `profile.tsx:1157-1176` 40px; `:1229` ~28px | hit-area |
| Review Read more | Remaining | `profile.tsx:1395` | hit-area |
| DrawerSearchButton | Remaining | `drawer-list.tsx:51` 40px | hit-area |
| ImagePickButton focus ring | Remaining | `profile.tsx:467-480` focus on an sr-only input, no ring on the label | focus-within ring |
| Upload failure explicit + retry | Remaining (partial) | toasts at `gallery.tsx:139`, `bookable-setup.tsx:448`; `906b5f3` names failed photos | Retry |
| Gallery loading/empty/error | Remaining | `gallery.tsx:179` returns null on loading/error; `bookable-setup.tsx:434`, `:275` | States |
| Optimistic UI reconciles | Verified | `gallery.tsx:148-158` rolls back | — |
| ResourceCard Select | Remaining | `booking.tsx:240`, 0 consumers after rooms retired (`b284fe7`) | Remove |
| ServiceCard fallback Book | Remaining | `profile.tsx:1173-1179` enabled Btn with no action | Wire or disable |
| Studio cards swallowing taps | Fixed `fb7def6` | `cards.tsx:407`, `:492` | — |
| Opportunity Respond | Fixed `f6f6f57` | card removed | — |
| Share QR | Remaining | `qr.tsx:459-463` shares the URL, not the image | Share image or disable with reason |
| Add-on link | Remaining | `booking.tsx:563` generic `/marketplace/rent` | Link the listing or remove |
| Delete confirms ×8 (equipment, gallery, proof photos, stage plot, release, live video, identity unlink, Spotify disconnect) | Remaining | `ui/alert-dialog` has 0 importers | Confirms |
| Confirm: profile photo (onboarding) | Fixed `5484503` | control removed | — |
| Copy-keyed: market.tsx, market-filter, marketplace/c.$slug | Fixed `f3e9d97`, `ebc9c6d` | keys compared | — |
| Copy-keyed: listing-form | Remaining | `:91`, `:253`, `:654`, `:1024` | Union |
| Copy-keyed: rental / request.$id | Remaining | `rental.tsx:174`, `:183`; `request.$id.tsx:82`, `:95`, `:143` | Union |
| Copy-keyed: bookable-setup | Remaining | `:140`, `:340` | Union |
| Copy-keyed: profile.tsx | Remaining (partial) | `906b5f3` fixed one; `:283`, `:430`, `:314-324`, `:786`, `:1080`, `:1557` | Unions |
| Button nested in link (market) | Fixed `ebc9c6d` | — | — |
| FulfilmentPicker radio roles | Remaining | `rental.tsx:208` | role/aria-checked |
| Calendar day labels + pressed | Fixed `55c2d62` | — | — |
| ReportSheet selected | Fixed `f3e9d97` | — | — |
| Textarea focus ring | Remaining | `hire-modal.tsx:298`, `help.tsx:280` `outline-none` | Ring |
| Contextual LoadError | Remaining (partial) | `c657382`; 32 of 73 query files render LoadError | 9 files with no error state; 2 null-on-error |
| Brand: purple pills, Spotify radios | Fixed `2d13f06` | — | — |
| Brand: Unsplash behind card Blocks | Remaining | 11 `src/data/*.ts` files | Local photos |
| Brand: pink button scope | Remaining | `bg-brand-button` on count badges `tab-header.tsx:42`, `market.tsx:1092` | Neutral |
| Brand: duplicate/wrong marks | Blocked | owner assets | — |
| Icons: Lucide; 13 Gestalt kept | Verified | only `tab-icon.tsx` imports gestalt | — |
| "Made by Wugweb" | Verified | settings, welcome, auth screens | — |
| Marketplace nav / location picker | Verified (not built) | — | — |

## Section 3 — Token cleanup

| Item | Status | Evidence | What's left |
|---|---|---|---|
| 1 Unused type utilities | Remaining | `display-*`, `body-*`, `label-*`, `.headline-*`, `.title-*` have 0 consumers | Remove |
| 2 Tracking | Remaining (partial) | `2d13f06` cleared utilities | h1 -0.02em / h2 -0.01em in base CSS |
| 3 10/11px | Verified / retained | 4× 10px, 9× 11px, each metadata/label (AGENTS.md) | Vendor `text-[0.8rem]`, `[11.2px]`, `[13px]`, `[12.5px]`, `[16px]` |
| 4 Spacing | Verified (rule) | no migration | rule for new code |
| 5 Radius tail | Remaining | `rounded-md` ×6, `-2xl` ×3, `-3xl` ×18, `rounded-[…]` ×18 | Clean or document |
| 6 Unused tokens | Remaining | avatar tokens 0; elevation-1/-4 stories only | Remove |
| 7 raw values → ink | Fixed `2d13f06` | — | — |
| 8 Primary vs Ink | Remaining | `--primary: var(--ink)` | Usage list for owner |
| 10 Skeleton 1.4s | Fixed `2d13f06` | — | — |
| GearCta raw pink | Remaining | `gear-cta.tsx:143` shadow | Token |
| market.tsx raw hex | Fixed `ebc9c6d` | — | — |
| qr.tsx raw hex | Remaining (partial) | `qr.tsx:233`, `:36` | Token where an equivalent exists |
| `#0D0B26` | Remaining (isolated) | `rgb(13 11 38)` in elevation and gear-cta | Generic token or remove |

## Section 3.5 — Engineering hygiene

| # | Status | Evidence | What's left |
|---|---|---|---|
| 15 tour.tsx | Remaining | 0 importers, `next/link`, excluded from tsconfig/eslint | Remove |
| 16 Vendor primitives | Remaining | ~50 `ui/` primitives with 0 product consumers | Remove unused |
| 17 Glyph/emoji | Remaining (partial) | `c657382`, `55c2d62`, `966649c`, `4535840` | "← Prev"/"Next →"; work-type and category emoji |
| 18 font-extrabold | Fixed `2d13f06` | — | — |
| 19 DownloadCta | Fixed `5484503` | 0 app consumers | — |
| 20 Optional props | Ongoing rule | — | fix when touched |
| 21 Tailwind defaults | Ongoing rule | — | — |
| 22 `--gradient-brand`, stroke | Remaining | 0 consumers | Remove; stroke inventory |
| Fabricated metrics | Fixed (named, `906b5f3`) / Remaining | "4× more likely", "3× more applications" | Remove |
| Storybook Unsplash | Remaining | 7 story URLs | Local fixtures |
| 33 liquefy-ui.css | Verified Storybook-only | `.storybook/preview.tsx:13` | — |
| 34 Brand assets | Blocked | owner assets | — |
| 35 AUDIT-2026-09-29.md | Remaining | `Claude outputs/specs/` | Classify |
| 36 collab references | Remaining | 4 importers, 4 routes, nav item | Classify/migrate |
| 37 Platform leakage | Remaining | `next/link` in tour.tsx only | With #15 |
| 38 External media | Remaining (classification) | intentional embeds listed | Unsplash → local |

## Sections 4, 5, 7

| Item | Status | Evidence |
|---|---|---|
| 4 Route coverage, contrast per state, focus-visible everywhere, L/E/E/O states | Remaining | no record |
| 4 Reduced motion | Verified (global) | `styles.css:809-820` |
| 5 Rendering gate 360/412/640 + Android shell | Remaining | 412px spot checks only |
| 7 Stale `docs/*` (4 files, 16–23 Sep) | Remaining | — |
| 7 AGENTS.md decisions 2/3 | Fixed `2d13f06` | — |

**AGENTS.md disagrees with the code** (to resolve in section 7): radius (AGENTS lists six steps,
styles.css four); touch target (AGENTS 48dp, token 44px); overlays (AGENTS says shadcn
dialog/sheet/drawer, the app uses ml `Sheet`).
