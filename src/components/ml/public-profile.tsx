import { useEffect } from "react";
import { notFound, redirect } from "@tanstack/react-router";
import { BusinessProfileExperience } from "@/components/ml/business-profile";
import { PersonProfileExperience } from "@/components/ml/person-profile";
import { businessViewFromRecord } from "@/lib/business-view";
import { profileUrl } from "@/lib/site";
import {
  getPublicProfile,
  getPublicProfileSections,
  getTaxonomyLabels,
  type ProfileSections,
  type TaxonomyLabels,
} from "@/lib/portfolio.functions";
import { getPublicBusiness } from "@/lib/profile-groups.functions";
import { mergeProfileRow, mergeSections, profileFromRow } from "@/lib/profile-view";
import type { ProfileRow } from "@/lib/profile-map";
import { rememberVisit } from "@/lib/device-history";

/*
 * A public profile by username, for /@username and /profile/username alike. One username
 * namespace for both account kinds: a business account (it has a profile_business row) shows the
 * business profile screen; any other stored profile shows the talent profile from its own row. A
 * username in neither is a 404, never somebody else's page.
 */

export type PublicProfileData = Awaited<ReturnType<typeof loadPublicProfile>>;

export async function loadPublicProfile(username: string) {
  // "me" is the owner's own profile, which has its own screen.
  if (username === "me") throw redirect({ to: "/profile" });
  const [row, business, labels] = await Promise.all([
    getPublicProfile({ data: { username } })
      .catch(() => null)
      .then((r) => (r ?? null) as ProfileRow | null),
    getPublicBusiness({ data: { username } }).catch(() => null),
    // Without labels the chips fall back to slugs; the page still renders.
    getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
  ]);
  if (business) {
    // A business's works come from the same portfolio as a talent's.
    const sections = await getPublicProfileSections({
      data: { profileId: business.profile.id },
    }).catch(() => null);
    return { row, business, labels, sections };
  }
  if (!row) throw notFound();
  // Without sections the profile shows its empty states.
  const sections: ProfileSections | null = row.id
    ? await getPublicProfileSections({ data: { profileId: row.id } }).catch(() => null)
    : null;
  return { row, business: null, labels, sections };
}

/**
 * The stored row and its stored sections, nothing else; the sections the database does not hold
 * render their empty states.
 */
function profileView(row: ProfileRow, labels: TaxonomyLabels, sections: ProfileSections | null) {
  return mergeSections(mergeProfileRow(profileFromRow(row), row, labels), sections, labels);
}

export function publicProfileHead(username: string, loaderData: PublicProfileData | undefined) {
  if (!loaderData) return { meta: [{ title: "Profile not found | MusicLinkd" }] };
  const business = loaderData.business
    ? businessViewFromRecord(loaderData.business, loaderData.labels)
    : null;
  const profile = business
    ? { name: business.name, primaryRole: business.typeLabel, headline: business.tagline }
    : loaderData.row
      ? profileView(loaderData.row, loaderData.labels, loaderData.sections)
      : { name: username, primaryRole: "", headline: "" };
  const title = profile.primaryRole
    ? `${profile.name} — ${profile.primaryRole} | MusicLinkd`
    : `${profile.name} | MusicLinkd`;
  const description = profile.headline
    ? `${profile.name}'s professional MusicLinkd profile: ${profile.headline}`
    : `${profile.name}'s professional MusicLinkd profile.`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: profile.headline || description },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}

export function PublicProfileScreen({
  username,
  data,
}: {
  username: string;
  data: PublicProfileData;
}) {
  const { row, business, labels, sections } = data;
  const view = business ? businessViewFromRecord(business, labels) : null;
  // A business's works read like a talent's; its own profile record stands in for the row.
  const baseRow = row ?? (business ? (business.profile as unknown as ProfileRow) : null);
  const person = baseRow ? profileView(baseRow, labels, sections) : null;

  // Opening a page is what makes it recently viewed; the note stays on this device.
  const name = view?.name ?? person?.name ?? "";
  const detail = view?.typeLabel ?? person?.primaryRole ?? null;
  const avatar = view?.logo || person?.photo || null;
  const isBusiness = Boolean(business);
  useEffect(() => {
    if (!name) return;
    rememberVisit({
      kind: isBusiness ? "studio" : "person",
      handle: username,
      name,
      detail,
      avatarUrl: avatar,
    });
  }, [username, name, detail, avatar, isBusiness]);

  const structuredData = view
    ? {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: view.name,
        description: view.tagline || view.about,
        image: view.cover || view.logo,
        url: profileUrl(username),
        telephone: undefined,
        sameAs: view.website ? [view.website] : undefined,
        address: view.city
          ? {
              "@type": "PostalAddress",
              addressLocality: view.city,
              addressCountry: "IN",
            }
          : undefined,
      }
    : person
      ? {
          "@context": "https://schema.org",
          "@type": "Person",
          name: person.name,
          jobTitle: person.primaryRole,
          description: person.shortBio || person.longBio || person.headline,
          image: person.photo,
          url: profileUrl(username),
          knowsAbout: [
            ...(person.genres || []),
            ...(person.instruments || []),
            ...(person.specialisations || []),
          ],
          address: person.location
            ? {
                "@type": "PostalAddress",
                addressLocality: person.location,
                addressCountry: "IN",
              }
            : undefined,
        }
      : null;

  return (
    <>
      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      ) : null}
      {view ? (
        <BusinessProfileExperience b={view} work={person} />
      ) : (
        <PersonProfileExperience p={person!} />
      )}
    </>
  );
}
