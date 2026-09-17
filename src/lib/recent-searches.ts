/*
 * The searches this person ran, kept on their own device. It is a convenience, not a record: it
 * never leaves the browser, so there is no table for it and nothing to keep in step across
 * devices. Every read and write is guarded — a private window, or blocked site data, must not
 * take a screen down with it.
 */

const KEY = "ml.recent-searches";
const LIMIT = 12;

export type RecentSearch = {
  /** What was typed, trimmed. Doubles as the identity of the entry. */
  query: string;
  /** How many the search found, at the time it ran. */
  results: number;
  /** ISO timestamp of the last time this search ran. */
  at: string;
};

export function readRecentSearches(): RecentSearch[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is RecentSearch =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as RecentSearch).query === "string" &&
        typeof (e as RecentSearch).at === "string",
    );
  } catch {
    return [];
  }
}

function write(list: RecentSearch[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, LIMIT)));
  } catch {
    // Nothing to do: history is a convenience, and the search itself still worked.
  }
}

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
