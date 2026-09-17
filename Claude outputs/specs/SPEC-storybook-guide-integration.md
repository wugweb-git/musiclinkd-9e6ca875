---
doc: SPEC-storybook-guide-integration
version: 2.0
status: CURRENT
updated: 2026-09-16
verified_against: musiclinkd-9e6ca875@24a55b7 · musiclinkd@fae464f — read 16 Sep 2026
folder: specs
originally: new
---

> **For Claude Code.** Claude (Cowork) does not edit or push code. Every number was read from the
> repos, not carried forward.
>
> **v2 supersedes v1.** v1 assumed the guide lived only in the `musiclinkd` repo. It does not —
> there is a second, untracked copy inside the app repo. That changes the whole approach.

# Storybook and the guide

## 0 · Do this first — the guide is unprotected

```
musiclinkd-9e6ca875/guide/     193 MB
git status                     ?? guide/        ← untracked
.gitignore                     no entry for it  ← nothing stops a commit
```

**One `git add .` pushes 193 MB into a Lovable-synced repo.** The owner's instruction is that this
folder stays local and never reaches GitHub. Nothing currently enforces that.

Add to `.gitignore`:

```gitignore
# Local design guide — never pushed. Published copy lives at musiclinkd.com/guide.
/guide/
```

Verify with `git check-ignore -v guide/styleguide.html` before doing anything else in this spec.

**Also on record:** a stale `.git/index.lock` in the `musiclinkd` guide repo has blocked commits
since 15 Sep and cannot be removed from this session — deletion is not permitted here. Clear it
manually.

## 1 · What exists

**Storybook is already installed in the app.** Nothing to install.

```
storybook                 10.6.0
@storybook/react-vite     10.6.0
@storybook/addon-docs     10.6.0
@storybook/addon-a11y     10.6.0
.storybook/               main.ts · preview.tsx · vite.config.ts · layers.css
scripts                   storybook → dev -p 6006 · build-storybook → storybook-static
```

`main.ts` points at `.storybook/vite.config.ts` rather than the app's config, because the app runs
TanStack Start with SSR and Nitro and a story page does not need it. That is correct — do not
"fix" it.

**Two copies of the guide, different jobs:**

| | |
|---|---|
| `musiclinkd-9e6ca875/guide/` | local only, untracked, 193 MB, `styleguide.html` 674 KB |
| `musiclinkd/frontend/guide/` | the tracked copy; published at **https://musiclinkd.com/guide** |

The app-repo copy has 16 entries; the published one has 19 (it also carries `MusicLinkd.pptx` and a
`_to_delete/`). They are near-identical, not synced. **Do not add a sync step.** Two copies with
different jobs is the owner's arrangement.

**Coverage is the real gap:**

| | components | with stories |
|---|---|---|
| `src/components/ml` | 24 | **2** — `auth`, `ui` |
| `src/components/ui` | 50 | **0** |
| `src/lab` | — | 3 |

74 components, 6 story files. Every Phase 1 surface is unstoried.

---

## 2 · Make Storybook see the local guide

The requirement has a built-in tension: **gitignored** means the folder does not exist on any build
machine. So local and published Storybook cannot resolve it the same way. Handle both explicitly —
do not let the build break silently.

### 2.1 Serve it, but only what is needed

193 MB through `staticDirs` will make Storybook slow to boot. Serve the styleguide and its direct
dependencies, not the whole tree.

In `.storybook/main.ts`, add a guard so a missing folder is not a build failure:

```ts
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const guideDir = resolve(__dirname, "../guide");
const hasGuide = existsSync(guideDir);
```

Then set `staticDirs` to `[{ from: "../guide", to: "/guide" }]` when `hasGuide`, and `[]` when not.
`styleguide.html` becomes reachable at `/guide/styleguide.html` on the Storybook dev server.

Check what `styleguide.html` actually loads before narrowing the directory — it references
`system/*.css`, `tokens/`, `icons/` and probably `brandkit/`. Grep its `href`/`src` attributes and
serve exactly those subfolders if the full mount is too slow. **Measure before optimising.**

### 2.2 One docs page, two behaviours

Add `.storybook/Guide.mdx` — a Docs entry that renders the styleguide in an iframe.

- when `hasGuide` — iframe `/guide/styleguide.html`, full height, no border
- when not — a short note plus a link to **https://musiclinkd.com/guide**

Expose `hasGuide` to the page through Vite `define` or an env var set in `main.ts`. The published
Storybook then shows the link; the local one shows the live file. Neither breaks.

State this on the page in one line, so nobody files a bug: *the embedded styleguide is local-only;
the published build links to musiclinkd.com/guide.*

### 2.3 Do not invert this

Do not make `styleguide.html` the thing that embeds Storybook. It is a 674 KB hand-maintained file;
making it the shell puts the drifting artefact in charge of the generated one.

---

## 3 · Story coverage — Phase 1 first

Order comes from the release phases, not component size.

```
ml/onboarding.tsx        StepShell and the 19 step surfaces
ml/profile.tsx
ml/person-profile.tsx
ml/portfolio.tsx
ml/work-form.tsx
ml/cards.tsx
ml/kit.tsx
ml/logo.tsx              Brand and Brand compact
ml/tab-header.tsx
```

Plus the `ui/` primitives those nine actually import — derive from the imports, do not story all 50
on spec.

**Every story ships the states the component really has**, not a happy path: default · loading ·
empty · error · offline where they exist; long-content and Indian-language-label variants, because
labels run long in Hindi and Tamil and the layout has not been tested against that; 412px as the
default viewport, per the Android-parity rule; `prefers-reduced-motion` on for anything animated.

`addon-a11y` is already installed and currently runs against 2 of 74 components. Across Phase 1 it
turns the **56 open `text-primary` contrast failures** from a grep number into per-component
findings. That is the point.

**Rules:** stories live beside their component as `*.stories.tsx`, matching the existing glob. No
fabricated content — use existing seed data or obvious placeholders; bios, track names, reviews and
credits are Vedanshu's. No new components: if a story is hard to write because a component takes
nine props and branches on four, report it, do not refactor under cover of a story.

---

## 4 · Not a code task — report only

`musiclinkd-9e6ca875/guide/musiclinkd-system/` and its twin in the other repo build on **Gestalt**.
The shipping app is **Tailwind + Radix**. Of the guide's 2,378 `.tsx` files, 2,151 are vendored
Pinterest Gestalt.

Either that library is dead and should be archived, or it is reference and its README should say
so. Right now it reads as a second design system. **Decision for Vedanshu. Report, do not act.**

---

## Order

```
0    .gitignore the guide folder      minutes   ← blocks everything, do it first
2.1  staticDirs with existsSync       hours
2.2  Guide.mdx, both branches         hours
3    nine Phase 1 components          2–3 days
4    report Gestalt state             minutes
```

## Exit gates

- `git check-ignore -v guide/styleguide.html` confirms the folder is ignored
- `bun run storybook` shows the styleguide embedded and it renders
- `bun run build-storybook` succeeds **on a machine without `guide/`**, and the Guide page shows
  the musiclinkd.com link instead of a broken iframe
- Every Phase 1 component has a story with its real states
- `addon-a11y` reports zero **new** violations; existing ones are listed, not silently passed
