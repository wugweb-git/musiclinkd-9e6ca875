---
doc: SPEC-overlay-pattern-selection
version: 1.0
status: CURRENT
updated: 2026-09-16
verified_against: builds on SPEC-icon-language-audit v1 and SPEC-marketplace-nav-and-location-picker v1
  (same icon-chip contrast target) — no new pixel measurement in this doc
folder: specs
originally: new
---

# Issue 7 — which overlay (bottom drawer / side drawer / modal) for which interaction

## Named instances (confirmed, build these as bottom drawers)

- **Add portfolio item → item-type list.** Tapping "add" opens a bottom drawer listing the
  available item types (whatever that set is — track, video, image, credit, etc.). Icon
  treatment: same as Issue 2/3 — icon inside a solid grey circle chip, contrast target
  `#e0–#e6` fill against a white/near-white row background, not a near-invisible tint. One row
  per item type, icon + label, no subtitle unless a type genuinely needs one.
- **Privacy settings (3 options).** Same bottom drawer pattern, single-select (radio behavior,
  same as Feature 1's sharing-preference sheet) rather than a full settings sub-page.
- **"Other similar items"** — named as a category, not enumerated. See the rule below instead of
  a growing list of one-off approvals.

## The actual rule (so this doesn't need a new issue every time)

Three overlay types, picked by what the content needs, not by habit:

| pattern | use when | don't use when |
|---|---|---|
| **Bottom drawer** | a short, single-purpose list of choices or actions (pick one type, pick one setting, pick one item) — the default for anything list-shaped that doesn't need to persist alongside other content | the list is long enough to need its own search/scroll context as a first-class screen, or the choice leads into a multi-step flow |
| **Side drawer** | navigation, or content meant to stay open *alongside* the current screen (a filter panel you adjust while seeing results update, a nav menu) | a single one-shot choice — that's a bottom drawer, not a side panel |
| **Modal (centered, blocks the screen)** | a single decision that must be resolved before continuing — confirmations, destructive-action prompts, errors | any list of more than ~2 options, or anything where dismissing without choosing is a normal, expected action (that's a drawer, not a modal) |

Bottom drawer is the default for "tap something, pick from a short list, close." Side drawer and
modal are reserved for their narrower cases above — don't reach for a modal just because a
drawer feels "too casual" for something like privacy settings; per the named instance above,
privacy settings **is** a drawer case (short, single-purpose, no persistent alongside-content
need).

## What this doesn't decide

The full enumerated list of every screen this applies to going forward — that's judged against
the rule above as each one comes up, not pre-approved here one by one. Also doesn't decide
per-pattern visual details (drawer corner radius, side-drawer width, modal backdrop opacity) —
mechanics only.
