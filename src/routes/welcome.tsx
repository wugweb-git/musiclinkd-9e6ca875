import { createFileRoute } from "@tanstack/react-router";

import { LoginScreen } from "@/components/ml/login";

// The login screen. The file and address stay `/welcome` (AGENTS.md: never rename route files).
export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Log in to MusicLinkd — India's music industry network" },
      {
        name: "description",
        content:
          "Join MusicLinkd to showcase your work, find collaborators, book studios and hire music professionals across India.",
      },
      { property: "og:title", content: "Log in to MusicLinkd" },
      {
        property: "og:description",
        content: "The professional network and marketplace for India's music industry.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <LoginScreen mode="signin" />,
});
