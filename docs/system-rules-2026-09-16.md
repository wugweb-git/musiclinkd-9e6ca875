# System rules — MusicLinkd, as built

The owner's reference rules, rewritten against what this repository actually ships: our token
names, our measured values, our component names, our groupings. Where the reference and the code
disagree, the disagreement is named rather than smoothed over — a rule nobody can build from is
worse than no rule.

Companion files: [token-scale-spec-2026-09-16.md](token-scale-spec-2026-09-16.md) for the scales
and the audit, and Storybook's **Foundations/Tokens** for the live values.

## Implementation rules

| Rule | Our value | Note |
| --- | --- | --- |
| Base container | `rounded-lg` (`--radius-lg`, 16px), `border border-border` (`--border` #d5d5de, 1px), `bg-card` | The reference says 32px. Ours is 16: cards moved off 32 when the radius roles were set, and 390 call sites use `rounded-lg`. 32 (`--radius-3xl`) is sheets, dialogs and full-bleed hero. |
| Buttons | Pill (`rounded-full`), `min-h-12` = 48dp | `Btn` and `BtnLink` are 48dp tall by construction; `IconBtn` draws at 40dp and carries `hit-area`, an invisible 48dp target. |
| Icons | One set: **lucide-react**, at the five sanctioned sizes (12 / 16 / 20 / 24 / 32) | The reference names two sets (Gestalt + Lucide). Gestalt is not in this repository and this app is Tailwind + Radix, so there is one set here. Brand marks live in `ml/brand-icons.tsx`. Never emoji. |
| Stroke | lucide's native 2, `strokeWidth={1.75}` on decorative list and tile icons | Two weights, by role: an icon that names a thing is lighter than an icon you press. |
| One canonical implementation | `ml/ui.tsx`, `ml/kit.tsx` and `ml/profile.tsx` hold the primitives | Check those three before adding anything; restyle, never add a sibling. |

## Canonical components

Our ten, in the app's own names. The system is larger than this — 27 modules in
`src/components/ml/` — and Storybook is the live list; this is the minimum, not the ceiling.

| Component | Where | Purpose |
| --- | --- | --- |
| `Btn` / `BtnLink` (primary, ink, outline, ghost) | `ml/ui.tsx` | CTAs, actions, passive triggers |
| `IconBtn` / `IconBtnLink` | `ml/ui.tsx` | Icon-only actions; the label is the accessible name |
| `TextField`, `PhoneField`, `CodeInput`, `InlineField` | `ml/auth.tsx`, `ml/collab.tsx` | Form fields, onboarding, credentials |
| `Chip` | `ml/ui.tsx` | Multi-select and filters. Selectable, wraps |
| `SegmentedField` | `ml/kit.tsx` | A choice between 2–4 alternatives, as one row of equal segments |
| `SearchBar` | `ml/ui.tsx` | Directory search |
| `BottomNav` | `ml/ui.tsx` | Home · Discover · Connections · Market · Profile |
| `WavePlayer` | `components/waves-cn/` | Audio with a waveform, on work pages |
| `Sheet` / `Dialog` | `ml/ui.tsx`, `ml/kit.tsx` | Modal overlay: confirmations, filters, pickers |
| `EmptyState` / `ProfileEmpty` | `ml/kit.tsx`, `ml/profile.tsx` | Empty lists and no-results, with one action |
| `VerificationBadge`, `StatusBadge`, `pill` | `ml/profile.tsx`, `styles.css` | Trust signal; availability; static label |

**Pill is not a chip.** `pill` is a static label — 12px, weight 500, spaced caps, on a ground.
`Chip` is a control you press. They never swap.

## Canonical cards

| Card | Where | Purpose |
| --- | --- | --- |
| `TalentCard`, `TalentRow`, `TalentGridCard` | `ml/cards.tsx` | Discovery: a person, three densities |
| Studio row | `routes/home.tsx`, `ml/booking.tsx` | Rooms to book, with their real rate |
| `MarketEntryCard` | `ml/profile.tsx` | Gear for sale or rent |
| `ProjectCard` | `ml/profile.tsx` | Releases, scores, collaborations |
| `OpportunityCard` + the Home role card | `ml/profile.tsx`, `routes/home.tsx` | Open calls and castings |
| `ReviewCard` | `ml/profile.tsx` | Testimonials from completed work |
| Booking row | `ml/booking.tsx` | A reservation and its state |
| Notification row | `routes/notifications.index.tsx` | Activity, with the category icon badged on the avatar |
| `AudioTrackCard`, `VideoCard` | `ml/profile.tsx` | Portfolio media; `VideoCard` has card, grid and row layouts |
| `ServiceCard` | `ml/profile.tsx` | What someone offers, and from what price |

## States

Eight states, one vocabulary. `state-layer` (styles.css) carries hover and pressed for every
button; the rest are per-component.

| State | Trigger | What we draw |
| --- | --- | --- |
| Hover | Pointer only (`@media (hover: hover)`) | `currentColor` at `--opacity-1` (0.08) over the control |
| Focused | Keyboard, `:focus-visible` only | 2px `--primary` (ink) at 2px offset |
| Pressed | Pointer down | The state layer at 0.12, plus a scale — **see the correction below** |
| Selected | Chosen | `--selected-bg` ink on `--selected-text` white; `Chip` springs once with `--animate-select` |
| Disabled | Inactive | `opacity-50`, `pointer-events-none`, and the reason said in words |
| Loading | Async | `Btn loading`, `Skeleton`, `Loading rows` — never "Please wait…" |
| Error | Validation or request failure | Message under the field on blur or submit; `AuthNotice` for whole-form problems |
| Empty | No data | `EmptyState` / `ProfileEmpty`: icon, one sentence, one action |

**Pressed scale, corrected.** The app shipped four values — 0.90, 0.95, 0.97, 0.98 — across 20 call
sites. All twenty are 0.97 now, the value the reference names.

**The focus ring is ink, not pink.** The reference says 2px pink. Primary became ink on 14 Sep at
the owner's instruction, and the ring followed it. Pink remains the accent and `--pink-strong` the
only pink that carries text.

## Measured floors

| Rule | Value | Where |
| --- | --- | --- |
| Touch target | 48dp | `hit-area` grows the target to 48×48 around the element's centre without changing the drawn size |
| Contrast, normal text | 4.5:1 | `--muted-foreground` #66666f clears it on both the card fill and the #ececf1 ground |
| Contrast, large text | 3:1 | |
| Hairline | 1.458:1 against the card fill | `--border` #d5d5de — an edge you can actually see |
| Focus ring | 2px ink at 2px offset, `:focus-visible` only | `--focus-ring`, `--focus-ring-offset` |
| Shell | 640px max, 350px min | `--container-app`; measured at both, no horizontal scroll on 20 routes |

## Standing rules

- A control smaller than 48dp keeps its drawn size and takes an invisible target. A 40dp icon
  button is the right visual size.
- Text over artwork sits on a scrim — the ink gradient on the profile cover, or `pill-glass`, the
  blurred light material for labels on photos. Never on raw imagery.
- A disabled control says why, not just that it is dim.
- Colour is never the only carrier of state: availability is a word and an icon, not a green dot
  alone.
- Never fabricate a count. An empty stat is an em-dash, never a zero.
- Rates render as an amount with a small unit line beneath, never "₹4,500 / hr".

## Motion

| Token | Value | Usage |
| --- | --- | --- |
| `--duration-1` | 125ms | Button press, chip toggle, state layer |
| `--duration-2` | 200ms | Hover, colour and icon change, dismissal |
| `--duration-3` | 320ms | Sheet reveal, shake, select spring, meter |
| `--duration-4` | 500ms | Modal fade and scale, sound check, fill |

Three easings, by role: `--easing-standard` `cubic-bezier(.4,0,.2,1)` for most motion,
`--easing-enter` `(.05,.7,.1,1)` for arrivals, `--easing-spring` `(0,.35,0,1.25)` for overshoot.

- Arrival screens land on a beat: `--animate-rise` 480ms, staggered per block by `flow-motion.ts`.
- The registration flow uses Material's shared axis X through the View Transitions API; **exit runs
  at ~60% of enter**, which matches the reference.
- Splash: the mark breathes in over 900ms and the screen never holds past 2s.
- Marquee (the Welcome ticker) runs one copy's width every 60s.
- `prefers-reduced-motion` collapses every animation and transition to 0.01ms and zeroes the
  stagger delays, so nothing waits to appear.

**Correction — skeleton shimmer.** The reference says a 1.4s loop; `Skeleton` uses Tailwind's
`animate-pulse`, which is 2s. Either adopt 1.4s as a token or drop the rule; today the rule
describes something we do not ship.

## Where this can drift

`/guide` is on the owner's machine and git-ignored, so nothing in this repository is generated from
it, and nothing checks this file against the code. The Storybook token pages read the stylesheet
live and cannot drift; this file is prose and can. When the two disagree, Storybook is right.
