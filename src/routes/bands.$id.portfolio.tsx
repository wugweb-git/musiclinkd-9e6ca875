import { createFileRoute, redirect } from "@tanstack/react-router";

/*
 * A redirect, nothing more. The band's portfolio lives on the band page itself, in its Music tab.
 *
 * This file also carried a loader, head meta and a 130-line `BandPortfolio` component after an
 * unconditional `throw redirect` in `beforeLoad` — none of which could ever run, and all of which
 * read as live code to anyone maintaining it (audit C7, 29 Sep 2026). The route stays so existing
 * links keep working; per the standing rule, route files are not renamed or deleted.
 */
export const Route = createFileRoute("/bands/$id/portfolio")({
  // ?tab=Live is still accepted so old links do not 404, but the band page has no Live tab —
  // its live work sits in Music, which is where this has always sent people.
  validateSearch: (s: Record<string, unknown>): { tab?: "Live" } =>
    s["tab"] === "Live" ? { tab: "Live" } : {},
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/bands/$id",
      params: { id: params.id },
      search: { tab: "Music" },
      replace: true,
    });
  },
});
