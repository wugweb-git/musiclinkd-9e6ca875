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
live at `musiclinkd.lovable.app`. Nothing here is a prototype.

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
before creating anything; reuse and restyle, don't add siblings. Use shadcn `dialog`/`sheet`/`drawer`
for overlays (focus trap, Escape, scroll lock).

**Primitive vs Component vs Block.** `src/components/ui/` (shadcn) is the Primitive layer:
domain-agnostic, atomic, would look the same in any app (`Button`, `Chip`, badges, `Card` the bare
shape). `src/components/ml/` is where Components and Blocks live, grouped by product domain, not one
file per export:
- **Component** — a small domain-aware grouping that isn't yet a standalone unit (a price + unit
  line, an avatar + name pairing).
- **Block** — the standalone, feature-level unit: bundles two or more data fields (often plus a named
  action) to represent one entity — `ArtistCard`, `BookingCard`, `TrackCard`, `HireContactModal`,
  `AdvancedFiltersBottomSheet`. The `Card` suffix is a shape, not a demotion — cards are Blocks.

Don't use "Widget" for this tier — retired, see Notion 🧩 Master Widgets for why. Canonical directory:
same page, being rebuilt under this naming.

- Fields: `TextField` (sentence-case label, not bold), `PhoneField`, `CodeInput`, `InlineField`.
  Errors under the field on blur or submit (`useFieldErrors`); `AuthNotice` only for whole-form problems.
- Buttons: `Btn`, `Btn icon`, `IconBtn label` (and `BtnLink`, `IconBtnLink`). Use `loading`, not
  "Please wait…". Never ship a control that does nothing; disable it and say why.
- Chip = selectable `Chip`. Pill = static status/tag label (`pill` utility). Never mix.
- Never key styling off display copy; key off a union type.
- Tailwind classes with tokens only. Inline `style` only for runtime values (computed sizes,
  safe-area, animation delays).
- Icons from `lucide-react` (brands: `ml/brand-icons.tsx`). Never emoji.

**Tokens.** `README.md` is stale.

- Radius by role: `sm` 8 controls, `md` 12 inputs/thumbnails, `lg` 16 cards, `xl` 20, `2xl` 28
  sheets, `3xl` hero, `full` buttons/chips/pills. No arbitrary `rounded-[…]`.
- Type: `text-0` (11px labels), `text-1`, `text-sm`, `text-2`, `text-2.5` (19px section
  headings), `text-3`, `text-4`, `text-5` (hero). No `text-xs/base/lg`, no `text-[Npx]`.
- Spacing: Tailwind numeric scale. Secondary text: `text-muted-foreground`.
- Colour: primary is ink `#0D0D0D`; palette is black, greys, white. Brand pink `#EA4C89` only on the
  logo, unread dots and the Welcome tagline — never buttons, links, selection, icons or body text.
- `:focus-visible` ring on every control; 48dp touch targets.

**Routing.** Flat dot-named files in `src/routes/`. `routeTree.gen.ts` is generated, never edit it.
Every route has `head()`. A route with children must render `<Outlet />` or be an `x.index.tsx`
leaf — check whether `x.tsx` exists before adding `x.y.tsx`. Never move or rename route files to
group screens.

**Data.** Keep UI copy, seed content and runtime data in separate modules. Store timestamps, not
"3 weeks ago". Never fabricate counts, availability, ratings, payments or bookings. Watch for seed
defaults (names, photos, counts) leaking into real users.

**Database.** Every schema change is a file in `supabase/migrations/`. Ask before adding tables.
Data access is server-side `createServerFn` in `*.functions.ts` with `requireSupabaseAuth`; no
client-side Supabase writes. Private user details live in owner-only `profile_private`.

## Checks

By default run `bunx tsc --noEmit`. Lint, build, 412px screenshots, `CHANGELOG.md` and `roadmap.md`
updates happen only when asked or before a push. Say plainly what was not run.

If a link, file or attachment can't be read, say so. If two sources disagree, surface it.
