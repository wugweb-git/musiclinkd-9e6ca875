import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TopBar } from "@/components/ml/ui";
import { ResourceCard, StepDots, StickyBar } from "@/components/ml/booking";
import { useBookingDraft } from "@/components/ml/booking-context";

export const Route = createFileRoute("/booking/$id/service")({
  head: () => ({
    meta: [
      { title: "Choose a room or service — MusicLinkd booking" },
      {
        name: "description",
        content:
          "Pick the room, booth or service you want to book, with capacity, gear and rates side by side.",
      },
      { property: "og:title", content: "Choose a room or service — MusicLinkd booking" },
      {
        property: "og:description",
        content: "Capacity, equipment and rates for every bookable room.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SelectService,
});

function SelectService() {
  const { bookable: b, draft, set } = useBookingDraft();
  const navigate = useNavigate();

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-background pb-32">
      <TopBar title="Select a space" subtitle={b.name} back={`/booking/${b.id}`} />
      <main className="px-5 pt-4">
        <StepDots step={1} total={5} />
        <p className="mt-3 text-sm text-muted-foreground">
          Each room has its own availability, rates and duration options.
        </p>
        <div className="mt-4 space-y-3">
          {b.resources.map((r) => (
            <ResourceCard
              key={r.id}
              r={r}
              selected={draft.resourceId === r.id}
              onSelect={() => set({ resourceId: r.id, date: undefined, start: undefined })}
            />
          ))}
        </div>
      </main>

      <StickyBar
        // Database studios have no availability calendar yet, so dates cannot be checked.
        hint={b.hasCalendar === false ? undefined : "Availability is checked per room"}
        disabled={b.hasCalendar === false}
        primaryLabel="Check dates"
        onPrimary={() => navigate({ to: "/booking/$id/schedule", params: { id: b.id } })}
      />
    </div>
  );
}
