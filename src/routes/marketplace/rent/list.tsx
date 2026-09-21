import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Renting out is the same flow as selling (owner, 22 Sep 2026): /marketplace/sell, opened on
 * Rent out. This path stays so every existing link keeps working.
 */
export const Route = createFileRoute("/marketplace/rent/list")({
  beforeLoad: () => {
    throw redirect({ to: "/marketplace/sell", search: { type: "rent" }, replace: true });
  },
});
