import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/ml/ui";
import { Card, EmptyState, Meter } from "@/components/ml/kit";
import { businessAnalytics, getBusiness } from "@/data/business";

export const Route = createFileRoute("/business/$id/analytics")({
  head: () => ({
    meta: [
      { title: "Business analytics | MusicLinkd" },
      { name: "description", content: "See how many people found the business, saved it, enquired and actually booked." },
      { property: "og:title", content: "Business analytics | MusicLinkd" },
      { property: "og:description", content: "Views, saves, enquiries and bookings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessAnalytics,
});

function BusinessAnalytics() {
  const { id } = Route.useParams();
  const b = getBusiness(id);
  const a = businessAnalytics;

  if (!b) {
    return (
      <Screen>
        <TopBar title="Analytics" back="/business" />
        <div className="px-5 pt-6">
          <EmptyState title="Business not found" body="This business may have been removed or you no longer have access to it." />
        </div>
      </Screen>
    );
  }

  const peak = Math.max(...a.daily);

  return (
    <Screen>
      <TopBar title="Analytics" subtitle={`${b.name} · last 30 days`} back={`/business/${b.id}/dashboard`} />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Page views", value: a.views.toLocaleString("en-IN") },
            { label: "Saves", value: a.saves },
            { label: "Enquiries", value: a.enquiries },
            { label: "Bookings", value: a.bookings },
          ].map((s) => (
            <Card key={s.label}>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-[22px] font-bold leading-none">{s.value}</p>
            </Card>
          ))}
        </div>

        <Card>
          <p className="text-sm font-semibold">Views this week</p>
          <div className="mt-3 flex h-24 items-end gap-2">
            {a.daily.map((d, i) => (
              <div key={i} className="flex-1 rounded-t-[8px] bg-primary/80" style={{ height: `${(d / peak) * 100}%` }} aria-label={`${d} views`} />
            ))}
          </div>
          <p className="mt-2 text-[12px] text-muted-foreground">View to enquiry: {a.viewToEnquiry}</p>
        </Card>

        <Card>
          <p className="text-sm font-semibold">Where people came from</p>
          <div className="mt-3 space-y-3">
            {a.sources.map((s) => (
              <Meter key={s.label} label={s.label} value={s.value} max={100} hint={`${s.value}%`} />
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-semibold">Rooms by demand</p>
          <div className="mt-3 space-y-3">
            {a.topSpaces.map((s) => (
              <Meter key={s.label} label={s.label} value={s.value} max={100} hint={`${s.value}%`} />
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-semibold">Responsiveness</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            You reply to {a.responseRate} of enquiries, usually {a.responseTime}. Studios that reply within an hour get roughly twice the bookings.
          </p>
        </Card>
      </div>
    </Screen>
  );
}
