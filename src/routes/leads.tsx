import { createFileRoute, redirect } from "@tanstack/react-router";

// One Inbox (owner, 4 Oct 2026, queue item 10): leads are the Inbox's Enquiries tab now.
export const Route = createFileRoute("/leads")({
  head: () => ({ meta: [{ title: "Enquiries | MusicLinkd" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/inbox", search: { tab: "enquiries" }, replace: true });
  },
});
