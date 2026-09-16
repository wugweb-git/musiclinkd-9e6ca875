import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Minus, Sparkles } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, Price, Segmented, StatusPill, Row } from "@/components/ml/kit";
import { plans, currentSubscription, type PlanKey } from "@/data/monetization";

export const Route = createFileRoute("/plans/")({
  head: () => ({
    meta: [
      { title: "Plans & Pricing | MusicLinkd" },
      {
        name: "description",
        content:
          "Compare Starter, Pro and Business plans for professionals, studios and labels on MusicLinkd.",
      },
      { property: "og:title", content: "Plans & Pricing | MusicLinkd" },
      {
        property: "og:description",
        content: "Starter, Pro and Business plans for music professionals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Plans,
});

const cycles = ["Monthly", "Yearly"] as const;

function Plans() {
  const [cycle, setCycle] = useState<(typeof cycles)[number]>("Monthly");
  const [selected, setSelected] = useState<PlanKey>(currentSubscription.planKey);

  return (
    <Screen>
      <TopBar title="Plans" subtitle="Upgrade when the work does" back="/profile" />
      <div className="space-y-4 px-5 pt-4">
        <Card className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" aria-hidden />
            <h2 className="text-sm">
              You are on {plans.find((p) => p.key === currentSubscription.planKey)?.name}
            </h2>
          </div>
          <p className="text-1 text-muted-foreground">Renews {currentSubscription.renewsOn}</p>
          <Price
            price={{
              amount: currentSubscription.amount,
              unit: currentSubscription.billingCycle === "monthly" ? "month" : "year",
            }}
            tone="inherit"
            amountClassName="text-1 font-semibold"
            unitClassName="text-1"
          />
          <BtnLink to="/plans/manage" variant="outline" className="w-full">
            Manage Subscription
          </BtnLink>
        </Card>

        <Segmented value={cycle} options={cycles} onChange={setCycle} />

        {plans.map((p) => {
          const active = selected === p.key;
          const currentPlan = currentSubscription.planKey === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setSelected(p.key)}
              className="block w-full text-left"
            >
              <Card className={active ? "border-primary" : ""}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-3 leading-tight">{p.name}</h3>
                    <p className="mt-1 text-1 text-muted-foreground">{p.tagline}</p>
                  </div>
                  {p.best ? (
                    <StatusPill label="Most picked" tone="brand" />
                  ) : currentPlan ? (
                    <StatusPill label="Current" tone="good" />
                  ) : null}
                </div>
                <Price
                  price={
                    cycle === "Monthly"
                      ? p.monthly
                      : { amount: p.yearly.amount, unit: p.yearly.unit }
                  }
                  tone="inherit"
                  className="mt-3"
                  amountClassName="text-3 font-bold leading-none"
                  unitClassName="mt-1 text-1"
                />
                {cycle === "Yearly" && p.key !== "free" ? (
                  <p className="mt-1 text-1 font-semibold text-foreground">2 months free</p>
                ) : null}
                <ul className="mt-3 space-y-2">
                  {p.features.map((f) => (
                    <li key={f.label} className="flex items-start gap-2 text-1">
                      {f.included ? (
                        <Check size={16} className="mt-0.5 shrink-0 text-success" aria-hidden />
                      ) : (
                        <Minus
                          size={16}
                          className="mt-0.5 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                      )}
                      <span
                        className={f.included ? "text-muted-foreground" : "text-muted-foreground"}
                      >
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </button>
          );
        })}

        <div className="space-y-2 pb-4">
          {selected !== currentSubscription.planKey ? (
            <BtnLink to="/plans/checkout" search={{ plan: selected }} className="w-full">
              Continue with {plans.find((p) => p.key === selected)?.name}
            </BtnLink>
          ) : (
            <Btn variant="outline" className="w-full">
              This Is Your Current Plan
            </Btn>
          )}
          <Row
            title="Earnings & payouts"
            subtitle="Bookings, services and rentals"
            to="/plans/earnings"
          />
          <Row
            title="Plans & billing help"
            subtitle="Invoices, refunds, fees"
            to="/help/$slug"
            params={{ slug: "pricing-your-first-service" }}
          />
        </div>
      </div>
    </Screen>
  );
}
