# Final acceptance report — convergence brief (29 Sep), 4 Oct 2026

`main` published to app.musiclinkd.com (verified live: the welcome form's `h1`, the
business-profile facts removed, 9 routes 200). Item-by-item evidence is in
`Claude outputs/convergence-status-2026-10-04.md`; this report gives each item exactly one heading.

## 1. Fixed (with commit)

| Section | Items | Merge |
|---|---|---|
| P0 | Data integrity and false claims | earlier (`906b5f3` and before) |
| 1 | Canonical Block migrations | `69c83f6`, `c614e72` |
| 2 | Safe area (Sheet, CoverHero); 48px hit areas on every listed control; upload focus ring, failure + Try again, gallery loading/error; dead controls (ResourceCard, ServiceCard fallback, Share QR, add-on link); 8 delete confirms (`useConfirm` on `ui/alert-dialog`); copy-keyed logic → keys (listing mode, fulfilment, inclusion, link icons, tier type); FulfilmentPicker radios; textarea focus rings; contextual LoadError gaps; pink count badges → ink | `405a1fe` |
| 3 | 48px touch token; unused type utilities; heading tracking; radius tail; unused tokens (avatar, elevation-1/-4, gradient-brand); GearCta raw pink; `#0D0B26` → generic `--shadow-ink`; AGENTS.md radius/touch/overlay rules | `f6c691f` |
| 3.5 | tour.tsx + `next/link`; 29 unused vendor primitives + file-upload-01; emoji and arrow glyphs → Lucide; fabricated "4×"/"3×" claims and dead trustSignals; band manage controls wired (`deleteBand`); audit J2/J3 | `a1b3c76` |
| 4 | Route coverage audit and fixes (failures shown as success, invented studio facts, demo owner on `/profile`, genre→role corruption, network errors shown as 404/empty, data-map id, "Room" option); 21 focus rings; contrast measured | `caff7ea` |
| 5 | Rendering gate, 20 screens × 360/412/640: no overflow; touch areas fixed across Segmented, SegmentedField, profile tabs, bottom nav, rows, links, auth fields, 404 | `caff7ea` |
| 7 | Superseded banners on three docs; token spec current; AGENTS.md bookables paragraph; SCREEN-INVENTORY count | `f31ca19` |
| — | Welcome heading: the form's title is the visible `h1` | `09f58d5` |
| M2b | `20261004130000` applied (owner instruction, 4 Oct): `room_id` dropped from `booking_requests` and `bookable_blocks`, 11 bookings intact; snapshot `supabase/dumps/2026-10-04-before-drop-room-ids.sql`; `types.ts` matches the live schema | this merge |
| Brand assets (§3.5 #34) | Favicon `.svg`/`.ico`, apple-touch-icon, manifest icons (192/512/maskable), Android launcher (legacy, round, adaptive) and splash drawables, all generated from `LogoMark` by `scripts/brand-assets.mjs`, pink on ink; the second "M wave" mark and Capacitor placeholders removed. Approved from the preview sheet (4 Oct). Android assets unverified until the shell is rebuilt in Android Studio | this merge |
| Decisions 4 Oct | Primary merged into Ink (pixel-identical); field border `--input` 1.24 → 3.06:1 on the page (1.46 → 3.61 on white); one icon stroke (Lucide default 2, 52 overrides removed); M2/M3 applied | this merge |

## 2. Verified (already correct)

- TextLink 48px (`links.tsx` hit-area); optimistic gallery reorder rolls back; Lucide everywhere
  except the 13 kept Gestalt nav icons; "Made by Wugweb" only on sign-in and Settings; no
  marketplace nav/location picker built; reduced motion (global rule); `liquefy-ui.css`
  Storybook-only; 10/11px uses (13) are metadata/labels; spacing rule (no migration).
- Mobile web: verified by the owner on their phone through the Lovable link (4 Oct).
- Checks: tsc, lint (0 errors), token drift, build, Cloudflare render, and the Storybook
  accessibility suite (20 files, 144 tests) all pass.

## 3. Intentionally retained

| Item | Reason / decision |
|---|---|
| Unsplash seed photos in `src/data` and stories | Owner, 4 Oct: ignore — kept as they are (one builder, `src/data/unsplash.ts`) |
| Story-only vendor primitives (Registry/Kept, Lab) | "kept here on the owner's word rather than deleted" |
| Availability words `Busy`/`Touring` | Compare stored taxonomy values, not display copy |
| Seven auxiliary reads with no error card | A failure drops a minor detail only (prefill, saved hearts, a badge) |
| `qr.tsx` `#374151` and QR black/white | No equivalent token; generator inputs |
| Calendar day cells 38–45px wide at 360–412 | Seven columns can't be 48px wide; cells are 48px tall |
| Welcome inputs 46px inside a 48px field | The field is the 48px target |
| Disabled button text 2.5:1 | Inactive controls are exempt from WCAG 1.4.3 |
| Filled rating star `strokeWidth={0}`; India flag circle; GearCta waves | A solid shape / not Lucide icons |
| New confirm and error wording | Approved by the owner, 4 Oct: "Remove <name>?", "Remove this photo?", "Remove stage plot?", "Disconnect Spotify?", Remove / Disconnect / Cancel, "Try again" on failed uploads, "We couldn't load your equipment" |
| `collab*` routes and tables | Classified (`collab-references-2026-10-04.md`); removal needs band invitations moved off `/collab/$id` first |

## 4. Blocked (exact dependency)

| Item | Waiting on |
|---|---|
| Android/Capacitor app shell (insets, the new launcher icons and splash on a device) | Unverified: no Android device; needs a rebuild in Android Studio. Mobile web was verified by the owner on their phone through the Lovable link (4 Oct) |
