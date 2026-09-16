import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, Row, Dialog, Price, StatusPill } from "@/components/ml/kit";
import { plans, currentSubscription, type PlanKey } from "@/data/monetization";

export const Route = createFileRoute("/plans/checkout")({
  validateSearch: (s: Record<string, unknown>): { plan: PlanKey } => ({
    plan: (["free", "pro", "business"] as const).includes(s["plan"] as PlanKey)
      ? (s["plan"] as PlanKey)
      : "pro",
  }),
  head: () => ({
    meta: [
      { title: "Confirm Your Plan | MusicLinkd" },
      {
        name: "description",
        content: "Review your MusicLinkd plan, billing cycle and payment method before confirming.",
      },
      { property: "og:title", content: "Confirm Your Plan | MusicLinkd" },
      { property: "og:description", content: "Review your plan and billing before confirming." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { plan } = Route.useSearch();
  const p = plans.find((x) => x.key === plan)!;
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [state, setState] = useState<"idle" | "processing" | "done" | "failed">("idle");

  return (
    <Screen bottomNav={false}>
      <TopBar title="Confirm plan" subtitle={p.name} back="/plans" />
      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-3 leading-tight">{p.name}</h2>
              <p className="mt-1 text-1 text-muted-foreground">{p.tagline}</p>
            </div>
            {p.best ? <StatusPill label="Most picked" tone="brand" /> : null}
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm">Billing cycle</h2>
          {(["monthly", "yearly"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCycle(c)}
              className={`flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left ${cycle === c ? "border-primary" : "border-border"}`}
            >
              <span className="min-w-0">
                <span className="block text-1 font-semibold capitalize">{c}</span>
                <Price
                  price={c === "monthly" ? p.monthly : p.yearly}
                  tone="inherit"
                  className="text-muted-foreground"
                  amountClassName="text-1"
                  unitClassName="text-1"
                />
              </span>
              <span
                className={`h-4 w-4 shrink-0 rounded-full border-4 ${cycle === c ? "border-primary" : "border-border"}`}
              />
            </button>
          ))}
        </Card>

        <Card className="space-y-2">
          <h2 className="text-sm">Payment method</h2>
          <Row
            title={currentSubscription.method}
            subtitle="Change payment method"
            onClick={() => undefined}
          />
          <p className="text-1 text-muted-foreground">
            Payments are not processed in this design build.
          </p>
        </Card>

        <Card className="space-y-1.5">
          <h2 className="text-sm">Summary</h2>
          <SummaryLine
            label={`${p.name} · ${cycle}`}
            value={cycle === "monthly" ? p.monthly.amount : p.yearly.amount}
          />
          <SummaryLine label="GST (18%)" value="Included" />
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <span className="text-1 font-semibold">Total today</span>
            <span className="text-2 font-bold">
              {cycle === "monthly" ? p.monthly.amount : p.yearly.amount}
            </span>
          </div>
        </Card>

        <Btn
          className="w-full"
          onClick={() => {
            setState("processing");
            setTimeout(() => setState("done"), 900);
          }}
        >
          {state === "processing" ? "Processing…" : `Confirm ${p.name}`}
        </Btn>
        <p className="text-center text-1 text-muted-foreground">
          Cancel any time. Your plan stays active until the end of the paid period.
        </p>
      </div>

      <Dialog
        open={state === "done"}
        title={`${p.name} is active`}
        body="Your new limits and boosts are available immediately."
        onClose={() => setState("idle")}
      >
        <BtnLink to="/plans/manage" className="w-full">
          Manage Subscription
        </BtnLink>
        <BtnLink to="/profile" variant="outline" className="w-full">
          Back to Profile
        </BtnLink>
      </Dialog>
      <Dialog
        open={state === "failed"}
        title="Payment could not be completed"
        body="No money was taken. Try another method or retry in a minute."
        onClose={() => setState("idle")}
      >
        <Btn onClick={() => setState("idle")}>Try Again</Btn>
      </Dialog>
    </Screen>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-1">
      <span className="min-w-0 truncate text-muted-foreground">{label}</span>
      <span className="shrink-0 font-semibold">{value}</span>
    </div>
  );
}
