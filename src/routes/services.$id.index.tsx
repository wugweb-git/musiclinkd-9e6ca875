import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn, Sheet } from "@/components/ml/ui";
import { Card, StatusPill, EmptyState, Dialog } from "@/components/ml/kit";
import { getService, priceLabel, pricingModelLabel, serviceStatusTone } from "@/data/services";

export const Route = createFileRoute("/services/$id/")({
  head: () => ({
    meta: [
      { title: "Service details | MusicLinkd" },
      {
        name: "description",
        content: "Pricing, packages, deliverables and availability for this service.",
      },
      { property: "og:title", content: "Service details | MusicLinkd" },
      {
        property: "og:description",
        content: "What is included, what it costs and how long it takes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ServiceDetail,
});

function ServiceDetail() {
  const { id } = Route.useParams();
  const s = getService(id);
  const [manage, setManage] = useState(false);
  const [paused, setPaused] = useState(s?.status === "paused");
  const [removed, setRemoved] = useState(false);

  if (!s) {
    return (
      <Screen>
        <TopBar title="Service" back="/services" />
        <div className="px-5 pt-6">
          <EmptyState title="Service not found" body="It may have been removed." />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar
        title={s.category}
        back="/services"
        right={
          <button
            type="button"
            onClick={() => setManage(true)}
            className="text-[12px] font-semibold text-primary"
          >
            Manage
          </button>
        }
      />

      <div className="space-y-4 px-5 pt-4 pb-6">
        <Card className="space-y-3">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-subtle text-[22px]"
            >
              {s.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-[17px] font-bold leading-snug">{s.title}</h1>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {pricingModelLabel[s.pricingModel]} · {s.workMode}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[18px] font-bold">{priceLabel(s.basePrice, s.unit)}</p>
            <StatusPill
              label={paused ? "paused" : s.status}
              tone={paused ? "warn" : serviceStatusTone[s.status]}
            />
          </div>
          <p className="text-[13px] leading-relaxed text-muted-foreground">{s.description}</p>
        </Card>

        <Card className="space-y-2">
          <h2 className="text-[15px]">What you get</h2>
          <ul className="space-y-1.5">
            {s.deliverables.map((d) => (
              <li key={d} className="flex gap-2 text-[13px]">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {d}
              </li>
            ))}
          </ul>
          <p className="pt-1 text-[12px] text-muted-foreground">Turnaround {s.turnaround}</p>
        </Card>

        {s.packages.length ? (
          <section className="space-y-3">
            <h2 className="text-[15px] font-semibold">Packages</h2>
            {s.packages.map((p) => (
              <Card key={p.id} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14px] font-semibold">{p.name}</p>
                  {p.popular ? <StatusPill label="popular" tone="brand" /> : null}
                </div>
                <p className="text-[16px] font-bold">{priceLabel(p.price, p.unit)}</p>
                <ul className="space-y-1">
                  {p.includes.map((i) => (
                    <li key={i} className="text-[12px] text-muted-foreground">
                      · {i}
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-muted-foreground">
                  {p.turnaround} · {p.revisions}
                </p>
              </Card>
            ))}
          </section>
        ) : null}

        {s.addons.length ? (
          <Card className="space-y-2">
            <h2 className="text-[15px]">Add-ons</h2>
            {s.addons.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0"
              >
                <span className="min-w-0 flex-1 truncate text-[13px]">{a.label}</span>
                <span className="text-[13px] font-semibold">{priceLabel(a.price, a.unit)}</span>
              </div>
            ))}
          </Card>
        ) : null}

        <Card className="space-y-2">
          <h2 className="text-[15px]">What the client should send</h2>
          {s.requirements.map((r) => (
            <p key={r} className="text-[13px] text-muted-foreground">
              · {r}
            </p>
          ))}
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Link to="/services/availability">
            <Btn variant="outline" className="w-full">
              Availability
            </Btn>
          </Link>
          <Link to="/booking/$id" params={{ id: s.id }}>
            <Btn className="w-full">Preview booking</Btn>
          </Link>
        </div>
      </div>

      <Sheet open={manage} onClose={() => setManage(false)} title="Manage service">
        <div className="space-y-2">
          <Link to="/services/new" search={{ step: "category" as const }}>
            <Btn variant="outline" className="w-full">
              Edit details & pricing
            </Btn>
          </Link>
          <Btn
            variant="outline"
            className="w-full"
            onClick={() => {
              setPaused((p) => !p);
              setManage(false);
            }}
          >
            {paused ? "Make bookable again" : "Pause bookings"}
          </Btn>
          <Btn
            variant="ghost"
            className="w-full"
            onClick={() => {
              setManage(false);
              setRemoved(true);
            }}
          >
            Remove service
          </Btn>
        </div>
      </Sheet>

      <Dialog
        open={removed}
        title="Service removed"
        body="Existing bookings are unaffected. You can publish it again any time."
        onClose={() => setRemoved(false)}
      >
        <Link to="/services">
          <Btn className="w-full">Back to services</Btn>
        </Link>
      </Dialog>
    </Screen>
  );
}
