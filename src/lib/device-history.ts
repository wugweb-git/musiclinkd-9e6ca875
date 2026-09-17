/*
 * What this person did on this device: the searches they ran, the profiles they opened. It is a
 * convenience, not a record — it never leaves the browser, so there is no table for it and nothing
 * to keep in step across devices. Every read and write is guarded, because a private window or
 * blocked site data must not take a screen down with it.
 */

/** One keyed list on this device, capped so it cannot grow forever. */
function readList<T>(key: string, valid: (e: unknown) => e is T): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(valid) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, list: T[], limit: number) {
  try {
    localStorage.setItem(key, JSON.stringify(list.slice(0, limit)));
  } catch {
    // Nothing to do: this is a convenience, and whatever the person was doing still worked.
  }
}

const SEARCH_KEY = "ml.recent-searches";
const SEARCH_LIMIT = 12;

export type RecentSearch = {
  /** What was typed, trimmed. Doubles as the identity of the entry. */
  query: string;
  /** How many the search found, at the time it ran. */
  results: number;
  /** ISO timestamp of the last time this search ran. */
  at: string;
};

export function readRecentSearches(): RecentSearch[] {
  return readList(
    SEARCH_KEY,
    (e): e is RecentSearch =>
      typeof e === "object" &&
      e !== null &&
      typeof (e as RecentSearch).query === "string" &&
      typeof (e as RecentSearch).at === "string",
  );
}

const write = (list: RecentSearch[]) => writeList(SEARCH_KEY, list, SEARCH_LIMIT);

/** Remember one search. Running the same one again moves it to the top instead of repeating it. */
export function rememberSearch(query: string, results: number) {
  const q = query.trim();
  if (!q) return;
  const rest = readRecentSearches().filter((e) => e.query.toLowerCase() !== q.toLowerCase());
  write([{ query: q, results, at: new Date().toISOString() }, ...rest]);
}

export function forgetSearch(query: string) {
  write(readRecentSearches().filter((e) => e.query !== query));
}

export function forgetAllSearches() {
  write([]);
}

/** "2 minutes ago" for something this device did; the timestamps here are always recent. */
export function sinceThen(iso: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

const VISIT_KEY = "ml.recently-viewed";
const VISIT_LIMIT = 20;

export type Visit = {
  /** What was opened, so the screen can group and link it. */
  kind: "person" | "studio";
  /** The username or slug the link needs. */
  handle: string;
  name: string;
  /** A role, a city — whatever the page showed under the name. */
  detail: string | null;
  avatarUrl: string | null;
  at: string;
};

export function readVisits(): Visit[] {
  return readList(
    VISIT_KEY,
    (e): e is Visit =>
      typeof e === "object" &&
      e !== null &&
      typeof (e as Visit).handle === "string" &&
      typeof (e as Visit).name === "string" &&
      typeof (e as Visit).at === "string",
  );
}

/** Remember that this page was opened. Opening it again moves it up instead of repeating it. */
export function rememberVisit(visit: Omit<Visit, "at">) {
  if (!visit.handle || !visit.name) return;
  const rest = readVisits().filter((v) => !(v.kind === visit.kind && v.handle === visit.handle));
  writeList(VISIT_KEY, [{ ...visit, at: new Date().toISOString() }, ...rest], VISIT_LIMIT);
}

export function forgetVisits() {
  writeList(VISIT_KEY, [], VISIT_LIMIT);
}

const SAVED_KEY = "ml.saved-searches";
const SAVED_LIMIT = 20;

/** A search someone kept, with the filters it had. Alerts are not part of it: nothing sends any. */
export type SavedSearch = {
  query: string;
  role: string | null;
  verifiedOnly: boolean;
  at: string;
};

/** The identity of a saved search is what it searches for, not when it was saved. */
const sameSearch = (a: Omit<SavedSearch, "at">, b: SavedSearch) =>
  a.query.toLowerCase() === b.query.toLowerCase() &&
  (a.role ?? "") === (b.role ?? "") &&
  a.verifiedOnly === b.verifiedOnly;

export function readSavedSearches(): SavedSearch[] {
  return readList(
    SAVED_KEY,
    (e): e is SavedSearch =>
      typeof e === "object" &&
      e !== null &&
      typeof (e as SavedSearch).query === "string" &&
      typeof (e as SavedSearch).at === "string",
  );
}

export function saveSearch(search: Omit<SavedSearch, "at">) {
  if (!search.query && !search.role && !search.verifiedOnly) return;
  const rest = readSavedSearches().filter((s) => !sameSearch(search, s));
  writeList(SAVED_KEY, [{ ...search, at: new Date().toISOString() }, ...rest], SAVED_LIMIT);
}

export function unsaveSearch(search: Omit<SavedSearch, "at">) {
  writeList(
    SAVED_KEY,
    readSavedSearches().filter((s) => !sameSearch(search, s)),
    SAVED_LIMIT,
  );
}

export function isSearchSaved(search: Omit<SavedSearch, "at">) {
  return readSavedSearches().some((s) => sameSearch(search, s));
}
