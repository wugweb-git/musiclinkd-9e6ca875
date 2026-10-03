<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

# Working in this repository

MusicLinkd — India's professional network for the music industry. The only MusicLinkd frontend,
live at `app.musiclinkd.com`. Nothing here is a prototype.

## Git and Lovable

- Lovable syncs only `main`. Work on a branch, merge `--no-ff` into `main`, push. Keep `main` working.
- Never force push, rebase, amend or squash anything already pushed.
- Before pushing, the Lovable agent must be idle. After a large push, check
  `git branch -r | grep lovable-sync`; if it exists, merge it (never delete it unmerged).
- Commit messages describe the diff. Every commit ends with exactly one trailer, and no other:
  `Co-Authored-By: Wugweb <admin@wugweb.com>`

## Code rules

**TypeScript.** `exactOptionalPropertyTypes` is on: declare optional props on shared components as
`onClick?: (() => void) | undefined`, fixed at the definition, never at call sites. No `as any` on
router links; if `to` won't type-check, the route is wrong.

**Components.** Check `src/components/ml/ui.tsx`, `ml/kit.tsx` and `src/components/ui/` (shadcn)
before creating anything; reuse and restyle, don't add siblings. Overlays: the `Sheet` in
`ml/ui.tsx` for bottom sheets, `Dialog` in `ml/kit.tsx` for dialogs, and `useConfirm` in `ml/ui.tsx`
for every destructive confirm (on `ui/alert-dialog`). Each has the focus trap, Escape, the Android
back button and scroll lock; don't hand-roll another.

**Primitive vs Component vs Block.** `src/components/ui/` (shadcn) is the Primitive layer:
domain-agnostic, atomic, would look the same in any app (`Button`, `Chip`, badges, `Card` the bare
shape). `src/components/ml/` is where Components and Blocks live, grouped by product domain, not one
file per export:
- **Component** — a small domain-aware grouping that isn't yet a standalone unit (a price + unit
  line, an avatar + name pairing).
- **Block** — the standalone, feature-level unit: bundles two or more data fields (often plus a named
  action) to represent one entity — `ArtistCard`, `BookingCard`, `TrackCard`, `HireContactModal`,
  `AdvancedFiltersBottomSheet`. The `Card` suffix is a shape, not a demotion — cards are Blocks.

Don't use "Widget" for this tier — retired 18 Sep 2026, along with the page that defined it. The
canonical directories are now the Blocks and Components pages under Design System in Notion.

- Fields: `InlineField` is the text field — one shape for the app, a pill (`inputClass`), matching
  the pickers beside it. A textarea keeps a rounded rectangle. `Field` (listing-form.tsx) wraps a
  control that isn't an input; `CityField` is the only way to ask for a city. Auth has its own
  `TextField`, `PhoneField`, `CodeInput`. Never add a second styled copy of any of these — four
  screens had one, and they have been folded back in. Input text is `text-2` or larger: the
  viewport sets no `maximum-scale`, so iOS zooms the page on anything under 16px.
  Errors under the field on blur or submit (`useFieldErrors`); `AuthNotice` only for whole-form problems.
- Buttons: `Btn`, `Btn icon`, `IconBtn label` (and `BtnLink`, `IconBtnLink`). Use `loading`, not
  "Please wait…". Never ship a control that does nothing; disable it and say why.
- Chip = selectable `Chip`. Pill = static status/tag label (`pill` utility). Never mix.
- Never key styling off display copy; key off a union type.
- Tailwind classes with tokens only. Inline `style` only for runtime values (computed sizes,
  safe-area, animation delays).
- Icons from `lucide-react` at a size from `iconSize` (brands: `ml/brand-icons.tsx`). Never emoji,
  never an off-scale pixel value. There is a second set: ~400 Pinterest Gestalt SVGs in
  `src/assets/icons/gestalt/`, used only by `ml/tab-icon.tsx` for a tab's filled active state.

**Tokens.**

- Radius, four steps by role (`src/styles.css`): `sm` 8 for chips, small controls, thumbnails and
  inputs; `lg` 16 for cards and list containers; `3xl` 32 for sheets, dialogs and full-bleed hero;
  `full` for buttons and pills. `md`, `xl` and `2xl` are retired. No arbitrary `rounded-[…]`.
- Type: `text-1` (12–13px, the smallest step), `text-sm` (14–15, what the app leans on hardest),
  `text-2` (16–18), `text-3` (22–28), `text-4` (32–44). No `text-xs/base/lg`. The only
  arbitrary sizes allowed are `text-[10px]` and `text-[11px]`, and only for metadata and compact
  labels (count badges, timestamps, initials in a small avatar, chart labels) — never body copy or
  headings, and never as `text-10`/`text-11` tokens. Any other `text-[Npx]` is a bug.
- Tracking: normal. An exception needs a named role and a written reason beside it in the code
  (today: the splash's all-caps label). Wordmarks and headings set at normal tracking.
  `text-0`, `text-2.5` and `text-5` do not exist (retired 16 Sep 2026). `cn()` (`src/lib/utils.ts`)
  tells tailwind-merge that `text-1`…`text-4` are sizes; a new size step must be added there too,
  or `cn()` drops it whenever a text colour follows and the element renders at 16px.
- Eyebrow text (the small label above a heading) has no background, border or pill around it
  (owner, 4 Oct 2026).
- Spacing: Tailwind numeric scale. Secondary text: `text-muted-foreground`.
- Colour: one dark token, `ink` `#0D0D0D` (`bg-ink`, `text-ink-foreground` on it); there is no
  `primary` (merged into `ink`, owner 4 Oct 2026). Palette is black, greys, white. Field borders use
  `border-input` (3:1 on the page); cards and dividers `border-border`. Icons draw at Lucide's
  default stroke 2; no per-icon `strokeWidth`. Brand pink `#EA4C89` is rare
  and always a signal: the logo, the active tab underline, press feedback while a finger is down, a
  selected pill, prices, and the `brand` button inside branded blocks. Never a resting border,
  background or body text. `src/styles.css` is the authority on this — read the comment on
  `--brand` rather than restating the rule from memory.
- `:focus-visible` ring on every control. Hit target 48px (owner, 29 Sep): `min-h-touch` /
  `--spacing-touch` is 48px. A control may be drawn 40–44px only inside a 48px `hit-area`.

**Routing.** Mostly flat dot-named files in `src/routes/`; `marketplace/`, `marketplace/rent/` and
`onboarding/` are real directories (27 of 144 route files). `routeTree.gen.ts` is generated, never edit it.
Every route has `head()`. A route with children must render `<Outlet />` or be an `x.index.tsx`
leaf — check whether `x.tsx` exists before adding `x.y.tsx`. Never move or rename route files to
group screens.

**Data.** Database rows are live data — never call them seed, sample or fake. Hardcoded content
lives only in `src/data/`, and a screen reading it instead of the database is a bug to fix, not a
pattern to copy. Keep UI copy and runtime data in separate modules. Store timestamps, not
"3 weeks ago". Never fabricate counts, availability, ratings, payments or bookings. Watch for
placeholder names, photos and counts leaking onto real profiles.

Anything drawn from a list of options — roles, genres, instruments, languages, cities, categories,
work modes, amenities — comes from `taxonomy_options`, never from an array in code. A profile stores
`metadata.app_key` where a category sets one and the slug otherwise, so read values back with
`labelFor`, and compare cities with `sameCity` (`src/lib/place.ts`) rather than `===`.

**Database.** Every schema change is a file in `supabase/migrations/`, applied through Lovable's
own tooling, never pasted into the live database by hand. While Lovable is out of credits, the
owner may have a migration applied directly from the committed file on `main` — unchanged, and
verified against the live database afterwards. It is always a committed file first. Committing
or deploying never applies a migration (checked 4 Oct 2026): the code that needs one ships after it
is live, or tolerates its absence.
`supabase_migrations.schema_migrations` stopped being updated after `20260918160000`: later
migrations are live without being recorded there, so it is not a record of what is applied.
Nobody writes to it by hand. No new table, bucket, or rename of
either without owner approval; propose the plan first.
**Commit a snapshot to `supabase/dumps/` before any write to the live database**, named
`YYYY-MM-DD-before-<change>.sql`, and reference it from the migration's header — that file is the
undo. A snapshot holds only what the change touches (definitions, row counts), never user data:
the repo syncs to Lovable.

**Sign-in and sign-up (owner, 4 Oct 2026).** Login (`/welcome`, `LoginScreen`) and sign-up
(`/signup`) are two screens sharing `ml/login.tsx`; the Sign In | Sign Up toggle navigates between
the two routes, never flips one form in place. Both ask for email and password only. Email is
verified by **link** before onboarding (Sign up → Check your email → link → `/`); mobile is
verified by a 6-digit **code** on one screen (`/auth/phone`). Never create an account already
confirmed. Remember me and Forgot password (by email link or mobile code) are on login only. A new
signup lands on onboarding (`postAuthTarget`; `onboarding_draft` defaults to `{}`, so an empty
draft is not a started one).

**Collaboration and bands (owner, 4 Oct 2026).** Collaboration stays: projects at `/collab`, as they
work today. Bands are separate from it: their own screens under `/bands`, and their own tables
planned (they still sit on the `collab*` tables, `type = 'band'`). Don't remove `/collab`.

**Naming (owner, 3 Oct 2026).** Storage, tables, files, routes and functions are named by the job,
never by one persona type: a studio is one business type, and a singer's cover and a studio's cover
are the same profile cover. Media buckets, by job:

| Bucket | Holds |
|---|---|
| `avatars` | Profile pictures, any persona |
| `covers` | Profile covers, any persona |
| `gallery` | Profile and band gallery photos |
| `listing-media` | Anything listed in Market: gear for sale or rent, any persona |
| `business-media` | Equipment and amenities of a bookable space, as proof of what it offers; never for sale (5 MB) |
| `verification-documents` | Private, owner-only |

Equipment for sale or rent belongs in `listing-media`; the two buckets are not merged. A
bookable space's tables are `bookables`, `bookable_blocks`, `bookable_equipment` and
`bookable_photos`, linked by `bookable_id` (20261003130000_bookables_rename.sql); its business
type stays on the owner's profile, and `studios_one_per_owner` keeps one per owner. The old
`studio*` views and functions were dropped (20261003140000). **There are no rooms** (owner,
3 Oct 2026): people book a service (`booking_requests.service_id`), one calendar per place; no code
reads `bookable_rooms` or `bookables.services`, which 20261004120000/20261004140000 retired by
renaming (`bookable_rooms_retired`, `services_retired`); 20261004150000 drops both (owner yes,
4 Oct 2026; committed, apply pending). What a business offers is `profile_services`.
Data access is server-side `createServerFn` in `*.functions.ts` with `requireSupabaseAuth`; no
client-side Supabase writes. The one exception is file uploads (photos, verification documents):
they go from the browser straight to Supabase Storage (owner, 3 Oct 2026). That is allowed because
the storage rules enforce ownership: every bucket only accepts files inside the uploader's own
folder (their user id, or a studio they own), so a server hop would protect nothing more. Files
are type- and size-checked first and photos resized in the browser (`checkPickedImage`,
`downscaleImage`); the row that points at a file is still written server-side. A storage rule
that checks a folder inside a subquery must say `objects.name` — a bare `name` can resolve to the
subquery's table (20261003100000_fix_studio_media_policies.sql). Private user details live in owner-only `profile_private`.

## Checks

By default run `bunx tsc --noEmit`. Before a push, run what CI runs, because CI blocks the merge on
all of it (`.github/workflows/ci.yml`): `bunx tsc --noEmit`, `bun run lint`, `bun run test-storybook`
(the accessibility gate — there are no `*.test.*` files, the stories are the test suite),
`bun run check-token-drift` and `bun run build`. 412px screenshots, `CHANGELOG.md` and `roadmap.md`
updates happen only when asked. Say plainly what was not run.

Checking a screen locally: the live SSR runtime is Cloudflare workerd, so verify on `bun run build`
served with `wrangler dev` on `.output/server` (a `.dev.vars` from `.env`, deleted after). The Vite
dev server can stall before hydrating; a page that never hydrated ignores taps, so don't read that
as a bug. Local runs have no service-role key: server functions using `supabaseAdmin` fail there and
fall back to empty. Onboarding needs an account; on the dev server `/onboarding?preview` runs it
without one and writes nothing. Never create accounts on the live database to test.

If a link, file or attachment can't be read, say so. If two sources disagree, surface it.
