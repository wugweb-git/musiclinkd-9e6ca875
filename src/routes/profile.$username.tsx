import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { PersonProfileExperience } from "@/components/ml/person-profile";
import { getProfile } from "@/data/profile";
import {
  getPublicProfile,
  getPublicProfileSections,
  getTaxonomyLabels,
  type ProfileSections,
  type TaxonomyLabels,
} from "@/lib/portfolio.functions";
import { mergeProfileRow, mergeSections, profileFromRow } from "@/lib/profile-view";
import type { ProfileRow } from "@/lib/profile-map";

export const Route = createFileRoute("/profile/$username")({
  // Real profiles win over seed data. A username in neither is a 404, never somebody else's page.
  loader: async ({ params }) => {
    // "me" is the owner's own profile, which has its own screen.
    if (params.username === "me") throw redirect({ to: "/me" });
    const [row, labels] = await Promise.all([
      getPublicProfile({ data: { username: params.username } })
        .catch(() => null)
        .then((r) => (r ?? null) as ProfileRow | null),
      // Without labels the chips fall back to slugs; the page still renders.
      getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
    ]);
    if (!row && !getProfile(params.username)) throw notFound();
    // Without sections the profile shows its seed sections or empty states.
    const sections: ProfileSections | null = row?.id
      ? await getPublicProfileSections({ data: { profileId: row.id } }).catch(() => null)
      : null;
    return { row, labels, sections };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Profile not found | MusicLinkd" }] };
    const profile = profileView(
      params.username,
      loaderData.row,
      loaderData.labels,
      loaderData.sections,
    );
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
  component: PersonProfileRoute,
});

/**
 * The real row over the seed profile. A real profile with no seed gets only its own data; the
 * sections the profiles table does not store render their empty states.
 */
function profileView(
  username: string,
  row: ProfileRow | null,
  labels: TaxonomyLabels,
  sections: ProfileSections | null,
) {
  const base = getProfile(username) ?? profileFromRow(row ?? { username });
  return mergeSections(mergeProfileRow(base, row, labels), sections);
}

function PersonProfileRoute() {
  const { username } = Route.useParams();
  const { row, labels, sections } = Route.useLoaderData();
  return <PersonProfileExperience p={profileView(username, row, labels, sections)} />;
}
