# Stroke inventory (brief §3.5 #22), 4 Oct 2026

App code only (`src/components/ml`, `src/routes`, `src/lib`, `src/hooks`, `src/registry`, `src/lab`);
vendor folders excluded. Counted from the class names and `strokeWidth` props.

| Stroke | Values in use | Role |
|---|---|---|
| Border | 1px ×538, 2px ×14, 4px ×11, none ×10 | 1px is the hairline on every card, field and divider; 2px marks a selected or focused item (selected service card, picked work, active chip); 4px is the ring around a profile photo on its cover |
| Ring | 1px ×22, 2px ×21 | 2px is the focus ring and the selected ring; 1px is a hairline ring on avatars and tiles |
| Divide | 1px ×34 | List dividers |
| Lucide `strokeWidth` | default 2 (most icons), 1.75 ×31, 2 ×9 explicit, 1.8 ×6, 3 ×4, 1.5 ×3, 2.2 ×2, 2.25/2.4/2.5/1.4 ×1 each, 0 ×1 | 1.75 is the line icon in tiles, nav and empty states; 3 is a check mark; the one-offs are tuned by eye |

**Recommendation (not applied):**

- Borders and rings already follow three roles on Tailwind's own widths (1 hairline, 2 selected and focus, 4 photo ring). A token would only rename them: no tokens.
- Icon stroke has one recurring role, 1.75 for line icons in tiles and navigation (31 uses). It is worth a token, `iconStroke.line` beside `iconSize` in `src/lib/tokens.ts`, with the one-offs (1.8, 2.2, 2.25, 2.4, 2.5, 1.4, 1.5) folded onto 1.75 or the default 2. That changes how some icons look, so it waits for the owner's word.
