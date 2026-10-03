import { createFileRoute, redirect } from "@tanstack/react-router";

/*
 * Legacy passwordless email entry. Product auth uses email + password at /welcome; account
 * verification remains separate at /auth/verify-email.
 */
export const Route = createFileRoute("/auth/")({
  head: () => ({
    meta: [
      { title: "Sign in — MusicLinkd" },
      {
        name: "description",
        content: "Sign in to MusicLinkd with your email address and password.",
      },
      { property: "og:title", content: "Sign in — MusicLinkd" },
      { property: "og:description", content: "Access your MusicLinkd account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: () => { throw redirect({ to: "/welcome", replace: true }); },
});
