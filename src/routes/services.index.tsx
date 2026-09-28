import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarClock, Plus, Settings2 } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import {
  Card,
  StatusPill,
  EmptyState,
  Loading,
  Price,
  Row,
  SoonBadge,
  Segmented,
} from "@/components/ml/kit";
import { toast } from "sonner";
import { StateCard } from "@/components/ml/portfolio";
import { serviceStatusTone } from "@/data/services";
import { categoryEmoji, optionLabel, useMyServices, useServiceOptions } from "@/hooks/use-services";
import { priceParts } from "@/lib/price";
import type { ServiceStatus } from "@/lib/services.functions";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/services/")({
  head: () => ({
    meta: [
      { title: "Services | MusicLinkd" },
      {
        name: "description",
        content:
          "Publish what you offer, set pricing and packages, and control when you are bookable.",
      },
      { property: "og:title", content: "Services | MusicLinkd" },
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
  // Signed out: no services, so the empty state. Views, enquiries and bookings are not stored.
  const { items, pending, error, retry } = useMyServices();
  const { options } = useServiceOptions();
  const list = items.filter(
    (s) => filter === "All" || s.status === (filter.toLowerCase() as ServiceStatus),
  );

  return (
    <Screen>
      <TopBar
        title="Services"
        subtitle="What people can book you for"
        back="/profile"
        right={
          <BtnLink
            to="/services/new"
            search={{ step: "what" as const }}
            variant="ink"
            className="min-h-10 px-4"
            icon={<Plus size={iconSize.sm} aria-hidden />}
          >
            New
          </BtnLink>
        }
      />

      <div className="space-y-4 px-5 pt-4 pb-6">
        {items.length ? (
          <div className="grid grid-cols-3 gap-2">
            <Card>
              <p className="text-1 text-muted-foreground">Live services</p>
              <p className="mt-1 text-3 font-bold leading-none">
                {items.filter((s) => s.status === "active").length}
              </p>
            </Card>
          </div>
        ) : null}

        {items.length ? (
          // Where two bookings overlap or fall outside the hours you set.
          <BtnLink to="/services/conflicts" variant="outline" className="w-full">
            Booking Conflicts
          </BtnLink>
        ) : null}

        <div className="">
          <Segmented value={filter} options={filters} onChange={setFilter} />
        </div>

        {pending ? (
          <Loading />
        ) : error ? (
          <StateCard
            tone="error"
            title="We couldn't load your services"
            body="Check your connection and try again."
            action={<Btn onClick={retry}>Retry</Btn>}
          />
        ) : list.length ? (
          <div className="space-y-3">
            {list.map((s) => (
              <Link key={s.id} to="/services/$id" params={{ id: s.id }} className="block">
                <Card className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-subtle text-2"
                    >
                      {categoryEmoji(s.category)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{s.name}</p>
                      {s.category ? (
                        <p className="truncate text-1 text-muted-foreground">
                          {optionLabel(options?.categories, s.category)}
                        </p>
                      ) : null}
                      <Price
                        from
                        price={priceParts(s.price_paise, s.price_unit, s.price_note)}
                        amountClassName="text-1 font-semibold"
                        unitClassName="text-1"
                      />
                    </div>
                    <StatusPill label={s.status} tone={serviceStatusTone[s.status]} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title={`No ${filter.toLowerCase()} services`}
            body="Publish a service so people can book you without asking for a quote first."
          >
            <BtnLink to="/services/new" search={{ step: "what" as const }} className="w-full">
              Add a Service
            </BtnLink>
          </EmptyState>
        )}
      </div>
    </Screen>
  );
}
