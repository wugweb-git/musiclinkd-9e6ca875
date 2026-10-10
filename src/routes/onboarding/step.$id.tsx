import { createFileRoute, redirect } from "@tanstack/react-router";

// The question screens live at /setup/$step, shared by setup and Edit profile for every account
// type (owner, 10 Oct 2026). Old links land there; the old second screens (q=2) are gone.
export const Route = createFileRoute("/onboarding/step/$id")({
  beforeLoad: ({ params, search }) => {
    const s = search as Record<string, unknown>;
    throw redirect({
      to: "/setup/$step",
      params: { step: params.id },
      search: {
        ...(s["from"] === "edit" ? { from: "edit" as const } : {}),
      },
      replace: true,
    });
  },
});
