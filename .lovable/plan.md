# FLOW 08 — Booking (plus Dashboard IA follow-up)

Design-only, front-end. Reuses the existing Gestalt system (`src/components/ml/ui.tsx`), the calendar and price-breakdown patterns already built for rentals (`src/components/ml/rental.tsx`), and existing profile/market/messaging screens. No backend, no payment provider integration, no navigation changes (bottom nav stays: Home, Discover, Connections, Market — Beta, Profile).

## Open work carried over
Flow 02 onboarding is mid-build: `src/routes/onboarding/index.tsx` exists, the stepper/preview/completion routes and the Flow 03 portfolio layer do not yet. Booking is added as a new track in `roadmap.md`; onboarding remains ahead of it unless you want Booking first.

## 1. Data layer — `src/data/booking.ts`
Seeded, typed demo data only, mapped to canonical names already used in the project (`businessProfile`, `service`, `availability`, `booking`, `payment`, `user`). Fields not backed by existing data are marked in comments as PROPOSED/COMPUTED.

- Bookable entities: recording, mixing, mastering, podcast, jam room, rehearsal, venue, music service — each with rooms/resources, facilities, equipment, policies, pricing tiers (hourly / half day / full day / session / custom).
- Availability model: per-date state (available / limited / unavailable / closed) with schema-driven slot lists, buffer, min/max duration, advance window — no hardcoded universal slots.
- Booking lifecycle: requested → provider reviewing → confirmed → upcoming → in progress → completed, plus cancelled / rejected / expired / no-show. Payment states: pending, processing, paid, failed, partially paid, balance due, refund pending, refunded.
- Seeded customer bookings (all tabs) and provider requests, so every screen has populated and empty variants.

## 2. Components — `src/components/ml/booking.tsx`
Extends Gestalt; nothing Booking-only visually.

Booking header, bookable entity card, service/resource card, availability calendar (extends `RentalCalendar` states with limited/closed), time-slot selector, duration selector, add-on card, price breakdown, policy card with acknowledgement, booking summary, booking status pill, booking timeline, payment summary, provider request card, provider booking calendar (day/week/month), availability editor, and the cancellation / reschedule / confirmation bottom sheets.

## 3. Routes (customer)
```
/booking/$id                 entity detail + Check Availability CTA
/booking/$id/service         resource / service selection
/booking/$id/schedule        availability + date + time + duration (single stepped screen)
/booking/$id/details         purpose, people, requirements, notes
/booking/$id/addons          equipment & add-ons (rental add-ons link out to /marketplace/rent)
/booking/$id/review          price, policies, Request or Confirm
/booking/$id/pay             payment, with success / failed states
/booking/confirmed/$ref      request-sent vs confirmed variants
/bookings                    My Bookings — Upcoming / Pending / Completed / Cancelled
/bookings/$ref               booking detail, upcoming countdown, reminder banner
/bookings/$ref/reschedule    + confirmation state
/bookings/$ref/cancel        policy + refund consequences, confirmation
```
Completion screen offers Leave Review (links to reviews flow) and Book Again (rebook prefilled, availability re-checked).

## 4. Routes (provider)
```
/provider/bookings            dashboard: today, upcoming, pending, availability, revenue, cancellations
/provider/bookings/requests   request list + detail with Accept / Decline / Suggest alternative
/provider/bookings/calendar   day / week / month with booking blocks
/provider/bookings/$ref       provider booking detail
/provider/availability        days, hours, blocked dates, buffer, min/max, advance window
/provider/policies            cancellation, reschedule, deposit, payment, overtime, arrival, equipment
/provider/pricing             hourly / half-day / full-day / session / add-ons / deposit
```
Provider screens are gated behind a role flag in demo data, not a separate app.

## 5. States on every screen
Loading skeletons, populated, empty (no bookings — customer and provider variants), offline banner (no false confirmation), error + retry, booking conflict ("this time is no longer available" with Choose Another Time / Date), no availability (next available, alternative dates, similar spaces, message provider), booking not found.

## 6. Cross-flow boundaries
Message CTAs open the existing messaging screen with a booking-context card. Reviews, notifications, rentals, business identity, and services stay owned by their flows — Booking links to them and does not re-implement them.

## 7. Dashboard follow-up (separate step, after Booking)
Rework `src/routes/feed.tsx` to the orchestrator IA you described: compact header → greeting → single highest-value update card → Continue (next booking / unfinished action) → For you (artists, studios) → Activity list. Existing cards (Professional Profile Active, Collab Availability, Add Track/EP, Studio Spaces, Friends on MusicLinkd, Search Hub) get demoted to status indicators, activity counts, or secondary actions rather than equal-weight feature cards. Upcoming bookings from Flow 08 feed the Continue block. Loading / empty / offline / error / retry preserved, plus a pass on clipping, card widths, and bottom-nav overlap at 360–430px.

## Verification
Build clean, then walk every route in a 412×915 Android viewport: no horizontal clipping, safe-area and bottom-nav padding correct, sticky CTAs above the nav, calendars and slot pickers keyboard/screen-reader labelled, and no colour-only status encoding.
