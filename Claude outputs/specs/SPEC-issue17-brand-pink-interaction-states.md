---
doc: SPEC-issue17-brand-pink-interaction-states
version: 1.0
status: CURRENT
updated: 2026-09-16
verified_against: builds on the Facebook "Explore" pill pattern already captured in Issue 3's
  screenshot (`issue3-facebook-marketplace-topnav.png`) — same mechanics, brand-pink instead of
  Facebook's blue
folder: specs
originally: new
---

# Issue 17 — brand pink usage rules: active tab, touch feedback, and the pill/toggle button

## The governing rule, stated first: pink is rare

Every use below is a **small, specific signal** — active tab, momentary touch feedback, selected
pill — not a general accent color splashed across the UI. If pink starts showing up as a default
border, a default background, or anything present in a resting/unselected state, that's already
a violation of this issue. Worth Claude Code treating this as a lint-able rule (which token gets
used where), not just a guideline to remember.

## 1 · Active tab indicator

When a tab is the active one: a bottom line/underline in brand pink. Inactive tabs: no colored
line. This is the one *persistent* use of pink in this issue — it stays on while the tab is
active, unlike the touch feedback below which is momentary.

## 2 · Touch/press feedback — momentary only

Buttons, OTP boxes, input boxes, and similar interactive elements get a brand-pink shadow or
outline **only during the touch/tap phase** — i.e. the CSS-equivalent of `:active`, while the
finger/pointer is actually down, not `:focus` staying lit after release and not a persistent
"selected" ring. The moment contact ends, the pink feedback goes away (reverts to whatever the
element's normal resting/focused state is). This is deliberately different from §3's pill button,
which *does* hold a persistent pink state once selected — don't conflate momentary press feedback
with a selected/toggled state.

## 3 · Pill/toggle button — selected state

Reference: Facebook's "Explore" pill in the Marketplace nav (`issue3-facebook-marketplace-
topnav.png`, already delivered) — light-blue-filled pill, blue label, for the selected tab among
Sell/Explore/Local/More. Same mechanics, brand pink instead of blue:

- **Unselected:** neutral label, no fill (or the app's default button/chip resting style).
- **Selected:** label text in brand pink, background in brand pink at roughly 20% opacity (match
  Facebook's actual ratio, don't just eyeball "looks about right" — measure their fill against
  their base blue the way Issues 2/3 measured chip contrast, then apply the same ratio to your
  pink).

## Flag before this ships: contrast at 20% opacity needs checking, not assumed

Pink text sitting on a ~20%-opacity pink background is a self-referential contrast problem — how
readable it is depends entirely on how light or saturated the actual brand pink hex is. A pale
pink at 20% opacity might not give pink text 4.5:1 contrast (WCAG AA for normal-size text) against
that tint. This isn't something to guess at without the real hex — **once the brand pink value is
set, run the actual pair (pink text / 20%-pink background) through a contrast check before
shipping the pill component**, the same way Issue 2 measured real values instead of assuming a
grey "looked fine." If it fails, the fix is usually a slightly darker/more saturated pink for the
text than for the fill, not abandoning the pattern.

## What this doesn't decide

The actual brand pink hex value (not mine to pick), exact underline thickness/pill corner radius,
and whether the pill pattern applies anywhere beyond the "Explore"-style filter/tab use case shown
in the reference.
