# Pending screens across all flows

I compared the full spec document against every screen currently in the app. The core journeys are all built; what remains is a set of side screens, follow-up actions and edge states. Below is the complete pending list, grouped by area, in the order I would build it.

## Group 1 — Business profiles (largest gap)

Business pages exist (create, view, manage, team) but a business cannot yet run as a business:

- Business services management and business availability
- Business portfolio / gallery management
- Enquiry and booking entry from a business page
- Business reviews and owner replies to reviews
- Business verification
- Follow and share a business, plus related-business suggestions
- Business analytics, leads inbox and owner dashboard

## Group 2 — Services

- Enquiry screen and custom-quote request from a service
- Pause / paused, duplicate and delete a service
- Availability conflict and double-booking warning screens

## Group 3 — Bands

- Band portfolio and discography
- Band events and band opportunities
- Contact the band

## Group 4 — Reviews

- Reply to a review (owner response)
- Edit and delete your own review
- Report a review
- Request a review, and the reminder screen

## Group 5 — Discovery and search

- Music discovery, project discovery and community discovery sections
- Nearby / local discovery, and nearby recommendations
- Recently viewed
- "Why am I seeing this" explanation
- Saved searches and search alerts
- Search history screen
- Location permission prompt

## Group 6 — Opportunities and portfolio follow-ups

- Report an opportunity
- Withdraw an application (explicit confirmation screen)
- Attach portfolio work inside a conversation
- Archive a work, media upload failure and media processing states
- Save-conflict screen when the same work is edited in two places

## Group 7 — Onboarding and help

- Verification prompt and services prompt at the end of onboarding
- Onboarding error and offline screens
- Splash / session-check screen at app start
- Verification help page
- FAQ page and announcements page in Help
- Search inside Help

## Group 8 — Settings and monetisation

- Change email, change phone, change username screens
- Invoice history and receipt screens (currently only earnings)

## How this will be built

- Design-only, mobile-first 430px shell, existing Gestalt system and tokens; no new backend work, no payment wiring.
- Flat dot-named routes under `src/routes/` matching existing conventions; each new route gets its own `head()` metadata.
- New data lives in the existing `src/data/*` files (business, services, band, reviews, discover, recommendations, cms) using the canonical field names already in use.
- Every new screen ships its loading, empty, error and offline state rather than a raw failure.
- Each group ends with a 412px render pass and reachable entry points from Profile, Discover, Business or the dashboard — bottom navigation stays at five destinations.
- `roadmap.md` is updated as each group lands.

## Out of scope

Real media upload/storage, payment provider wiring (Razorpay still undecided), push-notification delivery, and voice search.
