import { createFileRoute, redirect } from "@tanstack/react-router";

// "You're in" was a stop between sign-up and onboarding; sign-up now goes straight on. The URL is
// kept so an old link lands in the right place: the splash routes a new account to onboarding.
export const Route = createFileRoute("/auth/success")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
