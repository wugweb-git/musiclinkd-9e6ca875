import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * A seller and a rental provider are the same party in one marketplace (owner, 28 Sep 2026). Both
 * screens already loaded the same listings, reviews and labels; only the header differed. The
 * seller screen is the one, and it shows a person's listings whether they sell or rent them out.
 */
export const Route = createFileRoute("/marketplace/rent/provider/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/marketplace/seller/$id", params: { id: params.id }, replace: true });
  },
});
