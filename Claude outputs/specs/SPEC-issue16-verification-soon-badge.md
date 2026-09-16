---
doc: SPEC-issue16-verification-soon-badge
version: 1.0
status: CURRENT
updated: 2026-09-16
verified_against: Release Phases doc (Notion) currently lists Verification/Trust as "not yet
  placed in any phase," 6 tables on unmerged branch `merge/data-15sep` — this issue places it
folder: specs
originally: new
---

# Issue 16 — Verification gets a "Soon" badge, placed Phase 3 (or right after Marketplace)

## The decision

Same pattern as Bands (Issue 8/9): Verification is deferred, not hidden. Its entry point(s)
stay visible with a "Soon" badge rather than being removed from the UI. Placement: Phase 3, or
immediately after Marketplace ships if that ends up being a sub-sequencing detail within Phase
3 — worth confirming which, since "Phase 3" and "after Marketplace" aren't quite the same
commitment if Marketplace itself slips within Phase 3.

This moves Verification out of the Release Phases doc's "not yet placed in any phase" table,
where it's currently sitting alongside Reputation/Reviews, Analytics, and Subscription/
Monetization — those three are still genuinely unplaced; only Verification is being resolved by
this issue.

## Reuse, don't rebuild

The "Soon" badge treatment now has two instances (Bands, Verification) — that's enough to treat
it as a real pattern, not a one-off: same badge component, same visual treatment, same "entry
stays visible but disabled/non-functional" behavior, wherever it shows up next. Worth Claude Code
building it once as a shared component rather than twice as two bespoke implementations.

## What's still unresolved underneath

Verification has 6 tables that exist only on the unmerged branch `merge/data-15sep`
(`verification_requests`, `verification_requirements`, `verification_request_items`,
`verification_request_private`, `verification_type_details`, `verification_type_person_types` —
from the Master Schema audit earlier this session). Placing it in Phase 3 with a "Soon" badge
doesn't require merging that branch yet — the badge is a UI-only gate — but whoever picks up
Phase 3 for real will need that branch merged and the schema decisions in it reviewed, not just
the badge shipped.

## Notion status

Attempting to update the Release Phases page to reflect this placement (and the earlier Bands
move, which was blocked last attempt) in the same pass — see the note after this file for
whether it went through this time.
