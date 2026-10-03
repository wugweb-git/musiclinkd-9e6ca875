import { createFileRoute } from "@tanstack/react-router";

import { LoginScreen } from "@/components/ml/login";

// The sign-up screen: the login screen's layout, its own address (owner, 4 Oct 2026).
export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your MusicLinkd account — India's music industry network" },
      {
        name: "description",
        content:
          "Join MusicLinkd to showcase your work, find collaborators, book studios and hire music professionals across India.",
      },
      { property: "og:title", content: "Join MusicLinkd" },
      {
        property: "og:description",
        content: "The professional network and marketplace for India's music industry.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <LoginScreen mode="signup" />,
});
