import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, EmptyState, SegmentedField } from "@/components/ml/kit";
import { businessView, loadBusiness } from "@/lib/business-view";
import { bookingWindows } from "@/data/services";

export const Route = createFileRoute("/business/$id/availability")({
  loader: ({ params }) => loadBusiness(params.id),
  head: () => ({
    meta: [
      { title: "Business availability | MusicLinkd" },
      {
        name: "description",
        content:
          "Set opening hours, notice period and blackout dates so the calendar only shows real slots.",
      },
      { property: "og:title", content: "Business availability | MusicLinkd" },
      { property: "og:description", content: "Opening hours, notice period and blackout dates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessAvailability,
});

function BusinessAvailability() {
  const b = businessView(Route.useLoaderData());
  const [notice, setNotice] = useState(bookingWindows[1] ?? "24 hours notice");
  const [saved, setSaved] = useState(false);

  if (!b) {
    return (
      <Screen>
        <TopBar title="Availability" back="/business" />
        <div className="px-5 pt-6">
          <EmptyState
            title="Business not found"
            body="This business may have been removed or you no longer have access to it."
          />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Availability" subtitle={b.name} back={`/business/${b.id}/services`} />

      <div className="space-y-4 px-5 pt-4 pb-8">
        {b.hours.length ? (
          <Card>
            <p className="text-sm font-semibold">Opening hours</p>
            <div className="mt-3 space-y-2">
              {b.hours.map((h) => (
                <div
                  key={`${h.day}${h.hours}`}
                  className="flex items-center justify-between text-1"
                >
                  <span className="font-semibold">{h.day}</span>
                  <span className="text-muted-foreground">{h.hours}</span>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        <Card>
          <p className="text-sm font-semibold">How much notice do you need?</p>
          <div className="mt-3">
            <SegmentedField
              label="How much notice do you need?"
              value={notice}
              options={bookingWindows}
              onChange={setNotice}
            />
          </div>
        </Card>

        <Card>
          <p className="text-sm font-semibold">Blackout dates</p>
          <p className="mt-1 text-1 text-muted-foreground">
            Days the rooms are closed, whatever the calendar says.
          </p>
          {/* Blackout dates are not stored yet. */}
          <Btn variant="outline" className="mt-3 w-full">
            Add blackout dates
          </Btn>
        </Card>

        <Btn className="w-full" onClick={() => setSaved(true)}>
          {saved ? "Availability saved" : "Save availability"}
        </Btn>
      </div>
    </Screen>
  );
}
