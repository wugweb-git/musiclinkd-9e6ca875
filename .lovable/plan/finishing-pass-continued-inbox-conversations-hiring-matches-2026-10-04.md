# Finishing pass, continued: inbox, conversations, hiring matches, audits, publish

This follows the approved six-wave plan. Done so far: the three backgrounds, business name in edit profile, the Market banner, and hiring posts in match results. Everything below is still open. Each wave ends with checks that actually run, and anything that can't be checked is named in the reply.

## Wave A — Inbox and conversations (new)
- Inbox, the conversation list and the conversation screen get the drawer's flat style: grouped white rows on the light grey page, 48px rows, an initials avatar when there's no photo, and a pink dot for unread.
- A pink-glow banner at the top of Inbox, like the Market banners. It shows real unread counts only, or nothing at all.
- Faster messages: the list and thread show what's already loaded straight away. A new message appears the moment you send it and is confirmed in the background. Older messages load as you scroll up, so long threads scroll smoothly.
- The reply box stays above the keyboard. Long threads open at the newest message.

## Wave B — Hiring matches open full profiles (new)
- Every person suggested on the hiring match page links to their full profile page. Business profiles are included as well as talent.
- The profile page shows the contact options that person has made public, such as message, website or socials. Private phone numbers and emails stay hidden unless the person chose to show them.
- Each opportunity opens its full page, which shows who posted it and has a Message button.

## Wave C — Audit against the new styling (new, alongside the earlier Wave 6)
- Onboarding, edit profile, bookings, booking messages and Academy are checked screen by screen at phone width against the new backgrounds, type, ink and pink rules. Mismatches are fixed.
- Each screen is compared with the published app so any changes are known.

## Wave D — Remaining earlier waves
- Android features: share sheet, vibration on tap, status bar colour, camera or gallery for profile photos, and Firebase notifications only if the set-up checks out.
- Stock photos for empty states and banners only, never as a member's own photo or work.
- A full audit of every module, for talent and business accounts. Home and Discover are re-checked against your briefs, and unfinished work from past chats is found.
- One real hiring post made through the app's own form while signed in. Then a hiring need is typed into the match form and the result is opened.

## Wave E — Publish and phone check (new)
- I publish the app once Waves A to D pass their checks.
- On the live app, I check that every Market category banner count matches the real number of listings in that category.
- You check the back gesture with the menu open on your phone. I test the same thing on the live app at phone size.

## Technical details
- Conversations: `messages.tsx` and `conversation.$id.tsx` are restyled with the existing `ml/ui` primitives; no new sibling components. The thread is paginated by `created_at` with a cursor added to `getConversation`. `sendMessage` gets an optimistic update through React Query. Unread counts come from `listConversations`.
- Hiring profiles: `findAiMatches` also offers business profiles when the intent is hire. Results link to `/profile/$username`. Contact fields are read only where the profile's privacy settings allow (`discovery_prefs`). The Message button uses `conversationWith`, which respects "who can message you".
- Category counts: a live query is compared with what each banner shows.
- No new tables. If one is needed, a migration plan comes to you first.
