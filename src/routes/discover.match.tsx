import { createFileRoute, redirect } from "@tanstack/react-router";

// Find a match is gone: Search does this job (owner, 10 Oct 2026). Old links land on Search.
export const Route = createFileRoute("/discover/match")({
  beforeLoad: () => {
    throw redirect({ to: "/search", replace: true });
  },
});
