import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy URL, mock data. The live singers directory is /categories/singers. */
export const Route = createFileRoute("/singers")({
  beforeLoad: () => {
    throw redirect({ to: "/categories/$slug", params: { slug: "singers" }, replace: true });
  },
});
