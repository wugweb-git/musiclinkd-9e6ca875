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
