import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TopBar } from "@/components/ml/ui";
import { AddOnCard, PriceBreakdownCard, StepDots, StickyBar } from "@/components/ml/booking";
import { CalendarGate, useBookingDraft } from "@/components/ml/booking-context";
import { inr } from "@/data/booking";

export const Route = createFileRoute("/booking/$id/addons")({
  head: () => ({
    meta: [
      { title: "Equipment & add-ons — MusicLinkd booking" },
      {
        name: "description",
        content:
          "Add an engineer, a drum kit, extra mics or a marketplace rental to your session and watch the price update.",
      },
      { property: "og:title", content: "Equipment & add-ons — MusicLinkd booking" },
      { property: "og:description", content: "Engineers, backline and rentals for your session." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AddOnsStep,
});

function AddOnsStep() {
  return (
    <CalendarGate>
      <AddOns />
    </CalendarGate>
  );
}

function AddOns() {
  const { bookable: b, draft, toggleAddOn, price } = useBookingDraft();
  const navigate = useNavigate();

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-app bg-background pb-32">
      <TopBar title="Equipment & add-ons" subtitle="Optional" back={`/booking/${b.id}/details`} />
      <main className="px-5 pt-4">
        <StepDots step={4} total={5} />
        <p className="mt-3 text-sm text-muted-foreground">
          House gear is already included. Add-ons are confirmed with the provider.
        </p>

        <div className="mt-4 space-y-3">
          {b.addOns.map((a) => (
            <AddOnCard
              key={a.id}
              a={a}
              selected={draft.addOnIds.includes(a.id)}
              onToggle={() => toggleAddOn(a.id)}
            />
          ))}
        </div>

        <h2 className="mt-7 text-2">Running total</h2>
        <div className="mt-3">
          <PriceBreakdownCard p={price} />
        </div>
      </main>

      <StickyBar
        price={inr(price.total)}
        hint={`${draft.addOnIds.length} add-on${draft.addOnIds.length === 1 ? "" : "s"}`}
        primaryLabel="Review booking"
        onPrimary={() => navigate({ to: "/booking/$id/review", params: { id: b.id } })}
      />
    </div>
  );
}
