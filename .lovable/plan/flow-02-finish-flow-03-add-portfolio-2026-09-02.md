# FLOW 02 finish + FLOW 03 Add Portfolio

Both tracks reuse the existing Gestalt kit (`src/components/ml/ui.tsx`, tokens in `src/styles.css`). No new design tokens, no navigation changes.

One decision carried over: the portfolio screens already read and write the real database when a user is signed in (from the earlier "add a real backend" request). This build keeps that: signed-in users persist, signed-out users see the seeded demo portfolio. Everything new in this plan is UI-level — no schema changes, no new backend logic.

## Track A — finish FLOW 02 (Onboarding)

Already built: master data, step model, UI kit, draft store, welcome, stepper, preview, complete, resume, skip.

Remaining:
- Add the missing `done.tsx` final screen (celebratory summary, "View my profile", "Add portfolio", "Discover talent").
- Onboarding's Portfolio prompt and the readiness checklist link into the portfolio add flow.
- Persist completion for signed-in users through the existing profile save; drafts stay in local storage.
- 412px render pass over welcome, each step, preview, complete.

## Track B — FLOW 03 Add Portfolio

Existing thin version (overview, type picker, single form, detail, edit, reorder, settings) gets expanded to the full spec.

### Data
Grow `src/data/portfolio.ts` into the full model: all ten work types, media assets with states (not uploaded, uploading, processing, ready, failed, unavailable), credits, contributors, visibility, featured (max 3), ordering, analytics figures, per-screen data contracts, and field tags (existing / computed / proposed / future). Seed realistic Indian music-industry work.

### Components
Expand `src/components/ml/portfolio.tsx`: portfolio header, type-specific work cards (audio, video, image, project), credit row, contributor picker (searches profiles first, invite fallback), media uploader with progress and retry/replace, media preview, audio player (artwork, play/pause, seek, duration), video player, metadata selector, visibility selector, featured toggle, reorder list (drag plus accessible move up/down), work analytics, status pills.

### Screens
- Overview: featured, recent, categories, counts, visibility, actions; role-aware empty state.
- Add: work-type chooser, then stepped creation — basics, role and credits, contributors, media (audio/video/image/link variants), description, metadata, visibility and featured, preview, publish or save draft, with published and draft confirmations.
- Work detail: player, credits, metadata, analytics, edit, delete confirm, archive/restore, share sheet (link, QR, send in MusicLinkd).
- Edit: same form plus a save-conflict dialog (Review changes / Keep mine / Reload).
- Reorder: drag plus featured selection and save order.
- Settings: visibility, default ordering, featured, display and media preferences.
- Analytics: views, plays, shares, saves, profile clicks, link clicks.
- Select: portfolio picker for Opportunities applications and Messaging share, with preview of chosen items.

### States
Loading skeletons, empty, draft, published, private, archived, processing, error, offline, permission denied, work not found, media upload failure, save conflict — each a designed screen, never a raw error.

### Integration
- Public profile and `/me` read their portfolio section from the portfolio data layer instead of holding separate media lists.
- Messaging gets a "Share work" entry point that opens the picker.
- Onboarding's portfolio prompt links into the add flow.

## Technical notes

- Routes stay in the project's existing flat dot naming under `src/routes/` (`portfolio.add.tsx`, `portfolio.$id.analytics.tsx`, `portfolio.select.tsx`, etc.) so they match every other flow here; no nested folder duplicates.
- Every route defines its own `head()` metadata; screen data contracts live in `src/data/portfolio.ts`, not inline in components.
- Mobile-first 430px shell, safe areas, sticky action bars, bottom sheets, large touch targets, no colour-only status, alt text, accessible reorder alternative.
- Media stays URL/preview-based: no upload or storage infrastructure is added; the uploader is a designed state machine over local previews.
- Verification: typecheck, build, and a 412px Playwright pass across onboarding, portfolio, profile and dashboard, then update `roadmap.md`.
