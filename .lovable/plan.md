# Finishing pass: brand, media, business accounts, hiring posts, full audit

The work runs in waves. Each wave ends with checks that actually run (code checks, build, phone-size screenshots, signed-in tap tests). Anything that can't be checked is named in the reply.

## Wave 1 — Grounds, brand and type (whole app)
- Three backgrounds, modelled on Lovable:
  - **Auth ground:** warm light grey, for the sign-in screens.
  - **Content ground:** the page behind the main screens.
  - **Raised surface:** white, for cards, sheets and menus.
- Each becomes its own colour setting, so every screen uses one of the three. Exact values are measured from lovable.dev before they are set.
- Apply the new logo, Inter type scale and ink/pink rules to Home, Discover, Portfolio, Market, Profile and Settings. Reviewed card by card at phone width.
- Banners on the main Market page: the same dark branded banner as the category pages, with real listing counts only.
- Restyle the conversation list and conversation screen in the flat drawer style.

## Wave 2 — Real people, real media
- Profiles without a photo show clear initials, never a broken image or a placeholder face.
- Stock photos from Unsplash fill empty states and banners only. They are never shown as a member's own profile picture or work: that would be fake content.
- Business profiles: edit profile asks for the business name instead of first and last name. The other screens that show a name get the same check.

## Wave 3 — Business accounts and hiring posts
- Business accounts use the business account type that exists today; nothing new is added unless the check finds a gap.
- A hiring post page lets anyone post a job: role, city, dates, pay and details. It saves through the existing opportunities system, so posts show up in Opportunities and in matching. It links back to the match page.
- The "Describe a hiring need" card on business Home shows real open hiring posts as well as people.
- One real hiring post is created through the app's own form, by a real signed-in account, to prove the flow end to end. It is not seeded from code.

## Wave 4 — Android features
- Use what the native app already includes: the back button (done), share sheet, haptics on press, status bar colour, and the camera or gallery for profile photos.
- Phone notifications through Firebase, only if the app's notification set-up checks out. Otherwise they are listed as blocked.

## Wave 5 — Fix tap testing, then verify everything
- Find out why the test preview never makes buttons work. Fall back to testing a production build locally, signed in as a talent account and as a business account.
- Tap through every bottom menu, Profile, Settings, Portfolio, the match form (type a need, see results, open a profile and an opportunity), the business Home card, and the back gesture with a menu open.

## Wave 6 — Audit every module and user type
- Covers onboarding, profile, edit profile, bookings, messages, notifications, opportunities, collaborations, bands, Market, rentals, verification, reviews, Home and Discover.
- Covers talent and business accounts.
- Re-read the earlier Home and Discover briefs and fix the gaps.
- Search past chats for unfinished work and fix it, or list it.
- Each issue found is fixed in the same wave. The final reply lists anything still blocked.

## Technical details
- Grounds: a token for each of the three grounds in `src/styles.css`. The current `--auth-ground` is kept, and `Screen`, `Card` and `Sheet` are mapped onto the tokens.
- Business name: a check on `profiles.account_type` or the business type in edit profile and the onboarding identity step, with the form fields chosen by type rather than by display text.
- Hiring posts: a new route that writes through the existing opportunity server functions. `findAiMatches` keeps returning opportunities when `intent=hire`, and the match page shows them.
- No new tables. If one turns out to be needed, a migration plan comes to you first, as the project rules require.
- Native features: the Capacitor plugins already installed are used first. Any new plugin is noted in the reply.
- Testing: run `vite build` and `vite preview` on another port for Playwright, with sessions created through `lovable auth-session`.
