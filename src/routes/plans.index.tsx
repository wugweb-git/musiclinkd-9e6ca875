import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, Price, Row } from "@/components/ml/kit";
import { PricingTableOne } from "@/components/billingsdk/pricing-table-one";
import type { Plan as BillingPlan } from "@/lib/billingsdk-config";
import { plans, currentSubscription, type PlanKey } from "@/data/monetization";

/** Our plans in the shape billingsdk's table reads: plain amounts, the currency beside them. */
const billingPlans: BillingPlan[] = plans.map((p) => ({
  id: p.key,
  title: p.name,
  description: p.tagline,
  currency: "₹",
  monthlyPrice: p.monthly.amount.replace(/[^\d.]/g, "") || "0",
  yearlyPrice: p.yearly.amount.replace(/[^\d.]/g, "") || "0",
  buttonText:
    p.key === currentSubscription.planKey ? "Your current plan" : `Continue with ${p.name}`,
  ...(p.best ? { highlight: true, badge: "Most picked" } : {}),
  // Only what the plan includes: a feature it does not have is left out, not listed with a dash.
  features: p.features
    .filter((f) => f.included)
    .map((f) => ({ name: f.label, icon: "check" as const })),
}));

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

function Plans() {
  const navigate = useNavigate();

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

        {/*
         * The tiers come from billingsdk's pricing table: it carries the monthly/annual switch and
         * the saving calculation, so the screen no longer hand-rolls either. Only plans the person
         * can move to show a button; the one they are on says so.
         */}
        <PricingTableOne
          plans={billingPlans}
          theme="minimal"
          size="small"
          className="-mx-5"
          onPlanSelect={(planId) => {
            // The plan you are already on has nothing to check out.
            if (planId === currentSubscription.planKey) return;
            void navigate({ to: "/plans/checkout", search: { plan: planId as PlanKey } });
          }}
        />

        <div className="space-y-2 pb-4">
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
