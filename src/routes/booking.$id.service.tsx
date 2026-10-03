import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/ml/ui";
import {
  RequestSessionSheet,
  StepDots,
  StickyBar,
  type SessionRequest,
} from "@/components/ml/booking";
import { ServiceCard } from "@/components/ml/profile";
import { serviceItem } from "@/lib/service-item";
import { useBookingDraft } from "@/components/ml/booking-context";
import { requestBooking } from "@/lib/bookings.functions";
import { useAuth } from "@/hooks/use-auth";

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
  const { signedIn } = useAuth();
  const send = useServerFn(requestBooking);
  const [ask, setAsk] = useState(false);

  // A studio with no availability calendar is asked directly: the date you want, and what for.
  const noCalendar = b.hasCalendar === false;
  // Without services of its own, a studio is booked as a general session.
  const serviceChoices = b.services?.length
    ? b.services
    : [{ id: "session", name: "Studio session", price_paise: null, price_unit: null, uses: [] }];

  const request = useMutation({
    mutationFn: (r: SessionRequest) =>
      send({
        data: {
          studioSlug: b.id,
          ...(draft.serviceId ? { serviceId: draft.serviceId } : {}),
          ...(/^[0-9a-f-]{36}$/i.test(draft.resourceId) ? { roomId: draft.resourceId } : {}),
          date: r.date,
          ...(r.start ? { startTime: r.start } : {}),
          ...(r.hours ? { hours: r.hours } : {}),
          ...(r.people ? { people: r.people } : {}),
          ...(r.notes ? { notes: r.notes } : {}),
          ...(draft.purpose ? { purpose: draft.purpose } : {}),
        },
      }),
    onSuccess: ({ id }) => {
      setAsk(false);
      void navigate({ to: "/booking/confirmed/$ref", params: { ref: id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't send. Try again."),
  });

  return (
    <Screen className="pb-nav-clear">
      <TopBar title="What do you want to book?" subtitle={b.name} back={`/booking/${b.id}`} />
      <main className="px-5 pt-4">
        <StepDots step={1} total={5} />
        <p className="mt-3 text-sm text-muted-foreground">
          Pick a service. Next you choose a date and time.
        </p>
        {/* The studio's services; its rooms stay behind the scenes and set the calendar. */}
        <div className="mt-4 space-y-3">
          {serviceChoices.map((sv) => (
            <ServiceCard
              key={sv.id}
              s={serviceItem(sv)}
              selected={draft.purpose === sv.name}
              onBook={() => {
                set({ purpose: sv.name, serviceId: sv.id === "session" ? undefined : sv.id });
                if (noCalendar) {
                  if (signedIn) setAsk(true);
                  else void navigate({ to: "/welcome" });
                } else {
                  void navigate({ to: "/booking/$id/schedule", params: { id: b.id } });
                }
              }}
            />
          ))}
        </div>
      </main>

      <StickyBar
        // A studio with a calendar is checked date by date; one without is asked directly.
        hint={
          !draft.purpose
            ? "Pick a service to continue"
            : noCalendar
              ? "The studio replies with what it can do"
              : "Next: date and time"
        }
        primaryLabel={noCalendar ? "Request a session" : "Choose Date & Time"}
        disabled={!draft.purpose}
        onPrimary={() =>
          noCalendar
            ? signedIn
              ? setAsk(true)
              : void navigate({ to: "/welcome" })
            : void navigate({ to: "/booking/$id/schedule", params: { id: b.id } })
        }
      />

      <RequestSessionSheet
        open={ask}
        onClose={() => setAsk(false)}
        onSend={(r) => request.mutate(r)}
        pending={request.isPending}
        who="The studio"
      />
    </Screen>
  );
}
