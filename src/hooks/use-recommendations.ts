import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { getMyRecommendations, type Recommendations } from "@/lib/recommendations.functions";

/**
 * The signed-in person's recommendations (src/lib/recommendations.functions.ts). Null signed out,
 * while loading, or when the read fails — screens then keep their plain, unranked lists.
 */
export function useRecommendations(): Recommendations | null {
  const { user, signedIn } = useAuth();
  const load = useServerFn(getMyRecommendations);
  const q = useQuery({
    queryKey: ["recommendations", user?.id ?? null],
    queryFn: () => load(),
    enabled: signedIn,
    staleTime: 60_000,
  });
  return signedIn ? (q.data ?? null) : null;
}

/** Rows in recommendation order first (by id), then the rest in their own order. */
export function rankBy<T>(
  rows: T[],
  picks: { id: string }[] | undefined,
  idOf: (row: T) => string,
): T[] {
  if (!picks?.length) return rows;
  const rank = new Map(picks.map((p, i) => [p.id, i]));
  const ranked = rows.filter((r) => rank.has(idOf(r)));
  ranked.sort((a, b) => rank.get(idOf(a))! - rank.get(idOf(b))!);
  return [...ranked, ...rows.filter((r) => !rank.has(idOf(r)))];
}
