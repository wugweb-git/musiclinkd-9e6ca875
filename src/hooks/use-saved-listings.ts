import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listMySavedIds, saveTarget, unsaveTarget } from "@/lib/saved.functions";
import { useAuth } from "@/hooks/use-auth";

/** The same cache entry SavedToggle reads, so a heart on one screen is the heart on every other. */
const queryKey = ["saved", "ids", "listing"] as const;

/**
 * Real saved-listings state (marketplace + rentals share one target_type: "listing"), keyed by a
 * listing's row uuid. A toggle shows at once, then settles on what the server did: a failed save
 * rolls back and says so.
 */
export function useSavedListings() {
  const { signedIn } = useAuth();
  const queryClient = useQueryClient();
  const fetchIds = useServerFn(listMySavedIds);
  const save = useServerFn(saveTarget);
  const unsave = useServerFn(unsaveTarget);
  const ids = useQuery({
    queryKey,
    queryFn: () => fetchIds({ data: { targetType: "listing" } }),
    enabled: signedIn,
  });

  const has = useCallback((id: string) => ids.data?.includes(id) ?? false, [ids.data]);

  const toggle = useCallback(
    async (id: string) => {
      if (!signedIn) {
        toast("Sign in to save this");
        return;
      }
      const wasSaved = ids.data?.includes(id) ?? false;
      queryClient.setQueryData<string[]>([...queryKey], (prev) =>
        wasSaved ? (prev ?? []).filter((x) => x !== id) : [...(prev ?? []), id],
      );
      try {
        await (wasSaved ? unsave : save)({ data: { targetType: "listing", targetId: id } });
        await queryClient.invalidateQueries({ queryKey: ["saved", "mine"] });
        await queryClient.invalidateQueries({ queryKey: ["rent", "saved"] });
      } catch {
        toast.error("Couldn't update saved. Try again.");
        await queryClient.invalidateQueries({ queryKey: [...queryKey] });
      }
    },
    [ids.data, signedIn, queryClient, save, unsave],
  );

  return { has, toggle: (id: string) => void toggle(id) };
}
