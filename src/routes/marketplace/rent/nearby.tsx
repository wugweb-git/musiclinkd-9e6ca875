import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Rentals near you are Market's Nearby view. Market is one marketplace (owner, 22 Sep 2026); this path stays so links keep working.
 */
export const Route = createFileRoute("/marketplace/rent/nearby")({
  beforeLoad: () => {
    throw redirect({ to: "/marketplace", search: { view: "Nearby" }, replace: true });
  },
});
