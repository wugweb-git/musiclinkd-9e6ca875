---
doc: SPEC-issue19-component-reuse-perf-transitions
version: 1.0
status: CURRENT
updated: 2026-09-16
verified_against: system-level engineering discipline, not tied to a specific screenshot or
  screen — applies across everything already specced in Issues 1-18
folder: specs
originally: new
---

# Issue 19 — component reuse, performance, screen transitions, icon micro-animation

Four related engineering-discipline items, not one feature — bundling because they're all
"how things get built," not "what gets built."

## 1 · New components must map to existing tokens/styles first, not bypass them

Before any new card variant, button style, or UI pattern gets built, the actual question is:
does an existing component/token already cover this, and can it be extended instead of
duplicated? This directly matters given what's already been specced — the icon-chip pattern
(Issues 2/3/7), the overlay-selection rule (Issue 7), and the brand-pink interaction states
(Issue 17) are all meant to be **shared systems**, not per-screen one-offs. A new card type that
invents its own icon-chip color, or a new drawer that doesn't use the shared overlay component,
is a regression against work already specced — flag it as review criteria, not just a style
preference.

Practically: a design-token/component audit before adding something new — check
`tailwind.config`/token files and the existing `ui`/`ml` component directories (per the
Storybook coverage findings from earlier this session — 74 components already exist) before
writing a new one.

## 2 · Optimize code and assets for speed

Not specced in detail here — this is a broad ask that needs to become concrete engineering
tasks once there's something to measure against (bundle size, image sizes/formats, lazy loading,
etc.). Flagging as a standing requirement Claude Code should apply as a lens on every change
going forward (don't ship an unoptimized asset because a spec didn't call it out explicitly),
rather than one task with a checklist here.

## 3 · Screen enter/exit transitions

Interaction between screens (navigating in, navigating out) needs a defined transition, not
route changes with no motion. Mechanics to decide (not designed here): direction (push/pop
matching Android's own back-gesture conventions, since Issue 4 already established this is an
Android-first PWA/Capacitor app — transitions should feel native to that platform, not generic),
duration, and whether bottom sheets/modals (Issue 7) get their own distinct transition from
full-screen route pushes. `prefers-reduced-motion` handling applies here too, same as Issue 4's
Storybook coverage requirement for animated components.

## 4 · Icon animates on component state change

When a component's state changes (selected/unselected, expanded/collapsed, connected/not — e.g.
Feature 1's Spotify connection status, or the pill-button selected state in Issue 17), its icon
should animate the transition, not snap instantly. Applies wherever state-driven icon changes
already exist in the specced issues — Issue 17's pill selection, Feature 1's connection status,
the portfolio card's state 1 → state 2 expansion in Issue 14. Not a new list of screens, a rule
that applies retroactively to everything already specced with a state-change icon.

## What this doesn't decide

Specific animation curves/durations, which existing components pass or fail the "should this
have been reused" test until an actual audit is run, and concrete performance budgets (bundle
size targets, image size caps) — those need real measurement against the current app, not a
number picked here.
