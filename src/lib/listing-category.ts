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

/** Stored item_category slugs that aren't a product-type name, and the category they sit in. */
const extraSlugs: Record<string, string> = {
  preamps: "studio",
  controllers: "dj",
  dj_controller: "dj",
};

const categoryBySlug = new Map(
  rentalCategories.flatMap((c) => c.subs.map((s) => [subCategorySlug(s), c.slug] as const)),
);

/**
 * Which of the market's categories (instruments, audio, studio, dj, live, other) a stored listing
 * belongs to, from its item_category slug; instruments with an unknown slug stay instruments.
 */
export function gearCategoryOf(itemCategory: string | null, kind: string | null): string {
  const slug = itemCategory ?? "";
  return (
    categoryBySlug.get(slug) ??
    extraSlugs[slug] ??
    (kind === "instrument" ? "instruments" : "other")
  );
}
