import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * A seller's rentals live on My listings with everything else they list (owner, 22 Sep 2026):
 * their state (rented, reserved), renters' requests and the actions. This path stays so links
 * keep working.
 */
export const Route = createFileRoute("/marketplace/rent/listings")({
  beforeLoad: () => {
    throw redirect({ to: "/marketplace/mine", replace: true });
  },
});
