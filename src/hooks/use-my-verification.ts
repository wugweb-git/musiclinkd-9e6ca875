import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile } from "@/lib/portfolio.functions";
import { useTaxonomy } from "@/lib/taxonomy";
import {
  verificationTypesFor,
  type VerificationRequest,
  type VerificationType,
} from "@/data/verification";

/**
 * The signed-in person's verification view: the badges that fit their roles, and their requests.
 * There is no verification table yet, so a real account has no requests; the seeded statuses in
 * `myVerifications` are design data and are never shown to a real account.
 */
export function useMyVerification(): {
  types: VerificationType[] | null;
  requests: VerificationRequest[];
} {
  const { signedIn, loading } = useAuth();
  const load = useServerFn(getMyProfile);
  const { options } = useTaxonomy();
  const [roles, setRoles] = useState<string[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!signedIn) {
      setRoles([]);
      return;
    }
    let active = true;
    load()
      .then((row) => {
        if (active) setRoles((row as { roles?: string[] | null } | null)?.roles ?? []);
      })
      .catch(() => active && setRoles([]));
    return () => {
      active = false;
    };
  }, [loading, signedIn, load]);

  const types = roles && options ? verificationTypesFor(roles, options.person_types) : null;
  return { types, requests: [] };
}
