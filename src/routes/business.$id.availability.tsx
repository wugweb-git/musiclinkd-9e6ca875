import { createFileRoute, redirect } from "@tanstack/react-router";

/*
 * Opening hours are edited in one place: /business/availability, where a studio's weekly hours
 * also write the line its business profile shows (owner, 21 Sep 2026). Old links land there.
 */
export const Route = createFileRoute("/business/$id/availability")({
  beforeLoad: () => {
    throw redirect({ to: "/business/availability" });
  },
});
