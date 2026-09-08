import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, Plus } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, EmptyState, Row, StatusPill } from "@/components/ml/kit";
import { getBusiness } from "@/data/business";

export const Route = createFileRoute("/business/$id/services")({
  head: () => ({
    meta: [
      { title: "Business services | MusicLinkd" },
      { name: "description", content: "Manage the rooms, sessions and services this business offers, with pricing and status." },
      { property: "og:title", content: "Business services | MusicLinkd" },
      { property: "og:description", content: "Rooms, sessions and pricing for your business." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessServices,
});

function BusinessServices() {
  const { id } = Route.useParams();
  const b = getBusiness(id);

  if (!b) {
    return (
      <Screen>
        <TopBar title="Services" back="/business" />
        <div className="px-5 pt-6">
          <EmptyState title="Business not found" body="This business may have been removed or you no longer have access to it." />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar
        title="Services"
        subtitle={b.name}
        back={`/business/${b.id}`}
        right={
          <Link to="/services/new" search={{ step: "category" as const }} aria-label="Add service" className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground">
            <Plus size={18} />
          </Link>
        }
      />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Row icon={<CalendarClock size={16} />} title="Business availability" subtitle="Opening hours, blackout dates, notice" to={`/business/${b.id}/availability`} />

        <div className="space-y-3">
          {b.services.map((s) => (
            <Card key={s.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{s.label}</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">{s.price}</p>
                </div>
                <StatusPill label="Live" tone="good" />
              </div>
              <div className="mt-3 flex gap-2">
                <Btn variant="outline" className="flex-1">Edit</Btn>
                <Btn variant="ghost" className="flex-1">Pause</Btn>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <p className="text-sm font-semibold">Rooms as bookable spaces</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Each space carries its own rate and calendar. Customers pick the room before they pick a date.
          </p>
          <div className="mt-3 space-y-2">
            {b.spaces.map((sp) => (
              <div key={sp.id} className="flex items-center justify-between rounded-[16px] border border-border px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">{sp.name}</p>
                  <p className="truncate text-[12px] text-muted-foreground">{sp.rate} · {sp.capacity}</p>
                </div>
                <StatusPill label="Bookable" tone="brand" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Screen>
  );
}
