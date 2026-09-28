import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Saved rentals are in Market's Saved. Market is one marketplace (owner, 22 Sep 2026); this path stays so links keep working.
 */
export const Route = createFileRoute("/marketplace/rent/saved")({
  beforeLoad: () => {
    throw redirect({ to: "/saved", replace: true });
  },
});
