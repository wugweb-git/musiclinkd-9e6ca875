import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listMySavedIds, saveTarget, unsaveTarget } from "@/lib/saved.functions";
import { useAuth } from "@/hooks/use-auth";

/** Real saved-listings state (marketplace + rentals share one target_type: "listing"). */
export function useSavedListings() {
  const { signedIn } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const fetchIds = useServerFn(listMySavedIds);
  const save = useServerFn(saveTarget);
  const unsave = useServerFn(unsaveTarget);

  useEffect(() => {
    if (!signedIn) return;
    fetchIds({ data: { targetType: "listing" } })
      .then(setIds)
      .catch(() => {
        /* Saved state just stays empty; the heart still works next toggle. */
      });
  }, [signedIn, fetchIds]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback(
    (id: string) => {
      if (!signedIn) return;
      const wasSaved = ids.includes(id);
      setIds((prev) => (wasSaved ? prev.filter((x) => x !== id) : [...prev, id]));
      const call = wasSaved ? unsave : save;
      void call({ data: { targetType: "listing", targetId: id } }).catch(() => {
        setIds((prev) => (wasSaved ? [...prev, id] : prev.filter((x) => x !== id)));
      });
    },
    [ids, signedIn, save, unsave],
  );

  return { has, toggle };
}
