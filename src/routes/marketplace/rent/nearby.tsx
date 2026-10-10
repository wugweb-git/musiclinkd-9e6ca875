import { createFileRoute, redirect } from "@tanstack/react-router";

// Rentals and listings are one page (owner, 5 Oct); saved rentals live in Bookmarks.
export const Route = createFileRoute("/marketplace/rent/nearby")({
  beforeLoad: () => {
    throw redirect({ to: "/marketplace/nearby", replace: true });
  },
});
