import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy URL. The swipe deck lives under recommendations now
 * (/recommendations/swipe), next to the list at /recommendations.
 */
export const Route = createFileRoute("/recommended")({
  beforeLoad: () => {
    throw redirect({ to: "/recommendations/swipe", replace: true });
  },
});
