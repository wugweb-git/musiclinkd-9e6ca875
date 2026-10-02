import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Screen, Btn, Sheet, TopBar } from "@/components/ml/ui";
import { StepDots, StickyBar } from "@/components/ml/booking";
import { ServiceCard } from "@/components/ml/profile";
import { serviceItem } from "@/lib/service-item";
import { useBookingDraft } from "@/components/ml/booking-context";
import { requestBooking } from "@/lib/bookings.functions";
import { useAuth } from "@/hooks/use-auth";
import { earliestBookingDate } from "@/lib/bookable-slots";

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
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [hours, setHours] = useState("3");
  const [people, setPeople] = useState("2");
  const [notes, setNotes] = useState("");

  // A studio with no availability calendar is asked directly: the date you want, and what for.
  const noCalendar = b.hasCalendar === false;
  // Without services of its own, a studio is booked as a general session.
  const serviceChoices = b.services?.length
    ? b.services
    : [{ id: "session", name: "Studio session", price_paise: null, price_unit: null, uses: [] }];

  const request = useMutation({
    mutationFn: () =>
      send({
        data: {
          studioSlug: b.id,
          ...(/^[0-9a-f-]{36}$/i.test(draft.resourceId) ? { roomId: draft.resourceId } : {}),
          date,
          ...(start ? { startTime: start } : {}),
          ...(Number(hours) ? { hours: Number(hours) } : {}),
          ...(Number(people) ? { people: Number(people) } : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
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
                set({ purpose: sv.name });
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

      <Sheet open={ask} onClose={() => setAsk(false)} title="Request a session">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (date && !request.isPending) request.mutate();
          }}
        >
          <label className="block text-1 font-semibold" htmlFor="booking-date">
            Date
          </label>
          <input
            id="booking-date"
            type="date"
            min={earliestBookingDate()}
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="min-h-control w-full rounded-lg border border-border bg-card px-4 text-sm outline-none"
          />
          <div className="flex gap-3">
            <span className="flex-1">
              <label className="block text-1 font-semibold" htmlFor="booking-start">
                Start
              </label>
              <input
                id="booking-start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="mt-1 min-h-control w-full rounded-lg border border-border bg-card px-4 text-sm outline-none"
              />
            </span>
            <span className="w-24">
              <label className="block text-1 font-semibold" htmlFor="booking-hours">
                Hours
              </label>
              <input
                id="booking-hours"
                type="number"
                min={1}
                max={24}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="mt-1 min-h-control w-full rounded-lg border border-border bg-card px-4 text-sm outline-none"
              />
            </span>
            <span className="w-24">
              <label className="block text-1 font-semibold" htmlFor="booking-people">
                People
              </label>
              <input
                id="booking-people"
                type="number"
                min={1}
                max={200}
                value={people}
                onChange={(e) => setPeople(e.target.value)}
                className="mt-1 min-h-control w-full rounded-lg border border-border bg-card px-4 text-sm outline-none"
              />
            </span>
          </div>
          <label className="block text-1 font-semibold" htmlFor="booking-notes">
            Anything they should know
          </label>
          <textarea
            id="booking-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What you are recording, gear you need, who is coming."
            className="w-full resize-none rounded-lg border border-border bg-card p-4 text-sm outline-none"
          />
          <Btn type="submit" className="w-full" disabled={!date} loading={request.isPending}>
            Send request
          </Btn>
          <p className="text-1 text-muted-foreground">
            Nothing is charged here. The studio replies, and you settle payment with them.
          </p>
        </form>
      </Sheet>
    </Screen>
  );
}
