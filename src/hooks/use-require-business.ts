import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { isMyAccountBusiness } from "@/lib/profile-groups.functions";

/**
 * Gates the business.bookings.*, business.availability/pricing/policies screens: business-only
 * by product intent (owner, 18 Sep 2026 — see contextual-profile-rule memory), which nothing
 * enforced until this hook. A signed-out visitor or a talent account gets `allowed: false`;
 * screens render a sign-in/switch-account prompt for that case rather than the real content.
 */
export function useRequireBusiness() {
  const { signedIn, loading: authLoading } = useAuth();
  const load = useServerFn(isMyAccountBusiness);
  const q = useQuery({
    queryKey: ["account", "is-business"],
    queryFn: () => load(),
    enabled: signedIn,
  });
  const loading = authLoading || (signedIn && q.isLoading);
  const allowed = signedIn && q.data === true;
  return { allowed, loading, signedIn };
}
