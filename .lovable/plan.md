# Restore role-aware Home and Discover

## Goal
Recreate `/home` and `/discover` as the operational centre of MusicLinkd, with genuinely different priorities for Talent and Business accounts while preserving the current routes, navigation, data contracts, and design system.

## Home
- Detect the signed-in account identity and render a Talent workspace or Business operating console from the same route.
- Talent Home prioritizes real attention items, meaningful continuation, matched opportunities, useful people, studios/services, and recent account activity.
- Business Home prioritizes urgent enquiries and booking requests, today's work, a compact pipeline, active services, applicable inventory/team information, talent sourcing, and setup health.
- Hide irrelevant or empty modules rather than filling the page with fabricated metrics, availability, revenue, ratings, or events.
- Keep complete loading, sparse/new-account, offline, error, empty, and retry states.

## Discover
- Make search permanently visible and the dominant interaction, with progressive text-based modes for People, Studios, Services, Opportunities, Businesses, Projects, Music, and Market where data exists.
- Adapt mode ordering and recommendations by identity: collaborators/opportunities/services for Talent; sourcing talent/services/equipment for Business.
- Use existing entity-specific blocks and current search/filter routes instead of a generic card grid or a second directory implementation.
- Show explainable recommendation reasons, nearby results only from stored location, and direct routes to Saved and full Search.
- Keep no-results and unavailable-recommendation states productive without inventing content.

## Technical details
- Reuse authenticated server functions for profile/business identity, notifications, enquiries, bookings, services, listings, applications, and recommendations; consolidate Home reads where practical.
- Reuse existing MusicLinkd controls and Blocks, semantic tokens, five-tab navigation, and responsive rail/list patterns.
- Treat the duplicate Business Home upload as one brief. Since no separate Business Discover brief was included, apply the shared Discover contract with the business sourcing priorities explicitly defined by the Business Home brief.
- Add no tables or migrations and make no unrelated route changes.

## Verification
- Exercise Talent and Business states where test identities are available, plus loading, empty, offline, and error presentations.
- Inspect `/home` and `/discover` at 360px, 390px, 412px, and desktop for clipping, hierarchy, touch targets, and navigation.
- Run TypeScript, lint, token-drift, Storybook accessibility, build, and runtime diagnostics.
