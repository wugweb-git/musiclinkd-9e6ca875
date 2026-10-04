# MusicLinkd finishing pass — complete and verify Waves A–E

The attached note is a record of earlier promises and checks, not proof that they still work. Keep the existing app, real account data, five-tab navigation, and MusicLinkd brand rules. Do not invent members, jobs, messages, views, ratings, or profile photos. Work in phone-sized views first, then check larger screens.

## Wave A — Inbox and conversations
- Validate the already-built Inbox banner, unread indicator, conversation list, message thread, optimistic send, older-message loading, keyboard-safe composer, and back navigation. Fix failures rather than duplicating Inbox and Conversations as competing destinations.
- Align both screens and every relevant bottom sheet with the flat grouped-row style; use meaningful icons, clear edit/delete/draft actions, initials when a member lacks a photo, and proper loading, empty, offline, send-failure and retry states.
- Verify a signed-in member can open a thread, load older messages without a scroll jump, send and read back a reply, and navigate back. Check freshness when a message arrives from another account; choose an appropriate update mechanism only if the existing one is inadequate.

## Wave B — Hiring and full professional profiles
- Check that a hiring brief can match real talent, eligible business profiles, and open opportunities. Every result must open its full page and show only contact methods the owner has made public; messaging must respect existing access rules.
- Validate Home's business hiring entry, the existing multi-step opportunity posting form, draft/publish errors, and return path to matching. A job must not be fabricated or posted on another member's behalf: use a genuine owner-provided need, or test creation with clearly identified disposable test data and remove it after verification. The user's “LinkedIn style” answer guides the layout, not the facts of a real vacancy.
- Type an actual brief in the app, inspect the real results, open a profile and an opportunity, and confirm a genuinely posted job appears in matching. Report any missing business test account or lack of suitable real post as a blocker, not a successful test.

## Wave C — Mobile UI and flow corrections
- Screen-by-screen review of onboarding, edit profile, bookings, scheduling, booking messages, Academy, Portfolio Add work, Profile and Settings. Reconcile the three existing grounds, typography, branded Market banners and cards, safe areas, icon-labelled inputs, clear primary actions, animation/reduced-motion, and 48px tap areas.
- Simplify the owner profile: remove the redundant Overview tab, keep substantive sections reachable, and reduce duplicate Edit actions to one obvious primary entry plus contextual section editing where useful. Preserve public profile links, sharing and privacy.
- Use the supplied Lovable links as layout references only where their actual screens can be accessed; do not claim private views were inspected. Adapt reference patterns for saved items/history, analytics, QR/share, schedules, creation forms and stacked user content without copying unrelated Lovable product controls or inventing statistics.
- Ensure category banners show verified live listing counts, including zero and failed-count states. Empty-state stock photography may be used for editorial imagery, never to impersonate a member; use a member's own portfolio photos only where the existing permissions and real records allow.

## Wave D — Android and full-flow audit
- Check native share, press feedback, status bar and camera/gallery capture for Portfolio work and profile imagery; use existing plugins where possible. Wire message notifications only after checking registration, permission timing, token ownership, foreground behavior and delivery setup. Match notifications require a real match event and opt-in policy; do not promise pushes from a mere search result.
- Audit every route and major workflow for both talent and business: auth/onboarding, Home, Discover, search/saved/history, identity/QR, profiles/edit, portfolio, service creation, bookings/schedule/messages, opportunities/applications/hiring, Market/rentals, collaborations/bands, verification/reviews, notifications, settings, Academy/help and analytics. Fix dead links, duplicate actions, missing icons, bad role handoffs, stale data, misleading counts, inaccessible controls, and absent loading/empty/offline/error/retry states.
- Reconcile the earlier Home and Discover briefs and the supplied historical note against code and actual screens. Preserve active documentation; remove only demonstrably unused files if found, not live specifications or project rules.

## Wave E — Verify, then publish
- Diagnose the current preview's failed interactive-script load before accepting tap tests. Verify on the running preview with signed-in talent and business sessions at 412px: bottom drawers open/close/back and each existing action, Profile/Edit/Share, Settings, Portfolio/Add work/photo, Inbox/thread/reply, booking messages, onboarding handoff, hiring post and match result. Compare changed views to the currently published version. Check mobile overflow, keyboard behavior and reduced motion.
- Run focused tests and project checks; inspect the latest build/runtime errors. Validate each Market category count against live eligible listings with the same filters/visibility rules, not just the length of a possibly partial page.
- Publish only after blocking checks pass; then re-test the live phone-sized app and ask the owner to confirm the actual Android back gesture with the menu open. A browser simulation is not proof of native Android behavior. List every remaining blocked/unverified item explicitly.

## Technical boundaries
- Reuse existing route, UI and server-function patterns; keep account access and private contact details enforced server-side. Do not create a new table/bucket or rename either without the owner's separate approval. Do not seed a fake hiring post into live data.
- Existing code already contains an Inbox banner, optimistic/paginated conversation flow, an opportunity posting form, linked match results, three background tokens, branded Market banners, and native push-registration helpers. These are starting points to **validate**, not tasks to claim complete without signed-in interaction checks. Current preview telemetry reports a failed dynamically imported client script; fix or isolate that first.
