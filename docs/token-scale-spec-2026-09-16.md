# Token scale spec — for Storybook and the design guide

Owner's spec, 16 Sep 2026. **Not implemented.** Parked here so the Storybook token pages and the
design guide can be mapped against it later. The app today uses the numbered ramps in
`src/styles.css` (`--type-0…--type-5`, Tailwind `text-0`, `text-1`, `text-sm`, `text-2`,
`text-2.5`, `text-3`, `text-4`, `text-5`); reconciling the two is the work this file describes.

## Scales — four steps each

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

## Scale audit

Measured, not asserted. A step passes if each neighbour differs by at least 1.5×.

| Scale | Steps | Ratios | Verdict |
| --- | --- | --- | --- |
| space | 4/8/16/32 | 2.0× ×3, 8× spread | Pass |
| radius | 8/16/32 | 2.0× ×2; 9999 is functional, not a step | Pass |
| opacity | 0.08/0.16/0.32/0.64 | 2.0× ×3, 8× spread | Pass |
| motion | 125/200/320/500ms | 1.6×, 1.6×, 1.56× | Pass |
| zIndex | 100/200/400/800 | 2.0× ×3 | Pass |
| elevation | blur 3/12/24/32 | separable at every step | Pass |
| size | 32/40/48/56 | 1.25×, 1.2×, 1.17× — a constant set, not a scale; the 48dp / 44pt touch floor rules out an exponential ramp | — |
| type | 12/16/22/32 | 1.33×, 1.38×, 1.45× — modular perfect-fourth ramp, chosen for text | — |

## Typography

| Token | Fluid value (web) | Weight | Compose TextStyle | Usage |
| --- | --- | --- | --- | --- |
| `--type-1` | 12px → 13px | 600 | Inter, 12sp / 16sp, W600 | Micro labels, captions, badges, metadata, timestamps |
| `--type-2` | 16px → 18px | 400 | Inter, 16sp / 24sp, W400 | Body copy, default UI text, list item titles |
| `--type-3` | 22px → 28px | 600 | InterTight, 22sp / 28sp, W600 | Section headings, card titles, screen titles |
| `--type-4` | 32px → 44px | 800 | InterTight, 32sp / 40sp, W800 | Display — hero headlines, now-playing title, the one big number |

| Property | Value | Usage |
| --- | --- | --- |
| Paragraph spacing | `--space-3` · 16px | Between paragraphs |
| Max line width | `--layout-measure` · 64ch | `.ml-measure` |
| Font fallback | `-apple-system, BlinkMacSystemFont, sans-serif` | Declared inside each `--font-*` |
| Number style | Tabular | Stats, tables, timers — `.ml-tabular` |

## Sizing map

Mapped, never duplicated — a second name for the same number is how the previous system reached
248 tokens.

| Component | Resolves to |
| --- | --- |
| `--comp-btn-h-sm/-md/-lg` | `--size-1/-2/-3` (32/40/48) |
| `--comp-input-h` | `--size-2` (40) |
| `--comp-chip-h` | `--size-1` (32) |
| FAB small / regular | `--size-2` / `--size-4` (40/56) |
| Touch target min / comfortable | `--size-3` / `--size-4` (48/56) |
| Nav height | `--size-3` (48) |
| Switch track | height `--size-1` (32), width `--component-switch-track` (52) |
| `--comp-card-padding` / `-radius` | `--space-3` / `--radius-3` (16/32) |
| `--layout-gutter-mobile/-tablet/-desktop` | `--space-3` / `--space-4` / `--space-4` |
| `--layout-gap-sm/-md/-lg` | `--space-2` / `--space-3` / `--space-4` |
| `--layout-aspect-*` | 4/3 has no token (known gap); wide 16/9; square 1/1 |
| `--state-disabled-opacity` | `--opacity-3` (0.32) |
| `--state-hover-bg` / `-pressed-bg` | `--color-ink` at `--opacity-1` / `--opacity-2` |
| `--state-selected-bg` | `--color-pink-container` |
| `--state-focus-ring` | 2px `--color-pink` at 2px offset, defined once in `:focus-visible` |
| `--sp-xs…-2xl` | `--space-1/-2/-3/-4`; 24 and 48 have no token by design |
| `--r-card/-media/-pill/-avatar` | `--radius-3` (32; spec said 24, changed to match the scale) / `--radius-2` / `--radius-4` / `--radius-4` |

## Elevation and borders

| Token | Shadow | Usage |
| --- | --- | --- |
| `--elevation-1` | 0 1px 3px rgba(13,11,38,.08) | Cards, chips, resting surfaces — prefer a `--color-line` border first |
| `--elevation-2` | 0 4px 12px rgba(13,11,38,.05) | Hover cards, dropdowns, popovers |
| `--elevation-3` | 0 8px 24px rgba(13,11,38,.08) | FAB, side sheet, bottom sheet, mini-player |
| `--elevation-4` | 0 12px 32px rgba(13,11,38,.12) | Modals, dialogs, full-screen overlays |
| `--border-1` | 1px solid `--color-line` | Divider, card border, input rest |
| `--border-2` | 2px solid `--color-pink` | Focus ring, selected card or chip |
| disabled border | 1px solid `--color-disabled` | Inactive controls |

## Component states

| State | Trigger | Visual |
| --- | --- | --- |
| Default | Rest | Base style |
| Hover | Pointer enter | `--elevation-2`, translateY(-2px); pointer only |
| Focused | Keyboard | 2px `--color-pink` outline at 2px offset |
| Pressed | Pointer down | scale(0.96–0.97), `--duration-1` |
| Selected | Tap | `--color-ink` fill for commitment; `--color-pink-container` for intent |
| Disabled | Inactive | opacity `--opacity-3`, pointer-events none |
| Loading | Async | `.ml-skeleton` shimmer |
| Error | Validation fail | `--color-error` border and message |
| Empty | No data | `.ml-empty` — icon, message, CTA |

## Semantic roles

No CSS of their own on web; the names exist for the Compose and SwiftUI exports.

| Role | Token | Usage |
| --- | --- | --- |
| Primary | `--color-ink` | CTAs. Black, not pink — set by the brand owner |
| Accent | `--color-pink` | Focus, selection, active tab, brand mark. Never a CTA fill |
| Primary container | `--color-pink-container` | Badge and tag ground |
| Surface | `--color-white` | Card and sheet fill |
| Surface variant | `--color-surface` | Search bars, inactive segments, skeletons |
| Background | `--color-paper` | App canvas |
| Outline | `--color-line` | Hairlines and dividers |
| Success | `--color-success` | Confirmed, available, verified |
| Warning | `--color-warning` | Pending, caution |
| Error | `--color-error` | Rejected, critical, destructive |
| Info | `--color-info` | On Tour, remote available |
| Disabled | `--color-disabled` | Inactive elements |
| Scrim | `--color-scrim` | Backdrop behind drawers, sheets, modals |
