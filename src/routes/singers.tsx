import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * A persona type is a filter, not a screen (owner, 28 Sep 2026). Singers are one of the type
 * buttons on Discover; this legacy URL stays only so old links keep working.
 */
export const Route = createFileRoute("/singers")({
  beforeLoad: () => {
    throw redirect({ to: "/discover", replace: true });
  },
});
