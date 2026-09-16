import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn, BtnLink, Sheet } from "@/components/ml/ui";
import { Card, Row, StatusPill, Meter, Dialog, Price } from "@/components/ml/kit";
import {
  plans,
  currentSubscription,
  entitlements,
  invoices,
  boosts,
  cancelReasons,
} from "@/data/monetization";

export const Route = createFileRoute("/plans/manage")({
  head: () => ({
    meta: [
      { title: "Manage Subscription | MusicLinkd" },
      {
        name: "description",
        content: "Manage your MusicLinkd plan, usage limits, boosts and invoices.",
      },
      { property: "og:title", content: "Manage Subscription | MusicLinkd" },
      { property: "og:description", content: "Plan, usage limits, boosts and invoices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManagePlan,
});

function ManagePlan() {
  const plan = plans.find((p) => p.key === currentSubscription.planKey)!;
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  return (
    <Screen>
      <TopBar title="Subscription" subtitle={plan.name} back="/plans" />
      <div className="space-y-4 px-5 pt-4">
        <Card className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[19px] leading-tight">{plan.name}</h2>
              <Price
                price={{
                  amount: currentSubscription.amount,
                  unit: currentSubscription.billingCycle === "monthly" ? "month" : "year",
                }}
                tone="inherit"
                className="mt-1"
                amountClassName="text-[12px] font-semibold"
                unitClassName="text-[11px]"
              />
              <p className="text-[12px] text-muted-foreground">
                Renews {currentSubscription.renewsOn}
              </p>
            </div>
            <StatusPill
              label={currentSubscription.status === "active" ? "Active" : "Past due"}
              tone={currentSubscription.status === "active" ? "good" : "bad"}
            />
          </div>
          <p className="text-[12px] text-muted-foreground">
            Paid with {currentSubscription.method}
          </p>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-[15px]">What you are using</h2>
          {entitlements.map((e) => (
            <Meter
              key={e.label}
              label={e.label}
              value={e.used}
              max={e.limit ?? Math.max(e.used, 1)}
              hint={e.hint}
            />
          ))}
        </Card>

        <Card className="space-y-2">
          <h2 className="text-[15px]">Boosts</h2>
          {boosts.map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-lg bg-subtle px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">{b.target}</p>
                <p className="truncate text-[12px] text-muted-foreground">{b.detail}</p>
              </div>
              <StatusPill
                label={b.state === "active" ? "Running" : "Available"}
                tone={b.state === "active" ? "good" : "neutral"}
              />
            </div>
          ))}
        </Card>

        <Card className="space-y-2">
          <h2 className="text-[15px]">Invoices</h2>
          {invoices.map((i) => (
            <div
              key={i.id}
              className="flex items-center gap-3 border-b border-border py-2.5 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">{i.plan}</p>
                <p className="truncate text-[12px] text-muted-foreground">
                  {i.date} · {i.id}
                </p>
              </div>
              <span className="shrink-0 text-[13px] font-semibold">{i.amount}</span>
              <StatusPill
                label={i.status === "paid" ? "Paid" : "Refunded"}
                tone={i.status === "paid" ? "good" : "warn"}
              />
            </div>
          ))}
        </Card>

        <div className="space-y-2 pb-4">
          <Row
            title="Earnings & payouts"
            subtitle="Bookings, services and rentals"
            to="/plans/earnings"
          />
          <BtnLink to="/plans" variant="outline" className="w-full">
            Change plan
          </BtnLink>
          <Btn variant="ghost" className="w-full" onClick={() => setCancelOpen(true)}>
            Cancel subscription
          </Btn>
        </div>
      </div>

      <Sheet open={cancelOpen} onClose={() => setCancelOpen(false)} title="Why are you cancelling?">
        <div className="space-y-2">
          {cancelReasons.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setCancelOpen(false);
                setCancelled(true);
              }}
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-left text-[13px] font-semibold"
            >
              {r}
            </button>
          ))}
        </div>
      </Sheet>

      <Dialog
        open={cancelled}
        title="Subscription cancelled"
        body={`${plan.name} stays active until ${currentSubscription.renewsOn}. After that you move to Starter and keep your profile and portfolio.`}
        onClose={() => setCancelled(false)}
      >
        <Btn onClick={() => setCancelled(false)}>Got it</Btn>
      </Dialog>
    </Screen>
  );
}
