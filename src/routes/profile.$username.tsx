import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { BusinessProfileExperience } from "@/components/ml/business-profile";
import { PersonProfileExperience } from "@/components/ml/person-profile";
import { businessViewFromRecord } from "@/lib/business-view";
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

export const Route = createFileRoute("/profile/$username")({
  // One username namespace for both account kinds. A business account (it has a profile_business
  // row) shows the business profile screen; any other stored profile shows the talent profile from
  // its own row. A username in neither is a 404, never somebody else's page.
  loader: async ({ params }) => {
    // "me" is the owner's own profile, which has its own screen.
    if (params.username === "me") throw redirect({ to: "/profile" });
    const [row, business, labels] = await Promise.all([
      getPublicProfile({ data: { username: params.username } })
        .catch(() => null)
        .then((r) => (r ?? null) as ProfileRow | null),
      getPublicBusiness({ data: { username: params.username } }).catch(() => null),
      // Without labels the chips fall back to slugs; the page still renders.
      getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
    ]);
    if (business) return { row: null, business, labels, sections: null };
    if (!row) throw notFound();
    // Without sections the profile shows its empty states.
    const sections: ProfileSections | null = row.id
      ? await getPublicProfileSections({ data: { profileId: row.id } }).catch(() => null)
      : null;
    return { row, business: null, labels, sections };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Profile not found | MusicLinkd" }] };
    const business = loaderData.business
      ? businessViewFromRecord(loaderData.business, loaderData.labels)
      : null;
    const profile = business
      ? { name: business.name, primaryRole: business.typeLabel, headline: business.tagline }
      : loaderData.row
        ? profileView(loaderData.row, loaderData.labels, loaderData.sections)
        : { name: params.username, primaryRole: "", headline: "" };
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
  },
  component: ProfileRoute,
});

/**
 * The stored row and its stored sections, nothing else; the sections the database does not hold
 * render their empty states.
 */
function profileView(row: ProfileRow, labels: TaxonomyLabels, sections: ProfileSections | null) {
  return mergeSections(mergeProfileRow(profileFromRow(row), row, labels), sections, labels);
}

function ProfileRoute() {
  const { username } = Route.useParams();
  const { row, business, labels, sections } = Route.useLoaderData();
  const view = business ? businessViewFromRecord(business, labels) : null;
  const person = business || !row ? null : profileView(row, labels, sections);

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

  if (view) return <BusinessProfileExperience b={view} />;
  return <PersonProfileExperience p={person!} />;
}
