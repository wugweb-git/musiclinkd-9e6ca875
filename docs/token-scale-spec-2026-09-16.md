# Token scales — the reference spec, and what MusicLinkd actually has

Two halves. **Part 1** is the owner's four-step reference spec (16 Sep 2026). **Part 2** is the
measured state of `src/styles.css` and the app, against that shape, with the gaps named. Nothing in
Part 2 has been changed to fit Part 1 — this is the audit that decides what to change, and it is
where Storybook's token pages and the design guide should be mapped from.

---

# Part 1 — the reference spec

## Scales, four steps each

| Scale | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- |
| space | 4px | 8px | 16px | 32px |
| radius | 8px | 16px | 32px | 9999px |
| size | 32px | 40px | 48px | 56px |
| icon | 16px | 20px | 24px | 32px |
| avatar | 24px | 32px | 48px | 64px |
| elevation | 1dp | 3dp | 8dp | 12dp |
| opacity | 0.08 | 0.16 | 0.32 | 0.64 |
| type · web | 12–13px | 16–18px | 22–28px | 32–44px |
| type · android | 12sp | 16sp | 22sp | 32sp |
| type · iOS | caption1 | body | title3 | largeTitle |
| motion · web | 125ms | 200ms | 320ms | 500ms |
| motion · android | spring 1/1500 | spring 0.9/700 | spring 0.85/400 | spring 0.75/300 |

A step passes the audit if each neighbour differs by at least 1.5× — roughly where a difference
stops being arguable at a glance.

## Typography, as specified

| Token | Fluid value (web) | Weight | Compose TextStyle | Usage |
| --- | --- | --- | --- | --- |
| `--type-1` | 12px → 13px | 600 | Inter, 12sp / 16sp, W600 | Micro labels, captions, badges, metadata, timestamps |
| `--type-2` | 16px → 18px | 400 | Inter, 16sp / 24sp, W400 | Body copy, default UI text, list item titles |
| `--type-3` | 22px → 28px | 600 | InterTight, 22sp / 28sp, W600 | Section headings, card titles, screen titles |
| `--type-4` | 32px → 44px | 800 | InterTight, 32sp / 40sp, W800 | Display — hero headlines, the one big number |

Paragraph spacing `--space-3` (16). Measure 64ch. Tabular numbers for stats, tables and timers.

## Elevation, states, roles

Elevation 1–4 as `0 1px 3px`, `0 4px 12px`, `0 8px 24px`, `0 12px 32px` of `rgba(13,11,38,·)`.
Hover: elevation-2 and a 2px lift, pointer only. Focus: 2px accent at 2px offset. Pressed:
scale 0.96–0.97 at duration-1. Selected: ink for commitment, pink container for intent. Disabled:
opacity-3, no pointer events. Primary is ink; pink is accent only, never a CTA fill.

---

# Part 2 — what MusicLinkd has today

Measured from `src/styles.css` and from every `size={n}` and `rounded-*` in `src/components/ml`
and `src/routes`, 16 Sep 2026.

## The scales we actually ship

| Scale | Our steps | Source |
| --- | --- | --- |
| space | Tailwind numeric, used at 4 · 6 · 8 · 10 · 12 · 14 · 16 · 20 · 24 · 28 · 32px | no token; `--spacing-nav-clear: 96px` is the one named value |
| radius | 4 · 8 · 12 · 16 · 20 · 28 · 32 · full | `--radius-xs … --radius-3xl` |
| size (controls) | 40 (chip `min-h-10`) · 44 · 48 (button `min-h-12`) | component classes, no token |
| icon | 11 · 12 · 13 · 14 · 15 · 16 · 17 · 18 · 20 · 22 · 24 · 26 · 36 · 40 · 44 | inline `size={n}`, no token |
| avatar | 24 · 32 · 40 · 44 · 48 · 56 · 84 · 112 · 136 | component classes, no token |
| elevation | blur 3 · 12 · 24 · 32 | `--elevation-1…4` |
| opacity | 0.08 · 0.16 · 0.32 · 0.64 | `--opacity-1…4` |
| type | 11 · 12 · 14 · 16 · 19 · 22 · 32 · 40px at 412px, each a clamp to 1440px | `--type-0 … --type-5` |
| motion | 125 · 200 · 320 · 500ms | `--duration-1…4` |
| easing | standard `cubic-bezier(.4,0,.2,1)` · enter `(.05,.7,.1,1)` · spring `(0,.35,0,1.25)` | `--easing-*` |
| z-index | 20 (tabs) · 30 (top bars) · 40 (bottom nav) · 50 (sheets) | inline classes, no token |
| layout | app shell 640px, nav clearance 96px | `--container-app`, `--spacing-nav-clear` |

## Audit

| Scale | Ratios | Verdict |
| --- | --- | --- |
| opacity | 2.0× ×3 | **Pass** — identical to the spec |
| motion | 1.6× · 1.6× · 1.56× | **Pass** — identical to the spec |
| elevation | blur 4× · 2× · 1.33× | **Pass** — separable at every step, matches the spec |
| z-index | 1.5× · 1.33× · 1.25× | **Pass in practice** — four layers that never collide, but untokenised and not the spec's 100/200/400/800 |
| radius | 2.0 · 1.5 · 1.33 · 1.25 · 1.4 · 1.14 | **Fail** — eight steps where the spec has three plus `full`. In real use it is already three: `lg` 390 uses, `full` 346, `md` 76, everything else 4 uses combined |
| space | linear, not a ramp | **Fail as a scale** — no token layer at all; 11 distinct values in use |
| size | 40 · 44 · 48 | Constant set, not a scale, and correct — the 48dp touch floor rules out a ramp. Untokenised |
| icon | 15 distinct sizes | **Fail** — the spec asks for 4. 16 and 18 carry 248 of ~500 uses; the other 13 sizes are noise |
| avatar | 9 distinct sizes | **Fail** — no token, set per component |
| type | 1.09 · 1.17 · 1.15 · 1.19 · 1.16 · 1.46 · 1.25 at 412px | **Fail against 1.5×** — eight steps at ~1.15×, four of which are within 20% of a neighbour |

## The type ramp in detail

| Token | Tailwind | 412px | 1440px | Weight in use | Role today |
| --- | --- | --- | --- | --- | --- |
| `--type-0` | `text-0` | 11.05 | 12 | 500 | Pills, eyebrows, unit lines, meta captions |
| `--type-1` | `text-1` | 12.05 | 13 | 400 / 600 | Meta, hints, secondary rows |
| `--type-sm` | `text-sm` | 14.05 | 15 | 400 / 600 | Body, buttons, list titles |
| `--type-2` | `text-2` | 16.10 | 18 | 600 | Card titles, sub-headings |
| `--type-2-5` | `text-2.5` | 19.14 | 22 | 700 | Section headings |
| `--type-3` | `text-3` | 22.29 | 28 | 700 | Profile name, screen titles |
| `--type-4` | `text-4` | 32.58 | 44 | 800 | Home greeting |
| `--type-5` | `text-5` | 40.77 | 56 | 800 | Splash only, one call site |

`--type-0`, `--type-sm` and `--type-2-5` were added on 16 Sep so the 1,158 hand-set sizes the app
was carrying could all land on a step. They did their job, and they are also the three steps that
make the ramp fail the 1.5× test.

## What to change, in order

1. **Type: eight steps to five.** Keep 12 / 16 / 22 / 32 as the spec's four, plus 14 for body — the
   step the app leans on hardest (it is the default control and body size). Retire `--type-0` into
   12, `--type-2-5` into 22, `--type-5` into 32. Cost: `text-0` has ~400 call sites (`pill` sets it
   for most of them), `text-2.5` ~40, `text-5` one. Do `pill` first and the rest follows.
2. **Icon sizes: fifteen to four** (16 / 20 / 24 / 32). 16 and 18 are already half the uses; folding
   18 → 20 and 13/14/15/17 → 16 is a find-and-replace with a screenshot pass.
3. **Radius: eight steps to four** (8 controls, 16 cards, 32 sheets, full). `xs`, `xl` and `2xl`
   have six uses between them.
4. **Tokenise what has no token**: space, control size, icon, avatar, z-index. Without these the
   Compose and SwiftUI exports have nothing to read.
5. **Space**: adopt 4 / 8 / 16 / 32 as the sanctioned steps and treat 6, 10, 14, 20, 24, 28 as
   exceptions that need a reason — the spec deliberately omits 24 and 48.

Each of 1–3 is a mechanical sweep plus a screenshot pass at 350, 412 and 640. None of them should
travel with a feature change; they want their own branch and their own review.

## Semantic roles as the app defines them

| Role | Our token | Value | Note |
| --- | --- | --- | --- |
| Primary | `--primary` / `--ink` | `#0d0d0d` | Buttons, selection, progress, focus ring. Owner's call, 14 Sep |
| Accent | `--brand` | `#ea4c89` | Logo, unread dots, the Welcome tagline. Never a fill |
| Pink for text | `--pink-strong` | `#c7295f` | Prices (`--color-price`) and section actions. The only pink that clears contrast as text |
| Surface | `--card` | white | Cards, sheets |
| Surface variant | `--surface-subtle` | `#f8f8fb` | Inactive segments, thumbnails, skeletons |
| Background | `--background` | paper | App canvas |
| Outline | `--border` | `#d5d5de` | 1.458:1 on the card fill — a hairline you can see |
| Muted text | `--muted-foreground` | `#66666f` | Clears 4.5:1 on both the card and the ground |
| Success | `--success` / `--success-container` / `--success-strong` | — | Available, verified, confirmed |
| Warning | `--warn` / `--warn-container` / `--warn-strong` | — | Pending, visibility notices |
| Error | `--destructive` / `--danger-container` | — | Destructive and rejected |
| Category | `--status-category-bg` / `-text` | purple 12% / 72% | The only sanctioned purple |
| Selected | `--selected-bg` / `-text` | ink on white | One active state everywhere |
