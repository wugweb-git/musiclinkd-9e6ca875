# Screen inventory — Lovable app (app.musiclinkd.com)

Every route file under `src/routes`, what it is, who reaches it, from where, and why it exists.
Source of truth: the route tree in this repo, 25 Sep 2026. 181 route files.

The **Open** column launches each screen on the local dev server at `http://localhost:8080`. Start it first:

```bash
bun run dev
```

Routes with a `$param` show **—**: they need a real id, so reach them from the listing screen above them in the table.

Cohort column: **T** = talent (a human account), **B** = business account, **Both**, **Out** = signed-out / public.

---

## 1. Entry, auth, account

| Route | Screen | Who | Entered from | Why | Open |
| --- | --- | --- | --- | --- | --- |
| `/` | Router shim — sends to Welcome, onboarding or Home depending on session state | Both | App launch, cold URL | One entry point decides where a person actually belongs | [Open](http://localhost:8080) |
| `/welcome` | Welcome — opens on Sign In, Google + LinkedIn, sign-up one tap away | Out | `/` when no session | First screen for anyone without a session | [Open](http://localhost:8080/welcome) |
| `/auth` | Sign in with email | Out | Welcome → email | Fallback for people who don't use Google/LinkedIn | [Open](http://localhost:8080/auth) |
| `/auth/phone` | Sign in with mobile | Out | Welcome / `/auth` | Phone-first sign-in | [Open](http://localhost:8080/auth/phone) |
| `/auth/otp` | Verify your number | Out | `/auth/phone` | Confirms the mobile number | [Open](http://localhost:8080/auth/otp) |
| `/auth/verify-email` | Check your email | Out | Email sign-up | Tells the person the link is sent and to go read mail | [Open](http://localhost:8080/auth/verify-email) |
| `/auth/forgot` | Reset link dispatched | Out | Sign in → forgot | Password recovery hand-off | [Open](http://localhost:8080/auth/forgot) |
| `/reset-password` | Password updated | Out | Reset link in email | Closes the recovery loop | [Open](http://localhost:8080/reset-password) |
| `/auth/locked` | Sign-in paused 15 minutes | Out | Too many failed attempts | Rate-limit explained instead of a silent failure | [Open](http://localhost:8080/auth/locked) |
| `/auth/maintenance` | Back in a few minutes | Out | Auth backend down | Planned downtime | [Open](http://localhost:8080/auth/maintenance) |
| `/auth/offline` | No connection | Out | Auth attempt with no network | Distinguishes "you're offline" from "wrong password" | [Open](http://localhost:8080/auth/offline) |
| `/auth/success` | Redirect to `/` | Both | OAuth callback | Silent bounce after a provider returns | [Open](http://localhost:8080/auth/success) |
| `/auth/signout` | Sign out of MusicLinkd? | Both | Settings → sign out | Confirm before dropping the session | [Open](http://localhost:8080/auth/signout) |
| `/accounts` | Switch account | Both | Avatar menu | One login can hold talent + a business page; this is where the business journey starts | [Open](http://localhost:8080/accounts) |
| `/dev/new-user` | Test account creator | — | Direct URL, dev only | Spin a fresh account to walk a cohort journey | [Open](http://localhost:8080/dev/new-user) |
| `/.lovable/oauth/consent` | Connect an app | Both | Third-party OAuth | Lovable platform consent screen | [Open](http://localhost:8080/.lovable/oauth/consent) |

## 2. Onboarding

| Route | Screen | Who | Entered from | Why | Open |
| --- | --- | --- | --- | --- | --- |
| `/onboarding` | Person type + journey start | Both | First sign-in | Picking talent vs business locks the journey — no switching later | [Open](http://localhost:8080/onboarding) |
| `/onboarding/step/$id` | One onboarding question per screen | Both | Sequential from `/onboarding` | Required details, one at a time, resumable | — |
| `/onboarding/preview` | Review profile | Both | Last step | See the profile before it goes live | [Open](http://localhost:8080/onboarding/preview) |
| `/onboarding/complete` | Profile published | Both | Preview → publish | Confirms the profile exists | [Open](http://localhost:8080/onboarding/complete) |
| `/onboarding/done` | Welcome to MusicLinkd | Both | After complete | Hands over to Home with a first action | [Open](http://localhost:8080/onboarding/done) |
| `/onboarding/skip` | We've saved your progress | Both | Skip on any step | Leaving mid-way doesn't lose the answers | [Open](http://localhost:8080/onboarding/skip) |
| `/onboarding/resume` | Resume where you left | Both | Returning with a part-done profile | Picks the next unanswered step | [Open](http://localhost:8080/onboarding/resume) |

## 3. Home, discovery, search

| Route | Screen | Who | Entered from | Why | Open |
| --- | --- | --- | --- | --- | --- |
| `/home` | Home | Both | Tab bar | The signed-in landing surface | [Open](http://localhost:8080/home) |
| `/discover` | Discover | Both | Tab bar | Browse everything that isn't a direct search | [Open](http://localhost:8080/discover) |
| `/discover/music` | Music | Both | Discover tab | Music-led browsing | [Open](http://localhost:8080/discover/music) |
| `/discover/community` | Community | Both | Discover tab | People-led browsing | [Open](http://localhost:8080/discover/community) |
| `/discover/projects` | Projects | Both | Discover tab | Collabs and projects to join | [Open](http://localhost:8080/discover/projects) |
| `/discover/nearby` | Nearby | Both | Discover tab | Location-led browsing (India-only) | [Open](http://localhost:8080/discover/nearby) |
| `/feed` | → `/discover` | Both | Legacy links | Old name kept working | [Open](http://localhost:8080/feed) |
| `/search` | Search | Both | Search icon, any header | Cross-entity search | [Open](http://localhost:8080/search) |
| `/search/history` | Search history | Both | Search field | Re-run a past search | [Open](http://localhost:8080/search/history) |
| `/search/why/$id` | Why am I seeing this | Both | Result overflow menu | Explains a ranked result | — |
| `/categories` | Browse categories | Both | Discover / Search empty state | Taxonomy as a browsable list | [Open](http://localhost:8080/categories) |
| `/categories/$slug` | One category | Both | Categories list, deep links | Landing page per taxonomy term | — |
| `/singers` | → `/categories/singers` | Out | Legacy / marketing links | Old vanity URL | [Open](http://localhost:8080/singers) |
| `/studio` | Studios | Both | Discover, marketing links | Studio-type businesses as a browsable list | [Open](http://localhost:8080/studio) |
| `/recommendations/swipe` | Swipe recommendations | Both | Home card, Discover | Fast accept/skip triage of suggestions | [Open](http://localhost:8080/recommendations/swipe) |
| `/recommendations/settings` | Discovery settings | Both | Swipe screen | Tune what gets recommended | [Open](http://localhost:8080/recommendations/settings) |
| `/recommended` | → `/recommendations/swipe` | Both | Legacy links | Old name kept working | [Open](http://localhost:8080/recommended) |
| `/recently-viewed` | Recently viewed | Both | Profile / Saved | Get back to something seen earlier | [Open](http://localhost:8080/recently-viewed) |
| `/saved` | Saved profiles | Both | Profile menu | People kept for later | [Open](http://localhost:8080/saved) |

## 4. Profile and portfolio (talent)

| Route | Screen | Who | Entered from | Why | Open |
| --- | --- | --- | --- | --- | --- |
| `/profile` | Your profile | T | Tab bar | The person's own profile as others see it | [Open](http://localhost:8080/profile) |
| `/profile/$username` | Someone's profile | Both | Search, Discover, links | Public talent profile | — |
| `/$handle` | Vanity handle → profile | Out | Shared links, QR | Short public URL | — |
| `/talent/$id` | → `/profile/$username` | Both | Legacy links | Old id-based URL | — |
| `/me` | → `/profile` | Both | Legacy links | Old name kept working | [Open](http://localhost:8080/me) |
| `/profile/edit` | Edit profile | T | Own profile | Change headline, bio, fields | [Open](http://localhost:8080/profile/edit) |
| `/profile/insights` | Profile insights | T | Own profile | Who's looking, and from where | [Open](http://localhost:8080/profile/insights) |
| `/portfolio` | Your portfolio | T | Profile, tab bar | Every talent account always has a portfolio | [Open](http://localhost:8080/portfolio) |
| `/portfolio/new` | Step 1 of 3 — choose a type | T | Portfolio → add | Pick what kind of work is being added | [Open](http://localhost:8080/portfolio/new) |
| `/portfolio/new/$kind` | Step 2 of 3 — details | T | Step 1 | Type-specific fields | — |
| `/portfolio/$id` | One piece of work | Both | Portfolio, profile, search | Public view of a work item | — |
| `/portfolio/$id/edit` | Edit work | T | Own work item | Change or remove a piece | — |
| `/portfolio/analytics` | Portfolio performance | T | Portfolio header | How the work is performing | [Open](http://localhost:8080/portfolio/analytics) |

## 5. Bands and collabs

| Route | Screen | Who | Entered from | Why | Open |
| --- | --- | --- | --- | --- | --- |
| `/bands` | Bands | Both | Discover, profile | A band is a group of talent; this lists them | [Open](http://localhost:8080/bands) |
| `/bands/new` | Create a band | T | Bands, profile | Start a band page | [Open](http://localhost:8080/bands/new) |
| `/bands/$id` | Band | Both | Bands list, links | Public band page | — |
| `/bands/$id/portfolio` | Band portfolio | Both | Band page | The band's work | — |
| `/bands/$id/events` | Shows | Both | Band page | Where the band is playing | — |
| `/bands/$id/contact` | Contact band | Both | Band page | Reach the band without a booking | — |
| `/bands/$id/manage` | Manage band | T (owner) | Band page | Edit the band, members, details | — |
| `/bands/$id/invite` | Invite members | T (owner) | Manage band | Bring talent into the band | — |
| `/band` | → `/bands` | Both | Legacy links | Old name kept working | [Open](http://localhost:8080/band) |
| `/collab` | Collaborations | Both | Discover, profile | Collab is the parent; a band is one collab type | [Open](http://localhost:8080/collab) |
| `/collab/new` | What kind of collab | T | Collaborations | Choose the collab type to start | [Open](http://localhost:8080/collab/new) |
| `/collab/$id` | Collaboration | Both | List, links | The collab page | — |
| `/collab/join/$token` | Join a collab | Both | Invite link | Accept an invitation | — |

## 6. Opportunities

| Route | Screen | Who | Entered from | Why | Open |
| --- | --- | --- | --- | --- | --- |
| `/opportunities` | Opportunities | Both | Tab bar | The gig board | [Open](http://localhost:8080/opportunities) |
| `/opportunities/search` | Search opportunities | Both | Opportunities header | Filtered search of the board | [Open](http://localhost:8080/opportunities/search) |
| `/opportunities/saved` | Saved | T | Opportunities header | Gigs kept for later | [Open](http://localhost:8080/opportunities/saved) |
| `/opportunities/$id` | Opportunity | Both | Board, search, links | The public gig post | — |
| `/opportunities/$id/apply` | Apply | T | Opportunity | Send an application | — |
| `/opportunities/applications` | My applications | T | Opportunities header | Everything applied for | [Open](http://localhost:8080/opportunities/applications) |
| `/opportunities/applications/$aid` | Your application | T | My applications | One application and its status | — |
| `/opportunities/new` | Post an opportunity | Both | Opportunities header | Create a gig | [Open](http://localhost:8080/opportunities/new) |
| `/opportunities/mine` | My opportunities | Both | Opportunities header | Posts owned by this account | [Open](http://localhost:8080/opportunities/mine) |
| `/opportunities/$id/manage` | Manage opportunity | Owner | My opportunities | Edit, close, repost | — |
| `/opportunities/$id/applicants` | Applicants | Owner | Manage | Everyone who applied | — |
| `/opportunities/$id/applicants/$aid` | Applicant | Owner | Applicants list | One applicant, with a decision | — |
| `/opportunities/$id/analytics` | Performance | Owner | Manage | Views and applications for the post | — |

## 7. Services and booking (talent side)

| Route | Screen | Who | Entered from | Why | Open |
| --- | --- | --- | --- | --- | --- |
| `/services` | Services | Both | Profile, business page | What an account can be booked for | [Open](http://localhost:8080/services) |
| `/services/new` | Add / edit service | Both | Services | Create a bookable service | [Open](http://localhost:8080/services/new) |
| `/services/$id` | Service | Both | Services list, profile | Public service page | — |
| `/services/$id/manage` | Manage service | Owner | Service page | Edit pricing, rules, availability | — |
| `/services/$id/enquiry` | Service enquiry | Both | Service page | Ask before booking | — |
| `/services/availability` | Availability | Owner | Services | When the services can be booked | [Open](http://localhost:8080/services/availability) |
| `/services/conflicts` | Conflicts | Owner | Availability | Overlapping commitments to resolve | [Open](http://localhost:8080/services/conflicts) |
| `/booking/$id` | Booking wrapper | Both | Book button anywhere | Holds the booking steps | — |
| `/booking/$id/service` | What do you want to book? | Both | Book | Book always picks a service first | — |
| `/booking/$id/schedule` | Availability | Both | Step 1 | Choose date and time | — |
| `/booking/$id/details` | Session details | Both | Step 2 | Brief, headcount, location | — |
| `/booking/$id/addons` | Equipment & add-ons | Both | Step 3 | Studio services link amenities and equipment | — |
| `/booking/$id/review` | Review booking | Both | Step 4 | Last look before sending | — |
| `/booking/confirmed/$ref` | Confirmed / ask for another time | Both | Review → send | Outcome, plus reschedule ask | — |
| `/bookings` | My bookings | Both | Tab bar, profile | Everything booked, as the customer | [Open](http://localhost:8080/bookings) |

## 8. Business account

| Route | Screen | Who | Entered from | Why | Open |
| --- | --- | --- | --- | --- | --- |
| `/business` | Businesses | Both | Discover, search | Browse business pages | [Open](http://localhost:8080/business) |
| `/business/new` | Create a business page | B | Switch account | One login owns one business page | [Open](http://localhost:8080/business/new) |
| `/business/$id` | Business page | Both | Search, links | The public business page | — |
| `/business/$id/dashboard` | Dashboard | B | Switch account | The business landing surface | — |
| `/business/$id/manage` | Manage | B | Dashboard | Edit the page | — |
| `/business/$id/services` | Services | Both | Business page | What this business offers | — |
| `/business/$id/portfolio` | Portfolio | Both | Business page | The business's work | — |
| `/business/$id/team` | Team | Both | Business page | Who works there | — |
| `/business/$id/reviews` | Reviews | Both | Business page | Review rail for the business | — |
| `/business/$id/availability` | Availability | B | Manage | When the business takes work | — |
| `/business/$id/enquiry` | Enquiry | Both | Business page | Enquire without booking | — |
| `/business/$id/leads` | Leads | B | Dashboard | Enquiries not yet bookings | — |
| `/business/$id/analytics` | Analytics | B | Dashboard | Page and booking performance | — |
| `/business/$id/verification` | Verification | B | Dashboard | Business verification state | — |
| `/business/policies` | Policies | B | Manage | Cancellation and house rules | [Open](http://localhost:8080/business/policies) |
| `/business/pricing` | Pricing | B | Manage | Rate card | [Open](http://localhost:8080/business/pricing) |
| `/business/availability` | Availability | B | Dashboard | Account-level calendar | [Open](http://localhost:8080/business/availability) |
| `/business/leads` | Leads | B | Dashboard | Account-level lead list | [Open](http://localhost:8080/business/leads) |
| `/business/bookings` | Provider workspace | B | Dashboard | Everything booked, as the provider | [Open](http://localhost:8080/business/bookings) |
| `/business/bookings/calendar` | Calendar | B | Provider workspace | Bookings on a calendar | [Open](http://localhost:8080/business/bookings/calendar) |
| `/business/bookings/$ref` | Session | B | Provider workspace | One confirmed booking | — |
| `/business/bookings/requests` | Requests | B | Provider workspace | Incoming asks awaiting a decision | [Open](http://localhost:8080/business/bookings/requests) |
| `/business/bookings/requests/$ref` | Request | B | Requests list | Accept, decline or propose a time | — |

## 9. Marketplace (one marketplace — instruments and equipment, sell + rent)

| Route | Screen | Who | Entered from | Why | Open |
| --- | --- | --- | --- | --- | --- |
| `/marketplace` | Market | Both | Tab bar | Sell and rent are one flow, split by a view toggle | [Open](http://localhost:8080/marketplace) |
| `/marketplace/search` | Search | Both | Market header | Filtered search of listings | [Open](http://localhost:8080/marketplace/search) |
| `/marketplace/nearby` | Nearby | Both | Market | Location-led listings | [Open](http://localhost:8080/marketplace/nearby) |
| `/marketplace/c/$slug` | Category | Both | Market | Categories come from the taxonomy | — |
| `/marketplace/l/$id` | Listing | Both | Market, search, links | One item for sale | — |
| `/marketplace/seller/$id` | Seller | Both | Listing | Who is selling | — |
| `/marketplace/saved` | Saved | Both | Market header | Listings kept for later | [Open](http://localhost:8080/marketplace/saved) |
| `/marketplace/sell` | List an item | Both | Market | Create a sale listing | [Open](http://localhost:8080/marketplace/sell) |
| `/marketplace/mine` | My listings | Both | Market header | The seller screen | [Open](http://localhost:8080/marketplace/mine) |
| `/marketplace/rent` | → `/marketplace?view=Rent` | Both | Legacy links | Rent folds into Market | [Open](http://localhost:8080/marketplace/rent) |
| `/marketplace/rent/search` | Rent search | Both | Market (Rent view) | Filtered search of rentals | [Open](http://localhost:8080/marketplace/rent/search) |
| `/marketplace/rent/nearby` | Rent nearby | Both | Market (Rent view) | Location-led rentals | [Open](http://localhost:8080/marketplace/rent/nearby) |
| `/marketplace/rent/c/$slug` | Rent category | Both | Market (Rent view) | Taxonomy within rent | — |
| `/marketplace/rent/e/$id` | Rental item | Both | Rent views, links | One item for rent | — |
| `/marketplace/rent/provider/$id` | Provider | Both | Rental item | Who is renting it out | — |
| `/marketplace/rent/saved` | Saved rentals | Both | Rent view | Kept for later | [Open](http://localhost:8080/marketplace/rent/saved) |
| `/marketplace/rent/list` | Rent something out | Both | Market | Create a rental listing | [Open](http://localhost:8080/marketplace/rent/list) |
| `/marketplace/rent/listings` | My rental listings | Both | Rent view | What this account rents out | [Open](http://localhost:8080/marketplace/rent/listings) |
| `/marketplace/rent/mine` | My rentals | Both | Rent view | What this account has rented | [Open](http://localhost:8080/marketplace/rent/mine) |
| `/marketplace/rent/request/$id` | Rental request | Both | Rental item | Ask to rent, and its status | — |
| `/marketplace/rent/active/$id` | Active rental | Both | My rentals | A rental in progress | — |

## 10. Messages, notifications, reviews

| Route | Screen | Who | Entered from | Why | Open |
| --- | --- | --- | --- | --- | --- |
| `/messages` | Messages | Both | Tab bar | Every thread | [Open](http://localhost:8080/messages) |
| `/conversation/$id` | Conversation | Both | Messages, contact buttons | One thread | — |
| `/notifications` | Notifications | Both | Bell icon | Activity across the app | [Open](http://localhost:8080/notifications) |
| `/notifications/settings` | Notification settings | Both | Notifications header | Choose what arrives | [Open](http://localhost:8080/notifications/settings) |
| `/reviews` | Reviews | Both | Profile, business page | Reviews are a horizontal rail — no replies, no stat strips | [Open](http://localhost:8080/reviews) |
| `/reviews/write/$id` | Write a review | Both | After a booking | Leave a review | — |
| `/reviews/$id/edit` | Edit review | Author | Own review | Change a review | — |
| `/reviews/$id/reply` | Reply | Subject | Review | Present in code, off in the reviews UI | — |
| `/reviews/$id/report` | Report review | Both | Review overflow | Flag a review | — |
| `/reviews/request` | Ask for a review | Both | Bookings, profile | Prompt a past client | [Open](http://localhost:8080/reviews/request) |

## 11. Identity / QR

| Route | Screen | Who | Entered from | Why | Open |
| --- | --- | --- | --- | --- | --- |
| `/identity/qr` | Your QR | T | Profile | Share the profile in person | [Open](http://localhost:8080/identity/qr) |
| `/identity/business` | Business QR | B | Business dashboard | Same, for a business page | [Open](http://localhost:8080/identity/business) |
| `/identity/scan` | Scan QR | Both | QR screen | Read someone else's code | [Open](http://localhost:8080/identity/scan) |
| `/identity/q/$code` | Scanned code | Both | Camera / link | Resolves a code to a person or business | — |
| `/identity/contact` | Digital card | Both | QR screen | The card a scan shows | [Open](http://localhost:8080/identity/contact) |
| `/identity/contact/save` | Save contact | Both | Digital card | Into the phone's contacts | [Open](http://localhost:8080/identity/contact/save) |
| `/identity/history` | Scanned QR history | Both | QR screen | Who was scanned, and when | [Open](http://localhost:8080/identity/history) |
| `/identity/analytics` | QR analytics | Both | QR screen | How often the code is used | [Open](http://localhost:8080/identity/analytics) |
| `/identity/print` | Print preview | Both | QR screen | A code for a flyer or case | [Open](http://localhost:8080/identity/print) |
| `/identity/settings` | QR & sharing | Both | QR screen | What the code exposes | [Open](http://localhost:8080/identity/settings) |

## 12. Verification

| Route | Screen | Who | Entered from | Why | Open |
| --- | --- | --- | --- | --- | --- |
| `/verification` | Verification | Both | Settings, profile | Current verification state | [Open](http://localhost:8080/verification) |
| `/verification/choose` | Get verified | Both | Verification | Pick what to verify | [Open](http://localhost:8080/verification/choose) |
| `/verification/$type` | Verify one thing | Both | Choose | The per-type flow | — |
| `/verification/badge` | Your badge | Both | Verification | What others see once verified | [Open](http://localhost:8080/verification/badge) |
| `/verification/privacy` | Document privacy | Both | Verify flow | What happens to uploaded documents | [Open](http://localhost:8080/verification/privacy) |

## 13. Settings, help, legal

| Route | Screen | Who | Entered from | Why | Open |
| --- | --- | --- | --- | --- | --- |
| `/settings` | Settings | Both | Profile menu | Settings index | [Open](http://localhost:8080/settings) |
| `/settings/account` | Account | Both | Settings | Email, phone, account basics | [Open](http://localhost:8080/settings/account) |
| `/settings/privacy` | Privacy | Both | Settings | What's visible to whom | [Open](http://localhost:8080/settings/privacy) |
| `/settings/security` | Security | Both | Settings | Sessions and password | [Open](http://localhost:8080/settings/security) |
| `/settings/security/2fa` | Two-step verification | Both | Security | Turn 2FA on | [Open](http://localhost:8080/settings/security/2fa) |
| `/settings/spotify` | Spotify | T | Settings | Connect a music account | [Open](http://localhost:8080/settings/spotify) |
| `/settings/delete-account` | Delete account | Both | Account | Leave for good | [Open](http://localhost:8080/settings/delete-account) |
| `/help` | Help & guides | Both | Settings, footer | Support index | [Open](http://localhost:8080/help) |
| `/help/category/$key` | Help category | Both | Help index | A group of articles | — |
| `/help/$slug` | Help article | Both | Category, search | One article | — |
| `/about` | About | Out | Footer | Marketing page | [Open](http://localhost:8080/about) |
| `/contact` | Contact | Out | Footer | Reach the company | [Open](http://localhost:8080/contact) |
| `/legal/terms` | Terms | Out | Footer, sign-up | Legal | [Open](http://localhost:8080/legal/terms) |
| `/legal/privacy` | Privacy policy | Out | Footer, sign-up | Legal | [Open](http://localhost:8080/legal/privacy) |
| `/legal/cookies` | Cookies | Out | Footer | Legal | [Open](http://localhost:8080/legal/cookies) |

---

## Notes

- **Redirect-only routes** (no UI of their own): `/`, `/me`, `/feed`, `/band`, `/singers`, `/recommended`, `/talent/$id`, `/auth/success`, `/marketplace/rent`. They exist so older links and old vocabulary keep working.
- **Payment screens are absent by design** — no checkout, billing, payout or plan routes.
- Booking always starts by picking a service; enquiry is the separate, non-committal path.
- Rent and sell are one marketplace; the `rent/*` routes are views inside it, not a second market.
