import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, EmptyState, StatusPill } from "@/components/ml/kit";

export const Route = createFileRoute("/services/conflicts")({
  head: () => ({
    meta: [
      { title: "Booking conflicts | MusicLinkd" },
      {
        name: "description",
        content:
          "Double bookings and overlaps across your services, with the quickest way to resolve each one.",
      },
      { property: "og:title", content: "Booking conflicts | MusicLinkd" },
      { property: "og:description", content: "Overlapping sessions and how to resolve them." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Conflicts,
});

const conflicts = [
  {
    id: "cf-1",
    day: "Thursday 18 Sep",
    kind: "Double booking",
    detail: "Vocal session 14:00–17:00 overlaps a mixing block 15:00–19:00.",
    tone: "bad" as const,
  },
  {
    id: "cf-2",
    day: "Saturday 20 Sep",
    kind: "Outside your hours",
    detail: "A request came in for 23:00, past your weekend cut-off of 22:00.",
    tone: "warn" as const,
  },
  {
    id: "cf-3",
    day: "Sunday 21 Sep",
    kind: "No availability",
    detail: "Two enquiries landed on a day you have marked as time off.",
    tone: "neutral" as const,
  },
];

function Conflicts() {
  return (
    <Screen>
      <TopBar
        title="Conflicts"
        subtitle="Overlaps across your services"
        back="/services/availability"
      />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card>
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-subtle text-foreground">
              <AlertTriangle size={20} />
            </span>
            <p className="text-1 text-muted-foreground">
              Conflicts do not cancel anything on their own. Nothing changes until you pick an
              option below.
            </p>
          </div>
        </Card>

        {conflicts.length ? (
          <div className="space-y-3">
            {conflicts.map((c) => (
              <Card key={c.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{c.day}</p>
                    <p className="mt-1 text-1 text-muted-foreground">{c.detail}</p>
                  </div>
                  <StatusPill label={c.kind} tone={c.tone} />
                </div>
                <div className="mt-3 flex gap-2">
                  <Btn variant="outline" className="flex-1">
                    Offer Another Time
                  </Btn>
                  <Btn variant="ghost" className="flex-1">
                    Keep Both
                  </Btn>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No conflicts" body="Your calendar is clean for the next four weeks." />
        )}

        <BtnLink to="/services/availability" variant="outline" className="w-full">
          <CalendarClock size={16} className="mr-2 inline" aria-hidden />
          Adjust Availability
        </BtnLink>
      </div>
    </Screen>
  );
}
