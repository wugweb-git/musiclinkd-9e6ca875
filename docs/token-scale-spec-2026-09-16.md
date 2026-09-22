# Token scale spec — MusicLinkd, as built

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

**Follow-up the owner is handling separately**: most `bg-icon-chip` call sites draw a dark
icon/text on top of it, which was fine against the old light gray but is now low-contrast (or
invisible) against near-black — those ~11 sites need their icon/text color reviewed and likely
flipped to a light color. Not done as part of this token change; `--icon-chip` itself is fixed,
the call sites are not yet updated to match.

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

**Gate left at `"todo"`, not flipped live — a bigger, separate finding.** With the disabled-button
pattern fixed, flipping the gate still surfaced **26 more failures across 8 different axe rules**
that were always there, just hidden by `"todo"`: `color-contrast` (13, unrelated to disabled
buttons — `--destructive` red text on light backgrounds at 4.1:1, `Stars`' amber at 1.82–2.14:1,
a pink-on-brand pill at 3.02:1), `aria-prohibited-attr` (13), `image-redundant-alt` (6),
`aria-progressbar-name` (4), `aria-allowed-attr` (4), `button-name` (3), `aria-input-field-name`
(2), `nested-interactive` (1), `landmark-unique` (1), `heading-order` (1). None of this is a
disabled-state issue — it's a separate, much larger a11y triage that wasn't part of the "disabled-
button contrast" ask. Flagged here rather than fixed silently or the gate left broken; a full
per-rule triage (the same "is this element genuinely exempt or not" question, repeated 8 ways)
is real follow-up work, not a token change.

## Audit status

This file replaces the placeholder reference `src/registry/tokens.stories.tsx` originally cited
(`docs/token-scale-spec-2026-09-16.md`, which did not exist until this pass). Everything above was
cross-checked against `src/styles.css` and the live Storybook token page on 2026-09-22; rerun that
cross-check whenever a token scale changes.
