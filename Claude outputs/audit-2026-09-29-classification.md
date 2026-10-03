# AUDIT-2026-09-29 — classification against today's code

Every finding in `Claude outputs/specs/AUDIT-2026-09-29.md`, checked on 4 Oct 2026 against the
working tree at `f6c691f` (after §2 `405a1fe` and §3 `7b71b1b`), CHANGELOG.md and
`Claude outputs/convergence-status-2026-10-04.md`. The audit's line numbers are from 29 Sep; items
were found again by content. Files renamed since: `studio-setup.tsx` → `bookable-setup.tsx`,
`studio*` → `bookable*`; rooms retired 4 Oct; collab retired by the owner on 28 Sep.

Classes: **Incorporated** (fixed; commit or current file:line), **Superseded** (a later decision or
correction made it moot), **Actionable** (still true today). Read-only sweep: nothing was built,
run on a device or run in CI. Android behaviour is checked in code only.

| Finding | Class | Evidence | What's left |
|---|---|---|---|
| A1 Android hardware back not handled | Incorporated | `143291f`; `src/lib/dismiss-stack.ts:51` `App.addListener("backButton")`, `src/hooks/use-dismissable.ts` | Device check (see X2) |
| A2 TopBar has no top safe-area inset | Incorporated | `143291f`; `pt-safe`/`pt-inset` at `src/styles.css:957`, `:966`, used by `ui.tsx`, `onboarding.tsx`, `tab-icon.tsx`, `search.index.tsx`; CoverHero inset in §2 `405a1fe` | Device check (X2) |
| A3 Camera QR scan cannot work (no CAMERA) | Actionable | `89ca7d8`; `android/app/src/main/AndroidManifest.xml:81` declares `CAMERA` | Needs an Android build and a device to confirm `getUserMedia` works in the wrap |
| A4 Push notifications are dead code | Actionable | `registerForPush` (`src/lib/push.ts:30`) and `saveMyPushToken` (`src/lib/push.functions.ts:20`) still have 0 call sites; no `pushNotificationReceived`/`ActionPerformed` listener. `POST_NOTIFICATIONS` declared (`AndroidManifest.xml:82`) | Blocked on the owner's FCM credential; then call `registerForPush` and add a tap → deep-link listener |
| A5 GSAP on every screen for one tween | Incorporated | `87a5360`; 0 `gsap` imports in `src`, not in `package.json` | — |
| A6 QueryClient with no defaults | Incorporated | `131dfbc`; `src/router.tsx:24-27` (`staleTime: 30_000`, no focus refetch, `retry: 1`), `:44` `defaultPreloadStaleTime: 30_000` | — |
| A7 `useAuth()` is 91 independent sessions | Incorporated | `5e76c87`; `src/hooks/use-auth.ts:114` `useSyncExternalStore` | — |
| A8 supabase realtime on the critical path | Incorporated | `131dfbc`; `vite.config.ts:38` aliases `@supabase/realtime-js` to `realtime-stub.ts` | — |
| A9 No image pipeline | Actionable | Upload resize `1a9fdeb` (`src/lib/image-downscale.ts`, used by `gallery.ts`, `bookable-photos.ts`); CDN size `dba0f53` (`src/lib/image-url.ts`). Today 82 `<img>` in `.tsx`, 5 with `width=`, 44 with `loading="lazy"` | `width`/`height` (or a fixed box) on the ~33 unboxed images; `loading="lazy"` on below-the-fold ones |
| A10 Remote-URL shell, no offline path, splash hides early | Actionable | Splash/StatusBar done `89ca7d8`, `a7b5806` (`capacitor.config.ts:45-48`, `src/lib/splash.ts`); no service worker in `src` | Offline first paint is an owner product decision, not yet taken |
| A-x1 Plugin reality (status-bar unused, no splash JS, haptics plugin missing) | Incorporated | `89ca7d8`; `@capacitor/status-bar`/`splash-screen` used in `src/lib/splash.ts`; haptics uses `navigator.vibrate` (`src/lib/haptics.ts`) with `VIBRATE` declared (`AndroidManifest.xml:83`) | — |
| A-x2 Manifest permissions missing (CAMERA, POST_NOTIFICATIONS, VIBRATE, location) | Incorporated | `89ca7d8`; `AndroidManifest.xml:81-85` | Takes effect on the next Android build |
| A-x3 `allowBackup="true"` backs up the session | Incorporated | `89ca7d8`; `AndroidManifest.xml:10-11` `allowBackup="false"`, `fullBackupContent="false"` | — |
| A-x4 `window.open` for Directions fails in WebView | Incorporated | `89ca7d8`; `openExternal` via `@capacitor/browser`, `src/lib/download.ts:46-51`, called from `booking-actions.ts` | — |
| A-x5 `.ics`/`.vcf`/data export/QR PNG downloads fail silently | Actionable | `89ca7d8` made them honest: `downloadBlob` returns false in the app (`src/lib/download.ts:22`), callers toast `DOWNLOAD_UNAVAILABLE` (`booking-actions.ts:58-59`, `qr.tsx:32-33`, `settings.privacy.tsx:156`, `identity.contact.save.tsx:55`) | Files still cannot be saved inside the Android app; `@capacitor/filesystem` needs a store release — owner decision |
| A-x6 `navigator.share` missing, share buttons become copy | Superseded | Withdrawn by the audit's own correction ("Three things this audit got wrong" #2): `shareLink` already falls back to the clipboard | — |
| A-x7 shadcn `Button` sizes under the touch floor | Actionable | `src/components/ui/button.tsx:21-24` still `h-9`/`h-8`/`h-10`/`h-9 w-9`. Only vendor demo files import it (`command-menu-01`, `onboarding-01`, `file-upload-01`), reached only from `src/registry/kept.stories.tsx`; product uses `Btn` | No product screen affected; resolve with convergence §3.5 #16 (remove unused vendor primitives) or size it to 48 |
| A-x8 `88vh`/`100vh` in sheets | Incorporated | `5543ac2`; `ui.tsx:848` `min(88dvh, …)`, `drawer-list.tsx:172` `50dvh`, `onboarding.tsx:1064` `40dvh` | `marketplace/l.$id.tsx:265`, `:296` still size the photo gallery with `62vh` (not a sheet; minor) |
| A-x9 `ui/chart.tsx` imports all of recharts, used by nothing | Incorporated | Deleted in `5543ac2` | — |
| A-x10 `liquefy-ui.css` imported nowhere | Superseded | Audit's own correction #1: `.storybook/preview.tsx:13` imports it; convergence §3.5 #33 "Verified Storybook-only" | — |
| A-x11 Home bypasses React Query | Incorporated | `5e76c87`; `src/routes/home.tsx:92` `useQuery` | — |
| A-x12 Serial awaits: collab invites | Superseded | Collab retired as a concept (owner, 28 Sep: bands get their own tables, the `collabs` family is dropped); convergence §3.5 #36 tracks the collab code. Loop still at `src/lib/collabs.functions.ts:215-226` | Goes when collab code is removed |
| A-x13 Serial awaits: verification storage copies | Actionable | `src/lib/verification.functions.ts:427-434` `await bucket.copy` inside `for` | `Promise.all` over the copies |
| B1 `Field` gives its control no accessible name | Incorporated | `143291f`; `src/components/ml/listing-form.tsx:377` `<label htmlFor={controlId}>` | — |
| B2 Field errors not tied to the control | Incorporated | `143291f`; `listing-form.tsx:351-352` `aria-describedby`, `aria-invalid` | — |
| B3 `Sheet` has no focus trap or scroll lock | Incorporated | `5543ac2`; `src/components/ml/ui.tsx:784-795` | — |
| B4 `IconBtn` drops `aria-expanded`/`aria-controls` | Incorporated | `5543ac2`; `ui.tsx:700` passes `aria-expanded`/`aria-controls`/`aria-haspopup`/`aria-pressed`/`id` | — |
| B5 `Segmented` is a broken tablist | Incorporated | `5543ac2`; `src/components/ml/kit.tsx:282`; 0 `role="tablist"` in `ml/` | — |
| B6 Switch off-state invisible (1:1) | Incorporated | `131dfbc`; `--switch-off` `src/styles.css:635`, `kit.tsx:442` | — |
| B7 Brand pink as text background on count badges | Incorporated | `131dfbc` (→ `bg-brand-button`), then neutral in §2 `7b7f20e`: `tab-header.tsx:42`, `market.tsx:1092` are `bg-foreground text-background` | — |
| B8 Touch targets (SaveButton, gallery ✕, ProductCard heart) | Incorporated | `5543ac2`; `hit-area` at `market.tsx:93`, `gallery.tsx:296`, `market.tsx:437` | — |
| B9 `Loading` announces nothing | Incorporated | `src/components/ml/kit.tsx:638` `role="status" aria-label="Loading"` | — |
| B10 Duplicate `<h1>` on Profile; `<button>` inside `role="option"` | Incorporated | `5543ac2`; `talent-profile.tsx:144` bar label not `<h1>`; `drawer-list.tsx:167` plain list | — |
| D1 `ProductCard` is a second design system | Incorporated | `ebc9c6d` (CHANGELOG "the marketplace item card (P1-8 #5, 30 Sep)": "no raw hex, no `cqw` … no navy shadow") | — |
| D2 57 hand-written reproductions of `<Card>` | Actionable | Today ~58 `rounded-lg … bg-card` shells in `src/routes` + `src/components/ml` against 137 `<Card>` uses (approximate grep) | Fold hand-rolled card shells into `Card` |
| D3 Radius scale: 10 steps in use, `rounded-[20px]` | Incorporated | §3 `7b71b1b` (convergence §3 #5 "app code on sm/lg/3xl/full"); 0 `rounded-[…]` in `src/routes`/`src/components/ml` | — |
| D4 `Btn variant="brand"` has zero call sites; two places hand-roll it | Actionable | Still 0 `variant="brand"`; hand-rolled `bg-brand-button` buttons at `src/components/ml/gear-cta.tsx:143` and `src/components/ml/marketing.tsx:64` | Use `Btn variant="brand"` (or say why not) |
| D5 Four field patterns | Incorporated | AGENTS.md: "Never add a second styled copy of any of these — four screens had one, and they have been folded back in" | — |
| D6 Four switches | Actionable | Hand-rolled `role="switch"` at `src/components/ml/rental.tsx:341` and `src/components/ml/market.tsx:1113` beside the kit `Switch` (`kit.tsx:438`) | Use the kit `Switch` |
| D7 Six list-row shapes | Actionable | `PersonRow` unified person rows (`16ce640`, CHANGELOG P1-8 #1); other row shapes not re-counted | Inventory remaining row shapes against `Row`/`ActionRow`/`PersonRow` |
| D8 `filter-sheet.tsx` with zero system imports | Incorporated | `f3e9d97` (CHANGELOG P1-8 #11: "`filter-sheet.tsx`'s `FilterSheet` (no consumer)" removed); file gone | — |
| D9 ~14 screens with no `isError` branch | Incorporated | `c657382` (LoadError) and §2 `405a1fe`; convergence: seven auxiliary reads "retained: a failure drops a minor detail only" | — |
| C1 `/booking/$id` dead end | Incorporated | `560aa63`; `src/components/ml/booking-context.tsx:117` `TopBar` | — |
| C2 Talent cannot see enquiries (`/leads` gated on business) | Incorporated | `560aa63`; `src/routes/leads.tsx:46` | — |
| C3 Rental inbox filter without `!inner` | Incorporated | `560aa63`; `src/lib/rentals.functions.ts:215` | — |
| C4 Multi-step flows keep state in `useState` | Actionable | Booking draft `src/components/ml/booking-context.tsx:69` `useState`; signed-out Review sends to `/welcome` with no return (`src/routes/booking.$id.review.tsx:166`). `business.new` has URL steps (`business.new.tsx:58`) but answers in `useState`. Collab part superseded (retired) | URL step + persisted draft for booking, rental request, band, sell, business-new; return-to after `/welcome` |
| C5 Zero route-level auth; four gating shapes | Actionable | 21 `beforeLoad` in `src/routes`; 16 files still use `useRequire*` hooks | One gating shape |
| C6 Raw error strings reach users | Actionable | 196 `throw new Error(error.message)` in `src/lib`; 44 `toast.error(… .message …)` in `.tsx` (e.g. `gallery.tsx:147`, `work-form.tsx:173`) | Error-mapping layer |
| C7 15 orphan routes | Actionable | `bands.$id.portfolio.tsx` cut to 24 lines (`5e76c87`). Still no inbound link to `/help/category/$key` (`help.category.$key.tsx:6`), `/reviews/$id/edit` (`reviews.$id.edit.tsx:10`), `/marketplace/nearby` (`marketplace/nearby.tsx:10`) | Link or retire the orphans (route files are not renamed) |
| C8 136 `as never`, dangerous on writes | Actionable | 134 `as never` in `src`, 124 in `src/lib/*.functions.ts` | Typed inserts/updates, one file at a time |
| J1 New business finishes with no photo, bio or links | Actionable | `src/routes/business.new.tsx:42-52` steps are type, basics, location, offer, policies, review (+ amenities/equipment); basics (`:399-428`) asks name, username, tagline only | Collect photo/bio/links, or stop calling the fresh account incomplete |
| J2 Non-studio business modal promises spaces, hours and rates | Actionable | `src/routes/business.new.tsx:584-592`: `body="Add your spaces, hours and rates next."`, button to `/home`. Contradicts the owner's business booking model (no rooms/spaces in UI) | Change the promise to what exists, and link to it |
| J3 Rental path hops through redirect stubs | Actionable | 9 of 12 `src/routes/marketplace/rent/*` are `throw redirect` stubs (rent folded into Market, by decision); in-app links still target them: `rental.tsx:126`, `saved-market.tsx:40`, `market.tsx:878` | Point links at the destination; keep the stub files |
| I1 SCREEN-INVENTORY.md is stale | Actionable | `Claude outputs/specs/SCREEN-INVENTORY.md:336` still says "238 server functions" (last touched 29 Sep); today 285 `createServerFn` in `src/lib`, 146 route files | Regenerate from code |
| R1 Onboarding never completed (`from: "onboarding"` dropped) | Incorporated | `9988255` | — |
| R2 Collab wizard opened on Plan | Incorporated | `9988255` (and collab since retired) | — |
| R3 Settings rows to deleted routes | Incorporated | `9988255` | — |
| R4 Seven stale `/studio` links | Incorporated | `9988255` | — |
| X1 Title-case outliers; no written voice guide | Actionable | "Apply through Messaging" at `src/routes/bands.$id.index.tsx:363`; no voice guide in `docs/` or `Claude outputs/` | Owner call: sentence-case the outlier; a voice guide is authored content and needs the owner's ask |
| X2 Nothing Android-specific is device-verified | Actionable | Audit status section; nothing since records an emulator or handset run (convergence §5 "412px spot checks only") | Run hardware back, insets, camera, downloads on a device after the next Android build |

## Actionable

1. **A3** Camera in the wrap — confirm on a device (`AndroidManifest.xml:81`).
2. **A4** Push — wire `registerForPush` (`src/lib/push.ts:30`) and a tap listener once the FCM credential lands.
3. **A9** Image `width`/`height` on ~33 unboxed `<img>`; lazy loading on the rest.
4. **A10** Offline first paint / service worker — owner decision.
5. **A-x5** Saving files inside the app (`src/lib/download.ts:22`) — `@capacitor/filesystem` is an owner decision.
6. **A-x7** shadcn `Button` sizes (`src/components/ui/button.tsx:21-24`) — vendor-only; remove or size.
7. **A-x13** Serial storage copies in `src/lib/verification.functions.ts:427-434`.
8. **D2** ~58 hand-rolled card shells.
9. **D4** `Btn variant="brand"` unused; `gear-cta.tsx:143`, `marketing.tsx:64` hand-roll it.
10. **D6** Hand-rolled switches at `rental.tsx:341`, `market.tsx:1113`.
11. **D7** List-row shapes not re-counted beyond `PersonRow`.
12. **C4** Drafts in `useState` (`booking-context.tsx:69`); `/welcome` has no return (`booking.$id.review.tsx:166`).
13. **C5** One route-level auth shape.
14. **C6** Error mapping (196 throws, 44 toasts of `.message`).
15. **C7** Orphans: `/help/category/$key`, `/reviews/$id/edit`, `/marketplace/nearby`.
16. **C8** `as never` on writes (124 in `*.functions.ts`).
17. **J1** New business: no photo/bio/links (`business.new.tsx:399-428`).
18. **J2** Non-studio "spaces, hours and rates" promise (`business.new.tsx:587`).
19. **J3** Links into rent redirect stubs (`rental.tsx:126`, `saved-market.tsx:40`, `market.tsx:878`).
20. **I1** Regenerate SCREEN-INVENTORY.md.
21. **X1** "Apply through Messaging" title case; voice guide only if the owner asks.
22. **X2** Device verification of the Android fixes.
