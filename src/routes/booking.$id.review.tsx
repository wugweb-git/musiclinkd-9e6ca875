import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TopBar, Btn } from "@/components/ml/ui";
import {
  AcknowledgeRow,
  BookingSummaryCard,
  Detail,
  PolicyCard,
  PriceBreakdownCard,
  StepDots,
  StickyBar,
} from "@/components/ml/booking";
import { useBookingDraft } from "@/components/ml/booking-context";
import { inr } from "@/data/booking";

export const Route = createFileRoute("/booking/$id/review")({
  head: () => ({
    meta: [
      { title: "Review your booking — MusicLinkd" },
      {
        name: "description",
        content:
          "Everything in one place before you commit: room, date, time, add-ons, full price and the provider's terms.",
      },
      { property: "og:title", content: "Review your booking — MusicLinkd" },
      { property: "og:description", content: "Room, date, price and policies before you confirm." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Review,
});

function Review() {
  const { bookable: b, resource: r, draft, price, endTime } = useBookingDraft();
  const navigate = useNavigate();
  const [ack, setAck] = useState(false);
  const instant = r.model === "instant";
  const ready = Boolean(draft.date && draft.start) && ack;

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-background pb-36">
      <TopBar title="Review booking" subtitle={b.name} back={`/booking/${b.id}/addons`} />
      <main className="px-5 pt-4">
        <StepDots step={5} total={5} />

        {!draft.date || !draft.start ? (
          <div className="mt-4 rounded-3xl border border-border bg-card p-5 text-center">
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
                r={r}
                date={draft.date}
                start={draft.start}
                end={endTime}
                people={draft.people}
              />
            </div>

            <section className="mt-5 rounded-3xl border border-border bg-card p-4">
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <Detail label="Duration" value={`${draft.hours} hr${draft.hours > 1 ? "s" : ""}`} />
                <Detail label="Purpose" value={draft.purpose || "Not specified"} />
                <Detail label="Project" value={draft.notes || "—"} />
                <Detail
                  label="Add-ons"
                  value={draft.addOnIds.length ? `${draft.addOnIds.length} added` : "None"}
                />
              </dl>
              {draft.requirements ? (
                <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                  {draft.requirements}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => navigate({ to: "/booking/$id/details", params: { id: b.id } })}
                className="mt-3 min-h-11 text-xs font-bold text-primary"
              >
                Edit details
              </button>
            </section>

            <h2 className="mt-6 text-[17px]">Price</h2>
            <div className="mt-3">
              <PriceBreakdownCard p={price} />
            </div>

            <h2 className="mt-6 text-[17px]">Provider terms</h2>
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
                label={`I've read ${b.name}'s cancellation, deposit and overtime terms.`}
              />
            </div>
          </>
        )}
      </main>

      <StickyBar
        price={inr(price.total)}
        hint={price.deposit ? `${inr(price.deposit)} deposit due now` : "No deposit required"}
        disabled={!ready}
        primaryLabel={instant ? "Confirm booking" : "Request booking"}
        onPrimary={() =>
          navigate(
            price.deposit > 0
              ? { to: "/booking/$id/pay", params: { id: b.id } }
              : {
                  to: "/booking/confirmed/$ref",
                  params: { ref: instant ? "MLB-NEW-C" : "MLB-NEW-R" },
                },
          )
        }
      />
    </div>
  );
}
