# Primary vs Ink — usage list (brief §3 decision 8), 4 Oct 2026

**Values today** (`src/styles.css`): `--primary: var(--ink)` and `--primary-foreground` is the text on it; `--ink` is `#0D0D0D`. Since `2d13f06` they are the same colour, so no screen looks different whichever is used. The question for the owner is only whether to keep two names.

## Totals (app code: `src/components/ml`, `src/routes`, `src/lib`, `src/hooks`, `src/registry`, `src/lab`)

| Class | Uses |
|---|---|
| `bg-primary` | 47 |
| `text-primary-foreground` | 36 |
| `text-primary` | 36 |
| `bg-ink` | 34 |
| `border-primary` | 29 |
| `bg-primary-foreground` | 2 |
| `from-ink` | 2 |
| `via-ink` | 2 |
| `stroke-primary` | 1 |
| `accent-ink` | 1 |
| `to-ink` | 1 |
| `accent-primary` | 1 |

Vendor primitives (`src/components/ui`) use the shadcn names only: `bg-primary` ×26, `text-primary-foreground` ×14, `border-primary` ×6, `text-primary` ×1, `stroke-primary` ×1, `bg-primary-foreground` ×1, `bg-ink` ×1, `fill-primary` ×1. Those are shadcn defaults and follow `--primary`.

## How each is used today

- **`primary`** reads as "the main action": filled buttons and selected controls (`Btn` primary fills through `btnClass`), the focus ring (`--ring` → ink), progress fills, radio/checkbox checked states, the delivery picker's chosen dot, chart bars. `text-primary-foreground` is the text on those fills.
- **`ink`** reads as "a dark surface": the dark hero and CTA panels (GearCta), dark chips and badges, the active filter button, the send button, scrims (`from-ink/80`), overlays (`bg-ink/50`).
- **Where they overlap:** a filled dark button is written both ways — `Btn` primary (`bg-primary`) and hand-rolled `bg-ink text-background` buttons (saved.tsx, business.bookings.calendar.tsx, conversation send). Same colour, two spellings.

## Options for the owner

1. **Merge:** one name (`ink`), `primary` kept only as the shadcn alias the vendor primitives need. Mechanical rename in app code; no visual change.
2. **Keep both with a rule:** `primary` = interactive emphasis (actions, selection, focus), `ink` = surfaces and scrims. Then the hand-rolled `bg-ink` buttons move to `Btn`.
3. **Keep as is:** no change; the two names stay interchangeable.

No change is made until the owner picks one.

## Per file (app code)

| File | primary | ink |
|---|---|---|
| `src/components/dropzone.tsx` | 1 | 0 |
| `src/components/file-upload-01.tsx` | 3 | 0 |
| `src/components/ml/auth.tsx` | 1 | 0 |
| `src/components/ml/band-sections.tsx` | 1 | 0 |
| `src/components/ml/bookable-setup.tsx` | 2 | 0 |
| `src/components/ml/booking.tsx` | 14 | 0 |
| `src/components/ml/business-profile.tsx` | 1 | 0 |
| `src/components/ml/cards.tsx` | 2 | 0 |
| `src/components/ml/drawer-list.tsx` | 2 | 0 |
| `src/components/ml/gear-cta.tsx` | 0 | 2 |
| `src/components/ml/help.tsx` | 1 | 0 |
| `src/components/ml/hire-modal.tsx` | 1 | 0 |
| `src/components/ml/kit.tsx` | 9 | 2 |
| `src/components/ml/listing-form.tsx` | 3 | 0 |
| `src/components/ml/market.tsx` | 5 | 2 |
| `src/components/ml/marketing.tsx` | 0 | 3 |
| `src/components/ml/media-embed.tsx` | 0 | 1 |
| `src/components/ml/onboarding.tsx` | 3 | 0 |
| `src/components/ml/portfolio.tsx` | 2 | 4 |
| `src/components/ml/profile.tsx` | 6 | 7 |
| `src/components/ml/qr.tsx` | 4 | 1 |
| `src/components/ml/rental.tsx` | 5 | 0 |
| `src/components/ml/spotify.tsx` | 0 | 1 |
| `src/components/ml/ui.stories.tsx` | 2 | 0 |
| `src/components/ml/ui.tsx` | 3 | 3 |
| `src/components/onboarding-01.tsx` | 4 | 0 |
| `src/lab/registry-batch2.stories.tsx` | 2 | 0 |
| `src/registry/tokens.stories.tsx` | 0 | 2 |
| `src/routes/__root.tsx` | 6 | 0 |
| `src/routes/auth.signout.tsx` | 1 | 0 |
| `src/routes/bands.$id.contact.tsx` | 1 | 0 |
| `src/routes/bands.$id.invite.tsx` | 2 | 0 |
| `src/routes/booking.confirmed.$ref.tsx` | 4 | 0 |
| `src/routes/business.$id.enquiry.tsx` | 1 | 0 |
| `src/routes/business.availability.tsx` | 2 | 0 |
| `src/routes/business.bookings.calendar.tsx` | 2 | 1 |
| `src/routes/business.new.tsx` | 1 | 0 |
| `src/routes/collab.$id.index.tsx` | 1 | 0 |
| `src/routes/collab.new.index.tsx` | 1 | 0 |
| `src/routes/conversation.$id.tsx` | 0 | 2 |
| `src/routes/home.tsx` | 0 | 1 |
| `src/routes/identity.contact.index.tsx` | 0 | 1 |
| `src/routes/identity.qr.tsx` | 0 | 1 |
| `src/routes/identity.scan.tsx` | 5 | 0 |
| `src/routes/index.tsx` | 0 | 3 |
| `src/routes/leads.tsx` | 2 | 0 |
| `src/routes/marketplace/index.tsx` | 0 | 1 |
| `src/routes/marketplace/mine.tsx` | 1 | 0 |
| `src/routes/marketplace/rent/request.$id.tsx` | 1 | 0 |
| `src/routes/messages.tsx` | 0 | 2 |
| `src/routes/notifications.settings.tsx` | 2 | 0 |
| `src/routes/onboarding/done.tsx` | 2 | 0 |
| `src/routes/onboarding/index.tsx` | 1 | 0 |
| `src/routes/onboarding/skip.tsx` | 1 | 0 |
| `src/routes/opportunities.$id.analytics.tsx` | 1 | 0 |
| `src/routes/opportunities.$id.apply.tsx` | 3 | 0 |
| `src/routes/opportunities.$id.index.tsx` | 2 | 0 |
| `src/routes/opportunities.applications.$aid.tsx` | 1 | 0 |
| `src/routes/opportunities.new.tsx` | 3 | 0 |
| `src/routes/reviews.index.tsx` | 1 | 0 |
| `src/routes/reviews.write.$id.tsx` | 2 | 0 |
| `src/routes/saved.tsx` | 0 | 1 |
| `src/routes/search.why.$id.tsx` | 2 | 0 |
| `src/routes/services.$id.enquiry.tsx` | 3 | 0 |
| `src/routes/services.$id.index.tsx` | 3 | 0 |
| `src/routes/services.new.tsx` | 1 | 0 |
| `src/routes/settings.account.tsx` | 2 | 0 |
| `src/routes/settings.delete-account.tsx` | 1 | 0 |
| `src/routes/verification.$type.tsx` | 11 | 0 |
| `src/routes/verification.index.tsx` | 1 | 0 |
| `src/routes/verification.privacy.tsx` | 1 | 0 |
