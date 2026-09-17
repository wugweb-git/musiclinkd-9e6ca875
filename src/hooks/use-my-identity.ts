import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile, getTaxonomyLabels } from "@/lib/portfolio.functions";
import { asLinkMap, type ProfileRow } from "@/lib/profile-map";
import { myIdentity, SHORT_HOST, type QrStyle } from "@/data/identity";

/** The public profile link people reach by scanning. Absolute, so it works off the phone. */
function profileUrl(username: string) {
  const origin = typeof window === "undefined" ? `https://${SHORT_HOST}` : window.location.origin;
  return `${origin}/profile/${username}`;
}

/**
 * The real identity behind the QR module: the signed-in person's own profile, plus the contact
 * fields their card can show (phone/email from auth, website from profiles.links). Signed out,
 * the seed identity stands in, as it does on /profile. Shares the ["profile","me"] query used by
 * Settings, so a change there (or here) is visible everywhere without a refetch.
 */
export function useMyIdentity() {
  const { signedIn, loading, user } = useAuth();
  const load = useServerFn(getMyProfile);
  const loadLabels = useServerFn(getTaxonomyLabels);
  const profile = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => load(),
    enabled: signedIn,
  });
  const labelsQuery = useQuery({
    queryKey: ["taxonomy", "labels"],
    queryFn: () => loadLabels(),
    enabled: signedIn,
  });
  const row = profile.data as ProfileRow | null | undefined;
  const labels = labelsQuery.data ?? {};

  if (!signedIn) {
    return {
      ready: !loading,
      username: myIdentity.username,
      name: myIdentity.name,
      role: myIdentity.role,
      photo: myIdentity.photo,
      verified: myIdentity.verified,
      url: profileUrl(myIdentity.username),
      phone: myIdentity.contact.phone.shared ? myIdentity.contact.phone.value : null,
      email: myIdentity.contact.email.shared ? myIdentity.contact.email.value : null,
      website: myIdentity.contact.website.shared ? myIdentity.contact.website.value : null,
      qrStyle: "light" as QrStyle,
    };
  }

  const username = row?.username ?? null;
  const role = (row?.roles ?? [])
    .slice(0, 2)
    .map((slug) => labels["person_types"]?.[slug] ?? slug)
    .join(" · ");
  const links = asLinkMap(row?.links);
  return {
    ready: !profile.isLoading,
    username,
    name: row?.display_name ?? "",
    role,
    photo: row?.avatar_url ?? "",
    verified: false,
    // The real, working address for this profile — not a code that resolves to nothing.
    url: username ? profileUrl(username) : "",
    phone: user?.phone || null,
    email: user?.email || null,
    website: links["website"] ?? null,
    qrStyle: (row?.qr_style as QrStyle | undefined) ?? "light",
  };
}
