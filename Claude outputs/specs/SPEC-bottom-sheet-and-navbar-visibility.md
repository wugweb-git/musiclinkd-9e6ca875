---
doc: SPEC-bottom-sheet-and-navbar-visibility
version: 1.0
status: CURRENT
updated: 2026-09-16
verified_against: not checked against the app repo yet — this documents the stated requirement,
  not what's currently implemented. "QR card screens" refers to whatever set of card/QR variants
  already exists in the product; the actual list isn't enumerated here — see open question below.
folder: specs
originally: new
---

# Issue 5 — QR/card screens as bottom drawers, and bottom navbar visibility

## QR/card variations → bottom drawer, not full-screen route

Every variant of a "QR card" screen (whatever the actual set is — profile QR, business/studio
QR, event or ticket QR, listing QR, etc.) opens as a **bottom sheet/drawer**, not a full-screen
navigation push. One consistent presentation mechanism for the whole family, not one drawer here
and one full page there.

**Open question, not guessed at:** what's the actual enumerated list of QR/card variants in the
product today? I don't have that inventory — if Claude Code doesn't already have it either,
that's a five-minute grep of the codebase for QR-related components before building the shared
drawer, not something to leave implicit.

Mechanics that need to be consistent across all variants, once the list exists:
- Same drawer component/pattern reused, not a bespoke sheet per card type.
- Drag-to-dismiss + explicit close, same as any other bottom sheet in the app.
- What triggers it (tap on a card/avatar/share icon) should be the same interaction across
  variants — don't let one variant open on tap and another on long-press.

## Bottom navbar visibility

Needs an explicit rule, not "show it everywhere" or "hide it in modals" as vague guidance. A
navbar visibility rule is really a **route-type rule**:

| context | navbar |
|---|---|
| top-level tab screens (Home, Discover, Connections, Market, Profile — whatever the final tab set is) | visible |
| a bottom sheet/drawer is open over one of those screens (including the QR/card drawers above) | the navbar underneath stays as it was — the sheet layers on top, doesn't hide it |
| full-screen push (detail page, form, settings sub-page) | hidden — full-screen content shouldn't compete with tab chrome |
| full-screen media viewer / camera / QR scanner | hidden |
| onboarding flow | hidden throughout |

**Open question:** is this the right table, or does Vedanshu want a different rule for any of
these rows (e.g. navbar visible during onboarding, or hidden under an open sheet)? This is a
first pass at making "define visibility" concrete enough to build — confirm or correct the rows
before Claude Code implements it as-is.

## What this doesn't decide

The actual list of QR/card screen variants, the visual design of the shared drawer component, or
final confirmation of the navbar-visibility table above. Those need one round of confirmation
(or a codebase inventory) before this is buildable as stated.
