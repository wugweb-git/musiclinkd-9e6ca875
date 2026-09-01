import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, IndianRupee, Star, TrendingUp } from "lucide-react";
import { Screen, TopBar, Btn, Chip } from "@/components/ml/ui";
import {
  BookingListCard,
  EmptyState,
  ProviderRequestCard,
  BookingSkeleton,
} from "@/components/ml/booking";
import {
  bookings,
  declineReasons,
  getBookable,
  getResource,
  inr,
  providerRequests,
  providerStats,
  providerToday,
} from "@/data/booking";

export const Route = createFileRoute("/provider/bookings/")({
  head: () => ({
    meta: [
      { title: "Provider bookings — MusicLinkd" },
      {
        name: "description",
        content: "Review incoming requests, see today's sessions and manage the calendar for the space you run.",
      },
      { property: "og:title", content: "Provider bookings — MusicLinkd" },
      { property: "og:description", content: "Requests, today's schedule and earnings for your space." },
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
  const [decline, setDecline] = useState<string | null>(null);
  const [handled, setHandled] = useState<Record<string, "accepted" | "declined">>({});

  const upcoming = bookings.filter((b) => ["upcoming", "confirmed"].includes(b.status));
  const past = bookings.filter((b) => b.status === "completed");

  return (
    <Screen>
      <TopBar
        title="Provider workspace"
        subtitle="Octave Sound Labs"
        right={
          <Link
            to="/provider/availability"
            className="text-[11px] font-bold uppercase tracking-wide text-primary"
          >
            Availability
          </Link>
        }
      />

      <main className="px-5 pt-2">
        <div className="grid grid-cols-2 gap-2">
          <Stat icon={<CalendarClock size={15} />} label="Pending requests" value={`${providerStats.pending}`} />
          <Stat icon={<TrendingUp size={15} />} label="Occupancy" value={`${providerStats.occupancy}%`} />
          <Stat icon={<IndianRupee size={15} />} label="This month" value={inr(providerStats.monthEarnings)} />
          <Stat icon={<Star size={15} />} label="Rating" value={`${providerStats.rating}`} />
        </div>

        <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar">
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
                  const state = handled[bk.ref];
                  return (
                    <div key={bk.ref}>
                      <ProviderRequestCard
                        booking={bk}
                        resourceName={r?.name ?? "Room"}
                        onAccept={() => setHandled((h) => ({ ...h, [bk.ref]: "accepted" }))}
                        onDecline={() => setDecline(bk.ref)}
                        state={state}
                      />
                      {decline === bk.ref ? (
                        <div className="mt-2 rounded-3xl border border-border bg-card p-4">
                          <p className="text-sm font-semibold">Reason for declining</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {declineReasons.map((x) => (
                              <button
                                key={x}
                                type="button"
                                onClick={() => {
                                  setHandled((h) => ({ ...h, [bk.ref]: "declined" }));
                                  setDecline(null);
                                }}
                                className="min-h-10 rounded-full border border-border px-3 text-xs font-semibold"
                              >
                                {x}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => setDecline(null)}
                            className="mt-3 min-h-10 text-xs font-bold text-muted-foreground"
                          >
                            Keep request
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <List
              items={
                tab === "Today" ? providerToday : tab === "Upcoming" ? upcoming : past
              }
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

function List({ items, emptyTitle }: { items: typeof bookings; emptyTitle: string }) {
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
            entityName={bk.customerName ?? b?.name ?? "Customer"}
            resourceName={r?.name ?? "Room"}
          />
        );
      })}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <span className="text-primary">{icon}</span>
      <p className="mt-2 text-lg font-semibold leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
