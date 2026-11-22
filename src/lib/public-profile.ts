import { notFound, redirect } from "@tanstack/react-router";
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
import { businessViewFromRecord } from "@/lib/business-view";

export type PublicProfileData = Awaited<ReturnType<typeof loadPublicProfile>>;

export async function loadPublicProfile(username: string) {
  // "me" is the owner's own profile, which has its own screen.
  if (username === "me") throw redirect({ to: "/profile" });
  // A failed read is an error, never "no such profile": both reads failing throws, so the route's
  // error screen says it couldn't load (with Try again) instead of a 404.
  let failed = 0;
  const [row, business, labels] = await Promise.all([
    getPublicProfile({ data: { username } })
      .catch(() => {
        failed += 1;
        return null;
      })
      .then((r) => (r ?? null) as ProfileRow | null),
    getPublicBusiness({ data: { username } }).catch(() => {
      failed += 1;
      return null;
    }),
    // Without labels the chips fall back to slugs; the page still renders.
    getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
  ]);
  if (failed === 2) throw new Error("This profile didn't load");
  // A business's works come from the same portfolio as a talent's. A failed read throws rather
  // than showing "no work yet".
  if (business) {
    const sections = await getPublicProfileSections({
      data: { profileId: business.profile.id },
    });
    return { row, business, labels, sections };
  }
  if (!row) throw notFound();
  const sections: ProfileSections | null = row.id
    ? await getPublicProfileSections({ data: { profileId: row.id } })
    : null;
  return { row, business: null, labels, sections };
}

export function publicProfileHead(username: string, loaderData: PublicProfileData | undefined) {
  if (!loaderData) return { meta: [{ title: "Profile not found | MusicLinkd" }] };
  const business = loaderData.business
    ? businessViewFromRecord(loaderData.business, loaderData.labels)
    : null;
  const profile = business
    ? { name: business.name, primaryRole: business.typeLabel, headline: business.tagline }
    : loaderData.row
      ? mergeSections(
          mergeProfileRow(profileFromRow(loaderData.row), loaderData.row, loaderData.labels),
          loaderData.sections,
          loaderData.labels,
        )
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
