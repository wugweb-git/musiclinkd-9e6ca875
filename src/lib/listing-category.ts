import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/*
 * Market's categories and product types come from the taxonomy (taxonomy_options), not from code:
 * a listing's category is the tool being listed (owner, 10 Oct 2026) — an instrument (each with a
 * metadata.family), production hardware (equipment_categories) or software (daw_tools). A listing
 * stores its product type's slug in item_category and the kind (instrument or equipment) beside
 * it; software is stored as equipment, the kinds the column's check allows.
 *
 * Categories are the instrument families (Guitars, Keys, Percussion…), then the equipment
 * categories (Microphones, Audio Interfaces…), then Software. An instrument's category is its
 * family; an equipment category is its own product type; every DAW tool sits under Software.
 */

export type GearKind = "instrument" | "equipment";

/** The three Tools lists a listing's category comes from, in label-lookup order. */
export const TOOL_LISTS = ["instruments", "equipment_categories", "daw_tools"] as const;

/**
 * A stored item_category → its label from whichever Tools list holds it, else the stored value, so
 * listings saved under a retired category still show what they were saved as.
 */
export function toolLabel(
  labels: Record<string, Record<string, string>> | undefined,
  slug: string,
): string {
  for (const list of TOOL_LISTS) {
    const label = labels?.[list]?.[slug];
    if (label) return label;
  }
  return slug;
}

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
  category_key: (typeof TOOL_LISTS)[number];
  slug: string;
  label: string;
  metadata: { family?: string } | null;
};

let cached: Promise<GearTaxonomy> | null = null;
let loadedAt = 0;
const TTL_MS = 5 * 60 * 1000;

/** Published instruments, equipment categories and DAW tools, as product types and categories. Cached. */
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
      .in("category_key", [...TOOL_LISTS])
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
            : {
                slug: r.slug,
                label: r.label,
                kind: "equipment" as const,
                category: r.category_key === "daw_tools" ? "software" : r.slug,
              },
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
            .filter((t) => t.kind === "equipment" && t.category === t.slug)
            .map((t) => ({ slug: t.slug, label: t.label, kind: "equipment" as const })),
          ...(types.some((t) => t.category === "software")
            ? [{ slug: "software", label: "Software", kind: "equipment" as const }]
            : []),
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
