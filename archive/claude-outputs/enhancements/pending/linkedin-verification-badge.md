# Pending enhancement — "Verified on LinkedIn" badge

Filed 22 Sep 2026 from the owner's references (Behance/Adobe: a "Do you want to add a verification from
LinkedIn?" modal, and an "Add a verification badge — Connect your LinkedIn … Verify Now" card).
Status: **pending, not started.**

## What the references do

1. **Prompt card** on the profile/settings: icon, "Add a verification badge", one line ("Connect your
   LinkedIn to show a verification on your profile"), Learn more, one primary button "Verify now".
2. **Consent modal** before leaving the app: hero graphic with the badge, title, one paragraph on what
   happens (LinkedIn runs its own check; the result comes back and shows on your profile), two buttons —
   "Continue without verifying" (secondary) and "Add verification" (primary).
3. The person verifies **on LinkedIn** (LinkedIn's own ID / workplace checks). The app only receives the
   result and shows a badge on the profile.

## Where MusicLinkd is today (audited in the code, 22 Sep 2026)

| Piece | State |
|---|---|
| LinkedIn sign-in | Exists: Welcome → LinkedIn, Supabase provider `linkedin_oidc` (`src/routes/welcome.tsx`). Sign-in only; it reads no verification status. |
| Sign-in methods | Settings → Integrations → Sign-in methods lists linked identities and can remove one (`src/components/ml/identities.tsx`). No "link LinkedIn" action for an account that signed up another way. |
| Own verification | `/verification` with four types — identity, professional, business, studio (`src/data/verification.ts`, `verification.$type.tsx`); document upload reviewed by MusicLinkd's team; badges shown on profiles (`VerifiedMark`). |
| LinkedIn as a source of verification | None. No LinkedIn verification status is fetched, stored or shown. |

## What it would take

1. **LinkedIn access.** Reading a member's verification needs LinkedIn's verification program for
   partners ("Verified on LinkedIn"), which is by application and approval — not part of the standard
   Sign In with LinkedIn (OpenID Connect) scopes we use. **To confirm:** eligibility, scopes, terms, cost.
2. **Linking.** An account that signed up with Google or email must be able to link LinkedIn from
   Settings → Sign-in methods (Supabase `linkIdentity` for `linkedin_oidc`) before it can verify.
3. **Storing the result.** A column or row for "verified on LinkedIn" (type — identity / workplace —
   and date), refreshed on each LinkedIn sign-in; a DB snapshot before the migration.
4. **UI.**
   - A prompt card on the owner's profile and on `/verification` (the Behance card), one primary button.
   - A consent sheet before the LinkedIn hand-off (the Behance modal) — as a bottom sheet, our pattern.
   - A LinkedIn mark next to the name / in the verification badges on the public profile, distinct from
     MusicLinkd's own ID and Pro badges.
5. **Rules to decide.** Whether a LinkedIn verification counts toward our `identity` verification or
   stays a separate badge; what shows when the LinkedIn account is later unlinked.

## Open questions for the owner

- Separate "Verified on LinkedIn" badge, or does it satisfy our Identity verification?
- Talent only, or business accounts too (LinkedIn company pages)?
