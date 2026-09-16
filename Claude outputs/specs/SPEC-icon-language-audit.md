---
doc: SPEC-icon-language-audit
version: 1.0
status: CURRENT
updated: 2026-09-16
verified_against: pixel measurements of user-supplied screenshots (MusicLinkd Settings, Facebook Settings & Privacy, Facebook Friends) — read 16 Sep 2026
folder: specs
originally: new
---

> **Audit + spec, not a redesign.** Numbers below are measured directly from the screenshots
> (pixel bounding boxes, WCAG contrast ratios), not eyeballed. This is the icon system's
> mechanics and constraints — the actual visual pass (weights, exact hex, new icon set) is
> Vedanshu's call.

# Why MusicLinkd's settings icons read weaker than Facebook's

## 1 · The glyphs themselves are ~35–45% smaller

Measured the drawn icon (ignoring the container box) in both screenshots, same device width
(1080px), same row context:

| icon | glyph bounding box |
|---|---|
| MusicLinkd — person (Edit profile) | 33 × 42 px |
| Facebook — lock (Privacy Checkup) | 46 × 53 px |
| Facebook — house (Family Center) | 56 × 54 px |

Facebook's glyphs run roughly 40–70% larger than MusicLinkd's at identical scale. That's the
single biggest driver of "more visible, more impactful" — it isn't stroke color, it's size.

## 2 · MusicLinkd boxes every icon in a chip that's nearly invisible against the page

MusicLinkd: page background `≈ #f7f7f9`, icon-chip background `≈ #f5f5f7`. That's a 2–3 level
difference — the chip barely reads as a shape. But the chip's *padding* still shrinks the glyph
inside it (see §1). Net effect: you pay the cost of a container (smaller icon) without the
benefit of one (visible separation).

Facebook: **no container on the standard list icon.** The glyph sits directly on white. It only
adds a grey circle/box *when the icon needs one* — e.g. the default-avatar placeholder in the
Friends screenshot (mid-grey circle, darker-grey silhouette on top: two shades of grey doing the
job of depth, not a uniform chip on every row).

## 3 · Contrast of the glyph itself is not the problem

Measured WCAG contrast of icon stroke vs its immediate background:

| | contrast ratio |
|---|---|
| MusicLinkd person icon vs its chip | 18.3:1 |
| Facebook lock icon vs page | 20.0:1 |

Both comfortably exceed WCAG AAA (7:1). The stroke color isn't washed out — the glyph is just
drawn smaller inside a box that dilutes it. Don't "fix" this by darkening strokes; it won't move
the number that actually matters.

## 4 · Row density: Facebook drops the subtitle more often

MusicLinkd gives every settings row a title + subtitle (e.g. "Edit profile / Name, headline,
roles, links"). Facebook's list is mostly title-only, one line. That's a content decision
(Vedanshu's, not mine to make) but it's part of why the Facebook rows read punchier — less text
competing with the icon for attention per row.

---

## Constraints for the icon system (mechanics, not final visuals)

These are the rules a revised icon language needs to satisfy — not a mockup:

1. **Glyph size floor:** ~44–56px drawn icon at 1080px device width (current: 33–42px). Whatever
   icon set is used, target that range.
2. **Default: no container chip.** Icon sits directly on the row background. Reserve a
   circle/box treatment for cases that need a second color layer (status badges, avatar
   placeholders, selected/active states) — not as the default for every row icon.
3. **When a chip *is* used, its background must be a real step away from the page**, not 2–3
   luminance levels off. Facebook's placeholder-avatar grey (mid-grey circle) vs. page white is
   the reference — pick a chip color that's a visible layer, or drop the chip.
4. **Stroke weight:** leave as-is — measured contrast is already fine (18.3:1). Do not spend
   effort darkening strokes; spend it on size and container removal.
5. **Row text:** flag to Vedanshu as a content/IA question, not an icon fix — title-only rows vs.
   title+subtitle is a density decision independent of icon styling.

## What this doesn't decide

Which icon set, exact hex values, corner radius, or spacing tokens to use — that's a design
decision. This spec says *what's measurably wrong and by how much* and *what constraint any fix
has to satisfy* (size floor, no default chip, real-contrast chip if used). The actual icon
redraw/pick is Vedanshu's.
