import { rentalCategories } from "@/data/rentals";

/*
 * The market carries instruments and equipment only, so a listing needs no "what kind" step: the
 * seller picks a sub-category and the kind follows from it. Shared by selling and renting out.
 */
export const listingSubCategories = [...new Set(rentalCategories.flatMap((c) => c.subs))];

const instrumentSubs = new Set(rentalCategories.find((c) => c.slug === "instruments")?.subs ?? []);

export function kindOfSubCategory(sub: string): "instrument" | "equipment" {
  return instrumentSubs.has(sub) ? "instrument" : "equipment";
}

/** The rental category a product type sits under (instruments, audio, studio, dj, live, other). */
export function categoryOfSubCategory(sub: string): string {
  return rentalCategories.find((c) => c.subs.includes(sub))?.slug ?? "other";
}

/** How a product type is stored in marketplace_listings.item_category: "Audio Interfaces" → "audio_interfaces". */
export function subCategorySlug(sub: string) {
  return sub
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "");
}
