import { recordPortfolioPlay } from "@/lib/plays.functions";

const sent = new Set<string>();

/**
 * Count one play of a portfolio item toward Trending, through the server (plays.functions.ts).
 * Called when playback actually starts. This page load sends each item once; signed out, the
 * server refuses and nothing is counted, as the database would anyway.
 */
export function recordPlay(itemId: string) {
  if (sent.has(itemId)) return;
  sent.add(itemId);
  void recordPortfolioPlay({ data: { itemId } }).catch(() => {
    sent.delete(itemId);
  });
}
