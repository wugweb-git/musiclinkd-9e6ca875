import { createFileRoute, redirect } from "@tanstack/react-router";

// The code step is part of /auth/phone now (owner, 4 Oct 2026: one screen, two states). The URL is
// kept so an old link lands in the right place; the number has to be entered again.
export const Route = createFileRoute("/auth/otp")({
  head: () => ({ meta: [{ title: "Sign in with Mobile — MusicLinkd" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/auth/phone", replace: true });
  },
});
