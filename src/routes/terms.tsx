import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Top-level /terms route, redirecting directly into the legal Terms of Use screen.
 */
export const Route = createFileRoute("/terms")({
  beforeLoad: () => {
    throw redirect({ to: "/legal/$slug", params: { slug: "terms" }, replace: true });
  },
});
