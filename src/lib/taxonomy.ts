import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/*
 * Selection options for roles, instruments, genres and languages live in the database
 * (taxonomy_options, published rows only) and profiles store their slugs. Instruments and genres
 * come from persona_bucket, which narrows them to the person's roles and languages and caps each at
 * 12 per screen. Spec: Claude outputs/specs/PERSONA-BUCKET.md in the guide repo.
 *
 * The generated Supabase types predate these tables, hence the casts at the two call sites.
 */

const CATEGORIES = [
  "person_types",
  "instruments",
  "genres",
  "languages",
  // Onboarding choices (20260922170000_onboarding_choices.sql and earlier): metadata.app_key is
  // the value profiles store, metadata.description the hint a drawer shows.
  "work_modes",
  "available_for",
  "intents",
  "discovery_prefs",
  "experience_levels",
  "genders",
  "indian_states",
  "cities",
  // Business setup (Create business, step 4).
  "studio_amenities",
  "equipment_categories",
  "business_policies",
  // Service cards name their category.
  "service_categories",
  // Opportunity types: Work for Hire, Royalties Split, Co-Write, Session Payment.
  "collaboration_types",
] as const;

export type TaxonomyCategory = (typeof CATEGORIES)[number];

/** The `flow` filter on person_types: which kind of user an option is for. */
export type UserFlow = "talent_user" | "business_user";

export type TaxonomyOption = {
  slug: string;
  label: string;
  sortOrder: number;
  metadata: {
    group?: string;
    flow?: UserFlow;
    family?: string;
    scope?: string;
    /** The value profiles store for this option, when it isn't the slug. */
    app_key?: string;
    /** A one-line hint under the label. */
    description?: string;
    /** cities: the state the city is in. */
    state?: string;
  } | null;
};

export type PersonaBucket = { instruments: TaxonomyOption[]; genres: TaxonomyOption[] };

type OptionRow = {
  category_key: TaxonomyCategory;
  slug: string;
  label: string;
  sort_order: number;
  metadata: TaxonomyOption["metadata"];
};

let allOptions: Promise<Record<TaxonomyCategory, TaxonomyOption[]>> | null = null;
let loadedAt = 0;
// The cache is module-level, so on the SSR server it outlives requests. Five minutes bounds how long a
// publish or unpublish takes to reach server-rendered pages.
const TTL_MS = 5 * 60 * 1000;

/** Every published option, grouped by category. Cached for five minutes. */
export function loadTaxonomy(): Promise<Record<TaxonomyCategory, TaxonomyOption[]>> {
  if (!allOptions || Date.now() - loadedAt > TTL_MS) {
    loadedAt = Date.now();
    const query = supabase.from("taxonomy_options" as never) as unknown as {
      select: (cols: string) => {
        in: (
          col: string,
          values: string[],
        ) => {
          order: (col: string) => Promise<{ data: OptionRow[] | null; error: Error | null }>;
        };
      };
    };
    allOptions = query
      .select("category_key,slug,label,sort_order,metadata")
      .in("category_key", [...CATEGORIES])
      .order("sort_order")
      .then(({ data, error }) => {
        if (error || !data) throw error ?? new Error("No taxonomy returned");
        const out = Object.fromEntries(CATEGORIES.map((c) => [c, []])) as unknown as Record<
          TaxonomyCategory,
          TaxonomyOption[]
        >;
        for (const r of data) {
          out[r.category_key]?.push({
            slug: r.slug,
            label: r.label,
            sortOrder: r.sort_order,
            metadata: r.metadata,
          });
        }
        return out;
      })
      .catch((err: unknown) => {
        allOptions = null; // let the next caller retry
        throw err;
      });
  }
  return allOptions;
}

export type LoadState = "loading" | "ready" | "error";

export function useTaxonomy() {
  const [options, setOptions] = useState<Record<TaxonomyCategory, TaxonomyOption[]> | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState("loading");
    loadTaxonomy()
      .then((o) => {
        if (!active) return;
        setOptions(o);
        setState("ready");
      })
      .catch(() => active && setState("error"));
    return () => {
      active = false;
    };
  }, [attempt]);

  return { options, state, retry: () => setAttempt((n) => n + 1) };
}

/** The talent person-type groups, in picker order. Business types lead to a separate journey. */
export const talentGroups = [
  { key: "vocal", label: "Vocal" },
  { key: "instrumentalist", label: "Instrumentalist" },
  { key: "creator", label: "Creator" },
  { key: "technical", label: "Technical" },
  { key: "media", label: "Media" },
  { key: "education", label: "Education" },
  { key: "other", label: "Other" },
] as const;

export function talentTypes(options: TaxonomyOption[]): TaxonomyOption[] {
  // The live rows still say "business" until 20260921300000_business_types_cleanup.sql is applied
  // (it renames them "business_user"); both mean a business type.
  return options.filter((o) => !isBusinessFlow(o.metadata?.flow));
}

/** The business person types (Recording Studio, Music Label, Venue…), for Create business. */
export function businessTypes(options: TaxonomyOption[]): TaxonomyOption[] {
  return options.filter((o) => isBusinessFlow(o.metadata?.flow));
}

function isBusinessFlow(flow: string | undefined) {
  return flow === "business_user" || flow === "business";
}

/**
 * A category's options as drawer rows: the value profiles store (metadata.app_key, else the slug),
 * the label, and the hint line.
 */
export function choicesFor(options: TaxonomyOption[] | undefined) {
  return (options ?? []).map((o) => ({
    value: o.metadata?.app_key ?? o.slug,
    label: o.label,
    hint: o.metadata?.description,
  }));
}

/** slug → label for display; falls back to the slug so nothing renders blank. */
export function labelFor(options: TaxonomyOption[] | undefined, slug: string): string {
  return options?.find((o) => o.slug === slug)?.label ?? slug;
}

/**
 * Instruments and genres for this person. An empty instruments list means the step is skipped.
 * Returns null until the first answer arrives, and when there is no primary role yet.
 */
export async function loadPersonaBucket(
  primary: string,
  secondary: string[],
  languages: string[],
): Promise<PersonaBucket> {
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{
    data: { category_key: string; slug: string; label: string; display_order: number }[] | null;
    error: Error | null;
  }>;
  const { data, error } = await rpc.call(supabase, "persona_bucket", {
    p_primary: primary,
    // The function rejects more than two secondaries and any repeat of the primary.
    p_secondary: secondary.filter((s) => s !== primary).slice(0, 2),
    p_languages: languages,
    p_limit: 12,
  });
  if (error || !data) throw error ?? new Error("No bucket returned");
  const pick = (key: string) =>
    data
      .filter((r) => r.category_key === key)
      .sort((a, b) => a.display_order - b.display_order)
      .map((r) => ({ slug: r.slug, label: r.label, sortOrder: r.display_order, metadata: null }));
  return { instruments: pick("instruments"), genres: pick("genres") };
}
