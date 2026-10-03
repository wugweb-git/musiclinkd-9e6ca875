# Restore MusicLinkd’s product design system, Home, and Discover

## Goal
Use the supplied reference boards to rebuild the shared visual language, then recreate `/home` and `/discover` as the operational centre of MusicLinkd. Talent and Business accounts receive genuinely different priorities while current routes, navigation, and data contracts remain intact.

## Shared visual system
- Audit the current global styles and shared primitives against the references: hierarchy, content width, mobile rhythm, page backgrounds, surface grouping, typography, fields, buttons, segmented controls, rows, sheets, empty/loading/error states, and media treatment.
- Strengthen those shared foundations centrally instead of adding page-specific decoration or a parallel component set.
- Keep the Brand OS intact: Inter, monochrome product chrome, real media carrying colour, ink primary actions, and pink used only as a focused signal.
- Replace the current over-boxed, generic form/dashboard appearance with clearer editorial composition, tighter information grouping, stronger contrast, and deliberate mobile density.

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

## Product rollout
- After Home and Discover establish the approved quality bar, apply the same shared-system corrections to the remaining existing route groups rather than redesigning 143 routes independently.
- Prioritize shared shells and Blocks first, then account entry/onboarding, professional profiles, opportunities/connections, business operations, bookings/services, Market, settings, and secondary utilities.
- Preserve working behavior and verify each route group before moving on; do not fabricate data to make screens look populated.
