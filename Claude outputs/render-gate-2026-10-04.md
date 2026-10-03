# Rendering gate (brief §5) and verification (brief §4), 4 Oct 2026

**How:** `scripts/render-gate.mjs` against the production build (`bun run build`, served by
wrangler, the same Cloudflare runtime the live site uses). 20 screens × 360, 412 and 640px, signed
out. Per screen and width it saves a screenshot (`Claude outputs/render-gate/*.png`, kept out of git;
`report.json` beside them) and checks horizontal overflow and every control's touch area (the drawn
box or its `hit-area`).

**Screens:** welcome, discover, discover/singers, marketplace, marketplace/sell, services, a
service, a talent profile, a business profile, a booking page and its service and schedule steps,
opportunities, bands, a band, search, help, settings, identity/qr, and a 404.

## Result (final run)

- **Horizontal overflow:** none, on every screen at every width.
- **Status:** every screen 200; the unknown profile 404s.
- **Touch areas under 48px — fixed during the gate:** Segmented tabs (44px tall, "All" 30px wide)
  → 48px; SegmentedField options (33px) → hit-area; profile section tabs (44px wide) → 48;
  bottom-nav links and Menu (41–43px wide at 360) → hit-area; person rows (44px) → 48; search
  result links, service titles, photo pills, "…more", "Create an account", "Sign in", the @handle,
  Market's List, Band QR, Back to Discover, Expand details, Manage business → hit-area; See all → 48px;
  the root 404/error "Go home" (36px) → 48px; auth fields (44px) → 48px; search fields become
  labels so the whole 56px pill takes the tap.
- **Remaining, documented exceptions:**
  - Calendar day cells are 48px tall and 38px (360) / 45px (412) wide: seven columns can't each be
    48px wide inside 320–372px, and the grid is the standard date picker. At 640px they are 48.
  - The welcome email and password inputs are 46px inside a 48px field.

## Not checked

- **The Android/Capacitor shell:** no device or emulator was run in this session. The shell loads
  the hosted site, and `env(safe-area-inset-*)` can't be emulated in a desktop browser, so the top
  and bottom insets (`pt-safe`, the Sheet's max height, `CoverHero`'s inset) need one pass on a
  phone.
- **Signed-in screens** (Pricing, Closed times, confirms, uploads, the request sheet, Edit profile):
  the local build has no session.
- **Keyboard interaction** was checked in code (focus rings restored on 22 fields, Sheet and
  Dialog focus traps), not by driving a keyboard through every screen.

## §4 verification

- **Route coverage:** business-profile, public-profile, talent-profile, work-form audited
  (`Claude outputs/section4-route-coverage-2026-10-04.md`); fixes below.
- **Contrast:** measured per state (`Claude outputs/contrast-2026-10-04.md`); one owner decision
  (the hairline border, 1.24:1).
- **Focus-visible:** 23 controls had `outline-none` with no replacement; 21 fixed (rings on the
  field or its pill, input text 16px), 2 are focus-managed panels (Sheet, Dialog) and keep none.
- **Reduced motion:** global rule (`styles.css`) verified.
