import { createFileRoute, redirect } from "@tanstack/react-router";

// Adding work is a drawer on Portfolio, not a screen (owner, 28 Sep 2026); each type lives at
// /portfolio/new/$kind. A link or typed URL to /portfolio/new opens that drawer instead of a 404.
export const Route = createFileRoute("/portfolio/new/")({
  head: () => ({ meta: [{ title: "Add work — MusicLinkd" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/portfolio", search: { add: "1" }, replace: true });
  },
});
