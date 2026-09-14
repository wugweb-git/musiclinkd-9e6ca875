# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

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

<<<<<<< HEAD
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
=======
### Removed — state simulators from production (plan A2)

- **Demo controls render in development only** (`lib/dev.ts` `showDemoControls` = `import.meta.env.DEV`):
  Preview failure state (booking payment, portfolio upload), Demo states and Loading/Error buttons
  (booking schedule), States and Loading/Error/Offline (My bookings), the States cycler (Collaborations),
  Simulate success/failure (collab file upload) and Simulate a scan (identity scan). A production build
  contains none of those labels.
>>>>>>> chore/remove-demo-controls

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
