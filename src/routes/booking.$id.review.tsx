import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import {
  AcknowledgeRow,
  BookingSummaryCard,
  Detail,
  PolicyCard,
  PriceBreakdownCard,
  StepDots,
  StickyBar,
} from "@/components/ml/booking";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarGate, useBookingDraft } from "@/components/ml/booking-context";
import { requestBooking } from "@/lib/bookings.functions";
import { useAuth } from "@/hooks/use-auth";
import { inr } from "@/lib/price";

export const Route = createFileRoute("/booking/$id/review")({
  head: () => ({
    meta: [
      { title: "Review your booking — MusicLinkd" },
      {
        name: "description",
        content:
          "Everything in one place before you commit: date, time, add-ons, full price and the provider's terms.",
      },
      { property: "og:title", content: "Review your booking — MusicLinkd" },
      { property: "og:description", content: "Date, price and policies before you confirm." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReviewStep,
});

function ReviewStep() {
  return (
    <CalendarGate>
      <Review />
    </CalendarGate>
  );
}

function Review() {
  const { bookable: b, draft, price, endTime } = useBookingDraft();
  const navigate = useNavigate();
  const { signedIn } = useAuth();
  const send = useServerFn(requestBooking);

  // The request is the booking: the studio answers it, and the two of them settle payment.
  const ask = useMutation({
    mutationFn: () =>
      send({
        data: {
          studioSlug: b.id,
          ...(draft.serviceId ? { serviceId: draft.serviceId } : {}),
          date: draft.date ?? "",
          ...(draft.start ? { startTime: draft.start } : {}),
          ...(endTime ? { endTime } : {}),
          hours: draft.hours,
          people: draft.people,
          ...(draft.purpose ? { purpose: draft.purpose } : {}),
          ...(draft.notes ? { notes: draft.notes } : {}),
        },
      }),
    onSuccess: ({ id }) => void navigate({ to: "/booking/confirmed/$ref", params: { ref: id } }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't send. Try again."),
  });
  const [ack, setAck] = useState(false);
  const ready = Boolean(draft.date && draft.start) && ack;

  return (
    <Screen className="pb-nav-clear">
      <TopBar title="Review booking" subtitle={b.name} back={`/booking/${b.id}/addons`} />
      <main className="px-5 pt-4">
        <StepDots step={5} total={5} />

        {!draft.date || !draft.start ? (
          <div className="mt-4 rounded-lg bg-subtle p-5 text-center">
            <p className="font-semibold">Pick a date and time first</p>
            <Btn
              className="mt-3 w-full"
              onClick={() => navigate({ to: "/booking/$id/schedule", params: { id: b.id } })}
            >
              Choose a slot
            </Btn>
          </div>
        ) : (
          <>
            <div className="mt-4">
              <BookingSummaryCard
                b={b}
                date={draft.date}
                start={draft.start}
                end={endTime}
                people={draft.people}
                service={draft.purpose}
              />
            </div>

            <section className="mt-5 rounded-lg bg-subtle p-4">
              <dl className="grid grid-cols-2 gap-3 text-1">
                <Detail label="Duration" value={`${draft.hours} hr${draft.hours > 1 ? "s" : ""}`} />
                <Detail label="Purpose" value={draft.purpose || "Not specified"} />
                <Detail label="Project" value={draft.notes || "—"} />
                <Detail
                  label="Add-ons"
                  value={draft.addOnIds.length ? `${draft.addOnIds.length} added` : "None"}
                />
              </dl>
              {draft.requirements ? (
                <p className="mt-3 border-t border-border pt-3 text-1 text-muted-foreground">
                  {draft.requirements}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => navigate({ to: "/booking/$id/details", params: { id: b.id } })}
                className="mt-3 min-h-touch text-1 font-bold text-foreground"
              >
                Edit details
              </button>
            </section>

            {/* A service with no price quotes nothing; the business names it in its reply. */}
            {price ? (
              <>
                <h2 className="mt-6 text-2">Price</h2>
                <div className="mt-3">
                  <PriceBreakdownCard p={price} />
                </div>
              </>
            ) : null}

            <h2 className="mt-6 text-2">Provider terms</h2>
            <div className="mt-3 space-y-2">
              {b.policies.map((p) => (
                <PolicyCard
                  key={p.title}
                  title={p.title}
                  body={p.body}
                  critical={p.critical ?? false}
                />
              ))}
            </div>

            <div className="mt-3">
              <AcknowledgeRow
                checked={ack}
                onChange={setAck}
                label={`I've read ${b.name}'s cancellation and overtime terms.`}
              />
            </div>
          </>
        )}
      </main>

      <StickyBar
        price={price ? inr(price.total) : undefined}
        disabled={!ready || ask.isPending || !signedIn}
        primaryLabel={signedIn ? "Request booking" : "Sign in to request"}
        // Bookings end at Confirmed: payment happens between the two people, off MusicLinkd.
        onPrimary={() => (signedIn ? ask.mutate() : void navigate({ to: "/welcome" }))}
      />
    </Screen>
  );
}
