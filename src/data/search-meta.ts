/**
 * FLOW 04/12 — saved searches, search history and result explanations.
 * Design-only mock data. Timestamps are real epoch ms — never pre-formatted strings.
 */

export type SavedSearch = {
  /** saved_search.id — EXISTING */
  id: string;
  label: string;
  query: string;
  filters: string[];
  alerts: boolean;
  newCount: number;
  /** saved_search.created_at */
  createdAt: number;
};

export type SearchHistoryEntry = {
  id: string;
  query: string;
  scope: "talent" | "studios" | "market" | "opportunities";
  resultCount: number;
  /** search_history.searched_at */
  searchedAt: number;
};

const day = 86_400_000;
const now = Date.UTC(2026, 8, 13, 4, 0, 0);

export const savedSearches: SavedSearch[] = [
  {
    id: "ss-1",
    label: "Hindi vocalists in Mumbai",
    query: "vocalist hindi",
    filters: ["Mumbai + 50 km", "Verified", "Available now"],
    alerts: true,
    newCount: 6,
    createdAt: now - 12 * day,
  },
  {
    id: "ss-2",
    label: "Tabla players for a folk EP",
    query: "tabla folk",
    filters: ["Pan-India", "Remote work", "₹8,000 – ₹25,000"],
    alerts: true,
    newCount: 2,
    createdAt: now - 26 * day,
  },
  {
    id: "ss-3",
    label: "Tracking rooms under ₹3,000/hr",
    query: "studio tracking room",
    filters: ["Mumbai", "Under ₹3,000/hr", "Live room"],
    alerts: false,
    newCount: 0,
    createdAt: now - 58 * day,
  },
];

export const searchHistory: SearchHistoryEntry[] = [
  {
    id: "sh-1",
    query: "sitar session player",
    scope: "talent",
    resultCount: 34,
    searchedAt: now - 2 * 3_600_000,
  },
  {
    id: "sh-2",
    query: "mixing engineer bandra",
    scope: "talent",
    resultCount: 18,
    searchedAt: now - 9 * 3_600_000,
  },
  {
    id: "sh-3",
    query: "jam room andheri",
    scope: "studios",
    resultCount: 11,
    searchedAt: now - day,
  },
  {
    id: "sh-4",
    query: "condenser microphone",
    scope: "market",
    resultCount: 62,
    searchedAt: now - 2 * day,
  },
  {
    id: "sh-5",
    query: "playback singer wanted",
    scope: "opportunities",
    resultCount: 7,
    searchedAt: now - 4 * day,
  },
];

export const scopeLabel: Record<SearchHistoryEntry["scope"], string> = {
  talent: "Talent",
  studios: "Studios",
  market: "Market",
  opportunities: "Opportunities",
};

/** Explanation shown by "Why am I seeing this". */
export type WhyExplanation = {
  id: string;
  subject: string;
  headline: string;
  signals: { label: string; detail: string; weight: "strong" | "medium" | "light" }[];
  notUsed: string[];
};

export const whyExplanations: WhyExplanation[] = [
  {
    id: "rec-1",
    subject: "This profile",
    headline: "Matched on your genres, city and a saved search",
    signals: [
      {
        label: "Your genres",
        detail: "Indie folk and alt pop are on both profiles",
        weight: "strong",
      },
      {
        label: "Distance",
        detail: "12 km from Mumbai, inside your 50 km radius",
        weight: "strong",
      },
      { label: "Saved search", detail: "Appears in “Hindi vocalists in Mumbai”", weight: "medium" },
      {
        label: "Availability",
        detail: "Marked available in the week of your next booking",
        weight: "light",
      },
    ],
    notUsed: ["Your messages", "Your payment history", "Anything from your contacts"],
  },
];

export const defaultWhy: WhyExplanation = {
  id: "default",
  subject: "This result",
  headline: "Matched on your profile and recent activity",
  signals: [
    {
      label: "Your roles and genres",
      detail: "Taken from your profile, editable any time",
      weight: "strong",
    },
    { label: "Your city", detail: "Results near you rank higher", weight: "medium" },
    { label: "Recent activity", detail: "What you searched, saved and opened", weight: "medium" },
  ],
  notUsed: ["Your messages", "Your payment history", "Anything from your contacts"],
};

export const getWhy = (id: string) => whyExplanations.find((w) => w.id === id) ?? defaultWhy;

/** Relative time from an epoch, formatted at render — never stored. */
export function timeAgo(ts: number, from: number = now): string {
  const mins = Math.max(1, Math.round((from - ts) / 60_000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}
