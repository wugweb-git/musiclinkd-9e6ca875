import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * One screen, two subjects: the business code is /identity/qr?as=business. Two hand-written screens
 * for one layout drift apart — this one had already fallen behind the talent QR screen — so the
 * subject is a parameter, the way the Market uses ?view=Rent (owner, 28 Sep 2026).
 */
export const Route = createFileRoute("/identity/business")({
  beforeLoad: () => {
    throw redirect({ to: "/identity/qr", search: { as: "business" }, replace: true });
  },
});
