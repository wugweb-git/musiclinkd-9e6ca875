import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn, Chip } from "@/components/ml/ui";
import { Card, EmptyState } from "@/components/ml/kit";
import { getBusiness } from "@/data/business";
import { bookingWindows, timeOff } from "@/data/services";

export const Route = createFileRoute("/business/$id/availability")({
  head: () => ({
    meta: [
      { title: "Business availability | MusicLinkd" },
      { name: "description", content: "Set opening hours, notice period and blackout dates so the calendar only shows real slots." },
      { property: "og:title", content: "Business availability | MusicLinkd" },
      { property: "og:description", content: "Opening hours, notice period and blackout dates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessAvailability,
});

function BusinessAvailability() {
  const { id } = Route.useParams();
  const b = getBusiness(id);
  const [notice, setNotice] = useState(bookingWindows[1] ?? "24 hours notice");
  const [saved, setSaved] = useState(false);

  if (!b) {
    return (
      <Screen>
        <TopBar title="Availability" back="/business" />
        <div className="px-5 pt-6">
          <EmptyState title="Business not found" body="This business may have been removed or you no longer have access to it." />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Availability" subtitle={b.name} back={`/business/${b.id}/services`} />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card>
          <p className="text-sm font-semibold">Opening hours</p>
          <div className="mt-3 space-y-2">
            {b.hours.map((h) => (
              <div key={h.day} className="flex items-center justify-between text-[13px]">
                <span className="font-semibold">{h.day}</span>
                <span className="text-muted-foreground">{h.hours}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-semibold">How much notice do you need?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {bookingWindows.map((w) => (
              <Chip key={w} active={notice === w} onClick={() => setNotice(w)}>
                {w}
              </Chip>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-semibold">Blackout dates</p>
          <p className="mt-1 text-[13px] text-muted-foreground">Days the rooms are closed, whatever the calendar says.</p>
          <div className="mt-3 space-y-2">
            {timeOff.map((t) => (
              <div key={t.label} className="flex items-center justify-between rounded-[16px] border border-border px-3 py-2 text-[13px]">
                <span className="font-semibold">{t.label}</span>
                <span className="text-muted-foreground">{t.range}</span>
              </div>
            ))}
          </div>
          <Btn variant="outline" className="mt-3 w-full">Add blackout dates</Btn>
        </Card>

        <Btn className="w-full" onClick={() => setSaved(true)}>
          {saved ? "Availability saved" : "Save availability"}
        </Btn>
      </div>
    </Screen>
  );
}
