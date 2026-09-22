/*
 * Discovery settings (/recommendations/settings): what recommendations are based on. Stored in
 * profiles.discovery_prefs.recommend, next to the other screens' keys in that jsonb (Privacy's
 * appear, QR sharing, onboarding topics); saveMyProfile merges it in, so nothing else is dropped.
 * getMyRecommendations (recommendations.functions.ts) reads it for every screen that ranks by it.
 */

/** How far from the viewer a recommended person, studio or opportunity may be. */
export type Radius = "near" | "city" | "anywhere";

export type RecommendPrefs = {
  /** person_types slugs; empty means any role. */
  roles: string[];
  /** genres slugs; empty means the genres on the viewer's own profile. */
  genres: string[];
  /** City names, as profiles.city stores them; empty means the viewer's own city. */
  cities: string[];
  radius: Radius;
  /** Profile ids skipped on the swipe deck; they are not suggested again until cleared. */
  skipped: string[];
};

export const MAX_SKIPPED = 300;

const strings = (v: unknown, max: number) =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "").slice(0, max)
    : [];

export function recommendPrefsOf(discoveryPrefs: unknown): RecommendPrefs {
  const prefs =
    discoveryPrefs && typeof discoveryPrefs === "object" && !Array.isArray(discoveryPrefs)
      ? (discoveryPrefs as { recommend?: unknown }).recommend
      : null;
  const r = (prefs && typeof prefs === "object" ? prefs : {}) as Record<string, unknown>;
  const radius = r["radius"];
  return {
    roles: strings(r["roles"], 20),
    genres: strings(r["genres"], 20),
    cities: strings(r["cities"], 10),
    radius: radius === "near" || radius === "city" ? radius : "anywhere",
    skipped: strings(r["skipped"], MAX_SKIPPED),
  };
}
