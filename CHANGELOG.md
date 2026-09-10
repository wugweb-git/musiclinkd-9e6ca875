# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- Design tokens reconciled to v9 in `src/styles.css`: radius scale 8/16/32/pill, five fluid type
  ramps, four elevation steps, motion durations and easings, a focus-ring token, `--font-mono`
  (JetBrains Mono, now actually loaded), spacing and opacity steps, `--container-app` and
  `--spacing-nav-clear`
- `--status-category-*` (the only sanctioned purple) and `--selected-*` (pink means selected)
  semantic token pairs
- `--text-2-lg`, a fifth deliberate type step for section headers — without it every 17px heading
  collapses onto `--text-2` and matches the body copy beneath it
- `AGENTS.md` — GitHub↔Lovable sync protocol and code rules
- `CHANGELOG.md`
- `.prettierignore` entries fencing prose out of the formatter: `.lovable/`, `roadmap.md`,
  `docs/`, `src/routes/README.md`. The `.lovable/plan` documents are the only record of why 18
  flows were built design-only and exist nowhere else.

### Fixed

- Discover and Recently-viewed screens rendered `undefined` to users: `discover.music.tsx` read
  `t.label` where the data has `name`, and `discover.nearby.tsx` / `recently-viewed.tsx` read
  `s.image` where the data has `photo`. Shipped in `d10513f` ("Added audio autoplay", a commit
  that actually added five discover routes).
- `bun run lint` reduced from 1932 problems to 0 errors: ran the project formatter across
  `src/**/*.{ts,tsx}`, removed three `eslint-disable-next-line jsx-a11y/media-has-caption`
  comments that suppressed a rule no loaded plugin provides, and resolved one `prefer-const`.
- Repaired `AGENTS.md`, which had a corrupted, duplicated `LOVABLE:BEGIN/END` block
- `README.md` no longer ships the superseded Android design brief (old palette, radius, and type
  values)

### Changed

- Card radius is 32px (was 24px); `rounded-2xl` is 32px (was 40px). `xl`/`2xl`/`3xl` are retained
  as on-scale aliases of 32px so ~450 existing usages don't fall back to Tailwind's defaults
- Cards lift with `--elevation-2`; the 1px border is now the fallback, not the only treatment
- All arbitrary `rounded-[…]` and `text-[…]` values removed from `src/components/ml/`
- One selected state across the app: pink, not navy. `Chip`, `Segmented` and the three ad-hoc
  chip copies in `booking`/`collab-workspace`/`onboarding` now match the bottom nav
- Owner-row icons on `/me` are muted rather than pink, so pink reads as accent again
- `--accent` is a neutral hover surface; purple is confined to the category badge

### Fixed

- Category badge contrast was 3.72:1, below the 4.5:1 `AGENTS.md` mandates. The new
  `--status-category-*` pair measures 8.77:1

### Known gaps

- `--muted-foreground` measures **4.04:1** on card white — below the 4.5:1 AA floor for normal-size
  text, and it is the colour of nearly every caption in the app. It passes the 3:1 non-text floor,
  so icon use is fine. `oklch(0.56 0.0257 285.59)` would give 4.66:1. Not changed here: it repaints
  secondary text on every screen and deserves its own review.
- No accessibility linting: `eslint-plugin-jsx-a11y` is not registered in `eslint.config.js`, so
  the WCAG AA, contrast, `:focus-visible` and 48dp touch-target rules `AGENTS.md` mandates are
  not machine-checked. Tracked in `roadmap.md`.
- 18 `react-refresh/only-export-components` warnings remain (non-blocking; clearing them means
  splitting 10 component files to isolate their exports).
