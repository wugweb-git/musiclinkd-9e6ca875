import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, XCircle } from "lucide-react";
import { Screen, TopBar } from "@/components/ml/ui";
import { BookingSkeleton, BookingStatusPill, EmptyState } from "@/components/ml/booking";
import { BusinessOnlyGate, Segmented } from "@/components/ml/kit";
import { useRequireBusiness } from "@/hooks/use-require-business";
import { formatDate, formatTime, isoDate, type BookingStatus } from "@/data/booking";
import { listStudioBookings, type BookingRequest } from "@/lib/bookings.functions";
import { useAuth } from "@/hooks/use-auth";
import { TextLink } from "@/components/ml/links";
import { joinParts } from "@/lib/utils";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/business/bookings/")({
  head: () => ({
    meta: [
      { title: "Provider bookings — MusicLinkd" },
      {
        name: "description",
        content:
          "Review incoming requests, see today's sessions and manage the calendar for the space you run.",
      },
      { property: "og:title", content: "Provider bookings — MusicLinkd" },
      {
        property: "og:description",
        content: "Requests, and today's schedule for your space.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProviderBookings,
});

const tabs = ["Requests", "Today", "Upcoming", "Past"] as const;

function ProviderBookings() {
  const gate = useRequireBusiness();
  return (
    <BusinessOnlyGate allowed={gate.allowed} loading={gate.loading} signedIn={gate.signedIn}>
      <ProviderBookingsContent />
    </BusinessOnlyGate>
  );
}

function ProviderBookingsContent() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Requests");
  const { signedIn } = useAuth();
  const load = useServerFn(listStudioBookings);
  const q = useQuery({
    queryKey: ["studio-bookings"],
    queryFn: () => load(),
    enabled: signedIn,
  });

  const all = q.data ?? [];
  const today = isoDate(new Date());
  const pending = all.filter((b) => ["requested", "reviewing"].includes(b.status));
  const cancelled = all.filter((b) => b.status === "cancelled");
  const todays = all.filter((b) => b.session_date === today && b.status !== "cancelled");
  const upcoming = all.filter((b) => b.session_date > today && b.status === "confirmed");
  const past = all.filter((b) => b.session_date < today || b.status === "completed");

  const list =
    tab === "Requests" ? pending : tab === "Today" ? todays : tab === "Upcoming" ? upcoming : past;

  return (
    <Screen>
      <TopBar
        title="Provider workspace"
        subtitle="Requests and sessions for the spaces you run"
        right={
          <TextLink
            to="/business/availability"
            className="pill bg-background text-muted-foreground"
          >
            Availability
          </TextLink>
        }
      />

      <main className="px-5 pt-2">
        <div className="grid grid-cols-2 gap-2">
          <Stat
            icon={<CalendarClock size={iconSize.sm} />}
            label="Pending requests"
            value={`${pending.length}`}
          />
          <Stat
            icon={<XCircle size={iconSize.sm} />}
            label="Cancellations"
            value={`${cancelled.length}`}
          />
        </div>

        <div className="rail no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
          <WorkspaceLink to="/business/bookings/requests" label="Requests" />
          <WorkspaceLink to="/business/bookings/calendar" label="Calendar" />
          <WorkspaceLink to="/business/availability" label="Availability" />
          <WorkspaceLink to="/business/pricing" label="Pricing" />
          <WorkspaceLink to="/business/policies" label="Policies" />
        </div>

        <div className="mt-4 px-5 pb-1">
          <Segmented value={tab} options={tabs} onChange={setTab} />
        </div>

        <div className="mt-4">
          {!signedIn ? (
            <EmptyState
              title="Sign in to see your bookings"
              body="Requests for a space you run appear here."
            />
          ) : q.isLoading ? (
            <BookingSkeleton />
          ) : (
            <List items={list} emptyTitle={`Nothing ${tab.toLowerCase()}`} />
          )}
        </div>
      </main>
    </Screen>
  );
}

function List({ items, emptyTitle }: { items: BookingRequest[]; emptyTitle: string }) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} body="Sessions appear here once they're requested." />;
  }
  return (
    <div className="space-y-3">
      {items.map((b) => (
        <article key={b.id} className="rounded-lg bg-subtle p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {b.requester?.username ? (
                <Link
                  to="/profile/$username"
                  params={{ username: b.requester.username }}
                  className="truncate text-2 font-semibold"
                >
                  {b.requester.display_name ?? b.requester.username}
                </Link>
              ) : (
                <p className="truncate text-2 font-semibold">Someone</p>
              )}
              <p className="mt-0.5 truncate text-1 text-muted-foreground">
                {joinParts(b.studio?.name ?? b.studio_name ?? "Your space", b.room?.name ?? "")}
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
        </article>
      ))}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-subtle p-4">
      <span className="text-foreground">{icon}</span>
      <p className="mt-2 text-2 font-semibold leading-none">{value}</p>
      <p className="mt-1 text-1 text-muted-foreground">{label}</p>
    </div>
  );
}

function WorkspaceLink({
  to,
  label,
}: {
  to:
    | "/business/bookings/requests"
    | "/business/bookings/calendar"
    | "/business/availability"
    | "/business/pricing"
    | "/business/policies";
  label: string;
}) {
  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center rounded-full border border-border bg-card px-4 py-2.5 text-1 font-semibold"
    >
      {label}
    </Link>
  );
}
