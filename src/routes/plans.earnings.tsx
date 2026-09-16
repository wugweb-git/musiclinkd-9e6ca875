import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, Row, StatusPill } from "@/components/ml/kit";
import { earnings, payoutAccount } from "@/data/monetization";

export const Route = createFileRoute("/plans/earnings")({
  head: () => ({
    meta: [
      { title: "Earnings & Payouts | MusicLinkd" },
      {
        name: "description",
        content:
          "Track earnings from bookings, services and rentals, and manage your payout account.",
      },
      { property: "og:title", content: "Earnings & Payouts | MusicLinkd" },
      { property: "og:description", content: "Earnings from bookings, services and rentals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Earnings,
});

function Earnings() {
  return (
    <Screen>
      <TopBar title="Earnings" subtitle={earnings.range} back="/plans/manage" />
      <div className="space-y-4 px-5 pt-4">
        <Card>
          <p className="text-0 font-bold uppercase tracking-wide text-muted-foreground">
            Net earnings
          </p>
          <p className="mt-1 text-4 font-bold leading-none">{earnings.net}</p>
          <p className="mt-2 text-1 text-muted-foreground">{earnings.fees}</p>
          <div className="mt-4 space-y-2">
            {earnings.lines.map((l) => (
              <div
                key={l.label}
                className="flex items-center justify-between rounded-lg bg-subtle px-4 py-3"
              >
                <span className="text-1 font-semibold">{l.label}</span>
                <span className="text-1 font-bold">{l.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm">Payout account</h2>
              <p className="mt-1 truncate text-1 text-muted-foreground">{payoutAccount.label}</p>
            </div>
            <StatusPill
              label={
                payoutAccount.state === "verified"
                  ? "Verified"
                  : payoutAccount.state === "pending"
                    ? "Pending"
                    : "Missing"
              }
              tone={payoutAccount.state === "verified" ? "good" : "warn"}
            />
          </div>
          <p className="text-1 text-muted-foreground">
            Next payout {payoutAccount.nextPayout} · {payoutAccount.pending}
          </p>
          <Btn variant="outline" className="w-full">
            Change Payout Account
          </Btn>
        </Card>

        <div className="space-y-2 pb-4">
          <Row title="Bookings" subtitle="Where most earnings come from" to="/bookings" />
          <Row title="Marketplace orders" subtitle="Sales and rentals" to="/marketplace" />
          <Row title="Plans & billing" subtitle="Invoices and plan changes" to="/plans/manage" />
          <BtnLink
            to="/help/$slug"
            params={{ slug: "pricing-your-first-service" }}
            variant="ghost"
            className="w-full"
          >
            How Pricing and Fees Work
          </BtnLink>
        </div>
      </div>
    </Screen>
  );
}
