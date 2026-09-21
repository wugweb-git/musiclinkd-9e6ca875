/*
 * What this person did on this device: the searches they ran, the profiles they opened. Every read
 * and write is guarded, because a private window or blocked site data must not take a screen down
 * with it. Recently viewed (pages and listings) is also kept with the account when signed in
 * (recently-viewed.functions.ts), so every device shows the same list: each view is sent as it
 * happens, and syncRecentlyViewed merges the two lists when a session starts. Searches stay on
 * the device.
 */
import { supabase } from "@/integrations/supabase/client";
import { clearMyViews, listMyViews, recordViews } from "@/lib/recently-viewed.functions";

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
  /** Where it ran. Searches remembered before scopes existed have none. */
  scope?: SearchScope;
};

/** Where a search ran; "global" is /search, every kind of result at once. */
export type SearchScope = "market" | "rent" | "discover" | "global";

/** Every remembered search, or only those run in one place. */
export function readRecentSearches(scope?: SearchScope): RecentSearch[] {
  const all = readList(
    SEARCH_KEY,
    (e): e is RecentSearch =>
      typeof e === "object" &&
      e !== null &&
      typeof (e as RecentSearch).query === "string" &&
      typeof (e as RecentSearch).at === "string",
  );
  return scope ? all.filter((e) => e.scope === scope) : all;
}

const write = (list: RecentSearch[]) => writeList(SEARCH_KEY, list, SEARCH_LIMIT);

/** Remember one search. Running the same one again moves it to the top instead of repeating it. */
export function rememberSearch(query: string, results: number, scope?: SearchScope) {
  const q = query.trim();
  if (!q) return;
  const rest = readRecentSearches().filter(
    (e) => !(e.query.toLowerCase() === q.toLowerCase() && e.scope === scope),
  );
  write([
    { query: q, results, at: new Date().toISOString(), ...(scope ? { scope } : {}) },
    ...rest,
  ]);
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
  const at = new Date().toISOString();
  writeList(VISIT_KEY, [{ ...visit, at }, ...rest], VISIT_LIMIT);
  void keep([{ ...visit, at }]);
}

export function forgetVisits() {
  writeList(VISIT_KEY, [], VISIT_LIMIT);
  void whenSignedIn(() => clearMyViews({ data: { scope: "pages" } }));
}

const LISTING_KEY = "ml.recently-viewed-listings";
const LISTING_LIMIT = 20;

export type ListingVisit = {
  /** The listing slug the link needs; the listing itself is read live from the catalog. */
  id: string;
  at: string;
};

export function readListingVisits(): ListingVisit[] {
  return readList(
    LISTING_KEY,
    (e): e is ListingVisit =>
      typeof e === "object" &&
      e !== null &&
      typeof (e as ListingVisit).id === "string" &&
      typeof (e as ListingVisit).at === "string",
  );
}

/** Remember that this marketplace listing was opened. Opening it again moves it up. */
export function rememberListingVisit(id: string) {
  if (!id) return;
  const rest = readListingVisits().filter((v) => v.id !== id);
  const at = new Date().toISOString();
  writeList(LISTING_KEY, [{ id, at }, ...rest], LISTING_LIMIT);
  void keep([{ kind: "listing", handle: id, name: null, detail: null, avatarUrl: null, at }]);
}

type Kept = {
  kind: "person" | "studio" | "listing";
  handle: string;
  name: string | null;
  detail: string | null;
  avatarUrl: string | null;
  at: string;
};

/** Runs only with a session: signed out, the device copy is the whole list. */
async function whenSignedIn(run: () => Promise<unknown>) {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) await run();
  } catch {
    // The device copy already has it; the next sync sends it.
  }
}

const keep = (views: Kept[]) => whenSignedIn(() => recordViews({ data: { views } }));

/**
 * Merge this device's list with the account's, newest first, and send the account whatever it is
 * missing. Called once a session is known (src/routes/__root.tsx).
 */
export async function syncRecentlyViewed() {
  await whenSignedIn(async () => {
    const remote = await listMyViews();
    const pages = new Map<string, Visit>();
    for (const v of readVisits()) pages.set(`${v.kind}:${v.handle}`, v);
    const listings = new Map<string, ListingVisit>();
    for (const v of readListingVisits()) listings.set(v.id, v);
    const remoteAt = new Map(remote.map((r) => [`${r.kind}:${r.handle}`, r.viewed_at]));

    for (const r of remote) {
      if (r.kind === "listing") {
        const mine = listings.get(r.handle);
        if (!mine || mine.at < r.viewed_at)
          listings.set(r.handle, { id: r.handle, at: r.viewed_at });
      } else {
        const key = `${r.kind}:${r.handle}`;
        const mine = pages.get(key);
        if (!mine || mine.at < r.viewed_at) {
          pages.set(key, {
            kind: r.kind,
            handle: r.handle,
            name: r.name ?? r.handle,
            detail: r.detail,
            avatarUrl: r.avatar_url,
            at: r.viewed_at,
          });
        }
      }
    }
    const newest = <T extends { at: string }>(list: T[]) =>
      list.sort((a, b) => (a.at < b.at ? 1 : -1));
    writeList(VISIT_KEY, newest([...pages.values()]), VISIT_LIMIT);
    writeList(LISTING_KEY, newest([...listings.values()]), LISTING_LIMIT);

    const missing: Kept[] = [
      ...[...pages.values()]
        .filter((v) => (remoteAt.get(`${v.kind}:${v.handle}`) ?? "") < v.at)
        .map((v) => ({ ...v })),
      ...[...listings.values()]
        .filter((v) => (remoteAt.get(`listing:${v.id}`) ?? "") < v.at)
        .map((v) => ({
          kind: "listing" as const,
          handle: v.id,
          name: null,
          detail: null,
          avatarUrl: null,
          at: v.at,
        })),
    ];
    if (missing.length) await recordViews({ data: { views: missing.slice(0, 60) } });
  });
}
