import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy URL. Home is hidden for now; this keeps old links and bookmarks working. */
export const Route = createFileRoute("/feed")({
  beforeLoad: () => {
    throw redirect({ to: "/discover", replace: true });
  },
});
