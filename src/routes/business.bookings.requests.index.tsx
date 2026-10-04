import { createFileRoute, redirect } from "@tanstack/react-router";

// One Inbox (owner, 4 Oct 2026, queue item 10): the requests queue is the Inbox's Booking
// Requests tab. A single request still opens at /business/bookings/requests/$ref.
export const Route = createFileRoute("/business/bookings/requests/")({
  head: () => ({ meta: [{ title: "Booking requests | MusicLinkd" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/inbox", search: { tab: "bookings" }, replace: true });
  },
});
