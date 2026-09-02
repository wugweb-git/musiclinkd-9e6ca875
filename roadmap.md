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
- Backend (Lovable Cloud) — enabled
  - [x] `profiles` + `portfolio_items` tables, RLS, grants, signup trigger
  - [x] `/auth` email+password and Google sign-in, `useAuth` hook
  - [x] `src/lib/portfolio.functions.ts` server functions (portfolio + profile CRUD)
  - [x] onboarding completion writes profile to the database
- FLOW 03 — Add Portfolio (UI per latest spec, DB-backed when signed in)
  - [x] overview (header stats, featured, all work), type picker, work form, draft/publish
  - [x] work detail (audio/video player, credits, performance), edit, reorder + featured,
        settings, share, portfolio analytics, share-work picker
  - [x] media uploader state machine (not-uploaded/uploading/processing/ready/failed/unavailable)
  - [ ] real media upload/storage (deliberately out of scope — links only)
- FLOW 08 — Booking: re-check latest spec gaps (payment success/failure, conflict,
  no-availability, rebook, provider pricing/policies screens)
- FLOW 02 — User Onboarding
  - [x] `src/data/onboarding.ts` master data, step model, contracts
  - [x] `src/components/ml/onboarding.tsx` UI kit + draft store
  - [x] welcome, stepper (`/onboarding/step/$id`), preview, complete, resume, skip
  - [x] `/onboarding/done` final screen + portfolio hand-off
  - [x] render pass on 412px viewport (no overflow, no console errors)

## Next
- Profile follow-ups (from user)
  - [ ] `src/routes/profile.insights.tsx` — owner analytics
  - [ ] redirect `/talent/$id` → `/profile/$username`; repoint Discover/Search/collaborator links
  - [ ] fix remaining `exactOptionalPropertyTypes` errors in `person-profile.tsx`
- FLOW 03 — Add Portfolio
  - [ ] `src/data/portfolio.ts`, `src/components/ml/portfolio.tsx`
  - [ ] portfolio routes (overview, add, work detail, edit, reorder, settings, select)

## FLOW 23 — QR / Digital Identity & Sharing (requested Sep 2, design-only)
- [ ] `src/data/identity.ts` — canonical QR destination model (type/entityId/publicRoute/status), seeded demo destinations
- [ ] `src/components/ml/qr.tsx` — QR matrix renderer, identity card, scan frame, destination preview, share sheet
- [ ] Routes: digital ID entry, personal/business QR, fullscreen, share sheet, scanner + scanning,
      results (profile/business/service/marketplace/portfolio), invalid/expired/private/deleted/deactivated,
      customization, share card, digital business card, save contact, print preview, settings, analytics, scan history
- [ ] Camera permission / denied / gallery-image scan fallbacks, loading / offline / network + share error states

## FLOWS 15 / 16 / 17 / 18 / 20 / 22 (requested Sep 2, design-only, one coherent app)
- [x] FLOW 15 Band — /bands, /bands/$id, /bands/new, /bands/$id/manage, /bands/$id/invite
- [x] FLOW 16 Verification — VERIFY-01..17: /verification (hub), /verification/choose, /verification/$type?step&mode (5-step wizard, status branches, resubmit/renew), /verification/badge, /verification/privacy. Verified end-to-end at 412px.
- [x] FLOW 17 Reviews — /reviews, /reviews/write/$id
- [x] FLOW 18 Subscription / monetisation — /plans, /plans/checkout, /plans/manage, /plans/earnings
- [x] FLOW 20 Recommendations — /recommendations, /recommendations/settings
- [x] FLOW 22 CMS / content pages — /help, /help/$slug, /help/category/$key

## Notes
- Payments: seller is in India, so Lovable's built-in Stripe/Paddle are unavailable.
  Razorpay recommended (UPI, cards, INR) — awaiting user's decision before wiring.

## Verify / follow-up (requested Sep 2)
- Person Profile: confirm `/profile/$username`, `/me` owner mode, `/profile/edit`,
  `/profile/insights`, `/talent/$id` redirect and Discover/Search link mapping all render
- 412px Android render pass: dashboard, onboarding, profile, portfolio (clipping, bottom-nav overlap)

## Dashboard IA refactor + Booking gaps (Sep 2)
- [x] `/feed` rebuilt as orchestrator: greeting → single headline update → Continue (next booking) →
      For you tiles + matches → activity list → demoted manage/quick actions
- [x] `src/data/dashboard.ts` selectors pull the next session from the Booking data
- [x] Provider: `/provider/bookings/requests`, `/provider/bookings/calendar`, `/provider/pricing`, `/provider/policies`

- [x] FLOW 01 Authentication — AUTH-01..22: /welcome, /auth?mode, /auth/phone, /auth/otp, /auth/verify-email, /auth/forgot, /reset-password, /auth/success, /auth/signout, /auth/locked, /auth/offline, /auth/maintenance, /legal/terms, /legal/privacy, /settings/delete-account. Real email + Google auth; phone is preview-only. Verified at 412px.
