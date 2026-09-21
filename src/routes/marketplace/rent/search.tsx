import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Searching rentals is Market search. Market is one marketplace (owner, 22 Sep 2026); this path stays so links keep working.
 */
export const Route = createFileRoute("/marketplace/rent/search")({
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search["q"] === "string" && search["q"] ? { q: search["q"] } : {},
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/marketplace/search",
      search: search.q ? { q: search.q } : {},
      replace: true,
    });
  },
});
