import { createFileRoute, redirect } from "@tanstack/react-router";

// Rentals and listings are one page (owner, 5 Oct); saved rentals live in Bookmarks.
export const Route = createFileRoute("/marketplace/rent/listings")({
  beforeLoad: () => {
    throw redirect({ to: "/marketplace/mine", replace: true });
  },
});
