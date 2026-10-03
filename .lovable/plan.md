# Redesign MusicLinkd authentication entry

## Goal
Create one premium, editorial entry system across `/welcome`, phone sign-in, verification, and the onboarding Select screen. Preserve every route, field, validation rule, and authentication action.

## Changes
- Simplify `/welcome` into a compact branded introduction and centered authentication composition; remove the role ticker and noisy badges.
- Refine the Sign In / Sign Up segmented control, typography, fields, password reveal, primary action, alternate methods, remembered account, and legal footer.
- Carry the same spacing, hierarchy, field treatment, button proportions, notices, and footer rhythm into phone-number and verification-code states.
- Rework onboarding Select into a clear “1 of N” entry step with three neutral choice rows, an unmistakable pink selected state, supporting “Why create a profile?” content, and a separate Continue action.
- Preserve Music Talent, Business, and Upcoming behavior; Upcoming remains unavailable and accessible.
- Prevent vertical clipping by allowing short screens to scroll while retaining safe-area spacing and 48px touch targets.

## Technical details
- Reuse `AuthScreen`, `TextField`, `PasswordInput`, `PhoneField`, `CodeInput`, `Btn`, and existing MusicLinkd tokens.
- Limit edits to authentication/onboarding presentation files and the roadmap entry; no backend, route, or business-logic changes.
- Verify sign-in/sign-up switching, password reveal, field errors, phone entry, onboarding selection, and continuation at 412px and 1280px.
- Run the TypeScript check and inspect the latest preview build diagnostics.
