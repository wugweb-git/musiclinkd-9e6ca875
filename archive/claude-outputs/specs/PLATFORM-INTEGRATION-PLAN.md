# MusicLinkd: Platform & Integration Plan

Date: 25 Sep 2026 · Scope: what gets integrated, where it lands, what needs doing, why, and the impact. Mechanics only. Screen design and copy are Vedanshu's.

Evidence comes from reading both repo clones on 25 Sep: the app `musiclinkd-9e6ca875` at `bca0715`, and the old `musiclinkd` repo. **The live Supabase database could not be inspected** (no permission from the connected account), so "live" and "applied" claims below are unverified.


> **REVISION 3 — 25 Sep 2026 (supersedes Revision 2 and §0/§2 where they conflict).**
> Direction: the stack is **Supabase** (Vercel dropped — hosting is not Vercel; all server-side runs on Supabase Edge Functions). Grow by plugging hosted connectors into it — no extra servers, no engine migrations. Mercur/Medusa is OUT (needs its own Node server + Redis).
>
> | Module | Connector (hosted, plugs into Supabase + Vercel) | Role |
> |---|---|---|
> | Payments, deposits, refunds, seller KYC, split payouts, invoices | **Razorpay + Route** | Webhooks land on a Supabase Edge Function |
> | Holds, reminders, payout release, order/booking state steps, digests | **Inngest** (host-agnostic, called from Edge Functions) | Durable workflows instead of hand-written jobs |
> | Chat + feed, reactions, follows | **Stream (Maker: chat + activity feeds)** | Token endpoint on a Supabase Edge Function; replaces hand-built chat/feed |
> | Push, analytics, crashes, remote config | **Firebase (Spark)** — copy Ikan's FCM + Capacitor setup | |
> | Email | **Resend** | |
> | Admin UI | **Refine** (open-source admin framework, Supabase data provider) deployed as a static site on the same host as the app | Ready-made CRUD/tables/forms/auth on existing tables |
> | Media | **Embeds (oEmbed)** | |
> | Marketplace sell/rent/book, reviews, saves, profiles, verification | **Supabase (existing schema)** | No hosted multi-vendor marketplace engine runs natively on Supabase; Razorpay + Inngest carry the hard parts |
> | Optional | Algolia (search) · Upstash (rate limit/cache) · Sentry (errors)  | When needed |
> | Later | Shiprocket · HyperVerge/Cashfree · Google Calendar · WhatsApp | |

---

## 0. What the repos actually contain (and what that changes)

| Finding | Evidence | Consequence |
|---|---|---|
| **The Supabase schema is far bigger than AGENTS.md says** | 116 migrations, ~75 tables: `marketplace_listings`, `marketplace_offers`, `rental_bookings`, `booking_requests`, `reviews`, `review_requests`, `saved_items`, `saved_searches`, `notifications`, `push_tokens`, `conversations`, `messages`, `feed_posts`, `follows`, `verification_*`, `studios`, `studio_rooms`, `studio_blocks`, `bands`, `band_members`, `profile_services`, `profile_service_packages`, `opportunities`, `cms_pages`, `taxonomy_*`, `reports`, `support_requests`… | AGENTS.md's claim that only `profiles` and `portfolio_items` are live is **stale or wrong**. Whether these migrations are applied live is unverified. |
| **The app already queries them** | 42 `*.functions.ts` server-function files. `marketplace_listings` is used in 8 files, `studios` in 13, `booking_requests` 5, `reviews` 5, `rental_bookings` 4, `saved_items` 4, `follows` 3, `feed_posts` 0 | Much of the "vibe-coded" product has a real schema and server layer underneath. It isn't all mock. |
| **Route tree** | 157 entries in `src/routes` (plus folders such as `marketplace/` with 10 routes). Groups: business 23, opportunities 13, identity 10, auth 10, booking 8, bands 8, services 7, reviews 6, verification 5, discover 5 | The integration map in §4 uses these real routes |
| **Capacitor already installed as a thin wrapper** | `capacitor.config.ts`: `server.url: https://app.musiclinkd.com`; `@capacitor/android` 8.5, push, splash, status bar, `android/` folder | **Conflict:** the earlier recommendation was a static bundle + live updates, because a pure wrapper risks Google Play's minimum-functionality rejection. Decide before submitting to Play. |
| **Storybook already in the app repo** | `storybook` 10.6 + `storybook-static/` | Storybook stays in the app repo, as agreed |
| **Old repo** | `admin/` = Next.js 15 + firebase-admin; `backend/functions` = Firebase Functions; `frontend/` = docs (guide, ux, website); `infrastructure/` = Cloudflare, Docker, Vercel, Firebase Hosting | Old admin dropped (decided). Salvage the models and function list only. |

### Correction to the earlier recommendation

I recommended **Mercur/Medusa for commerce and Stream for chat and feeds** before seeing that the Supabase schema already models listings, sale/rent offers, rental bookings, booking requests, reviews, chat and feeds, and that 42 server-function files are wired to it. Replacing that with Mercur + Stream would **throw away working schema** and add a Node server, an auth bridge and a data migration.

**Revised call: keep Supabase as the core. Add only what the current build can't do by itself.**

| Need | Revised pick | Why |
|---|---|---|
| Commerce (sell / rent / book) | **Existing Supabase schema**, hardened | Already modelled. What's missing is state enforcement, payments, a ledger and jobs, not the engine. |
| Payments + payouts | **Razorpay (+ Route)** | The one thing that can't be built |
| Push | **FCM** (`@capacitor/push-notifications` already installed, `push_tokens` table exists) | Already started |
| Email | **Resend** | Nothing is sending email today |
| Webhooks + background jobs | **Supabase Edge Functions + pg_cron / Queues** | No separate Node server needed |
| Chat | **Existing `conversations` / `messages` + Supabase Realtime** | Already modelled. Stream only if quality falls short. |
| Feed | **Existing `feed_posts` / `follows`**, currently unused (0 queries) | Wire it before buying anything |
| Admin | **New admin app** (new repo) on Supabase | The old one is dropped |
| Mercur / Stream | **Parked.** Revisit if multi-seller payouts, tax or chat scale outgrow the Supabase build. | Keeps the option open without paying the migration cost now |

---

## 1. Settled decisions

| # | Decision | Status |
|---|---|---|
| D1 | One product, one frontend: the Lovable app repo | Settled |
| D2 | Supabase = the data core. Firebase (Spark) = Google services only: FCM, GA4, Crashlytics, Remote Config | Settled |
| D3 | Marketplace = sell + rent + book (services, gigs, studio, lessons) in **one backend**, three modes | Settled |
| D4 | Bookings are found from profiles and Discover, not on the marketplace screen. Shared: orders & bookings list, checkout, payouts, chat. | Settled |
| D5 | Collabs live in Opportunities (no checkout). Bands are a profile type, not a product. | Settled |
| D6 | No first-party video hosting. Reels and video are embeds, loaded thumbnail-first. | Settled |
| D7 | Old admin dropped. A **new admin UI** in a new repo, which also hosts the other server integrations over time. | Settled |
| D8 | Storybook stays with the design system (app repo) | Settled |
| D9 | Free/freemium first; minimum number of vendors | Settled |
| D10 | Supabase as core, Mercur/Stream parked (§0) | **Revised today, needs your confirmation** |

---

## 2. Final stack

| # | Service | Job | Free tier | Paid when |
|---|---|---|---|---|
| 1 | **Supabase** | Auth, all data, storage (images), realtime (chat, notifications), Edge Functions (webhooks), cron/queues | Free: 50K monthly users, 500 MB database, 1 GB storage, **pauses after 7 days of inactivity** | **Pro $25/month** at go-live |
| 2 | **Razorpay (+ Route)** | Checkout, deposits, refunds, seller KYC, split payouts, invoices | No monthly fee | A fee on every transaction |
| 3 | **Firebase (Spark)** | FCM, GA4, Crashlytics, Remote Config · plus Search Console | Free (FCM and Crashlytics no-cost at any scale) | — |
| 4 | **Resend** | Transactional email | Free tier (check the limit) | Volume |
| 5 | **Embeds** (YouTube, Instagram, Spotify, SoundCloud) | Reels, music, video | Free | — |
| 6 | **Capacitor** | Android | Free | Play developer account, $25 one-time |
| Later | Shiprocket · HyperVerge/Cashfree · Google Calendar · WhatsApp · Sentry · (Stream, Mercur if needed) | Shipping · identity checks · calendar sync · reminders · web errors | Pay per use / free tier | Only when needed |

**Dropped:** Directus, Zoho, Algolia, Cloudinary, Mux, PostHog, Contentful/Strapi/Sanity for the catalogue, Sharetribe, the separate Node server (for now).

**Running cost at launch:** Supabase Pro $25/month. Everything else is ₹0 until money moves.

---

## 3. Repos & structure

```
musiclinkd-9e6ca875     ← app (Lovable-synced) · web + Capacitor · Storybook
  src/routes/            flat, dot-named (unchanged rule)
  src/features/<module>/ components · server functions · types   ← reorg target
  src/integrations/      razorpay · firebase · resend · embeds    ← client-side adapters only
  supabase/migrations/   all schema changes
  supabase/functions/    Edge Functions: razorpay-webhook, send-push, send-email, jobs

musiclinkd-admin (new)  ← new admin UI, reads/writes Supabase server-side only
                          grows into the home for any server integration that
                          outgrows Edge Functions

musiclinkd (old)        ← archive read-only after salvaging models + admin function list
```

Rules: no secrets in the app · webhooks verify the signature, dedupe on event ID, then queue · admin never uses client-side service-role keys · the app never imports admin code.

---

## 4. Integration map: function → module → routes

### Razorpay

| Function | Module | App routes | Server side |
|---|---|---|---|
| Checkout (UPI / card) + pending / success / failed states | Booking, Marketplace | `booking.$id.*` (schedule → addons → details → review → pay), `booking.confirmed.$ref`, `marketplace/l.$id`, `marketplace/rent/*` | Edge: create order, verify signature, `payment.captured` webhook |
| Deposits (rental, booking) | Rental, Booking | `marketplace/rent/*`, `booking.$id.review` | Hold → release/keep job |
| Refunds | Orders & bookings | `bookings.index`, `business.bookings.$ref` | Refund API + webhook |
| Seller KYC + split payouts (Route) | Business, Marketplace sell | `marketplace/sell`, `business.*` (earnings) | Linked accounts, transfers, hold/release |
| GST invoices | Orders & bookings | booking/order detail | Invoice generation |
| Pro subscriptions (later) | Plans | `plans` routes | Subscriptions API |

### FCM (push) · already partly built

| Function | Module | App routes | Server side |
|---|---|---|---|
| Permission, token registration (`push_tokens`) | App-wide | first run, `notifications.settings` | — |
| Delivery + deep links | Notifications | `notifications.index`, every target route | Edge `send-push`, triggered by `notifications` inserts |
| Batched social pushes (likes, follows) | Feed, Profiles | `feed`, `discover.*` | Digest job |

### Resend (email)

| Function | Module | App routes | Server side |
|---|---|---|---|
| Receipts, booking confirmations, reminders, verification results, review requests | Booking, Marketplace, Verification, Reviews | `notifications.settings` (preferences) | Edge `send-email` from the outbox |

### GA4 + Crashlytics + Remote Config

| Function | Module | Where |
|---|---|---|
| Event tracking plan + funnels (view → save → enquire/book → pay → complete) | App-wide | Every route |
| Crash reporting | Android shell | Capacitor plugin |
| Banners, feature flags, personalisation slots | Home, Discover, Marketplace | `home`, `discover.index`, `marketplace/index` |

### Supabase (existing, to harden, not replace)

| Function | Tables | App routes |
|---|---|---|
| Sale/rent listings + offers | `marketplace_listings`, `marketplace_offers` | `marketplace/*` |
| Rentals (no double-booking) | `rental_bookings` | `marketplace/rent/*` |
| Studio / service bookings, requests → quotes | `booking_requests`, `studio_rooms`, `studio_blocks`, `profile_service_packages` | `booking.$id.*`, `business.bookings.*`, `services.*`, `studio` |
| Reviews (verified, two-way) | `reviews`, `review_requests` | `reviews.*`, `business.$id.reviews` |
| Saves + alerts | `saved_items`, `saved_searches` | `saved`, `marketplace/saved`, `opportunities.saved` |
| Chat | `conversations`, `conversation_members`, `messages` | `messages`, `conversation` |
| Feed + follows | `feed_posts`, `follows` | `feed`, `discover.*` |
| Verification | `verification_*` | `verification.*`, `business.$id.verification` |
| Profiles, bands, businesses | `profiles`, `profile_*`, `bands`, `band_members` | `identity.*`, `profile.*`, `bands.*`, `business.*` |
| Content / banners | `cms_pages`, `cms_categories` | `help.*`, `legal.*` |
| Reports / moderation | `reports`, `support_requests` | `reviews.$id.report`, `contact`, `help.*` |

### Embeds

| Function | Where |
|---|---|
| Link → thumbnail + metadata (`link-preview.functions.ts` exists) → tap to play | `portfolio.*`, `feed`, `discover.music`, `discover.projects`, profiles |
| Dead-link check job | Edge / cron |

---

## 5. What needs to be done, why, and the impact

| # | Work | Why | Impact |
|---|---|---|---|
| **P0.1** | **Verify which migrations are applied live** and correct AGENTS.md | The docs say 2 tables are live and the repo defines ~75. Every plan depends on which is true. | Unblocks everything. Low effort. |
| **P0.2** | **Apply the visibility RLS migration** | `profiles.visibility` isn't enforced, so private profiles are public | Trust/privacy fix. Needed before more profile types. |
| **P0.3** | **Decide on the Capacitor thin wrapper vs static bundle** | The current config is a thin wrapper, which risks Play rejection | Changes Android release timing |
| **P1** | **Stabilise:** make every route reachable, disable dead controls, stop fake data looking real, add the missing loading/empty/error/offline states, fix home/onboarding routing | What makes the product feel broken today. No vendor fixes it. | **Biggest perceived-quality gain.** UX-heavy, no new vendors. |
| **P2** | **Server foundation:** outbox table, `webhook_events` (dedupe), `audit_log`, money ledger (in paise), idempotency keys, state machines enforced server-side for orders/rentals/bookings | Payments and bookings can't be trusted without it | Invisible to users. Prevents money bugs. |
| **P3** | **Razorpay:** checkout, capture webhook, deposits, refunds, then Route (KYC + payouts), then invoices | Real transactions: the commercial Phase 2 engine | New UX states: payment pending/failed, KYC step, hold timers |
| **P4** | **Notifications:** wire `notifications` → FCM + Resend via the outbox, with preferences | Engagement + booking reliability (reminders) | Moderate UI: settings, prompts |
| **P5** | **Module hardening,** one at a time, deleting mock paths as each goes real: marketplace sell → rent (double-booking constraint) → bookings (request → quote, instant book, reschedule, no-show) → reviews (verified, two-way, double-blind) → saves/alerts | Turns vibe-coded screens into working flows | Per-module UX changes; your design pass follows each |
| **P6** | **Feed + media:** wire `feed_posts`/`follows`, reactions, comments, embeds thumbnail-first, mixed Discover with rules-based ranking, attached actions (book / hire / gear used) | Engagement loop, currently unwired (0 queries) | New UI: reaction set, cards, feed rhythm (your design) |
| **P7** | **Profile type system:** type registry, field definitions, capabilities, memberships | Profile types keep growing; code branches on type names | Adding a type becomes config, not code |
| **P8** | **New admin (new repo):** moderation, verification queue, bookings/orders overrides, payouts view, profile types, banners/CMS, reports | Ops can't run the marketplace without it | Separate app; Mercur-style ready-made admin not used, so it's built |
| **P9** | **App reorg** into `src/features/*` + `src/integrations/*` on a branch, then merged via the AGENTS.md safe loop | Stops cross-module leakage; makes vendor swaps one-folder changes | Invisible to users. Enables P5–P7. |
| **P10** | **Android release:** App Links, native Google sign-in, Crashlytics, UPI app switch, Play listing | Distribution | Depends on P0.3 |

**Order:** P0 → P1 → P2 → P3 → P4 → P5 (per module) → P6/P7 → P8 alongside P5 → P10. P9 runs in slices during P1–P5.

---

## 6. Impact summary

| Area | Impact | Detail |
|---|---|---|
| **Product** | Medium | Direction unchanged. Forced decisions: verified-only two-way reviews, commission as config per mode (studio 5–8%, rental ~10%, gig ~10%, digital ~12%), seller KYC before payouts, embed-only media. Keeping Supabase avoids the product-model constraints Mercur would have imposed. |
| **UX** | High in commerce, low elsewhere | Real states replace fake success: payment pending/failed, holds, quotes, KYC, reschedule/no-show, review timing. P1 is the largest UX gain. |
| **UI** | Low to medium | Your screens stay yours; no vendor UI except the Razorpay checkout sheet. New components: state pills, pending/failed, hold timers, quote cards, KYC steps, review dimensions, alert toggles, profile switcher, reaction bar. |
| **Cost** | Low | Supabase Pro $25/month + Razorpay per-transaction fees |
| **Effort** | Medium, spread over time | Mostly hardening existing code instead of migrating to new engines |

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| Migrations not applied live, so the schema and code don't match production | P0.1 first |
| Thin-wrapper Android gets rejected by Play | P0.3 decision; static bundle + live updates if needed |
| Supabase free tier pauses | Pro at go-live |
| Money bugs (double charge, wrong payout) | P2 ledger + idempotency + webhook dedupe + daily reconciliation |
| The Supabase build outgrows itself (multi-seller tax, chat scale) | Mercur / Stream remain parked options |
| GST obligations (TCS s.52, TDS s.194-O) | Confirm with your CA before P3 invoices |

---

## 8. Open decisions (yours)

1. Confirm D10: Supabase core, Mercur/Stream parked.
2. Capacitor: keep the thin wrapper, or move to a static bundle + live updates?
3. Is the Supabase project your own or Lovable Cloud? (It decides direct database access and admin connectivity.)
4. Admin stack for the new repo: same stack as the app (TanStack Start) to share the design system, or something else?
5. GST model: does the platform invoice on sellers' behalf? (Check with your CA.)
6. Phase 2 v1 scope: sell + rent + book, with digital in Phase 3?

---

## 9. Supersedes

- The **Marketplace End-to-End Spec (25 Sep)**, where it assumes a new schema or Mercur. Its state machines, rules and component list still apply, mapped onto the existing tables.
- The earlier chat recommendations of Mercur/Medusa as the core, Stream as default chat/feed, a Medusa Node server, and a `musiclinkd-platform` repo name. Now: a `musiclinkd-admin` repo + Supabase Edge Functions.
