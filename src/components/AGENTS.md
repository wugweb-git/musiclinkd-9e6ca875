# Components

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
