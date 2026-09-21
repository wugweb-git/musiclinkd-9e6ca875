import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile, getTaxonomyLabels } from "@/lib/portfolio.functions";
import { getMyCompany } from "@/lib/profile-groups.functions";
import { asLinkMap, type ProfileRow } from "@/lib/profile-map";
import { myIdentity, SHORT_HOST, type QrStyle } from "@/data/identity";
import { defaultQrPrefs, qrPrefsOf } from "@/lib/qr-prefs";

type Contact = {
  phone: string | null;
  email: string | null;
  website: string | null;
  company: string | null;
};

/** The public profile link people reach by scanning. Absolute, so it works off the phone. */
function profileUrl(username: string) {
  const origin = typeof window === "undefined" ? `https://${SHORT_HOST}` : window.location.origin;
  return `${origin}/@${username}`;
}

/**
 * The real identity behind the QR module: the signed-in person's own profile, plus the contact
 * fields their card can show (phone/email from auth, website from profiles.links, company from
 * the business's name or the current experience's org). Signed out,
 * there is no identity: every field is empty and there is no URL to encode. Shares the ["profile","me"] query used by
 * Settings, so a change there (or here) is visible everywhere without a refetch.
 */
export function useMyIdentity() {
  const { signedIn, loading, user } = useAuth();
  const load = useServerFn(getMyProfile);
  const loadLabels = useServerFn(getTaxonomyLabels);
  const loadCompany = useServerFn(getMyCompany);
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
  const companyQuery = useQuery({
    queryKey: ["profile", "me", "company"],
    queryFn: () => loadCompany(),
    enabled: signedIn,
  });
  const row = profile.data as ProfileRow | null | undefined;
  const labels = labelsQuery.data ?? {};

  if (!signedIn) {
    return {
      ready: !loading,
      username: null as string | null,
      name: "",
      role: "",
      photo: undefined,
      verified: false,
      url: "",
      phone: null,
      email: null,
      website: null,
      company: null as string | null,
      qrStyle: "light" as QrStyle,
      qr: defaultQrPrefs,
      contact: { phone: null, email: null, website: null, company: null } as Contact,
    };
  }

  const username = row?.username ?? null;
  const role = (row?.roles ?? [])
    .slice(0, 2)
    .map((slug) => labels["person_types"]?.[slug] ?? slug)
    .join(" · ");
  const links = asLinkMap(row?.links);
  const qr = qrPrefsOf(row?.discovery_prefs);
  const contact: Contact = {
    phone: user?.phone || null,
    email: user?.email || null,
    website: links["website"] ?? null,
    company: companyQuery.data ?? null,
  };
  return {
    ready: !profile.isLoading && !companyQuery.isLoading,
    username,
    name: row?.display_name ?? "",
    role,
    photo: row?.avatar_url ?? "",
    verified: false,
    // The real, working address for this profile — not a code that resolves to nothing.
    url: username ? profileUrl(username) : "",
    // What the card shares: each field the profile has, unless switched off in QR & sharing.
    phone: qr.phone ? contact.phone : null,
    email: qr.email ? contact.email : null,
    website: qr.website ? contact.website : null,
    company: qr.company ? contact.company : null,
    qrStyle: (row?.qr_style as QrStyle | undefined) ?? "light",
    qr,
    contact,
  };
}
