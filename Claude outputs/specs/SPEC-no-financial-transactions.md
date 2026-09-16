---
doc: SPEC-no-financial-transactions
version: 1.0
status: CURRENT
updated: 2026-09-16
verified_against: not a technical finding — this is a stated product/liability decision,
  recorded as given
folder: specs
originally: new
---

# Issue 6 — no in-app financial transactions; bookings/marketplace stop at "confirmed"

## The rule, as given

MusicLinkd does not process any financial transaction, for now, anywhere in the app —
bookings/rentals (studio, equipment, etc.) and Marketplace (buy/sell/rent) alike. The app's
job ends at **confirming** the booking, rental, or sale between the two parties. Payment,
delivery/pickup, and everything after that happens off-platform, between the users. The
platform is not liable for what happens after confirmation. Users can still leave a review.

## What this actually constrains

- **No payment integration in this phase** — no card capture, no escrow, no payout flow, nothing
  that touches money programmatically. This directly overrides anything in earlier phase
  planning that implied payment processing as part of Marketplace or booking (worth checking
  the phase-plan doc in Notion for any wording that assumed otherwise, and correcting it).
- **Every booking/rental/sale flow's terminal state is "Confirmed"** — not "Paid," not
  "Completed," not "Fulfilled." Whatever status enum backs these flows needs "confirmed" as the
  actual end state the app tracks; anything past that is between the two users.
- **Reviews stay in-app** and aren't gated on any payment/completion signal the app can't
  actually see (since the app doesn't see whether money or delivery ever happened) — reviews
  attach to the confirmed booking/listing, not to a "transaction completed" event the app has no
  way to verify.

## The liability line — flag, don't draft

"We are not liable" is a legal/Terms-of-Service position, not a UI behavior. The product
mechanics above (no payment flow, confirmed-only status, off-platform handoff) support that
position, but the actual liability language — what the Terms say, what disclaimer (if any) shows
at the confirmation step — needs real legal review, not app copy improvised by Claude Code or by
me. I'm not drafting that language here; flagging that it's a gap between "the app behaves this
way" and "the app is legally protected for behaving this way," and those are two different
deliverables.

## What this doesn't decide

Exact wording of any confirmation-screen disclaimer, whether a checkbox/acknowledgment is needed
before a user can mark something "confirmed," and the Terms of Service text — all outside what
I'll draft (content) or what Claude Code should improvise (legal).
