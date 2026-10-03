# Component inventory — tokens, primitives, components, blocks, widgets

> **Superseded (4 Oct 2026, brief §7).** This file is a dated snapshot, not an authority. The
> order of authority is **code → Storybook → Notion**: `src/styles.css`, `src/components/ml/*`,
> `AGENTS.md`, and Storybook's Foundations pages. Where this file disagrees with them, it is wrong.
> Kept for history only; nothing here should be built from.


**16 Sep 2026 · audit only.** Nothing under `src/` was changed to produce this document. Counts
were read directly from files on `main`, same method as `docs/inventory-2026-09-11.md`: grep/parse,
not guesswork. This is the first pass — it identifies and maps what exists and what repeats; it
does not merge anything.

## Layer 1 — Tokens

**Status: centralized, already mapped.** All design tokens live as CSS custom properties in
`src/styles.css` — 37 color, 5 type scale, 4 each of radius/opacity/elevation/duration/shadow/chart,
3 easing. One source of truth; nothing duplicates a token value under a different name that was
found in this pass. Documented live in Storybook at `Foundations/Tokens` (`src/registry/tokens.stories.tsx`,
landed 16 Sep) — six pages (Type, Shape, Icons, Colour, Depth, Layout), each reading the actual
custom property at render time so the docs page cannot drift from `styles.css`.

**No action needed here.**

## Layer 2 — Primitives (`src/components/ui/`)

60 files, one exported component per file (shadcn/Radix convention) — **zero duplicate names**
within this layer. But **zero of the 60 have a Storybook story.** The `ml/` layer above it is
partially documented; the primitives underneath it are not documented at all. That's a real gap:
anyone deciding "does a Button variant already exist for this" has to read source, not a story.

**Recommendation:** not urgent to fix (primitives are stable, low-churn, and self-evident from
shadcn's own naming), but worth a backlog item if `ui/` starts changing often.

## Layer 3 — Components (`src/components/ml/`)

27 module files, 12 with a matching `.stories.tsx` (auth, cards, kit, links, logo, marketing,
onboarding, person-profile, portfolio, profile, tab-header, ui, work-form). **15 have no story**
(booking, booking-context, brand-icons, business-profile, collab, collab-extra, collab-workspace,
filter-sheet, hire-modal, market, notification-icons, opportunity, qr, rental, viewer) — these are
some of the largest modules in the app (booking.tsx: 25 exports, collab.tsx: 24, market.tsx: 18,
rental.tsx: 16, qr.tsx: 13).

### Repeated component names across files — the actual "recycle" candidates

Same name, separately implemented, in more than one `ml/*.tsx` file. Same-name-different-file is
either an accidental duplicate (three teams needed "an offline banner" and each wrote one) or a
legitimately different thing that happens to share a name — each needs a look, not an assumption:

| Name | Defined in | Likely status |
|---|---|---|
| `EmptyState` | booking.tsx, collab.tsx, kit.tsx, market.tsx | 4-way duplicate — highest priority |
| `StatusPill` | kit.tsx, collab.tsx, portfolio.tsx | 3-way duplicate |
| `OfflineBanner` | booking.tsx, collab.tsx, onboarding.tsx | 3-way duplicate — already confirmed real in the routes audit (different props, different copy) |
| `Card` | kit.tsx, collab.tsx | check — `kit.tsx`'s `Card` reads like a generic primitive-ish wrapper; `collab.tsx`'s may be domain-specific |
| `StickyBar` | booking.tsx, collab.tsx | check |
| `StateCard` | portfolio.tsx, qr.tsx | check |
| `ProjectCard` | collab.tsx, profile.tsx | check — collab's is a workspace project, profile's is a portfolio project; may be legitimately different despite the name |
| `OpportunityCard` | opportunity.tsx, profile.tsx | check — same reasoning as ProjectCard |
| `ErrorState` | booking.tsx, collab.tsx | check |
| `AudioPlayer` | collab.tsx, portfolio.tsx | check |

10 repeated names across 27 files. Not yet deduplicated — this is the map, not the merge.

### Buttons, nav bar, cards, motion — verified against actual usage, not just definitions

A component being single-sourced in `ml/ui.tsx` doesn't prove every screen actually uses it — that
needs checking against the 213 route files themselves, not just the component layer:

- **Buttons**: `Btn`/`BtnLink`/`IconBtn`/`IconBtnLink` are the only implementations (`ui.tsx`), no
  duplicates. 200/213 routes import them. But **62 route files also contain a raw `<button>`** —
  some are legitimate (e.g. a `role="radio"` custom control can't use `Btn`), but 62 is too many to
  assume justified without opening each one. Not verified file-by-file in this pass.
- **Nav bar**: `BottomNav` and `TopBar` are only defined in `ui.tsx`. Clean, no duplicates found.
- **Cards**: 37 `*Card`-suffixed exports across 12 files (full list below). Most are legitimately
  different domains; the 4 collisions already listed above (`ProjectCard`, `OpportunityCard`,
  `StateCard`, `Card`) are the real candidates.
- **Animation/interaction — not mapped, and partly dead code.** The `motion` npm package
  (Framer Motion) is a `package.json` dependency **imported by zero files** in `src/routes/` or
  `src/components/ml/` — installed and entirely unused, same category as the icon-package bloat
  removed earlier this session. Actual animation happens ad hoc through a handful of named
  Tailwind classes (`animate-shake`, `animate-message`, `motion-safe:animate-*`), used in only 5
  files total. There is no documented or centralized animation/interaction system.

Full `*Card` list (37, one file's worth of grep, not yet triaged beyond the 4 flagged collisions):
`TalentCard`, `TalentGridCard` (cards.tsx) · `ResourceCard`, `AddOnCard`, `PriceBreakdownCard`,
`PolicyCard`, `BookingSummaryCard`, `BookingListCard`, `ProviderRequestCard`, `PaymentSummaryCard`
(booking.tsx) · `Card`, `ProjectCard` (collab.tsx) · `ListingCard` (market.tsx) · `ArticleCard`
(marketing.tsx) · `Card` (kit.tsx) · `OpportunityCard`, `ApplicationCard`, `ApplicantCard`
(opportunity.tsx) · `WorkCard`, `StateCard` (portfolio.tsx) · `QrIdentityCard`,
`DestinationPreviewCard`, `StateCard` (qr.tsx) · `ReadinessCard`, `HandoffCard` (onboarding.tsx) ·
`EquipmentCard`, `ProviderCard`, `BookingCard` (rental.tsx) · `FeaturedCard`, `AudioTrackCard`,
`VideoCard`, `ProjectCard`, `ServiceCard`, `ExperienceCard`, `CollaboratorCard`, `ReviewCard`,
`OpportunityCard`, `MarketEntryCard`, `CompletionCard` (profile.tsx).

**Answering "is this true for all 100+ screens?" directly: not fully verified.** The component
layer generalizes to every screen *only if* every screen actually uses it. That's ~94% true by
import count (200/213), but the 62-file raw-`<button>` overlap means real coverage is lower and
unconfirmed until each of those 62 files is read individually. That check has not been done.

## Layer 4 — Blocks / Widgets

**No separate block/widget layer exists in this codebase's own taxonomy.** Unlike the `guide/`
folder's now-gone `musiclinkd-system` reference (which explicitly separated "Components" from
"Blocks" from an "Admin widget directory"), `src/components/ml/` mixes both: a single file like
`booking.tsx` exports small primitives (`BookingStatusPill`), mid-size composites
(`SlotPicker`, `PriceBreakdownCard`), and full page-section blocks (`BookingSummaryCard`,
`AvailabilityCalendar`) side by side, with no naming or folder convention distinguishing them.

This isn't necessarily wrong — it's a valid alternative to a strict atomic-design split — but it
means "blocks" and "widgets" aren't things you can currently list separately from "components."
If that separation matters going forward, it would need to be introduced deliberately (e.g. a
naming convention or subfolder split), not discovered — there's nothing to map here yet.

## Layer 5 — Vendored / lab

Brought in scope and verified against real `import` paths (not filename string-matching, which
gave false positives on the first pass — corrected below):

| Dir | Files | Actually imported by `routes/`/`ml/`? | Verdict |
|---|---|---|---|
| `charts/` | 6 | Yes — `charts/recharts/line-signal.tsx` ← `portfolio.analytics.tsx`; `chart-state.tsx` (icons fixed this session) is its dependency | **Live, keep** |
| `kibo-ui/` | 5 | Yes — `kanban/`, `mini-calendar/` ← `services.new.tsx` | **Live, keep** |
| `waves-cn/` | 1 | Yes — `wave-player.tsx` ← `components/ml/portfolio.tsx` | **Live, keep** |
| `billingsdk/` | 1 | Yes — `pricing-table-one.tsx` ← `plans.index.tsx` | **Live, keep** |
| `agents-ui/` | 3 | Partially — `agent-audio-visualizer-bar.tsx` ← `ml/profile.tsx`; the other 2 (`agent-audio-visualizer-wave.tsx`, `react-shader-toy.tsx`) are unimported | **1 live, 2 orphaned** |
| `animate-ui/` | 6 | **No** — zero imports found anywhere in `routes/` or `ml/` | **Fully orphaned** |
| `spectrumui/` | 2 | **No** — zero imports found anywhere in `routes/` or `ml/` | **Fully orphaned** |

`animate-ui/` and `spectrumui/` (8 files combined) and `agents-ui/`'s 2 unused files are currently
unreferenced, but kept intentionally — owner's call (16 Sep 2026): planned for future use, not
delete candidates like the earlier `command-menu-01.tsx`/`onboarding-01.tsx`/`floating-dock.tsx`
removal. None of these were checked for size/dependency weight in this pass (unlike the icon
packages, which were) — worth doing if/when they're actually wired in.

## What's new since the routes audit (this session, earlier)

The routes-focused audit found `OfflineBanner` ×3 and a repeated tab-bar JSX block. This
component-level pass confirms `OfflineBanner` from the same angle and adds **9 more repeated
names** the routes audit couldn't see, because it only looked at `src/routes/`, not
`src/components/ml/` itself.

## Next step (not done in this pass)

Each "check" row above needs one read-through to confirm real duplicate vs. coincidental name
before merging — merging two components that just happen to share a name would be a correctness
bug, not a cleanup.
