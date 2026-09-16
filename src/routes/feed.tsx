import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy URL. Home lives at /home; this keeps old links and bookmarks working. */
export const Route = createFileRoute("/feed")({
  beforeLoad: () => {
    throw redirect({ to: "/home", replace: true });
  },
});
