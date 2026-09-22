/*
 * How well a person fits an opportunity, from what both have stored. One function for every
 * screen that needs it: the "For you" tab ranks opportunities for the viewer with it, and the
 * applicant screens score each applicant against the opportunity they applied to.
 *
 * What counts, and how much:
 *   Role   50  a role or instrument on the profile names one of the roles the opportunity asks for
 *               (its requirements and its category: "Guitarist", "Cello Player", "Mixing engineer")
 *   Genre  25  share of the opportunity's genres the profile also lists
 *   City   15  the profile's city is the opportunity's city
 *   Rating 10  the profile's review average out of 5, only when it has reviews
 * A part the opportunity does not state (no genres, no city) is left out of the total rather than
 * counted as a miss, so the percentage is out of what could match.
 */

import { categoryLabel, type Opportunity } from "@/data/opportunities";
import type { TaxonomyCategory, TaxonomyOption } from "@/lib/taxonomy";

/** A profile as stored: roles, instruments and genres are taxonomy slugs. */
export type FitPerson = {
  roles?: string[] | null;
  instruments?: string[] | null;
  genres?: string[] | null;
  city?: string | null;
  rating?: number | string | null;
  review_count?: number | null;
};

/** What an opportunity asks for: role names as written, genre slugs, its location. */
export type FitTarget = { roles: string[]; genres: string[]; city: string };

export type Fit = {
  /** 0–100. */
  score: number;
  /** What matched, as people read it: "Guitarist", "Indie Pop", "Mumbai". */
  reasons: string[];
  /** How many things matched (each genre counts), for ranking. */
  matches: number;
};

type Labels = Partial<Record<TaxonomyCategory, TaxonomyOption[]>> | null | undefined;

const WEIGHT = { role: 50, genre: 25, city: 15, rating: 10 } as const;

/** "Flute (Bansuri)" → "flute", "sound_engineer" → "sound engineer". */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[_\-/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Whole-word containment: "session musician" holds "musician", "mixing engineer" not "mix". */
function holdsWords(hay: string, needle: string): boolean {
  return needle.length >= 3 && ` ${hay} `.includes(` ${needle} `);
}

/** A stored value's option; profiles keep the slug, or metadata.app_key where one is set. */
function option(labels: Labels, category: TaxonomyCategory, value: string) {
  return labels?.[category]?.find((o) => o.slug === value || o.metadata?.app_key === value);
}

function label(labels: Labels, category: TaxonomyCategory, value: string): string {
  return option(labels, category, value)?.label ?? value;
}

/** The first part of a stored location: "Mumbai, MH" → "mumbai". */
function cityKey(s: string | null | undefined): string {
  return norm((s ?? "").split(",")[0] ?? "");
}

/** What a stored opportunity asks for, from its screen shape. */
export function fitTarget(o: Opportunity): FitTarget {
  const roles = o.requirements.map((r) => r.label);
  // A category that is a role ("Guitarist") counts too; the catch-all "Collaborator" does not.
  if (o.kind === "Person") {
    const cat = categoryLabel(o.categoryKey);
    if (cat && !roles.some((r) => norm(r) === norm(cat))) roles.push(cat);
  }
  return { roles, genres: o.genreKeys ?? [], city: o.city };
}

export function personFit(
  person: FitPerson,
  target: FitTarget,
  labels: Labels,
  { withRating = false }: { withRating?: boolean } = {},
): Fit {
  let earned = 0;
  let possible = 0;
  const reasons: string[] = [];
  let matches = 0;

  if (target.roles.length) {
    possible += WEIGHT.role;
    const roleNames = (person.roles ?? []).flatMap((r) => [
      norm(label(labels, "person_types", r)),
      norm(r),
    ]);
    // Instruments match by stem inside the role: "Cello" in "Cello Player", "Sitar" in "Sitarist".
    const instrumentStems = (person.instruments ?? [])
      .map((i) => norm(label(labels, "instruments", i)).replace(/s$/, ""))
      .filter((s) => s.length >= 4);
    const hit = target.roles.filter((wanted) => {
      const w = norm(wanted);
      return (
        roleNames.some((r) => holdsWords(w, r) || holdsWords(r, w)) ||
        instrumentStems.some((stem) => w.includes(stem))
      );
    });
    if (hit.length) {
      earned += WEIGHT.role;
      reasons.push(...hit);
      matches += hit.length;
    }
  }

  if (target.genres.length) {
    possible += WEIGHT.genre;
    const mine = new Set(person.genres ?? []);
    const shared = target.genres.filter((g) => mine.has(g));
    if (shared.length) {
      earned += (WEIGHT.genre * shared.length) / target.genres.length;
      reasons.push(...shared.map((g) => label(labels, "genres", g)));
      matches += shared.length;
    }
  }

  const theirs = cityKey(target.city);
  if (theirs) {
    possible += WEIGHT.city;
    const mine = cityKey(person.city);
    // "New Delhi" and "Delhi" are the same place.
    if (mine && (mine === theirs || holdsWords(mine, theirs) || holdsWords(theirs, mine))) {
      earned += WEIGHT.city;
      reasons.push((person.city ?? "").split(",")[0]!.trim());
      matches += 1;
    }
  }

  const rating = Number(person.rating ?? 0);
  if (withRating && (person.review_count ?? 0) > 0 && rating > 0) {
    possible += WEIGHT.rating;
    earned += (WEIGHT.rating * Math.min(rating, 5)) / 5;
  }

  return {
    score: possible ? Math.round((earned / possible) * 100) : 0,
    reasons,
    matches,
  };
}

/** The "why" line under a match: "Matches: Guitarist · Indie Pop". Empty when nothing matched. */
export function fitLine(fit: Pick<Fit, "reasons">, max = 3): string {
  return fit.reasons.length ? `Matches: ${fit.reasons.slice(0, max).join(" · ")}` : "";
}
