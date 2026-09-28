# Banners

Generated 29 Sep 2026, against the existing tokens — nothing new was introduced:
`--ink #0d0d0d`, `--brand #ea4c89`, `--background #ececf1`, hairline `#d5d5de`.
Pink appears **once** per asset, which is the standing rule (about 10% of a screen), and a price is
always pink.

All twelve are SVG: they scale to any density, cost ~1–3 KB, and carry `role="img"` with an
`aria-label`, so they need no `alt` decision at the call site.

| Folder | Size | What it is |
|---|---|---|
| `category/` | 824×320 | Market category headers — `instruments`, `audio-gear`, `studio`, `rentals`, `spaces`. The filename is the category slug in `src/data/market.ts:152-156`. |
| `share/` | 1200×630 | OG / share cards — `default`, `profile`, `listing`. Frames with slots, not finished cards. |
| `empty/` | 400×280 | Empty-state line art — `no-results`, `no-work`, `no-bookings`, `no-messages`, `no-listings`, `offline`. |

Each category motif is masked behind a left-to-right scrim so the label stays legible over it.

**Not wired into any screen.** The owner picks where these land. The obvious homes:

- `category/<slug>.svg` above the Market grid, keyed off the category slug
- `share/*.svg` as the `og:image` fallback when a subject has no image of its own
- `empty/*.svg` inside the existing `EmptyState` / `StateCard`, `offline.svg` on the offline route
