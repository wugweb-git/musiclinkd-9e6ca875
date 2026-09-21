import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * The old rental categories aren't Market's categories (those come from the taxonomy), so a rental category opens the Rent view. Market is one marketplace (owner, 22 Sep 2026); this path stays so links keep working.
 */
export const Route = createFileRoute("/marketplace/rent/c/$slug")({
  beforeLoad: () => {
    throw redirect({ to: "/marketplace", search: { view: "Rent" }, replace: true });
  },
});
