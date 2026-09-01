import { createFileRoute } from "@tanstack/react-router";
import { PersonProfileExperience } from "@/components/ml/person-profile";
import { getProfile, ownerUsername } from "@/data/profile";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "My Professional Profile | MusicLinkd" },
      { name: "description", content: "Manage your MusicLinkd professional identity, portfolio and collaboration profile." },
      { property: "og:title", content: "My Professional Profile | MusicLinkd" },
      { property: "og:description", content: "Your MusicLinkd professional identity and portfolio." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyProfile,
});

function MyProfile() {
  return <PersonProfileExperience p={getProfile(ownerUsername)} owner />;
}