import { iconSize } from "@/lib/tokens";
import { CalendarDays } from "lucide-react";
import { Segmented, EmptyState, LoadError } from "@/components/ml/kit";
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Btn, Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { BookingSkeleton, StudioBookingRecord, shownBookingStatus } from "@/components/ml/booking";
import { listMyBookings, type BookingStatus as DbBookingStatus } from "@/lib/bookings.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/bookings/")({
  head: () => ({
    meta: [
      { title: "My bookings — MusicLinkd" },
      {
        name: "description",
        content:
          "Every studio, jam room and session you've booked — upcoming, pending, completed and cancelled.",
      },
      { property: "og:title", content: "My bookings — MusicLinkd" },
      {
        property: "og:description",
        content: "Track upcoming, pending and past MusicLinkd bookings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyBookings,
});

const tabs = ["upcoming", "pending", "completed", "cancelled"] as const;
type Tab = (typeof tabs)[number];
const tabLabels: Record<Tab, string> = {
  upcoming: "Upcoming",
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
};
const tabMatch: Record<Tab, DbBookingStatus[]> = {
  upcoming: ["confirmed"],
  pending: ["requested", "reviewing"],
  completed: ["completed"],
  cancelled: ["cancelled", "declined"],
};

/** Your own booking requests, from the database: what you asked for and where each one stands. */
function MyBookings() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const { signedIn, loading: authLoading } = useAuth();
  const load = useServerFn(listMyBookings);
  const q = useQuery({
    queryKey: ["bookings", "mine"],
    queryFn: () => load(),
    enabled: signedIn,
  });
  // A confirmed session whose day has passed reads as completed (shownBookingStatus).
  const list = (q.data ?? []).filter((b) => tabMatch[tab].includes(shownBookingStatus(b)));

  return (
    <Screen>
      <TopBar title="My bookings" subtitle="Studios, rooms and sessions" />

      <div className="px-5 pb-3">
        <Segmented value={tab} options={tabs} labels={tabLabels} onChange={setTab} />
      </div>

      <main className="px-5">
        {!signedIn && !authLoading ? (
          <EmptyState
            icon={<CalendarDays size={iconSize.lg} aria-hidden />}
            title="Sign in to see your bookings"
            body="Requests you send to studios are tracked here."
            action={<BtnLink to="/welcome">Sign In</BtnLink>}
          />
        ) : q.isLoading ? (
          <BookingSkeleton />
        ) : q.isError ? (
          <LoadError
            what="your bookings"
            action={<Btn onClick={() => void q.refetch()}>Try Again</Btn>}
          />
        ) : list.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={iconSize.lg} aria-hidden />}
            title="No bookings yet"
            body="When you ask a studio for a session it shows up here."
            action={
              <BtnLink to="/discover/$slug" params={{ slug: "studios" }}>
                Discover Studios &amp; Spaces
              </BtnLink>
            }
          />
        ) : (
          <ul className="space-y-3">
            {list.map((b) => (
              <li key={b.id}>
                <StudioBookingRecord b={b} side="requester" />
              </li>
            ))}
          </ul>
        )}

        <Link to="/business/bookings" className="mt-6 block rounded-lg bg-subtle p-4">
          <p className="text-sm font-semibold">Manage a space you run</p>
          <p className="mt-0.5 text-1 text-muted-foreground">
            Open the provider workspace to review requests and set availability.
          </p>
        </Link>
      </main>
    </Screen>
  );
}
