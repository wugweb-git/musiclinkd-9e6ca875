# MusicLinkd Person Profile Experience

## Goal
Build one cohesive, high-fidelity Android person-profile experience for MusicLinkd using the existing Gestalt system. The profile will function as a professional music identity, portfolio, collaboration surface, and owner-mode workspace without adding backend behavior, APIs, migrations, payments, or a second design system.

## Current-state constraints confirmed
- The repository already has profile fixtures in `src/data/profile.ts` for Rahul Iyer, Ananya Sharma, role-adaptive fallback profiles, completion data, and profile insights.
- `src/components/ml/profile.tsx` already contains reusable profile primitives for hero, badges, sections, audio, video, gallery, projects, services, collaborators, reviews, sharing/QR, safety actions, and completion.
- The existing canonical `/profile/$username` route is not present; discovery currently resolves people through `/talent/$id`, while profile fixtures already reference `/profile/$username` links.
- `/me` is currently a compact menu rather than the owner view of the canonical profile, and `/profile/edit` is currently a section list rather than a progressive edit flow.
- The current public talent route is a separate, older profile presentation and does not expose the full profile contract.

## Product surface
1. **Canonical public profile** at `/profile/$username`
   - Hero identity: cover/photo, name, username, role stack, location, verification, availability, and restrained action group.
   - Overview-first information architecture with a small top-level navigation: Overview, Portfolio, Projects, Services, About.
   - Role-adaptive ordering using the same profile architecture: vocal identity for singers, production/credits for producers, instrument/performance emphasis for musicians, and appropriate professional details for other roles.
   - Featured work, professional summary, music identity, portfolio, projects/discography, services, experience/credits, collaborators, opportunities, marketplace/studio links, reviews, social links, and connections where data exists.
   - Useful public empty states for missing portfolio, audio, video, projects, services, reviews, collaborators, opportunities, marketplace entries, and connections.

2. **Portfolio interactions**
   - Compact audio cards with play/pause, deterministic waveform, duration, artwork, and a persistent mini-player that respects the existing bottom navigation.
   - Video cards and gallery grid using the existing photography-led visual language.
   - Progressive disclosure for biography and professional details instead of a wall of text.

3. **Profile actions and ecosystem connections**
   - Viewer actions are limited to the relevant primary actions: connect, message, follow, hire/enquire, share, and contextual more actions.
   - Message actions navigate to the existing `/messages` surface; hire/enquire uses the existing hire sheet; opportunity responses use existing messaging.
   - Collaborators resolve to the canonical person profile where possible; marketplace and studio entries link to existing routes; project and opportunity surfaces are not duplicated.
   - Share opens the existing QR/digital identity sheet with copy link, share card, save contact, and QR actions.
   - More opens existing safety actions for restrict/block/report.

4. **Owner mode**
   - Update `/me` to render the same canonical profile for the owner with owner controls rather than a separate profile design.
   - Add owner actions for edit, share, public preview, analytics, portfolio, services, availability, and settings using existing routes/data where applicable.
   - Surface the existing 78% completion model and profile insights in owner mode without adding marketplace seller analytics.
   - Expand `/profile/edit` into progressive sections for Identity, Professional, Music, Portfolio, Projects/Credits, Services, Availability, Social Links, Privacy, and Verification with a coherent save state.

5. **Loading, error, offline, privacy, and accessibility states**
   - Add profile skeletons and explicit loaded/empty/private/error/offline states using the current Gestalt patterns.
   - Keep public/private behavior presentational and fixture-driven; do not add auth or persistence.
   - Preserve touch-friendly Android sizing, safe-area spacing, bounded widths, no horizontal page overflow, and no bottom-nav/player overlap.
   - Ensure semantic headings, image alt text, labelled icon controls, accessible media controls, visible focus states, and non-colour-only status cues.

## Technical approach
- Extend `src/components/ml/profile.tsx` only with canonical reusable patterns that are genuinely shared; keep colors, typography, radii, and surfaces on existing semantic tokens.
- Add the missing `/profile/$username` route and map the existing discovery/talent profile entry points to it, while retaining compatibility for current ecosystem routes.
- Use `getProfile()` and existing profile fixtures as the data contract source; do not create a second taxonomy or invent backend fields.
- Refactor `/me` and `/profile/edit` to consume the same profile architecture and existing owner fixtures.
- Keep existing marketplace, rental, studio, messaging, projects, and opportunities as linked destinations rather than duplicating their workflows.
- Remove or avoid any AI-assisted discovery surface and seller analytics from this profile work; no backend/schema changes are included.
- Validate the build, route generation, and Android-sized preview for profile overview, portfolio tabs, share/more sheets, owner mode, edit flow, and long-content/empty states.
