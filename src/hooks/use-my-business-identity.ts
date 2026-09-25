import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { getMyBusiness } from "@/lib/profile-groups.functions";
import { getTaxonomyLabels } from "@/lib/portfolio.functions";
import { taxonomyLabel } from "@/lib/catalog.functions";
import { profileUrl } from "@/lib/site";

// A business page shares the same public address shape as a person: /@handle. See lib/site.ts.
const businessUrl = profileUrl;

/**
 * The real business identity behind the QR module's "Business" subject — the signed-in account's
 * own business profile, sharing the isMyAccountBusiness/getMyBusiness read already used to gate
 * business.* screens (see useRequireBusiness). Signed out, or when the account has no business
 * profile, there is no identity (hasBusiness false, no URL).
 */
export function useMyBusinessIdentity() {
  const { signedIn, loading } = useAuth();
  const load = useServerFn(getMyBusiness);
  const loadLabels = useServerFn(getTaxonomyLabels);
  const business = useQuery({
    queryKey: ["business", "me"],
    queryFn: () => load(),
    enabled: signedIn,
  });
  const labelsQuery = useQuery({
    queryKey: ["taxonomy", "labels"],
    queryFn: () => loadLabels(),
    enabled: signedIn,
  });
  const record = business.data;

  if (!signedIn || (business.isFetched && !record)) {
    return {
      ready: !loading && (!signedIn || business.isFetched),
      hasBusiness: false,
      username: null as string | null,
      name: "",
      category: "",
      city: "",
      logo: "",
      verified: false,
      url: "",
    };
  }

  const role = record?.profile.roles?.[0];
  const labels = labelsQuery.data ?? {};
  const username = record?.profile.username ?? null;
  return {
    ready: !business.isLoading,
    hasBusiness: true,
    username,
    name: record?.profile.display_name ?? "",
    category: role ? taxonomyLabel(labels, "person_types", role) : "",
    city: record?.profile.city ?? "",
    logo: record?.business.logo_url ?? record?.profile.avatar_url ?? "",
    verified: Boolean(record?.profile.is_verified),
    url: username ? businessUrl(username) : "",
  };
}
