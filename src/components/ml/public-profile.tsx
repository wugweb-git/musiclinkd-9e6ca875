import { useEffect } from "react";
import { notFound, redirect, useRouter } from "@tanstack/react-router";
import { Btn, Screen, TopBar } from "@/components/ml/ui";
import { LoadError } from "@/components/ml/kit";
import { BusinessProfileExperience } from "@/components/ml/business-profile";
import { TalentProfileExperience } from "@/components/ml/talent-profile";
import { businessViewFromRecord } from "@/lib/business-view";
import { profileUrl, jsonLd } from "@/lib/site";
import { mergeProfileRow, mergeSections, profileFromRow } from "@/lib/profile-view";
import type { ProfileRow } from "@/lib/profile-map";
import type { ProfileSections, TaxonomyLabels } from "@/lib/portfolio.functions";
import { rememberVisit } from "@/lib/device-history";
import type { PublicProfileData } from "@/lib/public-profile";

/*
 * A public profile by username, for /@username and /profile/username alike. One username
 * namespace for both account kinds: a business account (it has a profile_business row) shows the
 * business profile screen; any other stored profile shows the talent profile from its own row. A
 * username in neither is a 404, never somebody else's page.
 */

/**
 * The stored row and its stored sections, nothing else; the sections the database does not hold
 * render their empty states.
 */
function profileView(row: ProfileRow, labels: TaxonomyLabels, sections: ProfileSections | null) {
  return mergeSections(mergeProfileRow(profileFromRow(row), row, labels), sections, labels);
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
          dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
        />
      ) : null}
      {view ? (
        <BusinessProfileExperience b={view} work={person} />
      ) : (
        <TalentProfileExperience p={person!} />
      )}
    </>
  );
}

/** The profile routes' error screen: the read failed, so say so and offer Try again. */
export function PublicProfileError() {
  const router = useRouter();
  return (
    <Screen>
      <TopBar title="Profile" back="/discover" />
      <div className="px-5 pt-6">
        <LoadError
          what="this profile"
          action={
            <Btn variant="outline" onClick={() => void router.invalidate()}>
              Try again
            </Btn>
          }
        />
      </div>
    </Screen>
  );
}
