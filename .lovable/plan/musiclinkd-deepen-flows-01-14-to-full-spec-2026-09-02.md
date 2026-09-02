# MusicLinkd — deepen Flows 01–14 to full spec

You're right: what exists is a skeleton. Roughly 110 routes cover the happy path of each flow, but the uploaded spec defines several times that many screens, sheets and states — and several flows (Opportunities, Services & Availability, Business Profiles) have almost no surface yet.

This plan turns that skeleton into the full product, in waves, using the spec file as the single source of truth for screen lists and the Gestalt system for the look.

## Ground rules for every wave

- Screen-by-screen against the uploaded spec: every screen ID, bottom sheet, dialog, and the empty / loading / error / offline / permission / success state of each.
- Bottom navigation stays exactly five destinations. No new global nav.
- Every screen reachable from at least one real entry point — no orphan routes.
- Each wave ends with: typecheck, build, a 412px Android render pass on every new screen, and a link-reachability sweep.
- Backend added only where data must survive a reload (see below). Everything else stays seeded mock data.

## Backend scope

Already live: `profiles`, `portfolio_items` with owner policies and public reads.

Added as the waves need them, each with grants, RLS scoped to the owner, and public-read policies only where the spec says the data is public:

| Data | Tables |
| --- | --- |
| Identity & roles | extend `profiles`; `user_roles` (separate table, never a column on profiles) |
| Discovery | `saved_items` (shortlist), `follows` |
| Opportunities | `opportunities`, `opportunity_applications` |
| Services | `services`, `service_packages`, `availability_rules`, `availability_exceptions` |
| Booking | `bookings`, `booking_events` |
| Reviews | `reviews` |
| Business | `businesses`, `business_members` |

Marketplace listings, rentals, collaboration workspaces, QR analytics and subscription plans stay mock in these waves — they are the largest surfaces and are better done once the identity/services/booking spine is real.

Not in scope: payments (Razorpay still unresolved), real file/media storage, KYC or any real verification checks, push notifications.

## Waves

**Wave 1 — Identity spine (Flow 01 + 02 + 10)**
Real auth: email/password + Google, verification-pending, error, rate-limit, account-exists, session-expired and sign-out states. Onboarding writes to `profiles` instead of localStorage, resumes from the real record, and every role-adaptive branch in the spec gets its fields. Profile management (edit, settings, privacy, account) completed to spec on top of the same record.

**Wave 2 — Work & credibility (Flow 03 + 16 + 17)**
Portfolio deepened: every media kind, contributor credits, ordering, visibility, per-item states, and the analytics/insight screens the spec lists. Reviews become real records tied to bookings, with write / edit / respond / report / moderation states. Verification stays mock-reviewed but gains the remaining VERIFY screens.

**Wave 3 — Discovery (Flow 04 + 20)**
Discover, search, category, filter and result screens rebuilt against the spec's discovery dimensions, reading real profiles/portfolio/services instead of hardcoded arrays. Saves and follows persist. Recommendations wired to the same data with reason chips and settings.

**Wave 4 — Opportunities (Flow 05)**
The flow with no routes today: opportunity types, feed, filters, detail, application journey with all outcome states, My Opportunities (applied / saved / posted), and the create-opportunity composer — persisted, with owner and applicant views.

**Wave 5 — Services, availability, booking (Flow 11 + 08)**
Provider services and packages, pricing, policies, availability rules and exceptions, and the customer booking journey persisting real bookings through Requested → Reviewing → Confirmed → Upcoming → Completed, plus reschedule / cancel / no-show / dispute states on both sides.

**Wave 6 — Business & studios (Flow 12 + 07)**
Business profiles with members and roles, studio/space listing and discovery, and their booking handoff into Wave 5.

**Wave 7 — Connective tissue & polish**
Notifications centre, settings hub, messaging depth (thread states, requests, attachments, share-to-thread), plus a full-app polish pass: consistent spacing/hierarchy, imagery, motion, skeletons, and a 412px sweep across every screen in the app.

## Technical notes

- Routes stay flat, dot-named files under `src/routes/`; wizards use search params (`?step=`) so state is URL-driven and shareable.
- Authenticated pages move under `_authenticated/`; public profile, opportunity and listing pages stay SSR with their own `head()` metadata.
- Data access via `createServerFn` in `*.functions.ts` with `requireSupabaseAuth` for owner reads/writes; public reads via narrow anon SELECT policies.
- Seeded demo content stays available for signed-out visitors so the app never looks empty.
- Gestalt tokens and `ui.tsx` / `kit.tsx` remain the only component vocabulary; new shared patterns are added there rather than per-screen.

## Where to start

Wave 1 first, since every later wave reads from the identity record. Tell me if you'd rather I lead with a different wave.
