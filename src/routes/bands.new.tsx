import { createFileRoute, redirect } from "@tanstack/react-router";

/*
 * A band is a collab type (owner, 17 Sep 2026), so it starts in the one collab flow with Band
 * picked: details (name, one-line description, genres, base city), people, preview, then the
 * band's page. The address stays for the links that point here.
 */
export const Route = createFileRoute("/bands/new")({
  beforeLoad: () => {
    throw redirect({ to: "/collab/new", search: { type: "band" }, replace: true });
  },
});
