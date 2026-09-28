import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * A persona type is a filter, not a screen (owner, 28 Sep 2026). Studios are one of the type
 * buttons on Discover; this route stays only so old links and printed URLs keep working.
 */
export const Route = createFileRoute("/studio")({
  beforeLoad: () => {
    throw redirect({ to: "/discover", replace: true });
  },
});
