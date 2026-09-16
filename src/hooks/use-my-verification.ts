import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile } from "@/lib/portfolio.functions";
import {
  getVerificationTypes,
  listMyVerificationRequests,
  type VerificationRequestInfo,
  type VerificationTypeInfo,
} from "@/lib/verification.functions";

/**
 * The viewer's verification view: the types that fit their roles (verification_types_for), and their
 * requests. Signed out there are no roles and no requests. `types` is null until it loads.
 */
export function useMyVerification() {
  const { user, signedIn, loading } = useAuth();
  const loadProfile = useServerFn(getMyProfile);
  const loadTypes = useServerFn(getVerificationTypes);
  const loadRequests = useServerFn(listMyVerificationRequests);

  const profile = useQuery({
    queryKey: ["profile", "me", user?.id ?? null],
    queryFn: () => loadProfile(),
    enabled: signedIn,
  });
  const row = profile.data as {
    roles?: string[] | null;
    display_name?: string | null;
    username?: string | null;
  } | null;
  const roles: string[] | null = loading
    ? null
    : !signedIn
      ? []
      : profile.isSuccess
        ? (row?.roles ?? [])
        : null;

  const types = useQuery({
    queryKey: ["verification", "types", roles],
    queryFn: () => loadTypes({ data: { roles: roles ?? [] } }),
    enabled: roles !== null,
    staleTime: 5 * 60 * 1000,
  });
  const requests = useQuery({
    queryKey: ["verification", "requests", user?.id ?? null],
    queryFn: () => loadRequests(),
    enabled: signedIn,
  });

  const history = signedIn ? (requests.data ?? []) : [];
  const error = types.isError || (signedIn && (profile.isError || requests.isError));
  const pending =
    !error && (loading || roles === null || types.isPending || (signedIn && requests.isPending));
  const client = useQueryClient();

  return {
    signedIn,
    /** The types these roles can apply for, in taxonomy order. */
    types:
      pending || error
        ? null
        : (types.data?.applicable ?? [])
            .map((key) => types.data?.types.find((t) => t.key === key))
            .filter((t): t is VerificationTypeInfo => Boolean(t)),
    /** Every published type, whether or not it fits. */
    allTypes: types.data?.types ?? null,
    /** The newest request of each type. */
    requests: latestPerType(history),
    /** Every request, newest first. */
    history,
    /** The viewer's display name, else their username. */
    name: row?.display_name || row?.username || "",
    pending,
    error,
    retry: () => {
      void profile.refetch();
      void types.refetch();
      void requests.refetch();
    },
    refresh: () => client.invalidateQueries({ queryKey: ["verification", "requests"] }),
  };
}

function latestPerType(history: VerificationRequestInfo[]) {
  const seen = new Set<string>();
  return history.filter((r) => (seen.has(r.type) ? false : (seen.add(r.type), true)));
}

/** Whether a type can be started: its prerequisite must be verified and not expired. */
export function gateFor(type: VerificationTypeInfo, history: VerificationRequestInfo[]) {
  const pre = type.prerequisite;
  if (!pre) return { allowed: true, reason: "", needs: null };
  const now = Date.now();
  const met = history.some(
    (r) =>
      r.type === pre.key &&
      r.status === "verified" &&
      (!r.expiresAt || new Date(r.expiresAt).getTime() > now),
  );
  return met
    ? { allowed: true, reason: "", needs: null }
    : { allowed: false, reason: pre.reason, needs: pre.key };
}

/** A stored timestamp as "12 Aug 2026". */
export function formatDay(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
