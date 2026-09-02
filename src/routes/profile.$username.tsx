import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PersonProfileExperience } from "@/components/ml/person-profile";
import { getProfile } from "@/data/profile";
import { getPublicProfile } from "@/lib/portfolio.functions";
import { mergeProfileRow } from "@/lib/profile-view";
import type { ProfileRow } from "@/lib/profile-map";

export const Route = createFileRoute("/profile/$username")({
  head: ({ params }) => {
    const profile = getProfile(params.username);
    return {
      meta: [
        { title: `${profile.name} — ${profile.primaryRole} | MusicLinkd` },
        {
          name: "description",
          content: `${profile.name}'s professional MusicLinkd profile: ${profile.headline}`,
        },
        { property: "og:title", content: `${profile.name} — ${profile.primaryRole} | MusicLinkd` },
        { property: "og:description", content: profile.headline },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: PersonProfileRoute,
});

function PersonProfileRoute() {
  const { username } = Route.useParams();
  const base = getProfile(username);
  const load = useServerFn(getPublicProfile);
  const [row, setRow] = useState<ProfileRow | null>(null);

  // Real profiles win; the seeded demo profile stays the fallback.
  useEffect(() => {
    let active = true;
    load({ data: { username } })
      .then((r) => {
        if (active) setRow((r ?? null) as ProfileRow | null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [load, username]);

  return <PersonProfileExperience p={mergeProfileRow(base, row)} />;
}