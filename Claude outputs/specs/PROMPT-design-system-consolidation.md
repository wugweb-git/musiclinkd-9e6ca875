---
doc: PROMPT-design-system-consolidation
version: 1.0
status: CURRENT
updated: 2026-09-22
folder: specs
originally: new
---

# Prompt for Claude Code — wire the design-system tools together

Paste this as one message into Claude Code, in `musiclinkd-9e6ca875`. It sequences six tools so
they build on each other instead of running as six disconnected passes. Do this in order — each
step's output is the next step's input.

---

```
Run this as a sequenced pass, not six independent tasks. Stop and report between phases 1-2 and
3-4 rather than running straight through — those two boundaries are decision points, not just
checkpoints.

PHASE 1 — Token architecture (design-system skill)
Establish (or confirm, if it already exists in some form) the three-layer token model: primitive
→ semantic → component. Reconcile against what's already known to be broken in this repo:
  - Two spacing systems coexist (--spacing-xs/sm/md/lg vs numeric p-1/2/4/8) with no rule
    deciding which to use where — pick one, document the migration path for the other.
  - --radius-xl/2xl/3xl all render as 32px today across ~450 call sites — decide whether they
    become real distinct steps (a visual change, not free) or stay aliased, and record the
    decision, don't just re-alias silently.
  - --navy / #0D0B26 is retired but has 34 live uses — token architecture should make the
    retired-token case explicit (a documented shim, not a trap for new code).
  - Brand pink #EA4C89 usage rules from SPEC-issue17-brand-pink-interaction-states.md (Claude
    outputs/specs/) are inputs here — active-tab underline, momentary press states, and the
    pill-selected background-at-20%-opacity pattern all need to exist as tokens, not one-off
    values, including the contrast check that spec flagged (verify pink-on-20%-pink actually
    hits 4.5:1 once the real hex is set).
Output: the token layer documented, with every "two systems, no rule" case in this repo
resolved or explicitly deferred with a reason — not silently left ambiguous.

PHASE 2 — Sweep the app against the tokens (design:design-system / ui-system-mapper skill)
Now that Phase 1 defines what "correct" looks like, audit every existing component against it.
Report, don't fix yet:
  - Every hardcoded value that should be a token reference (colors, spacing, radius, shadows).
  - Naming drift — inconsistent names for the same concept across components.
  - The three duplicate pairs already flagged in AGENTS.md: AvailabilityBadge/StatusPill,
    Chip/Segmented, Sheet/Dialog — confirm whether they're still duplicated and what it takes to
    consolidate each, don't just re-confirm the finding.
  - 1,069 text-[Npx] / inline style instances from the Phase 8 sweep estimate in the Build State
    doc — this tool should turn that number into an actual list, not just cite it again.
STOP HERE. Report the sweep findings before touching code — the fix list from Phase 2 is what
Phase 3 and 4 execute against, and it needs a decision on scope (all of it now, or triaged) before
more tool passes run on top of an unaudited baseline.

PHASE 3 — Style/pattern reference (ui-ux-pro-max or equivalent pattern library, if installed)
For any NEW component work coming out of Phase 2's consolidation (e.g. building the single
Chip/Segmented replacement), pull from real reference patterns rather than inventing from
scratch. This does not override MusicLinkd's own tokens from Phase 1 — it's a reference for
proportion, spacing rhythm and icon/font pairing conventions, not a source of new colors or a
new type scale. If this tool suggests anything that conflicts with Phase 1's tokens, Phase 1
wins; flag the conflict, don't quietly adopt the reference's values.

PHASE 4 — Animation system (anthropic-skills:gsap-react)
Two places this plugs into work already specced:
  - SPEC-issue19-component-reuse-perf-transitions.md's screen enter/exit transitions and the
    icon-animates-on-state-change rule (pill selection, Feature 1's connection status, portfolio
    card expansion) — these become real GSAP timelines/durations/easings here, not ad-hoc
    Tailwind transition classes.
  - Replace any existing ad-hoc CSS transitions found during Phase 2 with the same durations/
    easings this phase establishes, so motion is one system, not per-component guesses.
Respect prefers-reduced-motion — this was already a requirement in the Storybook coverage spec
(SPEC-storybook-guide-integration.md) and applies here too.

PHASE 5 — Standing QA gate (anthropic-skills:design-qa)
Turn Phases 1-4's output into something that can't silently regress:
  - Token lint (flag a hardcoded value the moment it's introduced, not at the next audit).
  - Contrast checks — including the pink-on-20%-pink pairing from Phase 1, and the icon-chip
    contrast rule from SPEC-icon-language-audit.md (chip fill needs to be a real step from the
    page background, not a 1.0-1.1 contrast ratio rounding error).
  - a11y and visual regression across component states/themes.
This is CI-facing, not a one-time report — confirm it actually runs on future pushes, not just
once now.

PHASE 6 — Storybook coverage (already installed, 13 story files exist)
Every component touched or consolidated in Phases 2-4 gets a story showing its real states —
default/loading/empty/error/offline where applicable, per the state list already specced in
SPEC-storybook-guide-integration.md. This is the review surface for everything above — a
consolidated Chip component isn't done until its story shows every variant side by side, not
just compiles.

Report back after each phase with what changed, what's still open, and what needs a Vedanshu
decision — same as always, don't guess past a flagged conflict.
```

---

## Why this order

Tokens (1) have to exist before an audit (2) can say what's wrong. The audit's fix list (2) is
what any reference-pattern work (3) and the animation system (4) apply to — building on an
un-audited baseline just re-introduces the same drift Phase 2 was meant to catch. The QA gate (5)
only has teeth once there's a real token/motion system to lint against. Storybook (6) is the
review surface for all of it, so it comes last, not first — reviewing components before they're
consolidated means re-doing the stories once they change shape.

## What this doesn't decide

Whether Phase 2's full fix list gets executed all at once or triaged — that's the decision point
this prompt calls out explicitly rather than assuming. And whether `ui-ux-pro-max` is actually
installed/available in the Claude Code environment — if it isn't, Phase 3 is skippable; nothing
downstream depends on it.
