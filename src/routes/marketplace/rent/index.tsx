import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Rentals are Market's Rent view. Market is one marketplace (owner, 22 Sep 2026); this path stays so links keep working.
 */
export const Route = createFileRoute("/marketplace/rent/")({
  beforeLoad: () => {
    throw redirect({ to: "/marketplace", search: { view: "Rent" }, replace: true });
  },
});
