import { createFileRoute, redirect } from "@tanstack/react-router";

// One Inbox (owner, 4 Oct 2026, queue item 10): Messages is the Inbox's Messages tab now.
export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages | MusicLinkd" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/inbox", search: { tab: "messages" }, replace: true });
  },
});
