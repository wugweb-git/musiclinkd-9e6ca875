import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy URL. The swipe deck lives at /recommendations/swipe, with its discovery settings at
 * /recommendations/settings.
 */
export const Route = createFileRoute("/recommended")({
  beforeLoad: () => {
    throw redirect({ to: "/recommendations/swipe", replace: true });
  },
});
