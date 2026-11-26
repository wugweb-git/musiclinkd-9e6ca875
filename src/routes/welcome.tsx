import { createFileRoute } from "@tanstack/react-router";

import { LoginScreen } from "@/components/ml/login";

// The login screen. The file and address stay `/welcome` (AGENTS.md: never rename route files).
export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Sign In / Join MusicLinkd — India’s Professional Music Network" },
      {
        name: "description",
        content:
          "Sign in to MusicLinkd to showcase your audio work, book verified recording studios, collaborate with artists, and find gigs across India.",
      },
      {
        name: "keywords",
        content:
          "musiclinkd sign in, join music network India, musician login, artist portal India, studio sign in",
      },
      { name: "focus-keyphrase", content: "join music network India" },
      { property: "og:title", content: "Sign in to MusicLinkd" },
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
