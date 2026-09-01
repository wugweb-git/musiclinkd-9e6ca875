# FLOW 02 finish + FLOW 03 — Add Portfolio

Two tracks in one build. FLOW 02 is partly built (`src/data/onboarding.ts` exists); FLOW 03 is new. Both are design-only, reusing the Gestalt system in `src/components/ml/ui.tsx` and tokens in `src/styles.css`. No backend, no schema changes.

A `roadmap.md` at the project root will track both tracks and remaining items.

## Track A — finish FLOW 02 (Onboarding)

Already written: `src/data/onboarding.ts` (master data, role-adaptive step model, validation, readiness model, per-screen data contracts).

Still to build:
- `src/components/ml/onboarding.tsx` — `StepShell` (progress, back, skip, keyboard-aware, safe areas), `ChoiceGrid`, `ChipPicker`, `PhotoPicker` sheet, `InlineField`, `LocationPicker`, `ReadinessCard`, `HandoffCard`, offline/error/saving banners.
- Draft store: React context + localStorage, demo-only persistence with resume support.
- Routes under `src/routes/onboarding/`: `index.tsx` (welcome), `step.$id.tsx` (progressive stepper across identity → profession → expertise → context → intent → profile → personalisation), `preview.tsx`, `complete.tsx` (readiness checklist + hand-offs), `done.tsx`, `skip.tsx`, `resume.tsx`.
- Hand-off cards only for Business (FLOW 12), Band (FLOW 15), Verification (FLOW 16), Portfolio (FLOW 03), Services (FLOW 11).

## Track B — FLOW 03 (Add Portfolio)

### Data
`src/data/portfolio.ts`: `Portfolio`, `PortfolioItem` (track / album / video / performance / project / client work / case study / writing sample / image / external link), `MediaAsset` with states (not-uploaded, uploading, processing, ready, failed, unavailable), `Credit`, `Contributor`, visibility, featured flag (max 3), ordering, analytics figures, plus per-screen data contracts and EXISTING/COMPUTED/PROPOSED/FUTURE field tags. Seeded with realistic Indian music-industry work for the owner profile.

### Components — `src/components/ml/portfolio.tsx`
`PortfolioHeader`, `WorkCard` (communicates what / who / role / media / context), `AudioWorkCard`, `VideoWorkCard`, `ImageWorkCard`, `ProjectWorkCard`, `CreditRow`, `ContributorPicker` (searches existing profiles first, invite fallback), `MediaUploader` with progress + error/retry/replace, `MediaPreview`, `AudioPlayer` (artwork, play/pause, seek, duration, Spotify-like feel), `VideoPlayer`, `MetadataSelector` (canonical genre/language/role/instrument/year/tags), `VisibilitySelector`, `FeaturedToggle`, `ReorderList` (drag plus accessible move-up/move-down), `WorkAnalytics`, `StatusPill` for portfolio and media states.

### Routes — `src/routes/portfolio/`
- `index.tsx` — entry + overview: featured, recent, categories, counts, visibility, actions (add / edit / reorder / preview / share / settings). Empty state with role-aware suggestions.
- `add.tsx` — work type chooser, then a stepped creation flow: basics → role/credits → contributors → media (audio / video / image / external variants) → description → metadata → visibility & featured → preview → publish / save draft, with published and draft confirmation screens.
- `w.$id.tsx` — work detail with player, credits, metadata, analytics; edit, delete confirm, archive/restore, share sheet (link, QR via FLOW 23 pattern, send in MusicLinkd).
- `w.$id.edit.tsx` — edit existing work, save-conflict dialog (Review changes / Keep mine / Reload).
- `reorder.tsx` — drag reorder + featured selection with save order.
- `settings.tsx` — portfolio-only controls: visibility, default ordering, featured, display and media preferences.
- `analytics.tsx` — portfolio-level views, plays, shares, saves, profile clicks, link clicks; reads canonical analytics only.
- `select.tsx` — portfolio picker used by Opportunities application and Messaging share, with preview of selected items.

### States
Loading skeletons, empty, draft, published, private, archived, processing, error, offline, permission denied, work not found, media upload failure, save conflict — all as designed screens rather than raw errors.

### Integration
- Public profile and `/me` portfolio sections read from `src/data/portfolio.ts` instead of holding their own media lists.
- Messaging gets a "Share work" entry point that opens the portfolio picker.
- Onboarding's Portfolio prompt links to `/portfolio/add`.

## Technical notes

- Every route defines its own `head()` metadata; screen data contracts live beside the data model, not inline in components.
- Mobile-first 430px shell, safe areas, sticky action bars, bottom sheets, large touch targets, no colour-only status, alt text on images, accessible reorder alternative.
- No new design tokens; all colour via existing semantic tokens.
