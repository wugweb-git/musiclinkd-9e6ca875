import { createFileRoute, redirect } from "@tanstack/react-router";

/*
 * Reviews take no replies (owner, 22 Sep 2026). The address stays so old links land somewhere:
 * on Reviews.
 */
export const Route = createFileRoute("/reviews/$id/reply")({
  beforeLoad: () => {
    throw redirect({ to: "/reviews", replace: true });
  },
});
