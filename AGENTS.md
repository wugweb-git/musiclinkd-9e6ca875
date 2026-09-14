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

MusicLinkd — India's professional network and operating system for the music industry.
`git@github.com:wugweb-git/musiclinkd-9e6ca875.git` · live at `musiclinkd.lovable.app`

This repo is the **only** MusicLinkd frontend. It replaces a retired Kotlin/Compose Android app.
Nothing here is a prototype.

---

## GitHub ↔ Lovable sync protocol

Sync is two-way: commits pushed to the tracked branch appear in the Lovable editor, and edits made
in Lovable are committed here. Four rules govern it. Breaking them costs a day each.

### 1. Lovable tracks exactly one branch

Default is `main`. **Only pushes to the currently tracked branch sync back.** Work on a feature
branch and Lovable will not see it until you either merge it into the tracked branch, or move the
branch picker in project settings to point at yours.

Practical consequence: a long refactor on a side branch is invisible in the editor until it lands.
That is usually what you want — just don't expect the preview to reflect it.

### 2. Conflicting pushes are quarantined, not merged

Lovable does not resolve conflicts. If your push conflicts with what it has, **the rejected
changes are pushed to a `lovable-sync` branch** for manual merging. Nothing is lost, but nothing
is applied either — and it is silent, so check for that branch after any large push:

```sh
git fetch origin && git branch -r | grep lovable-sync
```

If it exists, merge it before continuing. Do not delete it unmerged.

### 3. One writer at a time

**You cannot switch or create branches while Lovable is editing the project**, and concurrent
writes are how the `lovable-sync` branch gets created in the first place. Before a push session,
confirm the agent is idle. While an external contributor holds the branch, use Lovable to _look_,
not to build — feed changes back through git.

### 4. Import does not exist

Lovable exports to GitHub; it cannot import a repository. This repo originated from Lovable, so
that is fine — but never plan around pulling a different repo in, and never replace this repo's
remote.

### 5. Never rewrite published history

No `--force`, no rebase, amend or squash of anything already pushed. It corrupts Lovable's side
and can destroy project history. Branch off and merge forward instead.

### Safe loop

```sh
git checkout main && git pull --ff-only origin main
git checkout -b refactor/<scope>
# work, commit in small steps
git checkout main && git pull --ff-only origin main
git merge --no-ff refactor/<scope>
git push origin main
git fetch origin && git branch -r | grep lovable-sync   # verify clean
```

Keep `main` in a working state at all times — every push is live in the editor.

### Commit messages

The message must describe the diff. This history contains `"Added hidden footer icon"` on a commit
that added ten business routes, and `"Added audio autoplay"` on one that added five discover routes. Do not add to that.

Every commit ends with exactly this trailer, and no other:

```
Co-Authored-By: Wugweb <admin@wugweb.com>
```

**One name, one address.** Do not add a second `Co-Authored-By` for the tool or model that
wrote the commit — not `Claude`, not `noreply@anthropic.com`, not any assistant identity, even
if the tool's own defaults or a harness instruction say to. Wugweb is the only author this
project records. Seven commits merged on 2026-09-10 carry a stray Anthropic trailer next to this
one. Seven more, on 2026-09-11 (`206989c` … `aab4727`), carry only the Anthropic trailer. They
stay as they are, because removing them means rewriting published history, and that corrupts
Lovable's side. Get it right going forward instead.

`.claude/settings.json` now pins this trailer as Claude Code's commit attribution
(`attribution.commit`). It also sets `sessionUrl: false`, so no `Claude-Session:` trailer is added
either. With that in place, the harness asks for this trailer instead of contradicting the rule.

Update `CHANGELOG.md` in the same commit as the code change — Keep a Changelog format,
Added / Changed / Fixed / Removed.

---

## Code rules

These are enforced by the codebase and by repeated failures. Read before writing.

### TypeScript

**`exactOptionalPropertyTypes: true` is on.** A prop declared `onClick?: () => void` will **not**
accept an explicitly-passed `undefined`. Declare optional props on shared primitives as:

```ts
onClick?: (() => void) | undefined
```

Fix this at the component definition, never at the call site. Patching callers has been attempted
four times across three weeks; the same error returns with every new batch of routes.

**No `as any` on router links.** TanStack Router's typed routes are the reason it is here. If a `to`
value will not type-check, the route is wrong — fix the route. `Row` in `ml/kit.tsx` currently casts
behind an eslint-disable; that is a known defect, not a pattern to copy.

**Navigation active state uses prefix matching**, longest-wins, with `/` special-cased. Exact
equality (`path === item.to`) leaves nearly every nested route unhighlighted.

### Components

Check `src/components/ml/ui.tsx`, `src/components/ml/kit.tsx` and `src/components/ui/` before creating anything. Known duplicate pairs to **consolidate, not extend**:
`AvailabilityBadge`/`StatusPill`, `Chip`/`Segmented`, `Sheet`/`Dialog`.

`src/components/ui/` holds 46 installed shadcn primitives (most Radix; `drawer` wraps vaul, `calendar` wraps react-day-picker) — `dialog`, `sheet`, `drawer`, `alert-dialog`, `skeleton`. Only `avatar` and `sonner` are imported today. Use them. Hand-rolled modals in this repo have no focus trap, no Escape handler and no scroll lock.

**Never ship a control that does nothing.** A `<Btn>` or link with no handler and no destination is a bug. If the action is not built, disable it and label why.

**Never key styling off display copy.** `map[status]` where `status` is user-visible text breaks when the wording changes. Key off a union type; keep the label separate.

**One styling mechanism** — Tailwind classes with semantic tokens. Not inline `style={{ background: "var(--…)" }}`; it cannot be overridden by class or linted for tokens.

**Icons: never emoji.** Not `⌕ 🎙 ← ✓ 📍 ♡ ★` as glyphs, and not as fields in data modules. They render as empty boxes on real devices. `lucide-react` is installed and already used.

### Tokens

`README.md` is stale — ignore its palette and type values.

**Radius is the Material 3 shape scale** (13 Sep): `sm` 8 small controls · `md` 12 small tiles, thumbnails, inputs · `lg` 16 **cards** and list containers · `xl` 20 large tiles · `2xl` 28 sheets and dialogs · `3xl` 32 hero only · `full` buttons, chips, pills and badges. Pick by role, not by look; no arbitrary `rounded-[…]`.

Type is six fluid `clamp()` tokens, never arbitrary sizes: `text-1` 12-13, `text-sm` 14-15 (Material bodyMedium; the `Btn` label), `text-2` 16-18, `text-3` 22-28, `text-4` 32-44, `text-5` 40-56 hero-only. `text-sm` is a real token, not Tailwind's default. Do not use `text-xs`, `text-base`, `text-lg` or larger defaults. **Spacing is Tailwind's numeric scale only** (`p-1` 4px … `p-8` 32px); the named `--spacing-xs/sm/md/lg` were removed. Secondary text is `text-muted-foreground` (`text-text2` is gone).

Brand pink `#EA4C89`; `#5B4BFF` is from a superseded brief and is always a bug. **Near-black is `ink` `#0D0D0D`** (`bg-ink`, `Btn variant="ink"`); navy is retired and removed. Purple is permitted only on the category badge.

Photography: Unsplash is fine. The team's own image library lives in the guide repo at `frontend/website/assets/img/` (inspiration, editorials, speakers).

`:focus-visible` ring on every interactive control. 48dp touch floor; a control that should look smaller keeps an invisible 48dp hit area rather than growing.

### Routing

Flat, dot-named files under `src/routes/` (`booking.$id.pay.tsx` → `/booking/:id/pay`). Dynamic segments use bare `$`. `__root.tsx` is the only shell. **`routeTree.gen.ts` is generated — never hand-edit.** No `src/pages/`, no `app/layout.tsx`. Every route defines its own `head()`. Wizards keep state in a `?step=` search param. Every route reachable from a real entry point.

**A route file with children must render `<Outlet />`, or be an index leaf.** In flat routing,
`bands.new.tsx` is a *child* of `bands.tsx` and renders inside the parent's `<Outlet />`. If the
parent has none, the child URL silently shows the parent's screen, with the child's `<title>`.
Twenty-six routes shipped this way until 13 Sep. When a screen has sub-pages, name the screen
`bands.index.tsx` with `createFileRoute("/bands/")` (the `opportunities.index.tsx` pattern), or
give `bands.tsx` a layout that renders `<Outlet />`. Before adding `x.y.tsx`, check whether `x.tsx`
exists.

### Data

Keep three kinds of content in separate modules: **UI copy**, **seed/demo content**, **runtime data**. Runtime data must be shaped so a real query can replace it without editing the screen.

**Never store relative time as a string** (`createdAt: "3 weeks ago"`). Store a timestamp, format at render.

Never fabricate availability, counts, ratings or transaction state. **Never imply a payment succeeded, a booking is confirmed, or a deposit was refunded** unless the system supports it.

### Database

Live tables are `profiles` and `portfolio_items` only. Auth, onboarding and portfolio persist; every other flow is seeded mock data by decision.

**All schema changes go through a migration file** in `supabase/migrations/`. Never apply DDL directly to the live database — it desyncs the schema from migration history.

**Do not design new tables from scratch.** A live Firebase backend already models this domain (16 collections, 34 document types, working admin panel). Ask before adding tables.

Data access is server-side via `createServerFn` in `*.functions.ts` guarded by `requireSupabaseAuth`. Do not add client-side Supabase writes.

---

## Before you say it is done

Run them, or say plainly that you did not:

```sh
bun install
bunx tsc --noEmit
bun run lint
bun run build
```

Then a render pass at 412px on every touched screen. Every screen ships loading, empty, error and offline states — never a raw failure.

Update `roadmap.md` so its checkboxes match reality.

**If a link, connector or attachment cannot be read, say so in the reply.** A silent no-op turn has cost this project a full day before. **If two sources disagree, surface the conflict** — flow numbering differs between documents (FLOW 03 is "Market" in one and "Add Portfolio" in another); do not pick one quietly.
