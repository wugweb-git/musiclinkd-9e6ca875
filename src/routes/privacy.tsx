import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Top-level /privacy route, redirecting directly into the legal Privacy Policy screen.
 * Resolves both in-app navigation and direct web / Play Store hits.
 */
export const Route = createFileRoute("/privacy")({
  beforeLoad: () => {
    throw redirect({ to: "/legal/$slug", params: { slug: "privacy" }, replace: true });
  },
});
