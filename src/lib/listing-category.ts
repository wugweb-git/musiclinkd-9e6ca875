import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/*
 * Market's categories and product types come from the taxonomy (taxonomy_options), not from code:
 * the instruments list (each with a metadata.family) and equipment_categories. A listing stores
 * its product type's slug in item_category and the kind (instrument or equipment) beside it.
 *
 * Categories are the instrument families (Guitars, Keys, Percussion…) followed by the equipment
 * categories (Microphones, Audio Interfaces…). An instrument's category is its family; an equipment
 * category is its own product type.
 */

export type GearKind = "instrument" | "equipment";

export type GearType = { slug: string; label: string; kind: GearKind; category: string };
export type GearCategory = { slug: string; label: string; kind: GearKind };
export type GearTaxonomy = { types: GearType[]; categories: GearCategory[] };

/** The taxonomy stores a family key on each instrument but no family name; these are the names. */
const familyLabels: Record<string, string> = {
  guitar: "Guitars",
  keys: "Keys",
  percussion: "Drums",
  strings: "Strings",
  wind: "Wind",
  electronic: "Electronic",
};

/** Families Market shows as one (owner, 22 Sep 2026): bowed and Indian strings are Strings. */
const familyAlias: Record<string, string> = { bowed: "strings", indian_string: "strings" };

/**
 * The categories the Market rail shows, most asked-for first; every other one is behind See all
 * (owner, 22 Sep 2026: six or seven common ones).
 */
export const popularCategories = [
  "guitar",
  "keys",
  "percussion",
  "strings",
  "microphones",
  "controllers",
  "pa_systems",
];

type Row = {
  category_key: "instruments" | "equipment_categories";
  slug: string;
  label: string;
  metadata: { family?: string } | null;
};

let cached: Promise<GearTaxonomy> | null = null;
let loadedAt = 0;
const TTL_MS = 5 * 60 * 1000;

/** Published instruments and equipment categories, as product types and categories. Cached. */
export function loadGearTaxonomy(): Promise<GearTaxonomy> {
  if (!cached || Date.now() - loadedAt > TTL_MS) {
    loadedAt = Date.now();
    const query = supabase.from("taxonomy_options" as never) as unknown as {
      select: (cols: string) => {
        in: (
          col: string,
          values: string[],
        ) => {
          eq: (
            col: string,
            v: boolean,
          ) => {
            order: (col: string) => Promise<{ data: Row[] | null; error: Error | null }>;
          };
        };
      };
    };
    cached = query
      .select("category_key,slug,label,metadata")
      .in("category_key", ["instruments", "equipment_categories"])
      .eq("is_published", true)
      .order("sort_order")
      .then(({ data, error }) => {
        if (error || !data) throw error ?? new Error("No taxonomy returned");
        const types: GearType[] = data.map((r) =>
          r.category_key === "instruments"
            ? {
                slug: r.slug,
                label: r.label,
                kind: "instrument" as const,
                category:
                  familyAlias[r.metadata?.family ?? ""] ??
                  r.metadata?.family ??
                  "other_instruments",
              }
            : { slug: r.slug, label: r.label, kind: "equipment" as const, category: r.slug },
        );
        const families = [
          ...new Set(types.filter((t) => t.kind === "instrument").map((t) => t.category)),
        ];
        const categories: GearCategory[] = [
          ...families.map((f) => ({
            slug: f,
            label: familyLabels[f] ?? "Other instruments",
            kind: "instrument" as const,
          })),
          ...types
            .filter((t) => t.kind === "equipment")
            .map((t) => ({ slug: t.slug, label: t.label, kind: "equipment" as const })),
        ];
        return { types, categories };
      })
      .catch((err: unknown) => {
        cached = null;
        throw err;
      });
  }
  return cached;
}

const empty: GearTaxonomy = { types: [], categories: [] };

/** The gear taxonomy in a component; empty until it loads. */
export function useGearTaxonomy(): GearTaxonomy {
  const q = useQuery({
    queryKey: ["taxonomy", "gear"],
    queryFn: loadGearTaxonomy,
    staleTime: TTL_MS,
  });
  return q.data ?? empty;
}

/** Which category a stored listing sits in, from its item_category slug; null when it has none. */
export function gearCategoryOf(
  itemCategory: string | null | undefined,
  taxonomy: GearTaxonomy,
): string | null {
  if (!itemCategory) return null;
  return taxonomy.types.find((t) => t.slug === itemCategory)?.category ?? null;
}

export function gearTypeOf(slug: string | null | undefined, taxonomy: GearTaxonomy) {
  return slug ? taxonomy.types.find((t) => t.slug === slug) : undefined;
}
