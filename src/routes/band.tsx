import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy URL. This was a hard-coded page for a band that does not exist in
 * the band data; band profiles live at /bands/$id and the directory at /bands.
 */
export const Route = createFileRoute("/band")({
  beforeLoad: () => {
    throw redirect({ to: "/bands", replace: true });
  },
});
