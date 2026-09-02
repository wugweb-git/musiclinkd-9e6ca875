# Dashboard IA refactor + Booking gap closure

Two scoped tracks. Design-only, front-end, existing Gestalt system and seeded data. No backend, no payment integration, no navigation changes — bottom nav stays Home, Discover, Connections, Market — Beta, Profile (Messaging is not a sixth item).

## What exists today

- `src/routes/feed.tsx` already handles loading / populated / empty / offline / error / retry, but its information architecture is still a feature-card list: a four-tile "Your activity" grid, then Continue, For you, Upcoming, Recent activity, and a "Quick actions" grid of four equal-weight tiles.
- `src/data/dashboard.ts` provides the seeded user, stats, continue items, matches, studios, activity and bookings.
- Booking (Flow 08) is built: data model, components, the full customer path (`/booking/$id` → service → schedule → details → addons → review → pay → confirmed), `/bookings` list, detail, reschedule, cancel, plus provider dashboard, request detail and availability. Payment success and failure states already exist.
- Booking's own upcoming sessions do not yet feed the dashboard — the Upcoming block uses its own local list and links to `/studio`.

## Track 1 — Dashboard as orchestrator (main work)

Rewrite `src/routes/feed.tsx` around the returning-user question "what is happening, and what next?", reusing existing components and tokens.

New order and weight:

1. **Header** — unchanged compact bar: wordmark, notifications, avatar.
2. **Greeting** — "Good afternoon, <name>" plus one contextual sentence, with availability shown as a small inline status chip rather than a card.
3. **Headline update** — one single highest-value card (e.g. "3 new opportunities" or the most urgent connection request) instead of the four-tile counter grid. It picks the top-priority item from the seeded stats.
4. **Continue** — the next booking from the booking data (`Octave-style` studio session with date and time) or the most advanced unfinished action, as one prominent card.
5. **For you** — compact two-up summary tiles ("4 artists to meet", "2 studios nearby") that open Discover/Studio, with the existing talent carousel beneath.
6. **Activity** — a plain, scannable event list (connection accepted, new message, profile views this week) replacing decorated promo cards; inline Accept stays on requests.
7. **Secondary** — the remaining counts and demoted actions in one quiet row: profile completion, add track/EP, collab availability, search, find contacts.

Data: extend `src/data/dashboard.ts` with a small selector that derives the headline update and the Continue item, and pulls the next upcoming session from `src/data/booking.ts` so Booking and Home stay in sync. No new models, no invented backend.

All six states stay: loading skeleton matching the new layout, populated, empty (quiet-network copy plus a Discover CTA), offline banner, error, retry.

## Track 2 — Booking gaps

Add the provider and edge screens the flow still lacks, all reusing `src/components/ml/booking.tsx`:

- `/provider/bookings/requests` — request list (the per-request detail already exists).
- `/provider/bookings/calendar` — day / week / month with booking blocks.
- `/provider/pricing` — hourly / half-day / full-day / session / add-ons / deposit.
- `/provider/policies` — cancellation, reschedule, deposit, payment, overtime, arrival, equipment.
- Booking conflict and no-availability states on the schedule step (next available date, alternative dates, similar spaces, message provider), and Book Again prefill from a completed booking.

## Rendering verification

Build clean, then walk the dashboard and every new route at 360, 412 and 430 px: no horizontal clipping, consistent card widths, safe-area top padding, bottom-nav clearance, no text overflow, and sticky CTAs above the nav.

## Out of scope

Discover, Connections, Market, Profile, auth, backend, Firestore models, navigation destinations, and any other screen stay untouched.
