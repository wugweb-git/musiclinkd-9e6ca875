# Rebuild MusicLinkd's product experience

## Goal
Use the supplied mobile reference boards, the linked design conversations, and the new Home/Discover briefs as the quality bar for a product-wide redesign. The result should feel unmistakably like a premium music-industry product: editorial hierarchy, compact professional information, expressive real media, and confident interaction states—not a generic form-and-card application.

Preserve routes, business logic, database contracts, authentication behavior, and the five-destination navigation. Do not fabricate activity, counts, ratings, availability, bookings, revenue, or success.

## Reference conversations
- https://lovable.dev/projects/ace967d9-a62e-48bb-b076-c3b63b11b185?messageId=main%3Aagent%2300000000300059%23ast%3AXZQWPLMH
- https://lovable.dev/projects/ace967d9-a62e-48bb-b076-c3b63b11b185?messageId=main%3Aagent%2300000000299689%23usr%3AQTB4YIL5
- https://lovable.dev/projects/ace967d9-a62e-48bb-b076-c3b63b11b185?messageId=main%3Aagent%2300000000300216%23usr%3ALSQEQ7KQ

## 1. Rebuild the shared visual foundation
- Rework the global CSS and shared primitives before restyling individual screens: page ground, content widths, typography rhythm, section hierarchy, spacing, borders, elevation, media treatment, focus/pressed/loading states, and responsive behavior.
- Keep the established Brand OS: Inter; ink, white, and neutral ground; real media supplies colour; pink is a rare signal; radii remain 8/16/32/full; Lucide icons; 48px touch targets.
- Replace the current repetitive “rounded box around everything” treatment with a small set of deliberate compositions: editorial page headers, grouped operational lists, media-led feature blocks, dense result rows, and anchored actions.
- Consolidate `Screen`, headers, buttons, fields, rows, tabs/segments, cards, sheets/dialogs, empty/loading/error states, and bottom navigation so improvements propagate throughout the product.
- Remove obsolete decorative motion, arbitrary visual exceptions, duplicate patterns, giant dead space, excessive pills, and unsupported one-off styling.

## 2. Establish the flagship screens
### Home
- Rebuild `/home` as one route with two true experiences selected from the signed-in identity.
- **Talent Home:** compact personal context; real attention items; meaningful continuation; opportunity matches; collaborators; studios/services; Saved/Search/Discover entry points; profile health only when useful.
- **Business Home:** business identity and verification; urgent enquiries and booking requests; today's real work; compact pipeline; active services; applicable listings/inventory/team information; talent sourcing; setup health.
- Render only modules backed by actual capabilities and data. Empty modules disappear or show a useful next action.

### Discover
- Make persistent search the visual and functional anchor, followed by progressive text-based intent modes rather than decorative icon tiles.
- Support entity-specific structures for People, Businesses, Studios, Services, Opportunities, Projects, Music, and Market content where current data exists.
- Adapt priorities by identity: collaborators, opportunities, studios, and services for Talent; sourcing talent, services, places, and equipment for Business.
- Reuse existing person, bookable, opportunity, service, project, track, and listing Blocks; add only missing shared discovery patterns such as mode-aware filters and preview behavior.
- Show natural, explainable relevance reasons and productive loading, unavailable, filtered, no-result, offline, error, saved, and recent states.

## 3. Roll the system through the complete product
Apply the new foundation in controlled route families, finishing each family before moving on:

1. **Account entry:** `/welcome`, create account, phone/verification, password recovery, consent, and immediate onboarding handoff. Redesign the current screenshot’s weak hierarchy, boxed form, dead space, and desktop-like mobile proportions while preserving the completed auth-state behavior and “no passwordless email codes” rule.
2. **Onboarding and creation:** identity, roles, interests, portfolio, business creation/review, bands, verification, service creation, and all progress/success/failure states.
3. **Professional identity:** Talent and Business profiles, owner/public modes, editing, portfolio, media, services, reviews, QR/sharing, verification, and profile health.
4. **Work and network:** Opportunities, applications, collaborations, Connections/Messages, notifications, Saved/recently viewed, search, and recommendations.
5. **Commercial workflows:** Bookings, business requests, enquiries/leads, services, availability, Market buying/selling/rentals, listing management, invoices/receipts where implemented.
6. **Account and utilities:** Settings, privacy, security, account switching, help/search/announcements, legal, offline/error/not-found, and development-only screens.

Each family receives responsive hierarchy, density, interaction polish, and complete states—not a cosmetic token swap.

## 4. Data and architecture rules
- Use current authenticated server functions for profiles, business identity, recommendations, notifications, enquiries, bookings, services, listings, applications, and Saved data.
- Remove reliance on hardcoded dashboard activity and do not turn absent backend capabilities into visual claims.
- Use taxonomy-backed labels and filters; do not add hardcoded role, genre, city, instrument, or service lists.
- Keep Business type as adaptive content within shared architecture, not separate dashboards per business category.
- Treat the duplicate Business Home upload as one brief. No separate Business Discover brief was supplied, so Business Discover will use the shared Discover contract plus the sourcing priorities in the Business Home brief.
- Add no database tables, buckets, or migrations without a separate owner-approved data plan.

## 5. Delivery sequence and review gates
- First deliver the shared foundation plus the redesigned `/home`, `/discover`, and `/welcome` as the visual benchmark.
- Capture and inspect those screens at 360px, 390px, 412px, tablet, and desktop before propagating the system.
- Continue family by family, checking real populated and sparse identities where available, plus loading, empty, offline, error, retry, disabled, and success states.
- Keep a route checklist so every existing content route is covered and no screen remains on the old visual language.
- Run TypeScript, lint, token drift, Storybook accessibility, build, runtime diagnostics, and representative end-to-end flows. Fix central-flow defects before calling a family complete.

## Acceptance standard
- The first viewport has a clear purpose and next action.
- Mobile screens have no clipping, nested scroll traps, oversized slabs, or bottom-navigation collisions.
- Desktop gains structure and density rather than stretching a phone layout.
- All interactive states are intentional and accessible.
- Real content and media lead; UI chrome stays calm and restrained.
- Home answers “what matters now”; Discover answers “what am I looking for”; neither becomes a social feed.
