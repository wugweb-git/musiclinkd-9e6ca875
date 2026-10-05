import { createFileRoute, redirect } from "@tanstack/react-router";

// The old Opportunities search (owner, 5 Oct: "old version"): the one Search, on its
// Opportunities tab, with the same query.
export const Route = createFileRoute("/opportunities/search")({
  validateSearch: (s: Record<string, unknown>): { q?: string } =>
    typeof s["q"] === "string" && s["q"] ? { q: s["q"] } : {},
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/search",
      search: { tab: "opportunities", ...(search.q ? { q: search.q } : {}) },
      replace: true,
    });
  },
});
