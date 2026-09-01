# FLOW 02 — User Onboarding

Design-only build of the complete MusicLinkd onboarding journey, reusing the existing Gestalt system (`src/components/ml/ui.tsx`, tokens in `src/styles.css`) and canonical profile data (`src/data/profile.ts`). No backend, no auth, no schema changes.

## Experience shape

One onboarding architecture with progressive, grouped steps — not 30 separate screens. Role-adaptive: irrelevant steps are skipped automatically.

```text
WELCOME → IDENTITY → PROFESSION → EXPERTISE → CONTEXT → INTENT → PROFILE → PERSONALISATION → PREVIEW → COMPLETION → DONE
```

Step groups:
1. Identity — display name, username (inline availability check, mocked), profile photo sheet (camera/gallery/crop/replace/remove), optional cover
2. Profession — primary role (single-select), secondary roles (multi)
3. Expertise — instruments (only for instrument roles), role-specific specialisation (vocal type, production skills, engineering discipline, DJ event types, composition type)
4. Context — genres, languages, location (Use my location / manual country-state-city), work mode
5. Intent — availability types, "what brings you to MusicLinkd", experience level
6. Profile — bio with character counter, profile links with URL validation, contact preferences (private by default)
7. Personalisation — discovery preferences, profile visibility with plain-language consequences
8. Preview — public profile card rendered with existing profile components, Edit / Complete
9. Completion — usefulness-based readiness checklist (Identity, Professional context, Discovery-ready, Portfolio, Services, Verification) with hand-off CTAs
10. Done — "You're ready for MusicLinkd", Explore / View profile

Hand-off screens (intent capture only, then link out): Business intent → Business profile, Band/Crew intent → Band, Verification prompt, Portfolio prompt, Services prompt.

## States

Every step supports loading (master data), saving, error with retry, offline banner ("changes sync when you're back online"), and empty/no-selection without false validation. Skip and Resume screens included; progress persists locally so returning users resume at the last incomplete meaningful step.

## Technical notes

- New route tree under `src/routes/onboarding/`: `index.tsx` (welcome), `step.$id.tsx` (the progressive stepper), `preview.tsx`, `complete.tsx`, `skip.tsx`, `resume.tsx`. Each route gets its own `head()` metadata.
- New `src/data/onboarding.ts`: canonical master data (roles, instruments, genres, languages, locations, availability, intents, discovery prefs), the step definition list with role-conditional visibility, and per-screen data-contract metadata (`flow`, `screen`, `route`, `dataSource`, `entities`, `states`, `actions`). Fields not in the current profile model are tagged EXISTING / COMPUTED / PROPOSED / FUTURE.
- New `src/components/ml/onboarding.tsx`: extended Gestalt pieces — `StepShell` (progress bar, back, skip, keyboard-aware scroll, safe areas), `ChoiceGrid`, `ChipPicker`, `PhotoPicker` sheet, `InlineField` with validation, `LocationPicker`, `ReadinessCard`, `HandoffCard`, offline/error banners.
- Onboarding draft state kept in a small local store (React context + localStorage) purely for demo persistence; no network calls.
- Preview screen reuses existing profile components rather than a parallel preview system.
- No changes to global bottom navigation; onboarding runs full-screen without the nav.
