# Wave 1 (continued): Onboarding + Profile made durable

Flow 01 (Authentication) is finished and verified. Next in the approved plan is the rest of Wave 1: Flow 02 (Onboarding) and Flow 10 (Profile), so a signed-in user's setup answers actually survive sign-out, device change, and app reload.

## Current state (checked)

- Onboarding keeps its whole draft in `localStorage` only (`src/components/ml/onboarding.tsx`); nothing is written to the backend during the steps.
- The backend `profiles` table only stores username, display name, headline, bio, city, roles, avatar, availability and an onboarding-complete flag.
- The onboarding steps collect much more than that: instruments, genres, languages, experience level, specialisations, work modes, links, contact channels, discovery preferences, intent, visibility.
- `saveMyProfile` / `getMyProfile` already exist and are used at the end of onboarding, so the extra answers are silently dropped.

## What will change

### 1. Store the full profile
Extend the profile record with the fields onboarding already asks for: instruments, genres, languages, specialisations, experience level, work modes, intent, links, contact preferences, discovery visibility, plus a resume pointer (last completed step) so "resume where you left off" works across devices.

### 2. Onboarding saves as you go
- Every step still writes locally first (instant, works offline), then syncs to the account in the background when signed in.
- Signed-out users keep the current local-draft behaviour; on sign-in the local draft is merged up once.
- Resume screen reads the server-side pointer when signed in, so a user who starts on phone and continues on desktop lands on the right step.
- Explicit saving / offline / retry banners wired to the real sync result instead of the current simulated states.

### 3. Profile convergence (Flow 10)
- `/me` and `/profile/edit` read and write the same extended record, so what onboarding captured shows up on the profile and is editable afterwards.
- Public `/profile/$username` renders the extended fields (instruments, genres, languages, work modes, links) from real data when the profile exists, falling back to the seeded demo profile otherwise.
- Profile completion meter and the owner "finish your profile" prompts derive from real stored values rather than mock counts.

### 4. States and render pass
Loading, empty, offline, error, retry, permission and success states across onboarding and profile, then a 412px Android pass on every touched screen for clipping, card widths and bottom-nav overlap.

## Out of scope (unchanged)

Marketplace/rentals, collaboration, QR analytics, subscriptions, real media/file storage, KYC checks, notifications and payments stay mocked. Bottom navigation stays at exactly five destinations.

## Technical notes

- One migration adds the new profile columns (text/array/jsonb as appropriate) with defaults, keeping existing RLS scoped to `auth.uid()` and adding no new tables.
- Persistence goes through `createServerFn` handlers in `src/lib/portfolio.functions.ts` (extend the existing `saveMyProfile` validator) with `requireSupabaseAuth`; no new client-side Supabase writes.
- Onboarding sync is debounced per step and non-blocking; navigation never waits on the network.
- Verification: `bunx tsgo --noEmit`, build log, curl checks on touched routes, Playwright at 412px.
