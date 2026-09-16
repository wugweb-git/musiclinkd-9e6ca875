---
doc: SPEC-issue18-wugweb-attribution
version: 1.0
status: CURRENT
updated: 2026-09-16
verified_against: stated by Vedanshu, not checked against current Sign-in/Settings screens
folder: specs
originally: new
---

# Issue 18 — "Made by Wugweb" attribution, linked to wugweb.com

## What's confirmed

Text "Made by Wugweb" (small, unobtrusive — a footer credit, not a headline), linking out to
`wugweb.com`, on two screens: **Sign-in** and **Settings**.

## What's not decided yet — flagged as open, not guessed at

Exact placement on each screen — Vedanshu's own words were "idk let's see," so this isn't
something to pin down with an assumption. Reasonable default to propose, not to build blind:
small text in the screen's footer/bottom area, low visual weight (muted color, small type),
consistent placement between the two screens (same corner/position on both) so it reads as one
system rather than two one-off placements.

## Mechanics

- Link opens `wugweb.com` in a new tab/external browser context (not a same-page navigation away
  from the app) — standard for an outbound credit link.
- Text content itself ("Made by Wugweb") is fine as literal attribution copy — not treated as
  product/profile content that's off-limits to specify verbatim.

## What this doesn't decide

Exact pixel placement, type size/color, and whether it appears on any screen beyond these two —
confirm placement once there's something to look at, per Vedanshu's own "let's see."
