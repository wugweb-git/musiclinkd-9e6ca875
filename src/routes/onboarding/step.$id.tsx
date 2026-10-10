import { createFileRoute, redirect } from "@tanstack/react-router";

// The question screens live at /setup/$step, shared by setup and Edit profile for every account
// type (owner, 10 Oct 2026). Old links land there; role's old second screen (q=2) is gone.
export const Route = createFileRoute("/onboarding/step/$id")({
  beforeLoad: ({ params, search }) => {
    const s = search as Record<string, unknown>;
    throw redirect({
      to: "/setup/$step",
      params: { step: params.id },
      search: {
        ...(params.id === "instruments" && Number(s["q"]) === 2 ? { q: 2 as const } : {}),
        ...(s["from"] === "edit" ? { from: "edit" as const } : {}),
      },
      replace: true,
    });
  },
});
