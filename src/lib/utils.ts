import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/*
 * tailwind-merge only knows Tailwind's own type sizes. Ours are `text-1`…`text-4` (src/styles.css),
 * which it read as text *colours*: in `text-1 … text-muted-foreground` the later colour "won" and
 * the size was deleted, so the element fell back to the inherited 16px (found 4 Oct 2026 on
 * TrustNote and LegalNote; it hit every `cn()` call that set a size and then a colour).
 */
const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: ["1", "2", "3", "4"] }] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "a · b" from whichever parts are present, so an empty field leaves no stray separator. */
export function joinParts(...parts: (string | null | undefined)[]) {
  return parts.filter(Boolean).join(" · ");
}
