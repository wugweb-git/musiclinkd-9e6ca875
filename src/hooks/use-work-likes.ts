import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { myPortfolioLikes, portfolioLikeCounts, toggleLike } from "@/lib/portfolio.functions";

export type WorkLikes = {
  available: boolean;
  counts: Record<string, number>;
  mine: Set<string>;
  toggle: (id: string, liked: boolean) => void;
};

/**
 * Like data for a list of works, in one read: whether likes exist yet, each work's count, and
 * which ones you liked. Optimistic toggle with rollback.
 */
export function useWorkLikes(ids: string[]): WorkLikes {
  const { signedIn } = useAuth();
  const queryClient = useQueryClient();
  const loadCounts = useServerFn(portfolioLikeCounts);
  const loadMine = useServerFn(myPortfolioLikes);
  const save = useServerFn(toggleLike);
  const key = ids.join(",");
  const counts = useQuery({
    queryKey: ["likes", "counts", key],
    queryFn: () => loadCounts({ data: { ids } }),
    enabled: ids.length > 0,
  });
  const mine = useQuery({
    queryKey: ["likes", "mine", key],
    queryFn: () => loadMine({ data: { ids } }),
    enabled: signedIn && ids.length > 0 && counts.data?.available === true,
  });
  const act = useMutation({
    mutationFn: (v: { id: string; liked: boolean }) => save({ data: v }),
    onMutate: ({ id, liked }) => {
      queryClient.setQueryData<string[]>(["likes", "mine", key], (prev = []) =>
        liked ? [...prev, id] : prev.filter((x) => x !== id),
      );
      queryClient.setQueryData<{ available: boolean; counts: Record<string, number> }>(
        ["likes", "counts", key],
        (prev) =>
          prev && {
            ...prev,
            counts: {
              ...prev.counts,
              [id]: Math.max(0, (prev.counts[id] ?? 0) + (liked ? 1 : -1)),
            },
          },
      );
    },
    onError: () => toast.error("That didn't save. Try again."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["likes"] }),
  });
  return {
    available: counts.data?.available ?? false,
    counts: counts.data?.counts ?? {},
    mine: new Set(mine.data ?? []),
    toggle: (id, liked) => act.mutate({ id, liked }),
  };
}
