---
doc: PROMPT-design-system-consolidation
version: 2.0
status: CURRENT
updated: 2026-09-22
folder: specs
originally: new
---

# One prompt — all six tools, one sequence

Paste this single block into Claude Code, in `musiclinkd-9e6ca875`.

---

```
Run these six tools as one continuous pass, in this order, each one's output feeding the next —
not six separate tasks.

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
   token, every naming-drift case, and a real fix plan for the three known duplicate pairs
   (AvailabilityBadge/StatusPill, Chip/Segmented, Sheet/Dialog) and the 1,069 text-[Npx]/inline-
   style instances already flagged in the Phase 8 estimate. This list is what steps 3-5 execute
   against.

3. ui-ux-pro-max (if installed) — for any component step 2 says needs rebuilding, not
   patching, pull proportion/spacing-rhythm/icon-font-pairing reference from it. It never
   overrides step 1's tokens; if it suggests a color or type value that conflicts with step 1,
   keep step 1's and note the conflict.

4. anthropic-skills:gsap-react: build the real animation system — durations, easings,
   entrance/exit patterns — and use it for two things already specced: SPEC-issue19's screen
   enter/exit transitions and its icon-animates-on-state-change rule (pill selection, Feature
   1's connection status, portfolio card expansion). Replace any ad-hoc Tailwind transitions
   found in step 2 with this system's values. Respect prefers-reduced-motion throughout.

5. anthropic-skills:design-qa: turn steps 1-4 into a standing CI gate — token lint so a
   hardcoded value is caught the moment it's introduced, contrast checks (including the pink
   pairing from step 1 and the icon-chip contrast rule from SPEC-icon-language-audit.md — a
   chip needs a real luminance step from its background, not a 1.0-1.1 ratio), a11y, and visual
   regression across states and themes. Confirm it actually runs on future pushes.

6. Storybook (13 story files exist already): every component touched in steps 2-4 gets a story
   showing its real states — default/loading/empty/error/offline where applicable, per
   SPEC-storybook-guide-integration.md's state list. A consolidated component isn't done until
   its story shows every variant, not just compiles.

Report what changed and what needs a Vedanshu decision at the end — don't stop mid-sequence
unless a real conflict forces a choice you can't make for him.
```
