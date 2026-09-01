import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy talent URL. Every profile entry point resolves to the canonical
 * /profile/$username screen, so this route only redirects.
 */
export const Route = createFileRoute("/talent/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/profile/$username",
      params: { username: params.id },
      replace: true,
    });
  },
});
