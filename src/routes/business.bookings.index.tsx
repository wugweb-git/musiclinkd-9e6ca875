import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, XCircle } from "lucide-react";
import { Screen, TopBar } from "@/components/ml/ui";
import { BookingSkeleton, EmptyState, StudioBookingRecord } from "@/components/ml/booking";
import { BusinessOnlyGate, LoadError, Segmented } from "@/components/ml/kit";
import { useRequireBusiness } from "@/hooks/use-require-business";
import { isoDate } from "@/lib/when";
import { listStudioBookings, type BookingRequest } from "@/lib/bookings.functions";
import { useAuth } from "@/hooks/use-auth";
import { TextLink } from "@/components/ml/links";
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

const tabs = ["requests", "today", "upcoming", "past"] as const;
const tabLabels: Record<(typeof tabs)[number], string> = {
  requests: "Requests",
  today: "Today",
  upcoming: "Upcoming",
  past: "Past",
};
const emptyTitles: Record<(typeof tabs)[number], string> = {
  requests: "No requests waiting",
  today: "Nothing today",
  upcoming: "Nothing upcoming",
  past: "Nothing past",
};

function ProviderBookings() {
  const gate = useRequireBusiness();
  return (
    <BusinessOnlyGate allowed={gate.allowed} loading={gate.loading} signedIn={gate.signedIn}>
      <ProviderBookingsContent />
    </BusinessOnlyGate>
  );
}

function ProviderBookingsContent() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("requests");
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
    tab === "requests" ? pending : tab === "today" ? todays : tab === "upcoming" ? upcoming : past;

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
          <WorkspaceLink to="/profile/edit" label="Policies" />
        </div>

        <div className="mt-4 px-5 pb-1">
          <Segmented value={tab} options={tabs} labels={tabLabels} onChange={setTab} />
        </div>

        <div className="mt-4">
          {!signedIn ? (
            <EmptyState
              title="Sign in to see your bookings"
              body="Requests for a space you run appear here."
            />
          ) : q.isLoading ? (
            <BookingSkeleton />
          ) : q.isError ? (
            <LoadError what="your booking requests" />
          ) : (
            <List items={list} emptyTitle={emptyTitles[tab]} />
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
        <StudioBookingRecord key={b.id} b={b} side="studio" />
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
    | "/profile/edit";
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
