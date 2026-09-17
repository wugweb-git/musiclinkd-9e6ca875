import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Screen, TopBar, BtnLink, Chip } from "@/components/ml/ui";
import {
  BookingSkeleton,
  BookingStatusPill,
  EmptyState,
  ErrorState,
} from "@/components/ml/booking";
import { formatDate, formatTime, type BookingStatus } from "@/data/booking";
import { listMyBookings } from "@/lib/bookings.functions";
import { useAuth } from "@/hooks/use-auth";
import { joinParts } from "@/lib/utils";

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

const tabs: { key: string; label: string; match: BookingStatus[] }[] = [
  { key: "upcoming", label: "Upcoming", match: ["confirmed"] },
  { key: "pending", label: "Pending", match: ["requested", "reviewing"] },
  { key: "completed", label: "Completed", match: ["completed"] },
  { key: "cancelled", label: "Cancelled", match: ["cancelled", "rejected"] },
];

/** Your own booking requests, from the database: what you asked for and where each one stands. */
function MyBookings() {
  const [tab, setTab] = useState(tabs[0]!.key);
  const { signedIn, loading: authLoading } = useAuth();
  const load = useServerFn(listMyBookings);
  const q = useQuery({
    queryKey: ["bookings", "mine"],
    queryFn: () => load(),
    enabled: signedIn,
  });
  const active = tabs.find((t) => t.key === tab)!;
  const list = (q.data ?? []).filter((b) =>
    active.match.includes((b.status === "declined" ? "rejected" : b.status) as BookingStatus),
  );

  return (
    <Screen>
      <TopBar title="My bookings" subtitle="Studios, rooms and sessions" />

      <div className="rail flex gap-2 overflow-x-auto px-5 py-3 no-scrollbar">
        {tabs.map((t) => (
          <Chip key={t.key} active={t.key === tab} onClick={() => setTab(t.key)}>
            {t.label}
          </Chip>
        ))}
      </div>

      <main className="px-5">
        {!signedIn && !authLoading ? (
          <EmptyState
            title="Sign in to see your bookings"
            body="Requests you send to studios are tracked here."
            action={<BtnLink to="/welcome">Sign In</BtnLink>}
          />
        ) : q.isLoading ? (
          <BookingSkeleton />
        ) : q.isError ? (
          <ErrorState
            message="We couldn't load your bookings just now."
            onRetry={() => void q.refetch()}
          />
        ) : list.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            body="When you ask a studio for a session it shows up here."
            action={<BtnLink to="/studio">Discover Studios &amp; Spaces</BtnLink>}
          />
        ) : (
          <ul className="space-y-3">
            {list.map((b) => (
              <li key={b.id}>
                <Link
                  to="/booking/confirmed/$ref"
                  params={{ ref: b.id }}
                  className="state-layer block rounded-lg bg-subtle p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-2 font-semibold">{b.studio?.name ?? "Studio"}</p>
                      <p className="mt-0.5 truncate text-1 text-muted-foreground">
                        {joinParts(b.room?.name ?? "", b.studio?.location ?? "")}
                      </p>
                    </div>
                    <BookingStatusPill
                      status={(b.status === "declined" ? "rejected" : b.status) as BookingStatus}
                    />
                  </div>
                  <p className="mt-2 text-1 text-muted-foreground">
                    {joinParts(
                      formatDate(b.session_date),
                      b.start_time ? formatTime(b.start_time.slice(0, 5)) : "",
                      b.hours ? `${b.hours} hrs` : "",
                    )}
                  </p>
                  {b.reply ? (
                    <p className="mt-2 line-clamp-2 text-1 text-muted-foreground">{b.reply}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Link to="/provider/bookings" className="mt-6 block rounded-lg bg-subtle p-4">
          <p className="text-sm font-semibold">Manage a space you run</p>
          <p className="mt-0.5 text-1 text-muted-foreground">
            Open the provider workspace to review requests and set availability.
          </p>
        </Link>
      </main>
    </Screen>
  );
}
