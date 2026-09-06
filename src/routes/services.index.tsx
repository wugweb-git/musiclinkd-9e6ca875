import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarClock, Plus, Settings2 } from "lucide-react";
import { Screen, TopBar, Btn, Chip } from "@/components/ml/ui";
import { Card, StatusPill, EmptyState, Row } from "@/components/ml/kit";
import { myServices, priceLabel, serviceStatusTone, type ServiceStatus } from "@/data/services";

export const Route = createFileRoute("/services/")({
  head: () => ({
    meta: [
      { title: "Your services | MusicLinkd" },
      { name: "description", content: "Publish what you offer, set pricing and packages, and control when you are bookable." },
      { property: "og:title", content: "Your services | MusicLinkd" },
      { property: "og:description", content: "Services, pricing and availability in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ServicesHome,
});

const filters = ["All", "Active", "Paused", "Draft"] as const;

function ServicesHome() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const list = myServices.filter((s) => filter === "All" || s.status === (filter.toLowerCase() as ServiceStatus));
  const bookings = myServices.reduce((n, s) => n + s.stats.bookings, 0);
  const enquiries = myServices.reduce((n, s) => n + s.stats.enquiries, 0);

  return (
    <Screen>
      <TopBar
        title="Services"
        subtitle="What people can book you for"
        back="/me"
        right={
          <Link to="/services/new" search={{ step: "category" as const }} aria-label="Add service" className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground">
            <Plus size={18} />
          </Link>
        }
      />

      <div className="space-y-4 px-5 pt-4 pb-6">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Live services", value: myServices.filter((s) => s.status === "active").length },
            { label: "Enquiries", value: enquiries },
            { label: "Booked", value: bookings },
          ].map((s) => (
            <Card key={s.label}>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-[20px] font-bold leading-none">{s.value}</p>
            </Card>
          ))}
        </div>

        <div className="space-y-2">
          <Row icon={<CalendarClock size={16} />} title="Availability" subtitle="Weekly hours, notice period, time off" to="/services/availability" />
          <Row icon={<Settings2 size={16} />} title="Booking policies" subtitle="Deposits, cancellation, rescheduling" to="/provider/policies" />
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f}
            </Chip>
          ))}
        </div>

        {list.length ? (
          <div className="space-y-3">
            {list.map((s) => (
              <Link key={s.id} to="/services/$id" params={{ id: s.id }} className="block">
                <Card className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-subtle text-[18px]">
                      {s.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold">{s.title}</p>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {s.category} · {priceLabel(s.basePrice, s.unit)}
                      </p>
                    </div>
                    <StatusPill label={s.status} tone={serviceStatusTone[s.status]} />
                  </div>
                  <div className="flex gap-4 text-[11px] text-muted-foreground">
                    <span>{s.stats.views} views</span>
                    <span>{s.stats.enquiries} enquiries</span>
                    <span>
                      ★ {s.stats.rating} ({s.stats.reviews})
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title={`No ${filter.toLowerCase()} services`} body="Publish a service so people can book you without asking for a quote first.">
            <Link to="/services/new" search={{ step: "category" as const }}>
              <Btn className="w-full">Add a service</Btn>
            </Link>
          </EmptyState>
        )}
      </div>
    </Screen>
  );
}
