# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Fixed — the welcome screen's heading is its visible title (4 Oct)

- "Welcome back" / "Create your account" is the page's `h1` at a heading size (`text-3`), not a
  12px `h2` under a screen-reader-only `h1`. The site description stays for screen readers as a
  paragraph; search engines read the meta description.

### Changed — brief §7: stale repo docs (4 Oct)

- `docs/component-inventory-2026-09-16.md`, `docs/db-map-2026-09-17.md` and
  `docs/system-rules-2026-09-16.md` carry a Superseded banner: the order of authority is code →
  Storybook → Notion.
- `docs/token-scale-spec-2026-09-16.md` (the one doc kept current) records the §3 changes: 48px hit
  target, four radius steps, removed type utilities and tokens, `--shadow-ink`, the Primary vs Ink
  list, measured contrast.
- AGENTS.md: the bookables paragraph says the `studio*` shims are gone and there are no rooms;
  SCREEN-INVENTORY's server-function count is 242.
- Storybook accessibility suite (`bun run test-storybook`): 20 files, 144 tests pass.

### Fixed — brief §4 and §5: verification and the rendering gate (4 Oct)

- Route coverage (business, public and talent profiles, work form):
  - connect/follow failures said "Connection request sent!"/"Now following" — they now show the
    error; a failed connection lookup refuses a second request instead of sending one;
  - invented studio facts ("Vocal Booth & Foley", "Neve & UA Chains", "Spaces") removed from every
    business profile — there is no data behind them;
  - signed-out `/profile` showed a hardcoded demo owner with Edit; it now goes to sign-in;
  - the work form moved genres into "Your role" on every edit; genres and roles are split back on
    load;
  - a profile that failed to load showed "not found" or "no work yet"; it now shows a LoadError
    with Try again (`PublicProfileError` on `/profile/$username` and `/@handle`);
  - a hardcoded username → id map no longer stands in for a live profile id;
  - "Room" removed from the business enquiry options (no rooms); off-scale icon sizes fixed; the
    work title gets a focus ring; Manage business and See all reach 48px.
- Focus: 21 fields had no visible focus ring; rings restored (on the field, or its pill), input
  text 16px so iOS doesn't zoom.
- Contrast measured per state (`Claude outputs/contrast-2026-10-04.md`).
- Rendering gate (`scripts/render-gate.mjs`, 20 screens × 360/412/640 on the production build): no
  horizontal overflow; touch areas fixed in Segmented, SegmentedField, profile tabs, bottom nav,
  person rows, search/market result links, auth fields (48px), the root 404 and many links; search
  fields are labels. Auth screens' `text-xs sm:text-sm` → `text-1`, `h-11 sm:h-12` → `h-12`.
- Wording changed: "No portfolio attached." etc. listed under §3.5; here only removals ("Room",
  the bento facts) and the welcome links' size.

### Changed — brief §3.5: engineering hygiene (4 Oct)

- Removed 29 vendor primitives nothing imported (incl. `tour.tsx` and its `next/link`) and the
  unused `file-upload-01.tsx`. Primitives used only by the Registry/Kept and Lab stories stay (kept
  on the owner's word).
- Glyphs and emoji: the calendar's "← Prev"/"Next →" use chevrons; work-type and service-category
  emoji are Lucide icons (`WorkTypeIcon`, `workIconFor`, `categoryIcon`).
- Fabricated claims removed: "applications with work are 4× more likely to be shortlisted" (now "No
  portfolio attached."), the Budget hint "Posts with a budget get 3× more applications.", and the
  unused `trustSignals` data.
- Story images go through `src/data/unsplash.ts`.
- Dead controls found by the collab sweep: band manage's Make admin/member, Remove member,
  Transfer ownership (picks an admin) and Delete band now do what they say (`deleteBand` added).
- From the audit classification: the Business created dialog reads "Add your hours and rates
  next." (no spaces); the provider card, a saved rental search and a rental category link straight
  to their pages instead of through redirect stubs.
- Reports: audit classification, collab references, external media, stroke inventory
  (`Claude outputs/`).

### Changed — brief §3: tokens (4 Oct)

- Hit target: `--spacing-touch` (`min-h-touch`) is 48px (owner, 29 Sep); 40–44px is only a drawn
  size inside a 48px `hit-area`. The 16 consumers are now 48px tall; Saved's icon button is 48×48.
- Type: the `display-*`, `body-*`, `label-*` utilities and the `.headline-*`/`.title-*` aliases
  (0 consumers) removed; h1/h2 set at normal tracking.
- Radius tail: app code uses only `sm`/`lg`/`3xl`/`full` — `rounded-md` → `sm` (thumbnails, tags),
  20/24px cards → `lg`, 14px tiles → `sm`, the 48px message composer → `full`, the 16px send and
  new-message buttons → `lg` (same size), bubble tail corners → `sm`.
- Unused tokens removed: avatar sizes, `elevation-1`/`-4`, `--gradient-brand` and `brand-gradient`.
  The shadow tint is a generic `--shadow-ink` (not a brand colour); GearCta's hover glow uses
  `--brand` instead of raw pink.
- Primary vs Ink: usage list for the owner (`Claude outputs/primary-vs-ink-2026-10-04.md`); no
  merge.
- Unsplash (owner, 4 Oct: keep it): the 11 `src/data` modules share one builder,
  `src/data/unsplash.ts`.
- AGENTS.md: radius (four steps), hit target (48px) and overlays (`Sheet`, `Dialog`,
  `useConfirm`) now match the code.

### Fixed — brief §2: component and state cleanup (4 Oct)

- Safe area in the shared primitives: `Sheet` never reaches under the status bar; `CoverHero`'s
  back and actions sit below the top inset (back gets a 48px hit area).
- 48px hit areas: duration chips (48px), listing photo and tag remove, proof-photo remove,
  `DrawerSearchButton`, market chips, Clear all and Filters, `ServiceCard` Book and Details, review
  Read more.
- Upload: `ImagePickButton` shows a focus ring on keyboard focus and never fails silently;
  upload failures offer Try again (profile, gallery, proof photos, bands, collabs); the gallery
  shows loading and a `LoadError` instead of nothing; equipment's error is the canonical `LoadError`.
- Dead controls: `ResourceCard` removed (no consumers after rooms); `ServiceCard`'s Book with
  nothing to open is disabled; Share QR sends the QR image (saves it where files can't be shared);
  an add-on's rental link opens its listing.
- Confirms (`useConfirm` in `ml/ui.tsx`, on `ui/alert-dialog`): equipment, gallery photo, proof
  photo, band live video, stage plot and release, sign-in method, Spotify disconnect.
- Logic keyed off copy moved to keys: listing mode (`sell`/`rent`; drafts saved with the old
  words still load), rental fulfilment (`pickup`/`provider_delivery`, the stored values),
  equipment inclusion (`included`/`extra`), social-link icons (platform key), `VerificationBadge`
  typed to `VerificationTier`. `SegmentedField` takes optional `labels` for keyed options.
- Accessibility: `FulfilmentPicker` is a radiogroup with checked state; the hire and support
  textareas get their focus ring back (and 16px text, so iOS doesn't zoom).
- Errors: My profile shows a `LoadError` when the business check fails (it used to fall through to
  the talent profile); opportunity analytics shows a `LoadError` and "—" instead of 0 views on a
  failed read; the booking request sheet shows its error inside the sheet as well as the toast.
- Brand: count badges (notifications, Filters) are ink, not pink.
- Wording changed: confirm titles "Remove <name>?", "Remove this photo?", "Remove stage plot?",
  "Disconnect Spotify?" with buttons Remove / Disconnect / Cancel (new: a confirm needs a
  question); upload toasts gain a "Try again" action; the equipment error reads "We couldn't load
  your equipment" (the canonical LoadError) with "Try again" instead of "Retry".

### Fixed — a service's own page has Book (4 Oct)

- The talent request test saved nothing. The profile cards' Book path is correct end to end (it
  needs no place, sends the request, shows the server's error if it fails), but the service's own
  page — where search results, the Services list and a card's title lead — had no Book at all,
  only Enquire, so a request could not be sent from there. It now has Book above Enquire: a
  business with a place opens its booking flow with the service picked (its calendar decides
  when, so Book shows whether or not the owner set "Available for"); anyone else gets the same
  dated request as the profile cards, when they are open for work. Enquire is unchanged.
- `getService` returns the provider's place (`bookableSlug`) for that choice.

### Changed — C2 and C3: one calendar per place; rooms and the services tags no longer read (4 Oct)

- C2: the booking draft has no room; every busy time and closure takes the whole place
  (`bookable-slots`, `booking-overlaps`); any duration can be picked. A place with no services takes
  no bookings ("This space is unavailable"); its "from" price is its lowest service price. Pricing
  loses room rates and price tiers (base rate and add-ons stay); closed times lose the room picker.
  Rooms are no longer read by the booking page, the business profile, `getMyBookable` or booking
  requests; `updateBookableRoomRate` / `updateBookableRoomTiers` are removed.
- C3: `bookables.services` is no longer read (`catalog.functions.ts`; `recommendations.functions.ts`
  loses the "Offers <slugs>, like studios you used" reason).
- Wording trimmed where it named rooms: booking page and step descriptions; "This room has no open
  dates" → "No open dates in the next month."; "Only durations this room supports are shown."
  removed; "Room capacity N" removed; "prepare the room" → "prepare"; "Block or Adjust This Room's
  Calendar" → "Block or Adjust the Calendar"; Pricing's description; the confirmed and session
  screens' Room line.
- Migrations, not applied: `20261004120000_retire_rooms.sql` (M2: `bookable_busy()` without
  `room_id`, room closures to the whole place, `bookable_rooms` → `bookable_rooms_retired` with
  access revoked), `20261004130000_drop_room_ids.sql` (held for the owner's yes),
  `20261004140000_retire_bookable_services.sql` (M3: `services` → `services_retired`). Snapshot
  query: `supabase/checks/before-retire-rooms.sql`.

### Changed — C1: a booking is for a service; every service can be booked (4 Oct)

- The booking flow carries the service picked (`serviceId`) and sends it; the summary, the request
  screen, the booking lists and the calendar show the service where they showed the room.
- Price (owner, 4 Oct: option 1, the 22 Sep starting-price decision stands): the service's own
  price — times the hours, with its minimum, only if a unit "hour" is ever stored — plus add-ons,
  shown as an estimate with the existing "the provider confirms the final amount" line. A service
  with no price quotes nothing. Room rates no longer price a booking.
- Book on a service with no booking flow of its own (a talent's, or a business without a place)
  opens the "Request a session" sheet, now a shared Block (`RequestSessionSheet`,
  `ServiceRequestSheet` in `ml/booking.tsx`), and sends a dated request for that service. Enquire is
  untouched.
- `/business/bookings/requests/$ref` opens to whoever owns the service booked, not only business
  accounts (the server says whether the account was asked); a talent goes back to Notifications.
- `requestBooking` takes a service with or without a bookable; `answerBooking` checks the asker
  owns the bookable or the service; `listBookableBookings` includes requests for the account's
  services.
- `20261004110000_service_owner_notice_link.sql`: a talent's booking notice opens the request too.
  Applied to the live database by the owner's Claude on 4 Oct, unchanged from `main` (SHA-256
  `ee3349c6…` checked), guard passed. New live `notify_booking` fingerprint
  `83bedd07a14b51f0204a7cc60d26f37b`.

### Added — bookings can point at a service (M1 of booking by service, 4 Oct) — applied 4 Oct

- Applied to the live database by the owner's Claude, unchanged from `0cc98fd` (SHA-256 checked):
  10 bookings, 6 linked to a service; both "Service owner" rules present; schema reloaded. New
  live fingerprints: `booking_requests_guard` `e7ef6fcc0b404335f8c16ad3394b98ac`, `notify_booking`
  `8d77693645c8450bc1fb18e24f0a44d1`.

- `20261004100000_bookings_point_at_services.sql`: `booking_requests.service_id` (→ `profile_services`,
  cleared if the service is deleted). Existing bookings are linked only where `purpose` is exactly
  the name of one service of the business asked. The service's owner can read and answer a booking
  of it (two new rules; the answer guard and the booking notification know the service's owner),
  so a talent can accept or decline. The guard and notification are replaced only if the live
  bodies match the snapshot (`supabase/dumps/2026-10-04-before-bookings-point-at-services.sql`,
  md5 of each body), otherwise it stops. A business's notice still opens the request itself
  (`/business/bookings/requests/<id>`); a talent's carries no link until C1 adds a screen for it.
  Nothing dropped; `room_id` untouched.

### Changed — one name for amenities; the picker offers 12; studio services fold into service categories (owner, 3 Oct)

- `20261003150000` and `20261003160000` applied to the live database by the owner's Claude on 3 Oct,
  unchanged from `ba11e89` (hashes checked); every built-in check passed and the API schema was
  reloaded. Photos: 15 `amenity`, 46 `equipment`, none `facility`. `amenities`: 33 options, 12 in
  the picker; `studio_amenities` gone. `service_categories`: 55; 18 new person-type rows.

- Taxonomy key `studio_amenities` is `amenities` (`20261003160000_amenities_key_and_service_fold.sql`).
  Same options and slugs; no stored selection changes.
- The amenity picker offers 12 options (parking, valet parking, lounges, Wi-Fi, fiber internet, bar
  & diner, lockers, cafe, AC, water, catering). The other 21 carry `metadata.picker = false`: still
  published, so a profile that already has one still shows it, and the editor still lists it so the
  owner can remove it. Nothing deleted.
- `service_categories` gains 6 of studio_services' options (`resident_engineers`,
  `attended_sessions`, `stem_mastering`, `producer`, `same_day_audio`, `multicam_video`) with their
  existing labels, under the `studio` parent, offered to every person type already offered `studio`.
  Not `recording`: "Studio recording" is already there, and the picker would show both.
  No screen read `studio_services`; its rows stay because `service_category_specialties` points at
  them. `bookables.services` is untouched.
- `20261003140000` (cleanup) compares row counts before and after instead of hard-coding 21 / 57;
  its snapshot, `supabase/dumps/2026-10-03-before-drop-bookables-compat.sql`, is committed.
- Snapshots for `20261003150000` and `20261003160000` committed (`supabase/dumps/2026-10-03-before-
  photo-subject-amenity.sql`, `…-before-amenities-key.sql`); `supabase/checks/before-amenities-key.sql`
  wraps its `UNION` in a subquery so its `ORDER BY` runs.

### Changed — Edit profile edits every onboarding answer (3 Oct)

- Date of birth and gender: onboarding's `PrivateDetailsFields` (moved from the step route to
  `ml/onboarding.tsx`) in Edit profile → Identity, talent only. They were not editable after
  onboarding.
- "Available for": onboarding's `available_for` picker instead of a free-text field (talent; a
  business keeps the text field, which business setup never asks).
- "Where you work": onboarding's `work_modes` picker from the taxonomy instead of a hardcoded list
  in `src/data/onboarding.ts`.

### Changed — "facility" is "amenity" everywhere (owner, 3 Oct)

- The photo subject type `facility` is `amenity`: `BookablePhotoSubject`, the `addMyBookablePhoto`
  enum, every `photosOf`/`photosBy` lookup (`20261003150000_photo_subject_amenity.sql`, applied
  3 Oct).
- `MyBookablePhotos.facilities` → `amenities`; the booking page's `facilities`/`facilitySlugs`/
  `facilityPhotos` → `amenities`/`amenityLabelSlugs`/`amenityPhotos`.
- Edit profile's section is "Amenities & equipment", opened by `?section=amenities` / `#amenities`
  (the Availability screen and Add service link there).

### Fixed — Add service asks every business, and only businesses, for amenities and equipment (3 Oct)

- `services.new.tsx` decided "studio" from whether the equipment list loaded. Since every signed-in
  account can now load it (empty when there's no bookable), talent accounts were shown amenities and
  equipment instead of portfolio examples. It now keys off `useRequireBusiness()`: every business
  type gets both fields, talent keeps examples.
- Both fields are optional for a business (owner, 3 Oct); talent still needs at least one example.
- `StudioSetupNote` → `BookableSetupNote`; its copy says "business", not "studio".

### Changed — route-local components classified; duplicates removed (P1-9, P1-10, P1-12, 3 Oct)

- **Availability on Home** puts the switch back when the save fails (it stayed flipped, looking
  saved) and stores no value when off, not `""`. The unused second `AvailabilityToggle` in
  `profile.tsx` is removed: it wrote a different value (`"Collaborations"`) for the same field.
- **Names say one thing:** Search's tappable `ChipGroup` is `SearchChipGroup`, booking's price
  `Row` is `PriceRow`, the work form's `Row` is `EditRow`, the conversation's `ShareSheet` (pick a
  service or work to send) is `ShareWorkSheet`.
- **Kept local, screen-specific:** `InviteLinkRow`, `EditCollabSheet`, `CollabRow`, `NewTierSheet`,
  `NewAddOnSheet`, `MoneyRow`, `BlockRow`, `ProfileLinkRow`, `NotificationRow`, `RolesCard`,
  `DetailRow`. `BusinessCard` and `SearchResults` are route screens. The four route `Field`s only
  set an id and render the shared `InlineField` / `Field`.
- **Destinations (P1-12):** Blocks link to their own entity's page; `ServiceCard` takes its Book and
  Enquire actions from the screen. No Block needed a destination passed in.

### Changed — Edit profile edits everything onboarding asks (3 Oct)

- **Every business** sees Edit profile → Facilities & equipment, not only one that already had a
  bookable. Its first amenity, equipment item or photo creates the business's bookable on the
  server (`ensureMyBookableId`, one per owner, safe if two saves race). `updateMyBookable` used to
  report success when it matched no row; it now saves or says it didn't.
- **Business type** in Edit profile uses business setup's picker and list, one type; it offered
  talent types before. **Policies** use business setup's editor instead of a text box.
- **Experience** (how long in music) is picked from onboarding's list, not typed; **experience per
  instrument**, asked in onboarding, can now be edited (merged into `discovery_prefs`).
- **Errors are errors:** a failed load on Availability, or of the amenities, shows a retry instead
  of the empty "no bookable" screen or nothing.

### Changed — facility photos are added in Edit profile (3 Oct)

- **Owner decision:** a business's facilities and equipment, each with its photos, are edited in
  **Edit profile → Facilities & equipment**, using the same shared editors. The section shows for a
  business account that runs a bookable space. The workspace's Availability screen keeps the
  hours and links to it; Add service's "Add Amenities / Equipment" opens it.
- The facilities query runs only for business accounts and doesn't retry when there is no
  bookable.

### Fixed — every page returned 500 on the published site (3 Oct)

- The published app (and Lovable's preview) answered every route with "This page didn't load".
  Cause: the profile share sheet's real QR code (P0) imported `qrcode` statically into
  `profile.tsx`, which most pages load; the library's server build imports `node:fs`, which the
  Cloudflare worker doesn't have, so every server render failed with `No such module "node:fs"`.
  It ran fine under Node, which is why local builds looked healthy.
- `qrcode` is now loaded only in the browser, when a code is drawn or saved (`qr.tsx`).
- Reproduced and verified under Cloudflare's own runtime (`wrangler dev` on the production build):
  before, `/` and `/discover` returned 500 with that error; after, `/`, `/discover`, a booking page,
  Market, Welcome, Help and a profile return 200.

### Added — cleanup migration for the bookable rename (3 Oct) — applied 3 Oct

- Applied to the live database by the owner's Claude on 3 Oct: every built-in check passed, the API
  schema was reloaded; 22 bookables, their photos and the storage rules unchanged.

- `20261003140000_bookables_drop_compat.sql` drops the old-name views (`studios`, `studio_rooms`,
  `studio_blocks`, `studio_equipment`, `studio_photos`) and wrapper functions (`studio_is_mine`,
  `can_review_studio`, `studio_busy`). No `CASCADE`: it first checks that no view, function or rule
  still uses an old name, and rolls back if one does. It touches no data.


### Changed — code names follow the bookable rename (3 Oct)

- Exported names that meant the bookable space say so: `getStudioCalendar` → `getBookableCalendar`,
  `DiscoverStudio` → `DiscoverBookable`, `StudioCard` / `StudioRow` / `StudioCardSkeleton` →
  `BookableCard` / `BookableRow` / `BookableCardSkeleton`, `StudioBookingRecord` → `BookingRecord`,
  `getStudio` → `getBookableBySlug` (`getBookable` was taken), and the owner, photo, block and
  equipment functions and types (`getMyBookable`, `BookablePhoto`, `addMyBookableBlock`…), 47 in all.
  `studio-setup.tsx` is `bookable-setup.tsx`.
- Unchanged: local variables, on-screen words, the `studio` persona slug, saved and recently-viewed
  values, the `/discover/studios` route and search keys.
- Checked at 412px against the live database after the rename: Discover, a studio's booking page
  and Market render, with no horizontal scroll.

### Changed — studio tables become bookables (3 Oct)

- **Applied live** (owner, 3 Oct): the migration ran unchanged from `161ee4e` and every built-in
  check passed. Snapshot: `supabase/dumps/2026-10-03-before-bookables.sql` (definitions and counts,
  no user data).

- **Migration `20261003130000_bookables_rename.sql`** (not applied): `studios` → `bookables`,
  `studio_rooms` / `_blocks` / `_equipment` / `_photos` → `bookable_…`, every `studio_id` →
  `bookable_id`, `reviews.target_studio_id` → `target_bookable_id`, `booking_requests.studio_name`
  → `bookable_name`, and the four studio-named functions renamed. The 12 functions that name them
  are rewritten from their live definitions by exact name swaps. Compatibility views (security
  invoker) and wrapper functions keep the old table and function names working; the two renamed
  columns on `booking_requests` and `reviews` can't keep an old name, so this and the code below go
  live together. It rolls back unless the counts are 21 / 25 / 0 / 116 / 57, reviews 43 and
  bookings 10, and every review, booking, room, equipment and photo link is unchanged. Nothing is
  deleted: the 57 photo rows and all 43 reviews carry over.
- **Code:** every query, row type and RPC uses the new table, column and function names, and the
  generated database types match. `src/lib/studio-*.ts` are `src/lib/bookable-*.ts`. Constraint
  names in join hints (`studios_owner_profile_id_fkey`), on-screen words, the `/discover/studios`
  route and stored values (`studio`) are unchanged.
- **Not yet:** exported names such as `getStudioCalendar`, `DiscoverStudio` and `StudioCard`, and
  `studio-setup.tsx`; the cleanup migration that drops the compatibility views and functions.
- `AGENTS.md` names the bookable tables and says the `studio*` shims are temporary.

### Changed — business-media takes 5 MB; how migrations are applied (3 Oct)

- **`business-media` limit is 5 MB** (owner), was 10: migration
  `20261003120000_business_media_5mb.sql` (snapshot `2026-10-03-before-business-media-5mb.sql`).
  The app checks the same 5 MB on the resized photo before uploading. Other buckets are
  unchanged.
- `20261003110000_business_media_bucket.sql` was applied directly to the live database by the
  owner (Lovable out of credits), unchanged and verified: `business-media` and its four rules are
  live, the `studio-media` rules are gone. The empty `studio-media` bucket stays until removed
  from the Storage dashboard.
- **`AGENTS.md`:** while Lovable is out of credits, a committed migration may be applied directly by
  the owner, unchanged and verified afterwards; `schema_migrations` stopped being updated after
  `20260918160000` and is not a record of what is applied, and nobody writes to it.

### Fixed — studio photos could never upload; their bucket is renamed for its job (3 Oct)

- The four `studio-media` storage rules checked the file's folder inside a subquery on `studios`,
  where a bare `name` meant the studio's display name, not the file's path, so the check never
  passed: owners could not upload, replace or delete studio photos.
- Migration `20261003110000_business_media_bucket.sql` creates **`business-media`** (same limits)
  with the rules saying `objects.name`, and drops the old rules and the empty `studio-media`
  bucket. The code uploads to and removes from `business-media` (`BUSINESS_MEDIA_BUCKET`). The
  first fix, `20261003100000_fix_studio_media_policies.sql`, was never applied and is deleted.
  **Not applied yet:** the policy snapshot is committed first, then Lovable applies it after the
  merge, then one facility photo upload confirms it.
- **Location data never leaves the phone in a public photo.** The resize used to hand back the
  original file when it was already small or when re-encoding came out bigger, with its EXIF and
  GPS position inside. Every public photo (profile, cover, gallery, listing, facility) is now
  always re-drawn, which drops all metadata (checked in Chromium: a JPEG with a GPS tag comes out
  with neither EXIF nor GPS, as WebP or JPEG); a photo that can't be re-drawn is refused with
  "Couldn't prepare this photo. Try another one." Verification documents upload as picked, to a
  private, owner-only bucket.
- **`AGENTS.md`:** why browser uploads are allowed (the storage rules enforce ownership); the
  `objects.name` rule; storage, tables and files named by the job, never one persona, with the
  media bucket table; no new table, bucket or rename without owner approval; migrations applied
  through Lovable, never by hand; snapshots hold definitions and counts, never user data; the
  route count (27 of 146 in folders). `CLAUDE.local.md` is git-ignored.

### Changed — uploads stay in the browser, with conditions (3 Oct)

- **Owner decision:** photo and document uploads keep going from the browser straight to Supabase
  Storage, into the user's own folder under storage RLS. `AGENTS.md` records this as the one
  exception to "no client-side Supabase writes"; the row that points at a file is still written
  server-side.
- **Gallery photos are resized** before upload (`downscaleImage`), like profile, cover, listing and
  studio photos already were; they went up at full camera size.
- **A big phone photo is no longer turned away.** The size check used to run on the picked file,
  so a 12 MB original failed a 10 MB limit it would have met once resized. Now a photo up to 25 MB
  can be picked (`checkPickedImage`: JPEG, PNG or WebP), and the bucket's limit (5 MB avatars,
  10 MB others) is checked on the resized file that actually uploads. The buckets enforce type
  and size themselves as well.
- Verification documents are unchanged: JPEG, PNG, WebP or PDF under 10 MB, uploaded as picked so
  they stay legible.

### Changed — tokens and brand (P1-14, 3 Oct)

- **Purple is the category badge's alone.** `TrustPill` is neutral ink on grey; a rental's "Offer
  sent" is a warning tone. Spotify's sharing radios are ink, not a resting pink.
- **`--primary`, `--ring` and `--selected-bg`** point at `--ink` instead of repeating `#0d0d0d`.
- **Skeletons pulse at 1.4s** (`--animate-pulse`), not Tailwind's 2s.
- **Weight 800 is gone:** every `font-extrabold` is `font-bold` (marketing, Gear CTA, a price).
- **Tracking is normal.** Every `tracking-tight`/`wide`/`widest`/`[-0.02em]` in app code is removed,
  wordmarks included. The one exception is the splash's all-caps label, with its reason beside it.
- **10/11px:** every `text-[10px]`/`text-[11px]` in product code is metadata or a compact label
  (count badges, timestamps, avatar initials, chart and player labels), so all stay.
- **`AGENTS.md`** says both rules (token decisions 2 and 3): 10/11px only for metadata and compact
  labels, no other `text-[Npx]`; normal tracking unless a named role and reason sit beside it.

### Changed — data access moves server-side (P1-11, 3 Oct)

- **Sign-in methods** are read and removed through server functions
  (`src/lib/identities.functions.ts`), not by Supabase Auth calls from the browser. The server
  refuses to remove an account's last method before asking Supabase, and only removes one of the
  caller's own. The row uses React Query: loading, an error with retry, per-method pending.
- **Plays** are recorded through a server function (`recordPortfolioPlay`), not a database call from
  the browser. The database still decides what counts.
- **Still direct from the browser, pending a decision:** photo and document uploads to Supabase
  Storage (`gallery.ts`, `listing-photos.ts`, `studio-photos.ts`, `profile-images.ts`,
  `verification-documents.ts`). Reads that stay client-side by design: taxonomy options and the
  username-availability check.

### Changed — the smaller calls (P1-8 #14, 3 Oct)

- **Saved searches show.** They were stored (`saved_searches`) and could be saved from Market and
  Search, but no screen listed them. Bookmarked has a Searches tab (`SavedSearchList`), with
  loading, empty and error states. **`SavedSearchRow`** is one link that runs the search again,
  with a separate 48px remove that deletes the stored record. It refreshed the wrong cache key
  (`saved-searches`); it now uses the one the search screens save into. Its date is the stored
  date, not "3 days ago".
- Bookmarked's tabs key off values (`Segmented` labels), and a failed load is `LoadError`, not an
  empty state.
- **`DownloadCta`** no longer requires an iOS link: MusicLinkd ships on Android only.
- **Removed:** `ServicesProvided`, `PhotoPicker` and `MediaUploader` (no consumer).
- **Kept as canonical:** `ExperienceCard` (no screen draws it yet), `ServiceCard`,
  `ImagePickButton`, `GalleryEditor`, `PhotoSlots`, `BottomCta`, `DownloadCta`.

### Changed — one profile completion (P1-8 #13, 3 Oct)

- **`ProfileCompletion`** draws completion from `profileGaps` everywhere: profile edit's "Finish your
  profile" and the end of onboarding's "Profile strength". Home's figure was already
  `profileGaps`.
- **Onboarding's number was wrong.** `completionPercent` counted portfolio, services and
  verification as never done (hard-wired `false`), so a finished profile read as half done; it now
  measures the profile just saved with the same ten checks. `completionPercent` is removed.
- **Removed:** `CompletionCard` (no consumer; its missing-item links took any string as a route).
  `ReadinessCard` stays for onboarding's next-step hand-offs. `profileGaps` reads only the ten
  fields it checks (`ProfileGaps` type), so a draft can be measured before it is a row.

### Changed — one set of state surfaces (P1-8 #12, 3 Oct)

- **`EmptyState`** (kit) is the one empty state, with a semantic `kind`: `default`, `no-results`,
  `filtered`, `action-required`. Each kind draws a layout screens already used (no new layouts);
  the old `variant` prop is gone. The six Market empty states that showed an emoji (📭 🎚 🛍️ 🤝 🎸
  🔍) show Lucide icons. Booking's empty states keep their calendar icon in the default layout.
- **`LoadError`** is the error state: the bookings list and a studio's availability use it, with
  Try Again. **`OfflineBanner`** (kit) is the offline state: booking and onboarding pass their own
  words. **`StateCard`** (kit) replaces the portfolio and QR copies. **`Loading`** is built on
  shadcn's `Skeleton`.
- An empty profile section is `EmptyState` with `ProfileCta`, the owner's typed way out (profile
  edit, or new work of one kind).
- **Removed:** Market's and booking's `EmptyState` wrappers, booking's `ErrorState`, booking's and
  onboarding's `OfflineBanner`, `ProfileEmpty`, the portfolio and QR `StateCard` wrappers, QR's
  `Skeleton`, `RentalSkeleton` and `LoaderSkeleton` (`src/components/skeleton.tsx`, no consumer).

### Changed — filters and reports (P1-8 #11, 3 Oct)

- **`ReportSheet`** is the one report sheet: any subject (listing, rental, profile, review) with
  reasons for that subject, keyed by value and stored as their label. Reasons are radios with a
  checked state, nothing is preselected, and Send stays off until one is picked. Listing pages
  report the listing (or rental) by its row id; the seller page and the profile More menu use it.
  "Nobody is told who reported this" stays; nothing claims a moderation team.
- **Removed:** `RentalReportSheet`, `RentalFilterSheet` (no consumer) and `filter-sheet.tsx`'s
  `FilterSheet` (no consumer). `MarketFilterSheet` is the filter sheet.
- **Filters key off values.** Market's type, condition, fulfilment and price filters store keys
  (`sale`, `like_new`, `pickup`, `under_10k`…) with their wording beside them
  (`src/lib/market-filter.ts`); a category's sort does too (`SortSheet` takes `labels`).

### Changed — one calendar, one price breakdown (P1-8 #10, 3 Oct)

- **`AvailabilityCalendar`** is the one calendar. A studio picks a day from its real hours
  (`single`); a rental picks a range around the owner's blocked days (`range`, with the minimum
  days and notice in the legend). Month buttons are 48px icon buttons, not "‹ ›" glyphs.
  **`RentalCalendar` is removed.**
- **`PriceBreakdownCard`** draws rentals too: the refundable deposit held apart, "Estimated total"
  and the estimate note. The rental maths moved into data (`rentalPriceLines`,
  `src/data/rentals.ts`). **`PriceBreakdown` is removed.**

### Changed — the studio booking record (P1-8 #9, 30 Sep)

- **`StudioBookingRecord`** draws a stored booking request for either side: the studio's requests
  queue and workspace lists (who asked, space and room, when, notes, the screen's actions) and My
  bookings (the studio, the reply; the whole record opens the booking). It replaces three
  route-local lists. No price is shown: nothing is paid in the app.
- **Statuses** come from one record typed to the database's statuses; the `as BookingStatus`
  casts and the declined→rejected remapping are gone. A confirmed session whose day has passed
  reads as completed (`shownBookingStatus`), on both sides.
- **Tabs key off values**, not their wording (`Segmented` takes `labels`).
- **Pending is per record** (Reviewing locks only its own request); buttons are 48px.
- `BookingTimeline` no longer draws a "·" glyph for a step not reached.
- **Removed:** `ProviderRequestCard` (no consumer; typed to design-time bookings).
- `BookingCard` stays for rentals, `BookingSummaryCard` for the checkout draft.

### Changed — work media (P1-8 #8, 30 Sep)

- **`MediaEmbed` is the one player.** A work's own page plays audio and video through it; a direct
  audio file there is drawn as a waveform (`waveform`), and a link that doesn't embed says where it
  plays. **Removed:** `AudioPlayer`, `VideoPlayer` and `AudioPreview`. A video work no longer shows
  a second "Open media link" beside its player; that link stays for works that are neither audio
  nor video, with an icon rather than the "↗" glyph.
- **Discover's trending audio** is drawn as tracks (`AudioTrackCard`), not video cards.
- **`FeaturedCard` is removed.** No real profile ever had one (`featured` came only from the
  design-time profiles); a featured work is a state of its own card. The fixtures' `featured`
  blocks (Unsplash photos, "812k plays") are gone; `linked-profiles.ts` keeps its lines under a
  local type because the migration generators never read them.
- `AudioTrackCard`, `VideoCard` and `PortfolioMediaTile` stay separate Blocks.

### Changed — reviews (P1-8 #7, 30 Sep)

- **`RatingSummary`** is the rating at a glance: `full` on the Reviews screen (average, stars, a
  bar per star) and `inline` above a profile's review rail (the profile's own inline summary is
  gone). Both read stored reviews only.
- **Reviews screen:** while reviews load, or when they fail, it shows loading or an error, not "No
  reviews yet".
- **`MatchBar` is removed.** The viewer's fit to an opportunity uses `ApplicantFit`, the line
  applicants' fit already used (its reviews line is left out when no rating is passed).

### Changed — opportunities and applications (P1-8 #6, 30 Sep)

- **`ApplicationCard`** and **`ApplicantCard`** are rebuilt on the database records
  (`MyApplication`, `ApplicantSummary`) and used by My applications and Applicants; their old
  bodies read design-time types and had no consumer. Status labels and tones come from one record
  per view (`APPLICANT_STATUS` also names the board's columns).
- **Pending is per card.** Withdraw, Shortlist, Accept and Decline lock only the card being
  answered, not every card in the list. Buttons are the 48px control height (they were 40px).
- **Dates, not "ago".** An opportunity carries its stored timestamp (`postedAt`) and the card
  shows the date; applications show the date they were sent.
- **Applicants, signed out:** a sign-in state, not "No applicants here yet" over a query that never
  ran.
- **A profile's opportunities** use `OpportunityCard` from the same rows and columns as the
  Opportunities screen. The profile's own `OpportunityCard` (and its "Respond" link to the inbox,
  which answered nothing) and the `OpportunityItem` type are removed, with the design-time sample
  opportunities on two fixture profiles. `linked-profiles.ts` keeps its lines under a local type:
  the migration generators never read them.

### Changed — the marketplace item card (P1-8 #5, 30 Sep)

- **`ProductCard`** (through `ListingCard` / `ListingTile` / `ListingGrid`) is drawn with tokens:
  no raw hex, no `cqw` type sizes or radii, no letter-spacing, no navy shadow (`shadow-sm`). The
  owner's reference proportions are kept (photo in a rounded frame inside the card).
- The save heart is a sibling of the card's link, not a button inside it.
- The badge's motion is keyed off the listing's condition and type, not off the badge's words.
- The round button shows an arrow to the listing, not a shopping cart: nothing is bought in the app.
- `ProductItem.opens` is gone: it was ignored, every product opens `/marketplace/l/$id`.
- **A profile's Marketplace rail** uses `ListingTile`, the Market's own card, from the same listing
  rows. **Removed:** `MarketEntryCard`, the `MarketEntry` type, `EquipmentGrid` and
  `productFromRental` (no consumer), and the two hard-coded sample listings (Unsplash photos) on the
  design-time profiles in `src/data/profile.ts`.

### Changed — rental provider (P1-8 #4, 30 Sep)

- `ProviderSummary` shows initials when a provider has no photo (`PersonAvatar`), and no longer
  opens an empty stats row when the only figure is a zero rating.
- Removed `providersOf` (no consumer). `ProviderCard` stays the provider Block; its destination is
  the seller page (P0-9, intentionally retained: a seller and a rental provider are one party).

### Changed — one seller Block (P1-8 #3, 30 Sep)

- **`SellerCard`** is the seller Block. Its listing count comes from the database
  (`countSellerListings`: the seller's listings open for browsing, services included). The listing
  page counted from its own catalog, which leaves services out, so it undercounted. It shows
  nothing while loading. A seller with no photo shows initials (`PersonAvatar`).
- **Removed:** the `SellerSummary` component (no consumer; carried a stored-copy "Replies within"
  line), the `SellerSummary` type of the same name, `SellerRow` and `sellersOf` (no consumer).

### Changed — one studio / business card (P1-8 #2, 30 Sep)

- **`StudioCard`** has a `featured` state (photo-led, details on the scrim) and Discover's two
  business rails use it; **`StudioMediaCard` is removed**.
- A business with no profile and no booking page renders as a plain card or row, not a focusable
  link that swallows the tap (`StudioCard`, and `StudioRow`, which had no guard).
- **Previews tell the truth.** Onboarding's business preview had a 4.9 rating from 38 reviews, a
  ₹2,500/hour rate, gear and an Unsplash photo; it now shows a new business as it is: no rating,
  rate, photo or badge. The business-setup preview no longer shows a verified badge.
- Name sizes follow the person cards: card `text-2`, row `text-sm`.

### Changed — one person Block (P1-8 #1, 30 Sep)

- **`PersonRow`** is the one row for a person: the directory, search, connections (all three tabs)
  and an opportunity's poster. It takes an `action` slot (default the save heart; Accept / Ignore,
  Message or "Requested" on connections; nothing for a poster), a `detail` line, and a person with
  no username (no link). Photos go through `PersonAvatar`, so a missing photo shows initials.
- **`PersonCard`** has a `featured` state (photo-led, name on the scrim) that replaces
  `PersonHeroCard` on Discover. A person with no photo now shows initials, not a building icon.
- **Names:** a card's name is `text-2`, a row's `text-sm` (they were the other way round).
- **Connections:** Accept and Ignore lock while that request is being answered, and the chosen one
  shows it is working.
- **Onboarding preview:** the "your talent card" preview no longer shows a verified badge nobody has.
- **Removed:** `PersonHeroCard`, the messages route's own `PersonRow`, `PosterRow`, and
  `CollaboratorCard` (no consumer).

### Removed — replacement trace for three Blocks retired earlier (P1-7, 30 Sep)

Checked at `fix/p0-truth`: no reference to any of the three remains in `src`.

- **`StatRow`** (Connections / Followers / Plays / Credits strip) — deleted in `473c82f` (22 Sep).
  Its job was **dropped, not moved**: Home no longer shows a stat strip (owner rule: no stat strips
  on profiles or Home). Plays live on the owner's Performance screen (`WorkAnalytics`).
- **`QrSheet`** — deleted in `3f637b7` (25 Sep) as dead code, imported nowhere. Its job moved to the
  profile `ShareSheet` (now drawing a real `QrCode`) and the `/identity/qr` screen
  (`QrIdentityCard`).
- **`BookingListCard`** — deleted in `6ec8da8` (18 Sep) with the orphaned `bookings/$ref` screens
  that were its only consumer. Booking lists are drawn by `/bookings` and the business booking
  screens' own rows, which P1-8 #9 folds into `StudioBookingRecord`.

### Fixed — P0: nothing on screen claims what didn't happen (30 Sep)

- **Rental dates.** `RentalCalendar` works in full `YYYY-MM-DD` days, moves month to month, opens on the
  chosen start or today, and can't pick a past or blocked day (blocked days were matched on day number
  alone). The request screen no longer preselects 18–22 Aug or writes year 2026 / month 7:
  it sends the dates picked, won't continue across a blocked day, and `requestRentalBooking` rejects
  malformed, reversed, past or blocked ranges on the server. The confirmation reads "Request sent", not
  "Rental confirmed"; "Save Draft", which saved nothing, is "Back".
- **Rental "today" is India's day** (`todayInIndia`, `src/lib/when.ts`), on the server that draws the
  page and the browser that hydrates it, and in the request check. Between midnight and 5:30 am
  India time the server's UTC clock drew yesterday as selectable, then the browser redrew it.
- **Rental price.** The invented "Platform fee (2%)" is gone. `priceFor` applies a weekly or monthly
  rate only when the owner set one: a stored 0 priced a week at ₹0.
- **Studio availability.** The hash-generated schedule (`availabilityFor`, `nextAvailableDate`) is
  removed; `AvailabilityCalendar` takes the studio's real day and has no fallback. A studio with no
  opening hours shows "Availability not set", and a failed calendar read is an error, not an empty week.
- **"Instant booking" / "Instant confirmation"** removed: every booking is a request.
- **Profile More sheet.** Copy link (after the clipboard resolves), Save to shortlist (`saved_items`) and
  Report profile (`reports`, with a reason) work. Restrict and Block have no backend and show disabled,
  "Not available yet". The trust-team footer and the "the team will look at it" toast are gone.
- **Saves.** Marketplace and rental cards save through `saved_items` with the listing detail's hook,
  roll back and say so on failure, and show no heart when there is no row to save. Opportunity saves
  live in `saved_items` only (a device-only list is moved there once), and a failed save rolls back.
- **Offers never sent.** `OfferSheet` passed the listing's slug to `makeOffer`, which takes the row uuid,
  so every offer failed, silently. It sends the uuid and says when it fails.
- **Media.** An unembeddable link reads "Open on {site}" and opens it, instead of "Playing in
  MusicLinkd" with animated bars. `AudioPlayer` and `VideoPlayer` go through `MediaEmbed` rather than
  feeding a page URL to `<audio>`/`<video>`. `AudioTrackCard` no longer invents "3:42", "Producer &
  Mix" or an "In-app lossless preview" waveform, and shows no play button without media.
  `FeaturedCard` drops its hard-coded mastering copy and its play button, which played nothing.
- **QR.** The share sheet draws a real, scannable code of the profile URL (`QrCode`); `QrBlock`, a hash
  pattern labelled "Profile QR code", is deleted. `QrCode` shows an error when generation fails.
  "Copied" appears only after the clipboard write resolves (`copyText`).
- **Failures shown as facts.** Sign-in methods, contributor search and Spotify show an error with a retry
  instead of "This is your only way to sign in", "Not on MusicLinkd yet" and "Not available yet". The
  portfolio header no longer defaults to "Public".
- **Play counts.** A play is recorded when the browser's player reports playback starting
  (`MediaEmbed` `onPlay`), not when a play button opens the player. An embedded source's player
  (YouTube, Spotify, SoundCloud) reports nothing to the page, so plays there are not counted.
- **Plays before the fix.** Rows recorded before it can't be told apart from real plays, so they are
  marked by date (`PLAYS_COUNTED_FROM`, `src/lib/plays-cutoff.ts`): Discover's Trending work ignores
  them (ranked from the rows in `listTrendingWork`, since the RPC only takes whole days), the
  Performance screen counts the last 30 days its title already names, and both owner views say
  "Plays counted from {date}". The Performance screen's "There's no analytics table yet, so these
  figures aren't tracked" is removed: plays are tracked.
- **Uploads.** A multi-photo upload keeps the photos that made it and names the ones that didn't.
- **Fabricated figures.** "72,000+ verified pros" (Gear CTA, sell page meta), "248 results" (filter
  sheet) and the local-only review "Helpful" count are removed.

### Fixed — the splash can't hang (30 Sep)

- **Session read.** `useAuth` no longer waits on `getSession()` forever. It can stall on a token
  refresh over a bad network, a lock held by another tab, or the Lovable preview's storage broker
  (`previewAuthStorage.ts`, generated, untouched). After 2.5 s, or on a failed read, it uses the
  session supabase-js saved in this browser; the real answer replaces it when it arrives.
- **Profile read.** The splash stays at most 5 s from the moment the app opened, the session read
  included. Unanswered, an account made in the last 10 minutes goes to onboarding (read from the
  saved session, no network); anyone else goes to Discover, as a failed read already did.
- **Expired saved sign-in.** If the saved copy was used and the real read then says nobody is signed
  in, the app says the sign-in expired and opens Welcome.

### Fixed — profile visibility has three values (15 Sep)

- **Public, MusicLinkd members, Limited** everywhere (owner: "keep 3"). The profile edit screen offered
  Connections only and Private and saved `connections` / `private`, which nothing else understood; it now
  uses onboarding's three options. The profile page labels the stored value, and the settings privacy
  list matches. Migration `20260915150000_profile_visibility_three` (not applied yet) moves saved
  `connections` and `private` rows to `limited` and adds a CHECK for the three values.
- Also resolved leftover merge-conflict markers in this file; both entries are kept.

### Changed — taxonomy: single option names, and the app's option lists in the database (15 Sep)

- **No "/" in any option label, ids renamed to match** (owner, 15 Sep). Migration
  `20260915110000_taxonomy_single_names_and_options` (generated by
  `supabase/generators/taxonomy_single_names.py`; not applied yet) renames genres `bollywood_filmi` →
  `bollywood`, `bhajan_kirtan` → `bhajan`, `punjabi_folk_bhangra` → `bhangra`, `garba_dandiya` → `garba`,
  `hiphop_trap` → `hiphop`, `rock_metal` → `rock`, `edm_synthwave` → `edm`, `lofi_chill` → `lofi`,
  `acoustic_unplugged` → `acoustic`, `rnb_soul` → `rnb`, `jazz_blues` → `jazz`, `reggae_dub` → `reggae`;
  instruments `keyboard_synthesizer` → `keyboard`, `drums_percussion` → `drums`, `drum_machine_sampler` →
  `drum_machine`; person type `wind_player` → `flautist`; ID type `company_pan_gstin` → `company_pan`. It adds
  Trap, Metal, Blues, Sampler and GSTIN after their parents, shortens the person-type labels (Singer,
  Rapper, Keyboardist, Drummer, Sitarist, Violinist, Flautist) and DJ Controller, keeps flute only under
  Flautist, and moves every stored reference (profile roles, instruments, genres, specialisations,
  headline, discovery prefs and onboarding draft, role details, opportunity genres, marketplace item
  categories, the rule tables). Imported role and title text loses its "/" too.
- **New published categories** from the app's copy: `verification_types`, `work_types`,
  `profile_visibility`, `link_platforms` (with Simple Icons slug, brand colour and placeholder),
  `intents`, `work_modes`, `available_for`, `service_categories`, `pricing_models`.
  `metadata.app_key` holds the value the app stores today.
- The earlier generated migrations (`20260914120000`, `…150000`, `…170000`, `…180000`) are regenerated
  with the new slugs, so a fresh database starts at them; the new migration then changes nothing.
- App: the Flautist role icon and profile type, the drums marketplace and rental subcategory, and the
  opportunity category match (whole role name, no "/" split) use the new values.

### Changed — business accounts and bands read the database (15 Sep)

- **One username namespace, two account kinds.** `/profile/<username>` shows the business profile screen
  when the account has a `profile_business` row, otherwise the talent profile. The business profile screen
  is now `BusinessProfileExperience` (`src/components/ml/business-profile.tsx`), shared by `/business/$id`.
- **Business screens** (profile, manage, team, enquiry, portfolio, services, availability, reviews,
  dashboard, leads, analytics, verification) load the business account whose username is the id. What is
  not stored is hidden: leads and analytics show their empty states, blackout dates and enquiry/booking
  figures are gone, no verification check is complete, review photos and dates are not shown.
  `/business` lists the signed-in account when it is a business; `/discover/community` lists business
  accounts and bands from the database.
- **Bands** are groups of talent profiles, not accounts, keyed by slug. `/bands`, `/bands/$id` and its
  shows, portfolio, contact, invite and manage screens read `bands`, `band_members`, `band_events` and
  `band_releases`. Member name, photo and badge come from the member's profile; Manage and Invite show for
  the creator, owner and admins; My bands lists the bands you are in. Followers and invitations are not
  stored and not shown.
- **Migrations (not applied):** `20260915120000_business_accounts.sql` seeds Soundhouse Bandra
  (`soundhouse.bandra`) as a business account with its details, gallery, services, team, studio rooms,
  reviews and credits; `20260915130000_bands.sql` creates the band tables with RLS and seeds The Kite Notes,
  Static Bloom and The Bangalore Blues Project (five talent profiles in its line-up). Generator:
  `supabase/generators/import_groups.py`.

### Removed

- The stop-gap that opened `/bands/<username>` for a profile with a line-up (`getPublicBand`,
  `bandViewFromRecord`), the static demo business and band views (`businessViewFromStatic`,
  `bandViewFromStatic`) and `getBusiness` / `getBand`.

### Changed — new user: first work before the profile is published (15 Sep)

- After the last onboarding question, Continue opens **Your first work** (`/portfolio/new?from=onboarding`):
  choose a type, add the link and publish (no Save draft in this stretch), then the work page offers
  **Continue to review profile**. An account that already has published work goes straight to Review
  profile. The order is now questions → first work → Review profile → Profile published → All set → Home.
- Profile published reads "Portfolio ready" from the real portfolio and drops its "Add your portfolio" card;
  All set drops "Add portfolio work".
- The first-work screens are in the flow's motion order, so they slide forward and back like the questions.

### Changed — sign-in (15 Sep)

- **Welcome is the sign-in screen:** "Continue with Google" and "Sign in". The email button, the separate
  create-account screen and "Already have an account?" are gone. Welcome shows who is on MusicLinkd as a
  slow ticker of every published role from the taxonomy (with role icons), the splash logo glides into
  Welcome's corner (view transition `brand`), and the buttons are the shared pill `Btn`.
- **Sign in = mobile + 6-digit code** (`/auth/phone`, titled "Sign in"), with **Sign in with email**
  (`/auth`): email + 6-digit code (`signInWithOtp`, `verifyOtp` type `email`). No passwords, no Forgot
  password, no sign-in/sign-up modes; a new account is created on first sign-in. Status screens link to
  Sign in. `/auth/forgot` and `/reset-password` are no longer linked from anywhere.
- **Local testing:** `/dev/new-user` (dev server only) signs out, signs in as a new anonymous account and
  hands to the splash; on localhost, "Continue with Google" goes there. Needs anonymous sign-ins on in
  Lovable Cloud. Each run is a real account in the database.
- With reduced motion on, staggered arrivals no longer wait out their delay before appearing.

### Changed — new user: onboarding (15 Sep)

- **About you:** the photo section and Area are removed; **date of birth and gender** are added. They are
  stored in the new owner-only table `profile_private` (migration `20260915100000_profile_private`),
  never on the public `profiles` row or its draft, and shown to no one else. Onboarding no longer clears
  a profile photo it doesn't ask for.
- **Contact:** each link field shows its platform's brand mark (Simple Icons, CC0); Instagram and YouTube
  show first and **Add more** adds the others. How people can reach you is icon chips, no descriptions.
  Who can see your profile is one row of three with icons, the chosen option explained underneath.
- **Review profile** shows the real profile header built from the answers, then one list of details;
  each row opens its step. The seven "Not added" boxes are gone.
- Role icons live in `lib/role-icons.tsx`, with their own marks for keyboard, drums, wind and the
  business roles.

### Changed — new user: portfolio (15 Sep)

- **Add work is link first.** Pasting a YouTube, Spotify, SoundCloud or any page link reads its title,
  cover and source on the server (`getLinkPreview`: oEmbed for the three, Open Graph otherwise; signed-in
  only, public hosts only, 5s and 512KB limits) and fills them in. The title is typed straight onto the
  page. Role, genre, year, contributors and description are one list of rows, each opening a sheet; a
  Public switch replaces the three visibility options. The simulated upload and the cover URL field are
  gone.
- **Work page actions** (edit, share, add another, delete) are icon buttons.
- **Work type icons** are line icons (`WorkTypeIcon`) instead of emoji; type rows and work cards have the
  press state.
- **Portfolio overview for a new user:** only the empty state and its Add work show until there is work;
  "Featured" only shows when it differs from "All work"; the settings glyph is an icon button. The
  signed-out "Sign in to manage your work" card is removed everywhere; `/profile/edit` sends a signed-out
  visit to Welcome.

### Changed — profile and verification (15 Sep)

- **Own profile (`/me`):** completion uses the real `profileGaps` instead of the seed 78%; Stats shows no
  seed figures for a signed-in owner; every empty-state button goes to the page that adds that thing (or
  is hidden when none exists); no "BASIC" badge for unverified people; no bare "@"; a load error has
  Retry; Copy link copies `/profile/<username>`. The owner actions are icon buttons. Availability sits
  next to the name. Music identity is one grouped list (icon + label over tags) instead of boxed tiles.
- **Labels (pills)** share one style app-wide (`pill` utility): small, medium weight, spaced capitals, on
  their own container; success and warn text use darker `success-strong` / `warn-strong`; labels on photos
  sit on ink.
- **Verification** shows only the badges that fit the person's roles (identity for everyone;
  professional for talent; business for business roles; studio & space for studios, venues and rental
  providers), no longer shows the seeded "Needs changes" / "Expired" statuses to real accounts, and lays
  trust signals out as a bento.
- `InlineField` gains `leading`, `type="date"` and `max`; its label is grey at rest, ink when focused, red
  when invalid, like `TextField`.

### Changed — new user: motion on the beat

- **Arrivals land on a beat.** Welcome, the onboarding intro and the two finish screens bring their blocks
  in one 90ms beat apart (`animate-rise`, `beat(n)`, `useArrival` in `flow-motion.ts`). Welcome plays the
  logo waveform, then the headline a word per beat. Each arrival plays once per page load, not again on Back.
- **Large title on onboarding steps:** when the question scrolls under the top bar, it replaces the
  step line there (Apple large-title behaviour); scrolling back restores it.
- **Chips spring when picked** (`animate-select`); chips already selected when a screen opens stay still.
- **A complete code pulses** box by box, left to right (`animate-meter`).
- **Finish screens:** profile strength fills after its card lands; to-do rows show an empty ring instead
  of a dot; next-step cards on Done have the press state and scale; bottom bars sit on the page ground
  with a scroll-aware divider, as on the steps.

### Fixed — new user: finish screens without a name

- "You're on MusicLinkd, there" and "Welcome aboard, there" read without the name clause when there is no
  display name. Done only says "Here's what it says right now." when there is a summary under it.

### Changed — new user: auth and onboarding states

- **Disabled filled buttons** use a faint ink container with faint ink text (Material 3) instead of a
  50% ink slab that read as a grey button, and fill to ink over 200ms when they become ready. Outline and
  ghost buttons keep 50%. `Btn` gains `pending`: looks disabled but still takes the tap, so onboarding
  Continue can still say what is missing.
- **Field labels** are grey at rest, ink while the field has focus, red when it is invalid.
- **Code boxes** ring all six in ink once the code is complete, while it is checked.
- **Show/hide password** icon pops when it swaps.
- **Onboarding bars:** the header's right slot keeps one width with or without Skip, so the progress bar
  no longer changes length between steps; the bottom bar sits on the page ground and its divider shows
  only while content continues under it.

### Changed — new user: onboarding motion and Android behaviour

- **Each question is a history entry.** A two-question screen's second question is `?q=2`, so the Android
  back gesture steps back one question, and the question change slides with the same shared-axis motion
  as a screen change (`flow-motion.ts` orders `?q=2` just after its screen). In-app Back from the next
  screen reopens it on its second question.
- **Keyboard Next on onboarding fields** moves to the next field instead of submitting a half-filled step;
  the last field or Go submits.
- **Chips at their limit** look disabled as before, but a tap now shakes the chip and vibrates instead of
  doing nothing (`Chip` `atLimit`).
- **Step header** is flat at rest; its divider fades in once content scrolls under it (Material top app bar).

### Fixed — auth bugs (no visual change)

- **Error messages.** "Confirm your email first" says a 6-digit code was emailed (it described a link).
  Password errors no longer show raw server text; reusing the current password gets its own message.
  Unknown errors show a plain next step, and the raw text goes to the console.
- **Keyboard.** Auth fields handle the Android keyboard's action key: Next moves to the next field, Go
  submits. Forgot password and Set a new password are now real forms, so Go works there too.
- **Forgot password** opens with the email typed on Sign in (kept for the tab, not in the URL), trims it
  before sending, and vibrates on error and on send.
- **Set a new password** checks both fields inline (strength, "These passwords don't match"), shows the
  button's loading state, and finishes through the splash (`/`), not `/feed`.
- **Continue with Google** on the email screen shows loading and ignores a second tap.

### Changed — one pill chip everywhere

- **`Chip` (`ui.tsx`) is the only pill chip.** It can lead with a circle holding an icon or an image
  (`media`), or nothing. States: selected (ink), pressed (state layer, small scale), focus ring, disabled,
  `aria-pressed` for toggles, 48dp touch area. Its 110 existing uses (filters, tabs, tags) pick up the
  style.
- **Pickers reuse it.** Onboarding's `ChipPicker` renders `Chip`s, left aligned. `SelectableChips` (portfolio) and profile edit's chips use `Chip` instead of their own
  buttons.
- **Roles:** "What do you do?" is one list of chips with the role's icon, ordered by group, with no group
  labels. It replaces the group tabs and the card grid; `ChoiceGrid` is gone.

### Changed — usernames: database rules, claimed once, then locked

Owner decisions, 14 Sep. Migration `20260914200000_username_rules.sql` (applied to the live database):

- **Format:** lowercase a–z, 0–9, dots and underscores, 3–30 characters, enforced by a CHECK. The existing
  hyphen usernames became dots (`aarav-mehta` → `aarav.mehta`), so their `/profile/` links changed.
  Static data in `src/data` was updated to match (username fields and profile links only; demo ids and
  studio, listing and opportunity slugs are unchanged).
- **Reserved names** live in `public.reserved_usernames` (brand, staff, system and top-level route names).
  The database refuses them, and `username_available()` reports them as taken.
- **Locked once set.** Signed-in users can't change or clear a username; the service role (MusicLinkd
  admins, dashboard) still can.
- **Onboarding claims on Continue.** Autosave no longer sends the username. Continue on About you claims it
  (`claimMyUsername`), with a loading button. A taken, reserved or invalid name keeps the person on the
  screen with the reason under the field; a network failure shows a notice. Once claimed, the field is
  read-only.
- **Profile edit** shows a set username read-only and no longer sends it. An unset one can be saved once,
  with taken, reserved and format errors named.

### Changed — new user: onboarding is one wizard, 8 screens

- **Instruments:** "What do you play?" allows up to two, with no primary instrument. Continue (with one or
  both picked) switches the same screen to "How long have you played?", one dropdown per instrument.
  Removing an instrument removes its answer.
- **Role waits for Continue too.** Picking a main role no longer jumps to "Anything else you do?";
  Continue does.
- **Next and Back move through questions, not only screens.** Arriving forward opens a screen's first
  question; Back from the next screen reopens its last one (Languages → How long have you played? → What
  do you play? → Anything else you do?).
- **Removed screens:** experience (no instruments means no experience question) and specialisation.
- Order now: About you, What do you do?, instruments, languages, genres, How do you work?, What brings you
  to MusicLinkd?, How people find and reach you.

### Changed — new user: onboarding goes from 19 questions to 10 screens

Grouped as the owner set out on 14 Sep. Each screen reuses the components the old steps used; nothing new
was drawn.

- **About you** (`identity`) holds photo, display name, username, state, city, area and the short bio
  (was identity, photo, location and bio). City is required here now. An empty username shows a hint
  instead of an error.
- **What do you do?** (`role`) asks for the main role, then, on the same screen, "Anything else you do?"
  (up to two, optional). Back returns to the main role. Replaces role and secondary-roles.
- **Experience** per instrument is stored in `discovery_prefs.instrumentExperience`; the profile's single
  `experience` is the highest of them. (Moved onto the instruments screen the same day, see above.)
- **How do you work?** (`work-mode`) adds "Available for" (was its own step).
- **What brings you to MusicLinkd?** (`intent`) adds "Show me more" (was discovery).
- **How people find and reach you** (`contact`) holds links, contact options (WhatsApp added) and
  visibility. It is the last step. Continue stays blocked while a link is malformed.
- **Business** is no longer asked in personal onboarding; it belongs to the business account flow.
- Instruments, specialisation, languages and genres keep their own screens.
- Preview's Edit buttons for availability, links and visibility open the combined screens.

### Removed — new user: the "You're in" screen

- Creating an account goes straight to onboarding (through the splash). `/auth/success`, a stop Lovable
  added on 2 Sep with "Set up my profile" / "Skip for now", now redirects to `/` so any old link still
  lands correctly.

### Changed — new user: onboarding and Home follow the sign-in design

- **Step header.** Back is a plain arrow; "Profession · 3 of 17" is normal case; the progress bar is
  thinner; Skip is a text link. Save state is a quiet "Saving…" / "Saved" in the header, replacing the
  "Saving to your account…" box that appeared after every answer and pushed the question down.
  Offline and failed saves still show a notice.
- **"Why we ask"** is a quiet line with an info icon, not a grey box.
- **Fields and dropdowns** (`InlineField`, `SelectField`) match `TextField`: sentence-case labels,
  hover, focus, invalid and success states, and animated messages with icons. The dropdown keeps Android's
  native picker and gains a chevron.
- **Notices.** A blocked Continue says "Add the required details to continue" (it used a "We couldn't save
  that" error box). Failed choice loads offer Try again. All use `AuthNotice`.
- **Secondary actions are text links:** Finish later, Skip for now, Start over, Explore MusicLinkd first,
  Later, and preview's Edit (with a pencil).
- **No capital-letter labels** on these screens or Home: step count, field labels, "Next up", the
  readiness "To do"/"Done" (now read out to screen readers only), Home's wordmark and card eyebrows.
  "You're in" and Skip use real lists instead of typed "1." and "·" marks.

### Changed — new user: sign-in fields, validation, messages; email sign-up by code

- **Fields.** Labels are quiet sentence case above the field (were bold uppercase). `TextField` has
  states: hover on pointer devices, focus (ink border and ring), filled, invalid (red border and an
  animated message with an icon, announced and linked by `aria-describedby`), and disabled.
- **Validation.** Email, password, mobile number and reset email check when you leave the field and when
  you submit, then stay live while you fix them (`useFieldErrors`). Messages say what to do ("Enter an
  email like name@example.com"). A blocked submit vibrates.
- **Password strength fits above the keyboard.** A thin four-segment bar, the rating and the next thing
  to add, shown only once typing starts. The 180px checklist card is gone.
- **Phone.** One field with the India flag and +91 inside, formatted as 98765 43210, checked as a
  10-digit mobile number.
- **Links move.** `AuthLink` / `AuthTextButton`: underline on hover, dim on press, 48dp, optional icon
  ("Use email instead" has a mail icon; "Change number", "Resend code" and "Use a different email"
  have icons).
- **Top bar.** Back sits alone in its own row; the logo stays on the splash and Welcome.
- **Messages.** Form-level notices are compact: icon, one bold line, a sentence, an optional action, and
  they slide in. Toasts are Material 3 snackbars: ink surface, white text, bottom, four seconds.
- **Email sign-up uses a 6-digit code.** "Check your email" is now a code screen
  (`verifyOtp({ type: "signup" })`) with auto-verify, resend after 30 seconds and a shake on a wrong
  code, sharing `CodeInput` with the phone code screen. The confirmation link had been the flow since
  Lovable's first auth build (6b4728a, 2 Sep). The sign-up email template must include the code
  (`{{ .Token }}`) for people to receive it.

### Added — button states and motion

- **Every button has the same states.** Enabled; hovered on pointer devices and pressed, shown by a
  Material 3 state layer of the content colour at 8% and 12% (`state-layer` utility); focused, via the
  global ring; disabled at 50% and inert; and **loading** — `loading` on `Btn` and `IconBtn` swaps the
  icon for a spinner, keeps the label and width, sets `aria-busy` and ignores taps.
- **Motion.** A touch ripple grows from where the finger lands and fades over 550ms; presses scale 2%
  (5% for icon buttons); the state layer fades in over `--duration-1`. Reduced motion turns them off.
- **Used on new-user screens.** Create account, Send code, Verify and Resend now use `loading` instead of
  swapping the label for "Please wait…" or "Sending…". The Welcome sign-in rows, step Back, chips,
  choice cards, option rows and role group tabs share the state layer.

### Added — new user: Back on sign-in screens; three button shapes

- **Back on every sign-in screen after Welcome.** `AuthScreen` takes `back`: Create account and phone go to
  Welcome, the code screen to phone, email check to sign-up, forgot password and the locked, maintenance
  and offline holds to sign-in, sign-out to Profile. Back follows history like the Android gesture and
  uses that destination only when there is no history (a deep link, an email link). The splash,
  Welcome and "You're in" have none.
- **Buttons come in three shapes.** `Btn` / `BtnLink` take an optional leading `icon` (icon + text); text
  only is unchanged; `IconBtn` / `IconBtnLink` are icon-only, 40px to see and 48dp to touch, with `label`
  as the accessible name. Create account shows Google and phone with their icons, matching Welcome, whose
  Google mark now comes from the shared `GoogleIcon`.

### Fixed — new user: usernames are checked against real accounts

- **"Available" is now true.** The identity step compared usernames with a hard-coded list of five
  names, while `profiles.username` is unique across 97 profiles. A new person could pick "wugweb" or any
  imported name, see "is available", and then fail to save. The field now asks the database
  (`username_available`, a SECURITY DEFINER function for signed-in users that also sees non-public
  profiles) after a 400ms pause. It shows "Checking…", "is available" or "That one's taken", and
  Continue waits while a name is taken or still being checked. If the check can't run, the field makes no
  claim and the save decides.
- Seed first names (ananya, arijit, rahul) are no longer blocked; admin, musiclinkd, support and help
  are reserved.

### Fixed — new user: names, not IDs

- Welcome to MusicLinkd (`/onboarding/done`) shows the role and genres by name. It printed slugs such
  as "Role: music_director". The email-check tips use a real list instead of typed bullets.

### Changed — new user: business types come from the database

- "Do you represent a business?" lists the 12 business person types from the taxonomy (Recording Studio,
  Music Label, Venue, …) and saves the slug. It used a hard-coded list of 9. Profile published names the
  chosen type by its label.

### Fixed — new user: Home is yours, not the demo account's

- **Home reads the signed-in profile.** It showed the seed account to everyone: "Music Producer · Mix
  Engineer", 72% complete, 6 connection requests, 148 profile views, "Ananya Sharma wants to connect",
  a "Monsoon Tapes" EP to finish and a studio session. Now the role chip shows your own roles (taxonomy
  labels, hidden when none), availability comes from your profile, and completion uses `profileGaps`.
- **Next steps are real.** "Finish your profile" (to `/onboarding/resume`) shows until onboarding is
  complete, and "Add your portfolio" shows while your portfolio is empty.
- **Nothing made up.** There are no tables yet for requests, messages, views, activity, recommendations
  or applications, so those start empty or at zero, and the headline counter, the "For you" matches, the
  seed booking and the unread dot are gone. Activity shows its existing empty state. Open opportunities
  still counts the listed opportunities, now labelled "Open opportunities" instead of "Matching you".
- A signed-out visit goes to Welcome.

### Fixed — new user: the photo step uploads a real photo

- **No stock photo as your avatar.** "Take photo", "Choose from gallery" and "Use existing photo" each set
  an Unsplash picture after a fake 700ms wait, so a new person's profile could go live with a stranger's
  face. Take photo opens the camera (`capture="user"`), and Choose from gallery opens the file picker.
  Both upload to the `avatars` bucket in the user's own folder (`uploadProfileImage`) and save the
  public URL. The replaced file is deleted. Type and size errors show under the picker.
- **Remove clears the saved photo.** `avatar_url` is always sent, so removing the photo now empties it
  on the profile. "Use existing photo" and the "crop and reposition" line are gone, because neither
  existed.

### Changed — new user: roles, instruments, genres and languages come from the database

- **Onboarding pickers read the taxonomy** (`taxonomy_options`, published rows; `lib/taxonomy.ts`) and
  save slugs to the profile (`singer`, `acoustic_guitar`, `bollywood_filmi`, `hi`), matching the
  backfilled rows. The hard-coded lists in `data/onboarding.ts` are no longer used by onboarding.
- **Role: group first, then type.** 27 talent person types in 7 groups (Vocal, Instrumentalist, Creator,
  Technical, Media, Education, Other), so no screen shows more than 12. Business types stay in their
  own journey. Secondary roles use the same picker, capped at two and excluding the primary, as
  `persona_bucket` requires.
- **Instruments and genres come from `persona_bucket`** for the chosen roles and languages, 12 each at
  most, in the order the function returns. When the roles hold no instruments the step is skipped,
  including a step that stops applying after a role change. Choices already made stay visible even
  if the bucket no longer includes them.
- **Languages come before genres**, because regional genres are ordered by the languages chosen.
  Languages show their native-script names.
- Preview and the bio suggestion show labels, not slugs. Loading and error states cover the taxonomy
  and the bucket. Specialisation keys follow the slugs (`sound_engineer`, `music_teacher`).

### Added — optional steps say so (plan C2, new user)

- **Optional onboarding steps are labelled.** 15 of the 19 steps are optional in the step data; only
  identity, role, location and visibility are required. `StepShell` now shows "Optional" beside the
  question on those steps, next to the existing Skip, so "Step 9 of 19" no longer reads as nine more
  required answers.

### Changed — no inline colour styles in the kit (plan B5)

- **`components/ml` inline `style` went from 53 to 13**, and the 13 left are runtime values: seven
  computed progress widths, waveform bar heights, avatar and save-button `size` props, and the QR code's
  scheme colours. Tone maps in collab, booking, rental, profile and portfolio pills are class strings
  (`bg-success-container text-success` and so on), so they follow tokens and the ink palette. Media
  status uses a real dot instead of a `●` glyph. Added `ink-gradient` and `grid-cols-13`. `AGENTS.md`
  lists what may stay inline.
- Page transitions are skipped while the document is hidden, which removes the "Transition was
  aborted" console errors from backgrounded tabs.

### Changed — one status screen for sign-in holds (plan B3)

- **`AuthStatus`** in `ml/auth.tsx` (`tone`, `icon`, `title`, `body`, optional checklist, `actions`,
  `note`, `footer`) now renders `/auth/locked`, `/auth/maintenance` and `/auth/offline`. The tone picks
  the icon tile from container tokens (`danger-container`, `subtle`), so the two inline backgrounds and
  the `text-[13px]` in those files are gone. The container token already exists as `danger-container`
  (same value as `--destructive`). The email, phone, OTP, verify and forgot screens are not merged. The
  checklist uses a real list instead of typed bullets, and the Back links meet 48dp.

### Changed — onboarding is account-only

- **Answers save to the account, not the device.** Onboarding reads and writes
  `profiles.onboarding_draft` in the Lovable Cloud database. A signed-out visitor on any onboarding
  URL goes to Welcome, and the "Saved on this device. Sign in to keep your answers on your account."
  note is removed.
- **No answers carried between accounts.** The browser draft used to be one shared key
  (`ml.onboarding.draft`), so a second sign-up on the same phone started from the first person's answers.
  The browser copy is now per account and only backs up a failed or offline save. The old shared key
  is deleted on first load.

### Fixed — Book buttons (plan A1)

- **No Book button opens a dead booking.** Three links sent `/booking/svc-1`, a service id the booking
  flow does not know, so every one showed "This space is unavailable". The business page's Book opens
  that business's enquiry. The enquiry's "Book a room" card shows only when the business has a
  `bookableId`; no seeded business has one. An applicant's hire sheet offers their service enquiry
  when the applicant has a `serviceId`; no seeded applicant has one, so it offers "Start a
  collaboration" today. Both fields are new and optional, and no link was invented.

### Removed — state simulators from production (plan A2)

- **Demo controls render in development only** (`lib/dev.ts` `showDemoControls` = `import.meta.env.DEV`):
  Preview failure state (booking payment, portfolio upload), Demo states and Loading/Error buttons
  (booking schedule), States and Loading/Error/Offline (My bookings), the States cycler (Collaborations),
  Simulate success/failure (collab file upload) and Simulate a scan (identity scan). A production build
  contains none of those labels.

### Added — registration-flow motion and Android behaviour

Measured first at 412px across the 30 screens from Welcome to Home: no page motion; back buttons at
40×40 and "Skip" at 25×17 on 12 steps (48dp floor); inline auth links 15-17px tall; no `enterKeyHint` on
any input; the email and phone forms had no `<form>`, so the keyboard's Go key did nothing.

- **Shared-axis page motion.** Registration screens slide forward or back by their place in the flow
  (`lib/flow-motion.ts`, View Transitions through the router's `defaultViewTransition`). The Android back
  gesture animates the same way. The step header and footer hold still while the question moves, and
  the progress fill grows to its new width. Everything outside the flow stays instant. Honours reduced
  motion.
- **Back agrees with the system gesture.** In-app Back on a step pops history when the previous entry is
  that step (`lib/flow-back.ts`), instead of pushing a new entry the gesture would then walk forward to.
- **Feedback.** Chips, choice cards and option rows scale on press and their check pops in. Selection
  gives a light vibration on Android (`lib/haptics.ts`, one place to swap in Capacitor Haptics). Continue
  on an incomplete step shakes, vibrates and scrolls the message into view.
- **Keyboard.** Onboarding fields and the email and phone forms submit from the keyboard's
  Next/Go key. Inputs carry `enterKeyHint` and `autocomplete` (name, username, locality, URL,
  national phone). URL fields turn off autocapitalise and spellcheck. The viewport sets
  `interactive-widget=resizes-content`, so fixed footers ride above the keyboard.
- **OTP.** Six digits verify without a tap, so Android SMS autofill completes sign-in. The active cell
  shows a caret, digits pop in, and a rejected code shakes the row and clears it. `?phone=` in the URL
  no longer comes through empty (the router parsed it as a number).
- **Splash sound check.** The waveform mark is revealed left to right, like a playhead crossing a
  clip. The splash holds up to 500ms so it can finish, and does not hold at all under reduced motion.
- **Success moments** (`/auth/success`, Profile published) pop their icon once, and profile strength
  fills from zero. Sheets slide up over a fading scrim.
- **48dp touch floor** without resizing anything (`hit-area` utility): step Back and Skip, TopBar Back,
  password toggle, Forgot password, legal links, section "See all", preview Edit, the Home bell.

### Changed — ink is primary; pink is a rare brand accent

- **Primary is ink `#0D0D0D`.** Owner direction: the palette is black, greys and white, and pink is the
  brand colour used rarely (about 10%). `--primary`, `--ring` and the selected pair now resolve to ink, so
  every primary button, selected chip, progress bar, checkbox and focus ring is black. Selected chips are
  ink with white text; selected choice cards get an ink ring.
- **Pink is `--brand` (`text-brand`, `bg-brand`)** and appears on the logo mark, the notification and
  unread dots (Home, Notifications, Messages) and the Welcome tagline. `--gradient-brand` starts from
  brand pink instead of primary.
- **Pink links and tints are gone.** 125 `text-pink-strong` text sites became `text-foreground` (legal
  links on the auth screens are underlined), and 43 `pink-container` tints became `subtle` surfaces; the
  bottom nav active pill is the page grey. The `brand` StatusPill tone is an ink pill. This supersedes
  the `pink-strong` sweep below, and dark text on these grounds clears AA with margin.

### Fixed — logo mark on Welcome and Home

- **Welcome and Home show the MusicLinkd mark.** Welcome, the first screen a new user sees, had a
  text-only wordmark and now uses `Brand`, the waveform lockup on every auth screen and the splash.
  Home's header label gains the same mark. The Google "G" hex fills on Welcome carry a comment: they
  are Google's required brand colours, not token misses.

### Fixed — icons, not glyphs, in shared components

- **Lucide icons replace emoji and text glyphs** in the primitives, so every screen using them changes:
  the TopBar and profile Back arrow, the search bar (search and mic glyphs), talent cards (pin, heart,
  star), profile location and menu chevrons, the portfolio placeholder, the Featured toggle, tag remove
  and reorder arrows, opportunity rating, market selection and success ticks, the hire sheet options and
  collab activity icons. Inline background styles at those sites became token classes. Route-level emoji
  (for example Discover's quick categories) are not in this change.

### Fixed — pink text contrast

- **Pink text is `pink-strong` everywhere.** `text-primary` (#EA4C89) on text measured 3.03:1 on the page
  ground and 3.56:1 on a card, under the 4.5:1 AA floor. 126 text sites across 77 files, including the
  shadcn link button, now use `text-pink-strong` (#C7295F): 4.56:1 and 5.37:1. The 52 lucide icons
  keep brand pink, which clears the 3:1 icon minimum. Sorted by syntax tree: a class on a lucide or
  `svg` element is an icon; anything else is text. `text-primary-foreground` (white on pink) is untouched.

### Changed — 14px type step

- **`text-sm` is a token.** The scale gains a 14-15px step (`--type-sm`, Material bodyMedium 14sp),
  exposed as `text-sm` so its 302 call sites, the `Btn` label among them, stop resolving to Tailwind's
  default. No call site changed; at 412px the size moves from 14px to 14.05px. `AGENTS.md` lists the
  six steps. The generated `ml-tokens.css` in the guide repo still needs the step.

### Fixed — new accounts reach onboarding

- **Every sign-in returns through the splash**, which reads the profile: `onboarding_complete` goes to
  Home, a started draft goes to `/onboarding/resume`, anything else to `/onboarding`. Google sign-up,
  the email confirmation link, password sign-in and phone all used to land on `/feed` with an empty
  profile. If the profile read fails, Home still opens.
- **Phone sign-in is real, and honest when it is off.** `/auth/phone` sends a code with
  `signInWithOtp` and `/auth/otp` checks it with `verifyOtp`; Resend sends a new code. The phone
  provider is off on the auth server today, so the phone screen says it is not available and disables
  Send. Switching the provider on needs no code change. The "Preview mode" notice, which let people
  reach a code screen that could never succeed, is gone.

### Changed — 13 Sep 2026 token and route decisions

- **Radius is now the Material 3 shape scale:** 4/8/12/16/20/28/32/full.
  - Cards, rows and images went from 32px to 16px (`rounded-lg`, 372 call sites).
  - Small tiles, thumbnails and inputs are 12px (`rounded-md`, 66).
  - The Sheet top and the Dialog panel are 28px (`rounded-2xl`).
  - `rounded-md` call sites (14) moved to `rounded-lg`, so they keep their 16px.
  - Vendored `components/ui/` and arbitrary `rounded-[…]` are untouched. See `90a4676`.
- **Navy is now ink `#0D0D0D`.**
  - 33 classes, `Btn variant="navy"` renamed to `"ink"` (5 call sites), and `--gradient-navy`
    renamed to `--gradient-ink`.
  - Dark buttons, cards and scrims are neutral black instead of blue-tinted. See `81c8953`.
- **One spacing system.** `--spacing-xs/sm/md/lg` had zero uses and are removed. No visual change.
- **One secondary-text class.** 185 `text-text2` and 16 `var(--text-secondary)` became
  `text-muted-foreground` / `var(--muted-foreground)`, and both aliases are removed. No visual
  change. See `d526f17`.
- **Routes:**
  - `/band`, a hard-coded page for a band that isn't in the data, redirects to `/bands`.
  - The onboarding "Create band" button now goes to `/bands/new`.
  - The swipe deck moved from `/recommended` to `/recommendations/swipe`, and the old URL
    redirects.
  - The last `/talent/$id` links point at `/profile/$username`. See `e2471e7`, `d526f17`.
- **`AGENTS.md`:** records the M3 radius roles, ink, numeric-only spacing and
  `text-muted-foreground`. The "never Unsplash" line is removed; no such rule exists, and the
  team library in the guide repo is noted instead.
- **`AGENTS.md` chip radius:** chips move from `sm` (8px) to `full`, with buttons, pills and badges.
  Every chip, pill and badge in `src/components/ml/` already renders `rounded-full`, and the M3
  change kept chips as pills. The old line would have had new screens build 8px chips.

### Fixed — new-user journey: tokens, logo, onboarding

- **Band is not an onboarding step.** A band is a profile type, a group of individuals, set up after
  registration. The "Are you in a band or crew?" step, its `bandIntent` field and the "Create your band
  profile" card on Profile published are removed. Onboarding is 17 steps.
- **No prefilled person.** A new user's draft started as "Ananya Sharma" / `ananya.sharma`, so Identity
  showed as done before anyone typed. Name and username start empty.
- **Profile published.** Internal spec labels ("FLOW 03", "FLOW 16") no longer show on cards. The
  readiness actions open Portfolio, Services and Verification (all opened `/me`), and "Start
  verification" opens `/verification`. "Later" only shows when it does something.
- **Correct logo.** The auth and splash brand mark is the MusicLinkd waveform (`LogoMark`), not a generic
  music-note icon.
- **Tokens, not hard-coded values**, on splash, welcome, auth, onboarding and Home: arbitrary `text-[Npx]`
  and Tailwind `text-xs/lg/xl` use the `text-1..4` scale; `max-w-[430px]` is `max-w-app`; inline
  `style={{ background: "var(--…)" }}` is a class. New theme colours: `pink-container`, `pink-strong`,
  `success-container`, `warn-container`, `danger-container`. The auth notice's `#F59E0B` and `#16A34A`
  are the warn and success tokens. `StatusPill` and the talent card's language chip use classes too.
- **Icons, not emoji.** The role step ("What do you do?") and `VerifiedBadge` use lucide icons.

### Fixed — discovery entry points (route audit §7.1)

- **Discover.** Quick categories open the nearest real section: Talent and Events open `/categories`,
  Bands opens `/bands`, Marketplace and Rentals open the market, and Studios, Labels, Venues and
  Communities open `/discover/community`. Trending "See all" opens `/discover/music`, and
  the Nearby location opens `/discover/nearby`.
- **Recommendations.** Each reason chip opens "Why am I seeing this?" (`/search/why/$id`).
- **Search.** A history button in the header opens `/search/history`.
- **Profile owner.** Public opens your public profile at `/profile/$username`, or profile edit if you have no
  username yet. Stats has a "Full insights" link to `/profile/insights`.
- **Reviews.** Cards link to the reply, report and edit pages instead of an in-page sheet. The page links to
  "Ask for a review" (`/reviews/request`).
- **Collab.** Pending proposals come from the proposals data and open `/collab/proposals/$id`. Before this,
  one hard-coded card was shown.
- **Marketplace.** "Recently viewed" opens `/recently-viewed`.
- **Provider calendar.** Blocks for pending requests open the request (`/provider/bookings/requests/$ref`),
  not the booking detail.
- **Opportunities.** Links "Projects you can join" (`/discover/projects`).

### Fixed — navigation hubs (route audit §7.1)

- **Settings has an entry point.** Profile's owner panel has a Settings row. Before this, nothing linked to
  `/settings`, the only way to Business, Services and Sign out.
- **Profile owner panel targets.** "Manage portfolio" now opens `/portfolio`, "Manage services" opens `/services`,
  and "Availability" opens `/services/availability`. All three used to open profile edit.
- **Business owners reach their dashboard.** Manage has a Dashboard row, which leads to leads, analytics,
  services, availability, portfolio, reviews and verification. Business verification opens
  `/business/$id/verification`, not the generic chooser. The Back buttons on Manage and Team go to the
  business itself: they linked to the literal path `/business/$id`.
- **Service detail.** "Preview booking" opens the service's own enquiry. It opened the studio booking flow
  with a service id, which always showed "This space is unavailable".
- **Bands.** Message opens the band's contact page, and "Band portfolio" and the empty Music tab open the
  band's own portfolio, not your personal one. The Shows tab links to the band's full shows and
  opportunities page.
- **Booking conflicts.** Services availability links to `/services/conflicts`.

### Changed — app start

- **The app opens on a session check, not Discover.** `/` shows the brand mark while the browser
  session loads, then replaces itself with `/feed` (saved sign-in) or `/welcome` (everyone else).
- **Discover moved to `/discover`.** The bottom-nav tab, 21 links and back buttons, the feed tile and
  the scanned-code fallbacks follow it. The 404 page's home link stays on `/`, so it routes by session.
- **Welcome is the front door.** It gained "Already have an account? Sign in" for returning email
  users, and the signed-out prompts (avatar, portfolio card, profile edit, saving a work) open
  `/welcome` instead of the email form. The password-reset page still returns to email sign-in.
- **"Saved items"** in recommendation settings opens `/saved`; it pointed at Discover.

### Fixed

- **Link buttons are one element.** 241 `<Link><Btn/></Link>` pairs in 129 files (a `<button>`
  inside an `<a>`: invalid HTML, two tab stops, and screen readers announce both) are now
  `<BtnLink>`, a `createLink` anchor that shares `Btn`'s classes and keeps typed `to`/`params`.
  Hrefs are unchanged. Layout is unchanged except in `flex-1`/`flex-[2]` rows: the padding now sits
  on the flex item, so equal-share rows are truly equal (on `/recommendations`, Open is the same
  width as Save and Hide instead of 72px), and 1:2 pairs shift by about 15px.
- **`/feed` renders its data on the server.** A fake 450ms timer wrapped data that was already
  static, so the server sent only a skeleton. The greeting is now set after mount, so a UTC server
  no longer picks the time of day for a reader in another timezone.
- **`/feed` opportunity counts are derived** from `data/opportunities.ts` the way `/opportunities`
  derives them (open opportunities, active applications, shortlisted), not typed into the JSX.
  Both tile grids share one `StatTile`.
- **The `/feed` Bell opens `/notifications`**, not `/messages`, and its dot follows the unread count.
- **`ui/skeleton` is neutral** (`bg-subtle`) instead of a pink tint.
- **An unknown `/profile/$username` is a 404**, not Rahul Iyer's profile. The route loads the real
  row first, and a username with neither a row nor a seed profile throws `notFound()`.
  `/profile/me` redirects to `/me`.
- **No profile shows another person's sections.** Ananya, every Discover talent and real profiles with
  no seed used to spread Rahul Iyer's fixture. They now start from `emptySections()`, and a missing
  section renders its empty state. `/me` builds from the signed-in user's own record. The profile
  header and share sheet handle a missing photo, cover, role, location and availability, and the
  Verified tick shows only for verified tiers.
- **The Home headline counts real data.** "N new opportunities" counts the open opportunities (the
  list the tiles use) and links to `/opportunities`, instead of a hard-coded 9 linking to the swipe
  deck.
- **No casts on router links.** `Row`, `ActionRow`, `PrimaryPair`, the collab settings row, and the
  collaborator and marketplace-entry links take the router's typed `to` and `params`. The
  recommendation cards and help-page CTAs carry typed links. Typing them exposed two wrong
  destinations: the studio recommendation opened `/booking` (no such route) and now opens `/studio`,
  and the opportunity recommendation opened Home and now opens `/opportunities`.
- **QR destinations resolve.** Rahul's personal QR opened `/profile/rahuliyer` and the Stratocaster
  listing opened `/marketplace/fender-strat-62`; both 404. They now open `/profile/rahul-iyer` and
  `/marketplace/l/fender-strat-62`.
- **`HireModal` names who you are contacting.** It hard-coded Ananya Sharma's name, a "responds
  within 6 hours" claim and a pre-filled message addressed to her, on every profile, search result and
  the studio page. The caller now passes the subject.
- **One status pill.** `AvailabilityBadge` duplicated `StatusPill`; its 4 call sites use `StatusPill`
  with `availabilityTone()`, which renders identically.
- **Removed dead code:** `RentalRequestCard`, `RentalLocationRow`, `BookableEntityCard` and
  `MiniPlayer` had no callers, and `/feed`'s `QuietDestination` had an unused `"/verification"`.

### Added

- **Profiles for the 11 people and businesses the app links to**: opportunity posters, applicants
  and collab participants. Their content is in `src/data/linked-profiles.ts`, and each is a public
  row in the live `profiles` table (migration `20260913090949_seed_linked_profiles`, generated from
  that module). Their auth users have no email or password, so nobody can sign in as them.

- `docs/pending-screens-audit-2026-09-13.md`: the 7 Sep pending-screens plan checked item by item
  against the code. Result: 24 done · 9 partial · 4 not done, plus ~20 finished screens that no
  link reaches
- `AGENTS.md` routing rule: a route file with children must render `<Outlet />` or be an index
  leaf. The missing rule is how 26 routes came to render their parent's screen
- Design tokens reconciled to v9 in `src/styles.css`, taken verbatim from
  `frontend/guide/system/ml-tokens.css` (generated from `tokens/tokens.json`): radius scale
  8/16/32/pill, four fluid type ramps (`--type-1..4` = 12–13 / 16–18 / 22–28 / 32–44px), four
  elevation steps, motion durations and easings, a focus-ring token, spacing and opacity steps,
  `--container-app` and `--spacing-nav-clear`
- `--status-category-*` (the only sanctioned purple) and `--selected-*` (pink means selected)
  semantic token pairs
- `AGENTS.md` — GitHub↔Lovable sync protocol and code rules
- `CHANGELOG.md`
- `.prettierignore` entries fencing prose out of the formatter: `.lovable/`, `roadmap.md`,
  `docs/`, `src/routes/README.md`. The `.lovable/plan` documents are the only record of why 18
  flows were built design-only and exist nowhere else.

### Added

- `eslint-plugin-jsx-a11y` registered in `eslint.config.js`. Accessibility is now machine-checked
  for the first time; `heading-has-content` and `anchor-has-content` are scoped off for the
  vendored `src/components/ui/` primitives, whose content arrives via `{...props}`

### Changed

- `--text-secondary` is now `var(--muted-foreground)` instead of a second copy of `#66666f`, so the
  two can't drift apart. No visual change
- **Headings use Inter's normal tracking; all heading letter-spacing tuning is removed** (decided
  13 Sep, replacing the 11 Sep "keep" decision). Removed:
  - `-0.02em` on `h1..h4` (`styles.css`), which was compensation for Inter Tight;
  - `tracking-tight` on the auth wordmark and `AuthHeading` (`ml/auth.tsx`);
  - `tracking-tight` on the `/welcome` wordmark and hero (`welcome.tsx`);
  - `tracking-tight` on the root error heading (`__root.tsx`).

  Headings set very slightly wider. Positive tracking on uppercase eyebrow labels
  (`tracking-[0.14em]`) is kept, since that aids legibility of caps; vendored `components/ui/` is
  untouched
- `styles.css` header comments corrected: type has five ramps, not four. `@custom-variant dark` is
  documented as deliberately inert, because there is no dark mode, and removing the line would let
  `dark:` utilities match in OS dark mode
- Claude Code's commit attribution is pinned in `.claude/settings.json` (`attribution.commit` = the
  Wugweb trailer, `sessionUrl: false`), so the harness asks for the single trailer `AGENTS.md`
  requires instead of a Claude co-author line
- Horizontal rails snap to item edges. All **65** rails in `src/` paired `overflow-x-auto` with
  `no-scrollbar`, which removes the only affordance that content continues — so a rail stopped
  wherever the finger left it and clipped the card mid-item. A new `rail` utility adds
  `scroll-snap-type: x mandatory` plus a child `scroll-snap-align`, so applying one class to the
  container is the whole change
- Hairlines are `#D5D5DE` (`tokens.json` `line`), not `oklch(0.9445 …)`. The old value measured
  **1.147:1** against the card fill — below the step at which an edge is visible, so every divider,
  card outline and input border was decorative rather than structural. Now **1.458:1**
- `--secondary`, `--muted`, `--accent` and `--surface-subtle` snapped to `#F8F8FB` (`tokens.json`
  `surface`), the sunken step between paper and a white card. Four near-identical greys, one token
- Page ground is `#ECECF1`, not `#FCFCFD`. The old value measured **1.025:1** against the `#FFFFFF`
  card fill, so every card, row and summary was an invisible container and screens read as text
  floating on white. The card step is now 1.177:1 — cards read as white shapes on grey
- `--muted-foreground` darkened to `oklch(0.56 …)`: it measured **4.04:1** on card white, under the
  4.5:1 AA floor, and it is the colour of nearly every caption in the app. Now 4.66:1
- `AGENTS.md` now states explicitly that `Co-Authored-By: Wugweb <admin@wugweb.com>` is the only
  commit trailer, and that no assistant/tool identity may be added as a second one

### Fixed

- The viewport meta lacked `viewport-fit=cover`, so every `env(safe-area-inset-*)` in the app
  resolved to 0. That is 10 uses, including the bottom nav (`ml/ui.tsx`) and the `/feed` header. On
  notched iPhones the nav sat under the home indicator. This is a web fix and is independent of the
  Capacitor decision
- **26 routes rendered their parent's screen instead of their own.** In TanStack's flat routing,
  `bands.new.tsx` is a child of `bands.tsx`, so it renders inside the parent's `<Outlet />`. None of
  12 parents had one, so the child's content was silently dropped and the parent's UI showed at the
  child's URL, with the child's `<title>`. Confirmed on the live site before fixing:
  - `/bands/new` showed the Bands list, not the create wizard.
  - Every band profile (`/bands/$id`) showed the Bands list, so band profiles, along with their
    contact, events, invite, manage and portfolio pages, were unreachable.
  - The same happened under `/reviews/*` (4 pages), `/plans/*` (3), `/help/*` (2),
    `/recommendations/settings`, `/services/$id/{enquiry,manage}`, `/portfolio/$id/edit`,
    `/collab/new/collaborators`, `/collab/proposals/$id/counter`, `/identity/contact/save`, and
    Lovable's new `/search/{history,saved,why/$id}`.

  Each parent is renamed `X.tsx` → `X.index.tsx` with `createFileRoute("/x/")`, the existing
  `opportunities.index.tsx` convention. Parent URLs are unchanged, and `routeTree.gen.ts` was
  regenerated by the build. Checked against the regenerated tree: 207 routes, 0 children under a
  parent without `<Outlet />`. All 14 sampled parent/child URLs render their own screen on the
  dev server.
- CI (`.github/workflows/ci.yml`, added 2026-09-13) failed on Lovable's first push after it landed:
  214 Prettier errors and one `prefer-const` in the files that push wrote (`search.history`,
  `search.saved`, `search.why.$id`, `src/data/search-meta.ts`, `src/integrations/supabase/types.ts`,
  `previewAuthStorage.ts`). Formatting was cleared with `eslint --fix`, scoped to those files only.
  `previewAuthStorage.ts`'s `timer` is now `const`, declared where it is assigned.
- The CI Lint step now gates on correctness rules only (`prettier/prettier` off). Formatting runs
  as a separate step that reports but doesn't fail the build. Lovable's agent never runs Prettier,
  so the old gate would have gone red on every Lovable push
- Discover and Recently-viewed screens rendered `undefined` to users: `discover.music.tsx` read
  `t.label` where the data has `name`, and `discover.nearby.tsx` / `recently-viewed.tsx` read
  `s.image` where the data has `photo`. Shipped in `d10513f` ("Added audio autoplay", a commit
  that actually added five discover routes).
- `bun run lint` reduced from 1932 problems to 0 errors: ran the project formatter across
  `src/**/*.{ts,tsx}`, removed three `eslint-disable-next-line jsx-a11y/media-has-caption`
  comments that suppressed a rule no loaded plugin provides, and resolved one `prefer-const`.
- Repaired `AGENTS.md`, which had a corrupted, duplicated `LOVABLE:BEGIN/END` block
- `README.md` no longer ships the superseded Android design brief (old palette, radius, and type
  values)

### Changed

- Card radius is 32px (was 24px); `rounded-2xl` is 32px (was 40px). `xl`/`2xl`/`3xl` are retained
  as on-scale aliases of 32px so ~450 existing usages don't fall back to Tailwind's defaults
- Cards lift with `--elevation-2`; the 1px border is now the fallback, not the only treatment
- All arbitrary `rounded-[…]` and `text-[…]` values removed from `src/components/ml/`
- One selected state across the app: pink, not navy. `Chip`, `Segmented` and the three ad-hoc
  chip copies in `booking`/`collab-workspace`/`onboarding` now match the bottom nav
- Owner-row icons on `/me` are muted rather than pink, so pink reads as accent again
- `--accent` is a neutral hover surface; purple is confined to the category badge
- Renamed the `--text-2` _colour_ token to `--text-secondary`. Mapping the type ramp into Tailwind's `--text-*` namespace collided with it, and one would have silently won
- Category badge contrast was 3.72:1, below the 4.5:1 `AGENTS.md` mandates. The new `--status-category-*` pair measures 8.77:1

### Known gaps

- `--muted-foreground` measures **4.04:1** on card white — below the 4.5:1 AA floor for normal-size
  text, and it is the colour of nearly every caption in the app. It passes the 3:1 non-text floor,
  so icon use is fine. `oklch(0.56 0.0257 285.59)` would give 4.66:1. Not changed here: it repaints
  secondary text on every screen and deserves its own review.
- `tokens.json` and its documentation disagree in three places, all recorded rather than resolved
  here: the published guide says "there is no purple in the palette" while `tokens.json` carries
  purple reinstated 2026-08-31 on the brand owner's instruction; `color.paper`'s description
  narrates a change to `#ECECF1` that neither its own `$value` nor the generated CSS reflects; and
  `README.md` promises `foundation.gestalt.*` full-fidelity scales that do not exist in
  `tokens.json` at all
- `--navy` is retired in the system (`--color-ink #0D0D0D` "replaces --black, --text and the
  retired --navy", and `action.primary = ink` — the primary button is black, not pink). Not
  migrated here: it is a colour-identity change on every screen
- No accessibility linting: `eslint-plugin-jsx-a11y` is not registered in `eslint.config.js`, so
  the WCAG AA, contrast, `:focus-visible` and 48dp touch-target rules `AGENTS.md` mandates are not
  machine-checked. Tracked in `roadmap.md`.
- 18 `react-refresh/only-export-components` warnings remain (non-blocking; clearing them means
  splitting 10 component files to isolate their exports).
