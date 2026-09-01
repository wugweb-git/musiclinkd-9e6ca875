# MusicLinkd roadmap

## Done
- FLOW 03 (Discover) — discover home, categories, search, filters, profiles
- Dashboard / returning-user home
- Marketplace (buy/sell) + Rental marketplace
- Person Profile (public + owner mode) and profile edit
- FLOW 08 — Booking: data layer, components, customer flow (entry → service → schedule →
  details → add-ons → review → pay → confirmed), my bookings, booking detail,
  reschedule, cancel, provider workspace, request review, availability manager

## In progress
- FLOW 02 — User Onboarding
  - [x] `src/data/onboarding.ts` master data, step model, contracts
  - [x] `src/components/ml/onboarding.tsx` UI kit + draft store
  - [x] welcome, stepper (`/onboarding/step/$id`), preview, complete, resume, skip
  - [ ] render pass on 412px viewport

## Next
- Profile follow-ups (from user)
  - [ ] `src/routes/profile.insights.tsx` — owner analytics
  - [ ] redirect `/talent/$id` → `/profile/$username`; repoint Discover/Search/collaborator links
  - [ ] fix remaining `exactOptionalPropertyTypes` errors in `person-profile.tsx`
- FLOW 03 — Add Portfolio
  - [ ] `src/data/portfolio.ts`, `src/components/ml/portfolio.tsx`
  - [ ] portfolio routes (overview, add, work detail, edit, reorder, settings, select)

## Notes
- Payments: seller is in India, so Lovable's built-in Stripe/Paddle are unavailable.
  Razorpay recommended (UPI, cards, INR) — awaiting user's decision before wiring.
