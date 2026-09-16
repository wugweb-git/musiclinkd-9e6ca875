import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, IndianRupee, Star, TrendingUp } from "lucide-react";
import { Screen, TopBar, Btn, Chip } from "@/components/ml/ui";
import {
  BookingListCard,
  BookingSkeleton,
  EmptyState,
  ProviderRequestCard,
} from "@/components/ml/booking";
import {
  bookings,
  getBookable,
  getResource,
  inr,
  providerRequests,
  providerStats,
  providerToday,
  type Booking,
} from "@/data/booking";
import { TextLink } from "@/components/ml/links";

export const Route = createFileRoute("/provider/bookings/")({
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
        content: "Requests, today's schedule and earnings for your space.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProviderBookings,
});

const tabs = ["Requests", "Today", "Upcoming", "Past"] as const;

function ProviderBookings() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Requests");
  const [loading, setLoading] = useState(false);

  const upcoming = bookings.filter((b) => ["upcoming", "confirmed"].includes(b.status));
  const past = bookings.filter((b) => b.status === "completed");

  return (
    <Screen>
      <TopBar
        title="Provider workspace"
        subtitle="Octave Sound Labs"
        right={
          <TextLink
            to="/provider/availability"
            className="text-0 font-bold uppercase tracking-wide"
          >
            Availability
          </TextLink>
        }
      />

      <main className="px-5 pt-2">
        <div className="grid grid-cols-2 gap-2">
          <Stat
            icon={<CalendarClock size={15} />}
            label="Pending requests"
            value={`${providerStats.pending}`}
          />
          <Stat
            icon={<TrendingUp size={15} />}
            label="Occupancy"
            value={`${providerStats.utilisation}%`}
          />
          <Stat
            icon={<IndianRupee size={15} />}
            label="This month"
            value={inr(providerStats.revenueMonth)}
          />
          <Stat
            icon={<Star size={15} />}
            label="Cancellations"
            value={`${providerStats.cancellations}`}
          />
        </div>

        <div className="rail no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
          <WorkspaceLink to="/provider/bookings/requests" label="Requests" />
          <WorkspaceLink to="/provider/bookings/calendar" label="Calendar" />
          <WorkspaceLink to="/provider/availability" label="Availability" />
          <WorkspaceLink to="/provider/pricing" label="Pricing" />
          <WorkspaceLink to="/provider/policies" label="Policies" />
        </div>

        <div className="rail -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar">
          {tabs.map((t) => (
            <Chip key={t} active={t === tab} onClick={() => setTab(t)}>
              {t}
            </Chip>
          ))}
        </div>

        <div className="mt-4">
          {loading ? (
            <BookingSkeleton />
          ) : tab === "Requests" ? (
            providerRequests.length === 0 ? (
              <EmptyState title="No pending requests" body="New booking requests will land here." />
            ) : (
              <div className="space-y-3">
                {providerRequests.map((bk) => {
                  const b = getBookable(bk.bookableId);
                  const r = getResource(b, bk.resourceId);
                  return (
                    <ProviderRequestCard
                      key={bk.ref}
                      booking={bk}
                      entityResource={`${b?.name ?? "Your space"} · ${r?.name ?? "Room"}`}
                    />
                  );
                })}
              </div>
            )
          ) : (
            <List
              items={tab === "Today" ? providerToday : tab === "Upcoming" ? upcoming : past}
              emptyTitle={`Nothing ${tab.toLowerCase()}`}
            />
          )}
        </div>

        <Btn variant="ghost" className="mt-6 w-full" onClick={() => setLoading((v) => !v)}>
          {loading ? "Show content" : "Preview loading state"}
        </Btn>
      </main>
    </Screen>
  );
}

function List({ items, emptyTitle }: { items: Booking[]; emptyTitle: string }) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} body="Sessions appear here once they're confirmed." />;
  }
  return (
    <div className="space-y-3">
      {items.map((bk) => {
        const b = getBookable(bk.bookableId);
        const r = getResource(b, bk.resourceId);
        return (
          <BookingListCard
            key={bk.ref}
            booking={bk}
            entityName={b?.name ?? "Your space"}
            resourceName={r?.name ?? "Room"}
            provider
          />
        );
      })}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <span className="text-foreground">{icon}</span>
      <p className="mt-2 text-2 font-semibold leading-none">{value}</p>
      <p className="mt-1 text-0 text-muted-foreground">{label}</p>
    </div>
  );
}

function WorkspaceLink({
  to,
  label,
}: {
  to:
    | "/provider/bookings/requests"
    | "/provider/bookings/calendar"
    | "/provider/availability"
    | "/provider/pricing"
    | "/provider/policies";
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
