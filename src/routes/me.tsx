import { createFileRoute, redirect } from "@tanstack/react-router";

/** The owner's profile moved to /profile when the tabs became /home and /profile. */
export const Route = createFileRoute("/me")({
  beforeLoad: () => {
    throw redirect({ to: "/profile", replace: true });
  },
});
