import { createFileRoute, redirect } from "@tanstack/react-router";
import { isCollabType, type CollabType } from "@/lib/collab-types";

/*
 * Start a collab — now only an address that sends you on (queue item 7, 4 Oct 2026). A
 * collaboration type (band, duo, collective, ensemble, production team, crew) is created on
 * /bands/new; a one-off project is proof of work, added in Portfolio as a project. The project
 * creator that lived here is gone: `project` is not a collaboration type.
 */
export const Route = createFileRoute("/collab/new/")({
  validateSearch: (s: Record<string, unknown>): { type?: CollabType | "project" } =>
    isCollabType(s["type"]) || s["type"] === "project"
      ? { type: s["type"] as CollabType | "project" }
      : {},
  beforeLoad: ({ search }) => {
    if (search.type && search.type !== "project") {
      throw redirect({ to: "/bands/new", search: { type: search.type }, replace: true });
    }
    throw redirect({ to: "/portfolio/new/$kind", params: { kind: "project" }, replace: true });
  },
  head: () => ({ meta: [{ title: "Start a collaboration | MusicLinkd" }] }),
});
