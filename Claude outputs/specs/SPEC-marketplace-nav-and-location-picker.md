---
doc: SPEC-marketplace-nav-and-location-picker
version: 1.0
status: CURRENT
updated: 2026-09-16
verified_against: pixel measurements of user-supplied Facebook Marketplace screenshots (top nav,
  category drawer, location picker) — read 16 Sep 2026. No current MusicLinkd screen was supplied
  for this flow, so there is nothing to diff against yet — this documents the reference pattern
  only.
folder: specs
originally: new
---

> **Reference-pattern capture, not a redesign.** No MusicLinkd screenshot was given for
> Marketplace-style browse/category/location — I have nothing of ours to compare, so this spec
> just documents the Facebook mechanics precisely enough to build from. Which of MusicLinkd's
> screens this pattern applies to, and the final visual pass, is Vedanshu's call.

# Issue 3 — top nav, category drawer, location picker

## 1 · Top nav bar

Three zones, fixed row:

- **Left:** hamburger menu (unboxed line icon) + page title, large bold type, tight together.
- **Right:** a cluster of action icons — messenger, search, overflow ("...") — each unboxed
  except the one that's a brand/product entry point (Messenger), which gets a filled black
  circle. That's the one deliberate exception to "no default chip": a chip signals "this icon is
  a distinct destination/product," not "this is a generic row."

## 2 · Category quick-access row (horizontal scroll)

Below the nav: a row of bordered cards (not chips — a full outlined rounded-rect card), one per
category, icon on top + label below, stacked vertically inside the card:

- Card: rounded corners (~16–20px), 1px border, no fill (white/transparent), fixed width, equal
  gaps, horizontally scrollable.
- Icon inside the card: unboxed, sits directly on the card's white background — same "no chip
  inside a chip" logic as the settings rows.
- Label: below the icon, inside the card, regular weight, smaller than a section header.

This is a different container from the drawer list below it (§3) — cards here, circles there.
Don't conflate the two into one icon treatment.

## 3 · Category drawer (opens on tap — full list)

Search field at top ("What do you want to buy?"), then flat list rows, each: **icon inside a
solid grey circle** + label, grouped under section headers ("Top categories", "All categories")
with a divider between groups.

This *is* a chip — and it's worth reconciling with the Issue 2 finding (MusicLinkd's icon-chip
reads as invisible against the page). Measured both, same method:

| | chip fill | page bg | contrast |
|---|---|---|---|
| MusicLinkd (Issue 2, Settings) | `≈ #f8f8fb` | `≈ #f7f7f9` | **1.01:1** — unreadable as a shape |
| Facebook (this drawer) | `#e2e5e9` | `#ffffff` | **1.26:1** — reads as a distinct circle |

Facebook's chip isn't dramatically dark — it's still a light grey — but it's a real step down
from the page, not a rounding error. **Concrete target for MusicLinkd's chip, if a chip is used:
something in the `#e0–#e6` range against a white/near-white page**, not `#f8`. This replaces the
vague "pick a real layer" note in the Issue 2 spec with an actual reference value.

Icon glyph fills a clear majority of the circle (drawn to roughly 55–60% of the circle's
diameter) — not a small centered mark floating in a mostly-empty chip.

## 4 · Location picker (opens on tap of the location pin) — bottom sheet

- Standard sheet: drag handle, title ("Choose a location"), search icon top-right.
- Interactive map preview up top, current point marked, place name resolved below it in plain
  text ("Greater Noida").
- Two actions side by side: primary filled button ("Locate me", with a location-arrow icon) +
  secondary grey button ("Edit"). Primary/secondary pairing, not two equal-weight buttons.
- Below that, a flat "Suggested for you" list — plain rows, search/magnifier icon + place name,
  no card or chip (this list uses the *unboxed* treatment, same logic as §1/§2 — a chip isn't
  the default, it's reserved for the category drawer's varied, distinguishable icon set).

## What this doesn't decide

Whether MusicLinkd's own categories, nav actions, or location flow should look exactly like
this, what MusicLinkd's actual category list is, or final colors/radii — that's Vedanshu's call
and depends on what MusicLinkd screen(s) this maps to. Send the current MusicLinkd screen for
whichever flow this applies to (Discover/Market entry, filters, location) and I'll do the same
measured diff as Issue 2 rather than working from the reference alone.
