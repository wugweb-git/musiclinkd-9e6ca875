# FLOW 16 — Verification (complete journey)

Design-only. No backend, no document storage, no real identity checks. Everything reuses the existing Gestalt system (`src/components/ml/ui.tsx`, `src/components/ml/kit.tsx`) and the canonical data in `src/data/verification.ts`. The five bottom-nav destinations stay unchanged.

## What exists today

- `/verification` — a hub with status per type, trust signals and related links.
- `/verification/$type` — a single-page request screen (requirements + a document checklist + submit dialog).
- `src/data/verification.ts` — four canonical types (identity, professional, business, studio), statuses `unverified / in_review / verified / rejected / expired`, sample requests and trust signals.

Gaps against the spec: no type-comparison screen, no separated requirements/consent/upload/review steps, no submission-success, pending, resubmit, renew, badge-preview, privacy or help screens.

## Journey to build

```text
Profile → Verification entry → Choose type → Requirements → Submit (identity /
professional / business evidence) → Review + consent → Submitted → Pending →
Decision (Verified / Rejected / Expired) → Badge
```

## Screens

1. **Entry (`/verification`)** — overall trust state at the top (Not verified / Pending / Verified / Rejected / Expired), one primary "Get verified" CTA, per-type status rows, trust signals, links to badge, privacy and help. Adds an expired example so the state is designed, not theoretical.
2. **Choose type (`/verification/choose`)** — the four supported levels side by side with three fixed lines each: what it verifies, what other people see, what is required. Levels not available for the account type are shown as locked with the reason (professional requires identity first).
3. **Requirements (step 1 of `/verification/$type`)** — plain checklist, turnaround, what is never asked for, and an explicit "why we need this" line per item.
4. **Evidence step (step 2)** — role-specific: identity (ID + selfie + consent), professional (portfolio, credited work, affiliation picked from existing portfolio entries), business (business name, registration, authority). Only fields the level actually needs.
5. **Document upload (step 3)** — per-document rows with attach / preview / replace / remove, local-only previews, and a privacy note.
6. **Review + consent (step 4)** — summary of type, information and documents, explicit consent checkbox, "Submit for review" CTA.
7. **Submitted (step 5)** — confirmation with status Under Review and what happens next; no promised deadline beyond the type's stated turnaround.
8. **Status states** — pending, verified (with date and badge preview), rejected (reason, "Review requirements" + "Resubmit" keeping previously accepted documents), expired ("Renew verification" reusing the same wizard).
9. **Badge (`/verification/badge`)** — one badge preview plus how it appears in profile, search, discovery, marketplace, business, opportunities, messaging and reviews, so it reads consistently everywhere.
10. **Privacy (`/verification/privacy`)** — what is stored, what is never public, who reviews it, how to withdraw.
11. **Help** — FAQ answers routed to the existing CMS article `/help/how-verification-works`, extended with the five spec questions.

## States

Every screen gets loading, empty, error/offline retry, permission-locked (level not available), and disabled-submit states, matching the patterns already used in Recommendations and Bookings.

## Technical notes

- Extend `src/data/verification.ts` with: locked/eligibility reason per type, `whatOthersSee`, per-requirement rationale, an expired sample request, badge placement list and privacy copy. Keep the canonical names `verification_request`, `verification_type`, `verification_status`, `trust_signal`, and map spec states `not_started → unverified`, `pending → in_review`.
- Turn `/verification/$type` into a stepped wizard driven by local component state (no persistence), with a `step` search param so back/forward behaves.
- New flat routes: `verification.choose.tsx`, `verification.badge.tsx`, `verification.privacy.tsx`.
- Reuse existing `StatusPill`, `Meter`, `Card`, `Row`, `Dialog`, `Sheet`, `EmptyState`, `VerifiedBadge`; extend Gestalt only if a document-row component is genuinely reusable.
- Entry points: owner profile panel and dashboard already link to `/verification`; add a verification nudge on the dashboard when status is not verified.
- Verify with typecheck, build, route sweep and a 412px render pass on every new screen.

## Out of scope

Real document storage or upload infrastructure, KYC/API integrations, reviewer/admin tooling, payments.
