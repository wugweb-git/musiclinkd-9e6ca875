# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- `AGENTS.md` — GitHub↔Lovable sync protocol and code rules
- `CHANGELOG.md`
- `.prettierignore` entries fencing prose out of the formatter: `.lovable/`, `roadmap.md`,
  `docs/`, `src/routes/README.md`. The `.lovable/plan` documents are the only record of why 18
  flows were built design-only and exist nowhere else.

### Changed

- `AGENTS.md` now states explicitly that `Co-Authored-By: Wugweb <admin@wugweb.com>` is the only
  commit trailer, and that no assistant/tool identity may be added as a second one

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

### Known gaps

- No accessibility linting: `eslint-plugin-jsx-a11y` is not registered in `eslint.config.js`, so
  the WCAG AA, contrast, `:focus-visible` and 48dp touch-target rules `AGENTS.md` mandates are
  not machine-checked. Tracked in `roadmap.md`.
- 18 `react-refresh/only-export-components` warnings remain (non-blocking; clearing them means
  splitting 10 component files to isolate their exports).
