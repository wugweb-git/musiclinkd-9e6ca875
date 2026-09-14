import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { loadMyDbOpportunities } from "@/lib/opportunity-view";

/**
 * Stored opportunities the signed-in user created, for the screens that list what they posted.
 * Empty without a session. `pending` is true while the session or the list is still loading.
 */
export function useMyDbOpportunities() {
  const { user, signedIn, loading } = useAuth();
  const q = useQuery({
    queryKey: ["opportunities", "mine", user?.id ?? null],
    queryFn: loadMyDbOpportunities,
    enabled: signedIn,
  });
  return {
    items: signedIn ? (q.data ?? []) : [],
    pending: loading || (signedIn && q.isPending),
  };
}
