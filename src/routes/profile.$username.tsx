import { createFileRoute } from "@tanstack/react-router";
import { PersonProfileExperience } from "@/components/ml/person-profile";
import { getProfile } from "@/data/profile";

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
  return <PersonProfileExperience p={getProfile(username)} />;
}