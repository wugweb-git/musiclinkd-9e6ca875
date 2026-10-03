# Section 4 — route coverage audit: profiles and the work form (4 Oct 2026)

Read-only audit of four areas that had never been checked against AGENTS.md:
`business-profile.tsx`, `public-profile.tsx`, `talent-profile.tsx`, `work-form.tsx`, plus the routes
that render them (found by import):

- `src/routes/profile.$username.tsx`, `src/routes/$handle.tsx`, `src/routes/profile.index.tsx`: these render
  `PublicProfileScreen` / `TalentProfileExperience`
- `src/routes/portfolio.new.$kind.tsx`, `src/routes/portfolio.$id.edit.tsx`: these render `WorkForm`
- `src/routes/business.$id.enquiry.tsx`, `src/routes/business.$id.availability.tsx`: the `business.$id*`
  routes. Neither renders `business-profile.tsx`. The availability route is only a redirect.
  There is no `business.$id.tsx` route. A business profile is reached only through `/profile/$username`
  or `/@username`, so the comment at `business-profile.tsx:69` that names `/business/$id` is out of date.
- `src/routes/conversation.$id.tsx` imports only `CallBtn` from talent-profile. CallBtn was checked in
  talent-profile and nothing else in that route was audited.

Some findings sit in shared blocks in `profile.tsx`, `booking.tsx` or `market.tsx` that these screens
render. Each one is listed under the screen that renders it and cites **both** the call site and the
definition. Fixing the definition fixes every screen that uses it.

Nothing was run: no tsc, lint, build or Storybook. Every line number below was read from the file on
`main` at `a1b3c76`.

Rule key: **R1** hit target · **R2** control that does nothing · **R3** logic keyed off display copy ·
**R4** loading/error state · **R5** focus / input size · **R6** icon size, emoji, arbitrary type or
radius · **R7** brand pink · **R8** hardcoded `src/data` content where live data belongs · **Other**
is a rule from AGENTS.md outside the eight.

---

## 1. `src/components/ml/business-profile.tsx`

| Finding | Rule | file:line | Suggested fix |
|---|---|---|---|
| Every business profile shows a "Studio Facility Bento" with invented facts. Spaces reads "Vocal Booth & Foley" or "Production Suites". The other lines are "Acoustically isolated", "Console & Signal: Analog & Hybrid" and "Neve & UA Chains". None of it comes from the business's record. | R8 (never fabricate) | `business-profile.tsx:184-201` | Remove the block. If a facility summary is wanted, derive it from `b.equipment` / `b.amenities`, which are already loaded. |
| Owner's "Manage business" link is a bare `<Link>` drawn at `h-10 w-10` (40px) with no `hit-area`. | R1 | `business-profile.tsx:119-123` | Use `IconBtnLink` (it already carries `hit-area`), or add `hit-area`. |
| The website link in the header is `text-1` with no min height and no `hit-area`, so its tap target is about 18px tall. The same link under Find & contact passes `min-h-touch` (`:356`). | R1 | `business-profile.tsx:144` (component `:506-513`) | Pass `min-h-touch` at `:144` too, or put `hit-area` in `WebsiteLink`. |
| "See all work" / "See all reviews" use StackSection's `showAll` button: `pt-3` + `text-sm` gives about 32px, with no `hit-area`. | R1 | call `business-profile.tsx:291-295`, `:361-365`; def `profile.tsx:200-205` (Link variant `:192-197`) | Add `hit-area` (or `min-h-touch`) to both showAll variants in `StackSection`. |
| The same "See all" buttons are `text-pink-strong`. Brand pink on a resting text link is not one of the allowed uses. | R7 | call `business-profile.tsx:293`, `:363`; def `profile.tsx:194`, `:202` | `text-foreground` (keep `link-action`). |
| Amenity `ProofPill` with photos is a `<button>` at `py-1` (about 32px) with no `hit-area`. | R1 | call `business-profile.tsx:235-242`; def `booking.tsx:934-938` | Add `hit-area` to the ProofPill button. |
| Owner's "Stats" button links to `/home`, and `home.tsx` has no stats, insights or analytics. The button promises something it does not deliver. | R2 | `business-profile.tsx:634-636` | Point it at a real stats screen (`/portfolio/analytics` exists), or remove it until a business stats screen exists. |
| If the follow-state query fails, `followOn` falls back to `false`. A business you already follow then shows "Follow", and tapping it sends `following: true` again. | R4 | `business-profile.tsx:584-595` | On `q.isError`, disable the Follow button (say why) or retry; don't assume "not following". |
| `SavedToggle size={40}` → `SaveButton` draws its icon at `size * 0.45` = 18px, which is off the `iconSize` scale. | R6 | call `business-profile.tsx:127`; def `market.tsx:97` | Size the SaveButton icon from `iconSize` (e.g. `iconSize.md` for 40, `iconSize.sm` for 36). |
| `📍` emoji, but only inside a doc comment, never rendered. | (note, not a finding) | `business-profile.tsx:471` | Optional: reword the comment. |

Checked and clean: the owner IconBtns at `h-11 w-11` (IconBtn carries `hit-area`), the equipment rows
(`h-12` thumbnail + `py-3`), Directions (`min-h-touch`), the Btn/BtnLink action row (`min-h-control`), and
icon sizes all from `iconSize`. Prices go through `Price`. Tab keys are a union type (`BusinessTab`).

## 2. `src/components/ml/public-profile.tsx` (+ `profile.$username.tsx`, `$handle.tsx`)

| Finding | Rule | file:line | Suggested fix |
|---|---|---|---|
| A failed profile fetch shows as a 404. `getPublicProfile` and `getPublicBusiness` both `.catch(() => null)`, then `if (!row) throw notFound()`, so a network or server error tells the visitor the profile does not exist. | R4 | `public-profile.tsx:32-35`, `:46` | Let real errors throw (route `errorComponent` → `LoadError`). Only treat an empty result as not found. |
| A failed sections fetch shows as empty. `getPublicProfileSections(...).catch(() => null)` turns an error into "No audio yet", "No videos yet" and the other empty states on a profile that has work. | R4 | `public-profile.tsx:41-43`, `:48-50` | Carry an error flag into the view and show `LoadError what="this profile's work"` in the affected sections. |
| Recently-viewed entries for a business are stored as `kind: "studio"`. | Other (naming: no type-named data) | `public-profile.tsx:111` | Rename to `"business"` in `rememberVisit` and its readers. |

`profile.$username.tsx` and `$handle.tsx` only pass loader data through. Both have `head()`, and they
have no UI of their own.

## 3. `src/components/ml/talent-profile.tsx` (+ `profile.index.tsx`)

| Finding | Rule | file:line | Suggested fix |
|---|---|---|---|
| **Failures are reported as successes.** The mutation's `onError` shows `toast.success("Connection request sent!")`, `"Now following"` or `"Unfollowed"` when the request **failed**. The optimistic button then reverts silently. | R4 (and never fabricate) | `talent-profile.tsx:307-312` | `onError` → `toast.error("That didn't save. Try again.")` for every action. |
| If the connection query fails, `state` falls back to `"none"`. A connected person shows "Connect", and tapping it sends a fresh request. Follow has the same problem. | R4 | `talent-profile.tsx:270-276` | On `q.isError`, disable Connect/Follow with a reason, or show a retry. |
| Hire visibility depends on display copy: `isOpenForWork` compares `availability` against the strings `"Busy"` / `"Touring"`. Any other wording (e.g. "2 slots this month") counts as open. | R3 | call `talent-profile.tsx:176`; def `profile.tsx:320-321` (also `isUnavailableForWork` `:326-327`) | Store and compare an availability union/key (`AvailabilityState` already exists in `data/profile.ts:130`). |
| A profile id is looked up in a hardcoded `profileIdByUsername` map from `src/data/profile.ts` (11 fixed usernames → uuids). | R8 | `talent-profile.tsx:38`, `:259`; data `src/data/profile.ts:226-238` | Use `p.profileId` from the loaded row only. Drop the map. |
| A signed-out visit to `/profile` renders `ownerProfile` (the hardcoded "Rahul Iyer" from `src/data/profile.ts:793`) **as the owner**, with Edit, Share and View Public Profile. | R8 | `profile.index.tsx:11`, `:163-166` | Signed out → redirect to `/welcome` (or show a sign-in state). Never render a data-file person. |
| The Bento card icon is `size={15}`, off-scale. | R6 | `talent-profile.tsx:993` | `iconSize.sm`. |
| "View All" / "Services" section actions are `text-pink-strong`. | R7 | call `talent-profile.tsx:595`, `:622`; def `profile.tsx:97` | `text-foreground`. |
| `BentoChip` is a hand-styled static pill (`rounded-full bg-subtle px-2.5 py-1 ... border`) instead of the `pill` utility. | Other (Pill = `pill` utility; no second styled copy) | `talent-profile.tsx:1005-1009` | Use the `pill` utility. |
| "{count} genres" has no singular, so one genre reads "1 genres". | Other (copy) | `talent-profile.tsx:997` | Pluralise. |
| Unused imports: `Check`, `CreditCard`, `LifeBuoy`, `Play`, `QrCode`, `type profileInsights` (each appears only in the import). | Other (lint hygiene) | `talent-profile.tsx:4`, `:12`, `:19`, `:25`, `:27`, `:41` | Remove. |
| Error state is a hand-built `StateCard tone="error"` rather than the canonical `LoadError`. | R4 (canonical) | `profile.index.tsx:152-157` | `<LoadError what="your profile" action={<Btn …>Retry</Btn>} />`, as the same file already does at `:74-84`. |
| After a gallery change, `reloadSections` swallows a failure (`.catch(() => undefined)`), so the person sees a stale gallery with no message. | R4 | `profile.index.tsx:115-119` | `toast.error` on failure. |

Checked and clean: the owner header IconBtnLinks (`h-10`, with hit-area via IconBtn), ViewerActions Btn
rows (`min-h-control`), the bio toggle (`hit-area` at `:558`), the gallery row buttons (`h-56`), the
"Studio connection" card link, which is `p-4` around an `h-11` icon and so well over 48px. That
link's pink comes from `Price`, which is allowed. The "View Public Profile" button with no username
toasts the reason instead of doing nothing (`:509-516`). `CallBtn` renders nothing when it has no
number, which is correct.

## 4. `src/components/ml/work-form.tsx` (+ `portfolio.new.$kind.tsx`, `portfolio.$id.edit.tsx`)

| Finding | Rule | file:line | Suggested fix |
|---|---|---|---|
| Role and genre options come from arrays in `src/data/portfolio.ts` (`creditRoles`, `genres`) instead of `taxonomy_options`. | R8 (taxonomy rule) | `work-form.tsx:10`, `:296`, `:303`; data `src/data/portfolio.ts:130`, `:148` | Load both from the taxonomy (as the onboarding pickers do), store slugs/app_keys, and read back with `labelFor`. |
| Roles **and genres** are saved as display labels, joined into one `role` text column (`[...roles, ...genre].join(", ")`). On edit, `role` is split back into **roles** and `genre` starts empty. Each edit-and-save moves every genre into "Your role", and genres can never be shown as genres. | R3 (stored display copy) / data loss | `work-form.tsx:86-89`, `:156` | Store keys in separate fields (a `genres` column or metadata), hydrate `genre` from it, and stop joining labels. |
| The title `<textarea>` has `outline-none` and no focus-visible replacement. It also sits outside `InlineField`, so it gets no focus-within ring, and keyboard focus is invisible. | R5 | `work-form.tsx:244` | Drop `outline-none`, or add `focus-visible:ring-2 focus-visible:ring-ring` (as `business.$id.enquiry.tsx:133` does). |
| If the link preview read fails, `preview` is set to `null`, so the hint falls back to "We'll fill in the title and cover…". The person is never told the read failed. | R4 | `work-form.tsx:115`, `:202-208` | Keep a `readFailed` flag and show "Couldn't read this link. Add the title yourself." |
| An unknown `$kind` (e.g. `/portfolio/new/foo`) silently shows the Track form, because `workType` falls back to `workTypes[0]`. The raw `foo` is still saved as `kind`, since the server accepts any string up to 24 characters (`portfolio.functions.ts:15`). | Other (logic) | `portfolio.new.$kind.tsx:34`; `work-form.tsx:76`, `:154` | `notFound()` in the route for an unknown kind, and save `t.kind`. |
| Edit screen when signed out, or while auth is still resolving: the query is disabled, so `isLoading` is false and `data` is undefined. The screen shows "You can't edit this work" (possibly as a flash before auth lands). | R4 | `portfolio.$id.edit.tsx:32-38`, `:46-51` | Show the skeleton while auth is loading, and send a signed-out visitor to Welcome. |

Checked and clean: the EditRow rows (`min-h-control-lg`), the Public switch (`hit-area`), and `InlineField`
(text-2 with a focus-within ring). The bottom-bar Btns use `loading` and `pending`, and the edit route
uses `LoadError` for `isError` (`portfolio.$id.edit.tsx:45`). `RowSheet` "Done" only closes the sheet,
but that is correct here: every picker writes its state as you tap, so there is nothing left to apply.

## 5. `business.$id*` routes (`business.$id.enquiry.tsx`; `business.$id.availability.tsx` is a redirect)

| Finding | Rule | file:line | Suggested fix |
|---|---|---|---|
| The intent options are a hardcoded array, `["Room", "Mixing", "Live", "Other"]`, and the display label itself is sent and stored as `intent`. "Room" also contradicts the rule that the UI has no rooms. | R3 / R8 | `business.$id.enquiry.tsx:33`, `:37`, `:49` | Options from `taxonomy_options` (or the business's own active services), and send a key. |
| A loader failure shows as "Business not found": `loadBusiness` swallows `getPublicBusiness` errors. | R4 | `business.$id.enquiry.tsx:60-72`; `src/lib/business-view.ts:256` | Let errors reach an `errorComponent` with `LoadError`; keep not-found for an empty result. |
| The Send button shows "Sending…" text instead of using `loading`. | R4 (AGENTS: use `loading`) | `business.$id.enquiry.tsx:140-146` | `<Btn loading={sending} …>Send Enquiry</Btn>`. |
| Send is disabled until the message reaches 8 characters, and nothing says why. | R2 ("disable it and say why") | `business.$id.enquiry.tsx:142` | Use `pending` plus an inline hint/error, as WorkForm's Publish does. |
| The success icon `CheckCircle2 size={40}` is off-scale (`iconSize.xl` is 32). | R6 | `business.$id.enquiry.tsx:80` | `iconSize.xl`. |

---

## Combined list, by severity

**Critical: wrong information shown to real people**
1. Failures are reported as success ("Connection request sent!", "Now following", "Unfollowed"): `talent-profile.tsx:307-312` (R4)
2. Invented studio facility facts on every business profile: `business-profile.tsx:184-201` (R8)
3. A signed-out `/profile` shows the hardcoded "Rahul Iyer" as the owner: `profile.index.tsx:163-166` (R8)
4. The work form saves genres into `role` and re-reads them as roles, so each edit corrupts the work: `work-form.tsx:86-89`, `:156` (R3)

**High**
5. Network errors become a 404 on public profiles: `public-profile.tsx:32-35`, `:46` (R4)
6. Network errors become empty portfolio sections: `public-profile.tsx:41-43`, `:48-50` (R4)
7. Role/genre options come from `src/data` instead of taxonomy: `work-form.tsx:10`, `:296`, `:303` (R8)
8. Connection/follow query error shows "Connect"/"Follow", and a tap re-requests: `talent-profile.tsx:270-276`; `business-profile.tsx:584-595` (R4)
9. Hire visibility keyed off the strings "Busy"/"Touring": `profile.tsx:320-321` via `talent-profile.tsx:176` (R3)
10. Enquiry intents hardcoded, stored as labels, and include "Room": `business.$id.enquiry.tsx:33`, `:49` (R3/R8)
11. Title textarea has no visible focus: `work-form.tsx:244` (R5)

**Medium**
12. "Stats" goes to `/home`, which has no stats: `business-profile.tsx:634-636` (R2)
13. 40px Manage link without `hit-area`: `business-profile.tsx:119-123` (R1)
14. Header website link about 18px tall: `business-profile.tsx:144` (R1)
15. StackSection "See all" about 32px with no `hit-area`: `profile.tsx:192-205` via `business-profile.tsx:291-295`, `:361-365` (R1)
16. ProofPill button about 32px with no `hit-area`: `booking.tsx:934-938` via `business-profile.tsx:235` (R1)
17. Pink "See all" links: `profile.tsx:194`, `:202` via `business-profile.tsx:293`, `:363` (R7)
18. Pink "View All"/"Services" links: `profile.tsx:97` via `talent-profile.tsx:595`, `:622` (R7)
19. Hardcoded username→id map: `talent-profile.tsx:259` (R8)
20. Enquiry loader error shows "Business not found": `business.$id.enquiry.tsx:60-72` (R4)
21. Edit work shows "You can't edit" while signed out or while auth loads: `portfolio.$id.edit.tsx:46-51` (R4)

**Low**
22. A failed link read gets no message: `work-form.tsx:115` (R4)
23. "Sending…" instead of `loading`: `business.$id.enquiry.tsx:145` (R4)
24. Send disabled with no reason: `business.$id.enquiry.tsx:142` (R2)
25. Hand-built error StateCard instead of LoadError: `profile.index.tsx:152-157` (R4)
26. Silent gallery reload failure: `profile.index.tsx:115-119` (R4)
27. Icon `size={15}`: `talent-profile.tsx:993` (R6)
28. Icon `size={40}`: `business.$id.enquiry.tsx:80` (R6)
29. SaveButton icon 18px: `market.tsx:97` via `business-profile.tsx:127` (R6)
30. Unknown work kind falls back to Track: `portfolio.new.$kind.tsx:34`, `work-form.tsx:154` (Other)
31. Hand-rolled BentoChip pill: `talent-profile.tsx:1005-1009` (Other)
32. Recently-viewed `kind: "studio"`: `public-profile.tsx:111` (Other)
33. "1 genres": `talent-profile.tsx:997` (Other)
34. Unused imports: `talent-profile.tsx:4-41` (Other)

## Counts per rule

| Rule | Count |
|---|---|
| R1 hit target | 4 |
| R2 does nothing / disabled without reason | 2 |
| R3 keyed off display copy | 3 |
| R4 loading / error | 10 |
| R5 focus / input size | 1 |
| R6 icons / type / radius | 3 |
| R7 brand pink | 2 |
| R8 hardcoded `src/data` / fabricated | 4 |
| Other | 5 |
| **Total** | **34** |

No arbitrary `text-[Npx]`, no `rounded-[…]`, no off-scale `rounded-md/xl/2xl`, no `text-xs/base/lg` and no
emoji rendered in UI were found in any of the audited files. The one emoji, in a comment at
`business-profile.tsx:471`, is never rendered.
