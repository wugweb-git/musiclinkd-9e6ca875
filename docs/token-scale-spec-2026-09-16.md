# Token scale spec — MusicLinkd, as built

> **Current (updated 4 Oct 2026).** This is the one repo doc kept current; `src/styles.css` still
> wins on any disagreement. Changes since 23 Sep, from brief §3:
>
> - **Hit target:** `--spacing-touch` / `min-h-touch` is **48px** (owner, 29 Sep). 40–44px is only a
>   drawn size inside a 48px `hit-area`. `control-sm` 40, `control` 48, `control-lg` 56 unchanged.
> - **Radius:** app code uses only `sm` 8, `lg` 16, `3xl` 32 and `full`. The `rounded-md`,
>   `rounded-2xl` and arbitrary `rounded-[…]` uses were moved onto those steps (vendor code aside).
> - **Type:** the unused `display-*`, `body-*`, `label-*` utilities and `.headline-*`/`.title-*`
>   aliases are gone; h1/h2 set at normal tracking. Sizes are the `text-*` steps only.
> - **Removed tokens:** avatar sizes, `elevation-1`/`-4`, `--gradient-brand`/`brand-gradient`.
>   `--shadow-ink` (a generic near-black, not a brand colour) tints `elevation-2`/`-3` and GearCta.
> - **Primary vs Ink:** same colour; the usage list for the owner's decision is
>   `Claude outputs/primary-vs-ink-2026-10-04.md`.
> - **Contrast**, measured per state: `Claude outputs/contrast-2026-10-04.md`.


Companion to [system-rules-2026-09-16.md](system-rules-2026-09-16.md). That file names the
canonical components; this one names the scales underneath them, laid out as three layers —
primitive, semantic, component — and audits our numbers against the owner's original reference
where the two ever disagreed.

Source of truth for every value here is `src/styles.css`'s `@theme inline` block. Storybook's
**Foundations/Tokens** page (`src/registry/tokens.stories.tsx`) reads the same values live via
`getComputedStyle`, so if this file and Storybook ever disagree, Storybook is right — rerun the
audit and fix this file.

## The three layers

**Primitive** — raw values, no meaning attached. `--brand: #ea4c89`, `--pink-strong: #c7295f`,
`--ink: #0d0d0d`, the numeric Tailwind spacing scale (`p-1` = 4px … `p-8` = 32px), `--radius-sm/
lg/3xl`, `--duration-1..4`, `--easing-standard/enter/spring`.

**Semantic** — a primitive given a role. `--color-price` (→ `--pink-strong`, "prices are always
brand pink"), `--pink-on-tint` (a darkened mix of `--pink-strong` for text-on-tint contrast, see
below), `--elevation-1..4`, `--opacity-1..4`, the z-index scale (`--z-raised/tabs/bar/nav/sheet`).

**Component** — a semantic token consumed by a component. `StatusPill`'s `tone` prop maps to
`--success`/`--warn`/`--danger`/`--brand` containers; `Segmented`'s active-tab underline reads
`--brand`; card surfaces read `--card`/`--radius-lg`.

A value should only ever move down this chain (primitive → semantic → component), never sideways
— a component should not read a primitive directly if a semantic token for that role exists.

## Radius — four steps, not seven

| Token | Value | Role |
| --- | --- | --- |
| `--radius-sm` | 8px | Small controls (chips, badges) |
| `--radius-lg` | 16px | Cards, the base container |
| `--radius-3xl` | 32px | Sheets, dialogs, full-bleed hero |
| `rounded-full` | 9999px (Tailwind utility, not a CSS var) | Pills, buttons, avatars |

Reduced from seven steps on 16 Sep 2026: `xs` (4px), `md` (12px), `xl` (20px) and `2xl` (28px)
were retired into their nearest neighbour. There is no `--radius-xl` or `--radius-2xl` in the
codebase today. The owner's original reference names one 32px radius for "the base container" —
ours is 16px there (390 call sites on `rounded-lg`); see `system-rules-2026-09-16.md`'s
Implementation rules table for that disagreement, named rather than smoothed over.

## Spacing — one system

Tailwind's numeric scale only (`p-1` = 4px, `p-2` = 8px, `p-4` = 16px, `p-8` = 32px). A second,
named scale (`--spacing-xs/sm/md/lg`) existed briefly, had zero call sites, and was removed on
13 Sep 2026. `--space-1..4` and the `--spacing-control/-touch/-icon/-avatar` tokens still in
`styles.css` are reference values for Storybook's token page and hand-authored components (touch
target sizing, icon sizing) — they are not a competing layout system.

## Ink, not navy

`--navy` (`#0d0b26`) is retired. Every `bg-navy`, `variant="navy"` and `--gradient-navy` became
`--ink` (`#0d0d0d`) on 13 Sep 2026. There are no live `--navy` references in `src/`.

## Brand pink — interaction states only

Pink is a rare accent (about 10% of a screen at most), never a resting border, background or
body text. Three sanctioned uses, per `SPEC-issue17-brand-pink-interaction-states.md`, all
already shipped:

1. **Active-tab underline** — `Segmented`'s active tab gets a 2px brand-pink underline
   (`src/components/ml/kit.tsx:258`); inactive tabs get none.
2. **Momentary press feedback** — the `press-brand` utility (`src/styles.css:1073`) puts a
   brand-pink shadow ring on `:active` only, reverting on release. Used by inputs, OTP boxes and
   buttons (6 call sites).
3. **Selected pill** — `bg-brand/20` fill with `--pink-on-tint` text
   (`src/components/ml/kit.tsx:208`), modeled on Facebook's "Explore" pill.

### Contrast — pink-on-tint verified against WCAG AA (2026-09-22)

`--pink-strong` alone on a `bg-brand/20` fill measures **4.20:1** — below the 4.5:1 AA threshold
for normal text, which is exactly why `--pink-on-tint` exists: `color-mix(in oklab,
var(--pink-strong) 78%, black)` darkens it before it's used as text.

Measured (OKLab mix computed to sRGB, WCAG relative-luminance contrast formula, against the
`bg-brand/20` fill composited over `--surface-subtle` #ffffff):

| Pairing | Ratio | Result |
| --- | --- | --- |
| `--pink-strong` text on `bg-brand/20` | 4.20:1 | Fails AA (confirms the comment already in `styles.css:596`) |
| `--pink-on-tint` text on `bg-brand/20` | **6.89:1** | Passes AA (4.5:1) comfortably |

No hex change needed. `--pink-on-tint` is a verified, standing guarantee — any new component
putting pink text on a `bg-brand/20`-style tint should use `--pink-on-tint`, not `--pink-strong`,
for the text color.

## Motion

`--duration-1..4` (125/200/320/500ms) and `--easing-standard/enter/spring` are the only motion
primitives; every named `--animate-*` composite (tab-home, ripple, splash-mark, etc.) is built
from these. New animation work (screen transitions, icon-state-change) should read these tokens
rather than inventing new timing values — see `SPEC-issue19-component-reuse-perf-transitions.md`.

## Icon-chip — contrast measured, fixed to ash black (2026-09-23)

`--icon-chip` (`src/styles.css`) is a background fill used behind icons/avatar placeholders in
~11 places (`drawer-list.tsx`, `rental.tsx`, `business-profile.tsx`, `portfolio.tsx`,
`profile.tsx`'s cover placeholder and `ReviewInviteCard`, `market.tsx`, `services.$id.index.tsx`,
`categories.index.tsx`, `marketplace/mine.tsx`) — not the Settings-row icon
`SPEC-icon-language-audit.md`'s screenshots describe (that row has no chip at all today, which
already satisfies the spec's "default: no container chip" rule).

Measured on the old value (WCAG relative-luminance contrast, same method as the pink-on-tint
check above):

| Pairing | Ratio |
| --- | --- |
| Old `--icon-chip` (`#e2e5e9`) on white (`--surface-subtle`/`--card`) | 1.26:1 |
| Old `--icon-chip` (`#e2e5e9`) on the page (`--background` #ececf1) | 1.07:1 |

Neither read as a shape (a visible UI-component boundary conventionally wants somewhere around
3:1). The spec deliberately gave no target ratio or replacement hex, so before changing it a
range of darker candidates was measured — even a fairly dark gray like `#c8cad0` only reaches
1.64:1 on white; a gray needs to reach roughly `#919191` to cross 3:1 at all. The owner's call
(23 Sep): go further than the contrast floor, to **ash black, `#1c1c1c`** — **17.04:1 on white**.

**Call-site follow-up — done (2026-09-23).** All 11 real `bg-icon-chip` usages (`drawer-list.tsx`,
`rental.tsx`, `business-profile.tsx`, `portfolio.tsx`, `profile.tsx`'s `ReviewInviteCard`,
`market.tsx`, `services.$id.index.tsx` ×2, `categories.index.tsx`, `marketplace/mine.tsx` ×2)
switched their icon/text color to `text-primary-foreground` (white, 17.04:1 on the chip) or, for
`rental.tsx`'s active/inactive icon toggle, `text-primary-foreground`/`text-primary-foreground/60`
(17.04:1 / 6.85:1, both pass AA). `MarketCategoryIcon` (`market.tsx`) gained a `className` prop
so its 3 icon-chip callers can override the color without breaking its other, light-background
uses. `profile.tsx:571` (the cover-photo placeholder fill) has no content on it — nothing to
recolor there. Verified: `tsc --noEmit` clean, `eslint` clean, `test-storybook` 20/20·146/146,
`bun run build` succeeds.

## Disabled-button contrast — triaged and fixed (2026-09-23)

Flipping Storybook's a11y gate from `test: "todo"` to `test: "error"` first failed 34 tests
across 15 story files, all the same axe `color-contrast` violation: `disabled:text-foreground/40`
on `disabled:bg-foreground/10` (`ui.tsx`'s `filledDisabled`, e.g. the `Btn` "Publish" state in
`work-form.stories.tsx`) resolves to **2.5:1**, against a 4.5:1 requirement. `Chip`'s `atLimit`
state had the same problem via a separate `opacity-50` (3.64:1).

**Triage, per Material's own disabled-state guidance**: Material 3 dims disabled content to 38%
over a 12% container — almost exactly this codebase's `/40` and `/10` — and WCAG 1.4.3 exempts
genuinely inactive controls from contrast requirements. That's the correct treatment, but only for
a *true* `disabled` element: native `disabled` removes a control from the tab order entirely, so
nobody is meant to read it. The same low-contrast classes were also applied to `aria-disabled` and
`data-pending`, and neither of those is inert here by design — the code's own comments say so:
`pending` "looks disabled but still takes the tap, so the form can say what is missing";
`atLimit`'s aria-disabled chip "shakes and vibrates instead of selecting." A control a user can
still reach and act on has to stay legible; dimming it to Material's *disabled* strength was a
misapplication of that pattern to a state that was never actually disabled.

**Fix**: `disabled:` keeps the original Material treatment (still WCAG-exempt, unchanged).
`aria-disabled:`/`data-pending:` now use `text-muted-foreground` (13.25:1 on the faint container)
instead of `text-foreground/40`; `Chip`'s `atLimit` drops its `opacity-50` on the label for the
same reason. Verified: all 34 original failures gone (`bun run test-storybook` with the gate at
`"error"` — zero `color-contrast` failures matching this pattern).

**The 26-failure follow-up — triaged and fixed, gate now live at `"error"` (2026-09-23).** With
the disabled-button pattern fixed, flipping the gate surfaced 26 more failures across 8 axe rules
that were always there, hidden by `"todo"`. Resolved:

- **`color-contrast` (13)** — three distinct root causes, not one:
  - `--destructive` (`#dc2626`, 4.1:1 on the page, 3.44:1 on its own container tint) darkened to
    `oklch(0.44 0.2152 27.33)` (≈`#aa0000`): ≥4.5:1 against every surface it appears on (page,
    white, its own container on either). `--danger` was a second literal at the same old value
    (used by `bg-danger-container`, paired with `text-destructive` in `StatusPill`'s "bad" tone)
    — aliased to `var(--destructive)` so the two can't drift apart again.
  - `text-warn`/`text-success` (raw container tones, `#f59e0b`/`#22c55e`, 2.14:1/1.93:1 as text)
    were being used as body text in 8 real places (`rental.tsx`, `cards.tsx`'s `Stars`,
    `profile.tsx`, `market.tsx`, `profile.edit.tsx` ×2, `business.new.tsx`) instead of the
    `-strong` variants the codebase already has for exactly this (`--warn-strong`/
    `--success-strong`, already used correctly elsewhere, e.g. `StatusPill`). Swapped to the
    `-strong` tokens (10.66:1/11.00:1 on white) — decorative icons using the raw tone kept as-is,
    only real text nodes changed.
  - **Brand-pink CTA — resolved (2026-09-23).** Owner's call: darken `--brand` for buttons only,
    leave the brand mark itself alone. New token `--brand-button: color-mix(in oklab, var(--brand)
    80%, black)` (`#ae3664`) — **5.99:1** against pure white, **5.09:1** against `--background`
    (the off-white used as CTA text on dark hero blocks, which is worse than pure white: `--brand`
    alone only cleared 3.02:1 there). Applied to the three real CTA/button surfaces: `Btn`'s
    `brand` variant (`ui.tsx`), `BottomCta`'s primary button (`marketing.tsx`), and the gear-sell
    CTA (`gear-cta.tsx`). `--brand` itself is untouched everywhere else (logo, active-tab
    underline, pill-selected fill, unread dots) — those never carry text, so the original contrast
    problem doesn't apply to them. The 4 stories that were individually exempted for this
    (`marketing.stories.tsx`'s `Bottom`/`Bottom CTA`, `person-profile.stories.tsx`'s `Visitor`/
    `WithoutUsername`) had their exemptions removed and now pass for real. **Not touched**: two
    small notification-count badges (`market.tsx:1104`, `tab-header.tsx:40`) still use raw
    `bg-brand` with white/background text at 10–11px — same underlying issue, but out of scope
    ("buttons only") and never flagged by axe in any tested story. Worth a look if this ever
    surfaces.
- **`aria-prohibited-attr` (13)** — `Stars` (`kit.tsx`) had `aria-label` on a `<span>` with no
  `role`; added `role="img"`. Two loading skeletons (`portfolio.tsx`'s `PortfolioSkeleton`,
  `profile.tsx`'s `ProfileSkeleton`) had `aria-busy`+`aria-label` on a `<div>` with no `role`;
  added `role="status"`.
- **`landmark-unique` (1)** — `SearchField`'s `<form role="search">` (`tab-header.tsx`) had no
  accessible name; gained an optional `label` prop (default `"Search"`). Only surfaced because one
  story (`tab-header.stories.tsx`'s `LongPlaceholder`) deliberately renders two side by side to
  demo long placeholders — real screens only ever show one. Gave the two demo instances distinct
  labels.
- **`heading-order` (1)** — `CompletionCard`'s heading (`profile.tsx`) was an `h3` directly under
  the profile's `h1` name, skipping `h2`. Bumped to `h2`, matching this file's other top-level
  section headings.
- **`image-redundant-alt` (6), `aria-progressbar-name` (4), `aria-allowed-attr` (4),
  `button-name` (3), `aria-input-field-name` (2), `nested-interactive` (1)** — all 20 of these
  were in vendor reference components (`src/lab/*.stories.tsx`, `src/registry/kept.stories.tsx`)
  that the app deliberately doesn't ship (each one duplicates something we already ship, per that
  file's own comment). Not our code to fix, and the gate can't stay permanently blocked by
  reference material we don't maintain — exempted those specific story files
  (`parameters.a11y.test: "off"`, each with a comment explaining why), not the whole gate.

Net result: `.storybook/preview.tsx` is now `a11y: { test: "error" }` for real. `test-storybook`
passes 20/20 files, 146/146 tests, with the gate live and zero owner-decision exemptions left —
the brand-pink CTA fix above (2026-09-23) resolved the last one. The only remaining exemptions are
the vendor reference stories (`src/lab/*`, `src/registry/kept.stories.tsx`) nobody maintains, each
documented in place.

## Audit status

This file replaces the placeholder reference `src/registry/tokens.stories.tsx` originally cited
(`docs/token-scale-spec-2026-09-16.md`, which did not exist until this pass). Everything above was
cross-checked against `src/styles.css` and the live Storybook token page on 2026-09-22; rerun that
cross-check whenever a token scale changes.
