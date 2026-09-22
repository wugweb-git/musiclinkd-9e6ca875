---
doc: PROMPT-design-system-consolidation
version: 3.0
status: CURRENT
updated: 2026-09-22
folder: specs
originally: new
---

# One prompt — all tools, one sequence

Paste this single block into Claude Code, in `musiclinkd-9e6ca875`. `ui-ux-pro-max` had no
findable source, so it's replaced below with two real skills that cover the same job.

---

```
Run these as one continuous pass, in this order, each step's output feeding the next.

1. design-system skill: establish the three-layer token model (primitive → semantic →
   component) for color, type, spacing, radius, elevation, motion. Resolve on the way through:
   the two competing spacing systems (--spacing-xs/sm/md/lg vs numeric p-1/2/4/8), the
   --radius-xl/2xl/3xl aliasing (all render 32px across ~450 call sites today), the retired
   --navy (#0D0B26, 34 live uses) as a documented shim not a trap, and the brand-pink rules from
   SPEC-issue17-brand-pink-interaction-states.md (active-tab underline, momentary press state,
   pill-selected 20%-opacity background) as real tokens, including verifying pink-text-on-
   20%-pink actually clears 4.5:1 contrast once the hex is final.

2. design:design-system skill (ui-system-mapper): sweep every existing component against the
   token model just defined. Produce the full list — every hardcoded value that should be a
   token, every naming-drift case, and the three known duplicate pairs (AvailabilityBadge/
   StatusPill, Chip/Segmented, Sheet/Dialog) plus the 1,069 text-[Npx]/inline-style instances
   already flagged in the Phase 8 estimate. This list is what steps 3-5 execute against.

3. anthropic-skills:refactor: execute the duplicate-pair consolidations and hardcoded-value
   fixes from step 2's list — surgical, behavior-preserving changes, not rewrites. This is where
   step 2's findings actually get resolved, not just re-confirmed.

4. anthropic-skills:frontend-design + anthropic-skills:design-taste-frontend (in place of
   ui-ux-pro-max, which has no findable install source): for any component step 2/3 says needs
   rebuilding rather than patching, pull aesthetic direction, typography and proportion
   reference from these — design-taste-frontend's own audit-first, pre-flight-check approach
   should run against what steps 1-3 already established, not restart from a blank brief.
   Neither overrides step 1's tokens; if either suggests a color or type value that conflicts
   with step 1, keep step 1's and note the conflict.

5. anthropic-skills:gsap-react: build the real animation system — durations, easings,
   entrance/exit patterns — and use it for two things already specced: SPEC-issue19's screen
   enter/exit transitions and its icon-animates-on-state-change rule (pill selection, Feature
   1's connection status, portfolio card expansion). Replace any ad-hoc Tailwind transitions
   found in step 2 with this system's values. Respect prefers-reduced-motion throughout.

6. anthropic-skills:design-qa: turn steps 1-5 into a standing CI gate — token lint so a
   hardcoded value is caught the moment it's introduced, contrast checks (including the pink
   pairing from step 1 and the icon-chip contrast rule from SPEC-icon-language-audit.md — a
   chip needs a real luminance step from its background, not a 1.0-1.1 ratio), a11y, and visual
   regression across states and themes. Confirm it actually runs on future pushes.

7. Storybook (13 story files exist already): every component touched in steps 2-5 gets a story
   showing its real states — default/loading/empty/error/offline where applicable, per
   SPEC-storybook-guide-integration.md's state list. A consolidated component isn't done until
   its story shows every variant, not just compiles.

Note: anthropic-skills:brandkit was considered and left out deliberately — it generates brand
presentation assets (guideline boards, logo systems, decks), not component-level reference
patterns, so it doesn't fit this sequence.

Report what changed and what needs a Vedanshu decision at the end — don't stop mid-sequence
unless a real conflict forces a choice you can't make for him.
```
