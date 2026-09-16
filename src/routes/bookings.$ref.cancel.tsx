import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { Detail, EmptyState, PolicyCard, StickyBar } from "@/components/ml/booking";
import { formatDate, formatTime, getBookable, getBooking, getResource } from "@/data/booking";

export const Route = createFileRoute("/bookings/$ref/cancel")({
  head: () => ({
    meta: [
      { title: "Cancel booking — MusicLinkd" },
      {
        name: "description",
        content:
          "Review the provider's cancellation policy before cancelling your session.",
      },
      { property: "og:title", content: "Cancel booking — MusicLinkd" },
      { property: "og:description", content: "Policy and confirmation before cancelling." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Cancel,
});

const reasons = [
  "Schedule changed",
  "Found another space",
  "Session postponed",
  "Budget changed",
  "Booked by mistake",
  "Other",
];

function Cancel() {
  const { ref } = Route.useParams();
  const bk = getBooking(ref);
  const b = getBookable(bk?.bookableId ?? "");
  const r = getResource(b, bk?.resourceId);
  const [reason, setReason] = useState<string | undefined>(undefined);
  const [done, setDone] = useState(false);

  if (!bk || !b || !r) {
    return (
      <Screen>
        <TopBar title="Cancel booking" back="/bookings" />
        <div className="px-5 pt-4">
          <EmptyState title="Booking not found" body="This booking can no longer be cancelled." />
        </div>
      </Screen>
    );
  }

  if (done) {
    return (
      <Screen>
        <TopBar title="Cancelled" back="/bookings" />
        <main className="px-5 pt-6">
          <div className="rounded-lg bg-subtle p-5">
            <p className="font-semibold">Booking cancelled</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {b.name} has been notified.
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-1">
              <Detail label="Reference" value={bk.ref} />
            </dl>
            <BtnLink to="/bookings" className="mt-4 w-full">
              Back to Bookings
            </BtnLink>
          </div>
        </main>
      </Screen>
    );
  }

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-app bg-background pb-32">
      <TopBar title="Cancel booking" subtitle={`#${bk.ref}`} back={`/bookings/${bk.ref}`} />
      <main className="px-5 pt-4">
        <div className="rounded-lg bg-subtle p-4">
          <p className="font-semibold">{b.name}</p>
          <p className="text-1 text-muted-foreground">{r.name}</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-1">
            <Detail label="Date" value={formatDate(bk.date)} />
            <Detail label="Time" value={`${formatTime(bk.start)} – ${formatTime(bk.end)}`} />
          </dl>
        </div>

        <div className="mt-3">
          <PolicyCard
            title="Cancellation policy"
            body="MusicLinkd takes no payment. Settle anything you paid directly with the studio."
            critical
          />
        </div>

        <h2 className="mt-6 text-2">Why are you cancelling?</h2>
        <div className="mt-3 space-y-2">
          {reasons.map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => setReason(x)}
              aria-pressed={reason === x}
              className={`flex min-h-control w-full items-center justify-between rounded-lg border-2 bg-subtle px-4 text-left text-sm ${
                reason === x ? "border-foreground bg-subtle" : "border-transparent bg-subtle"
              }`}
            >
              {x}
              <span
                className={`h-4 w-4 rounded-full border ${reason === x ? "border-primary bg-primary" : "border-border"}`}
                aria-hidden
              />
            </button>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="text-1 font-semibold text-muted-foreground">
            Message to the provider (optional)
          </span>
          <textarea
            rows={3}
            placeholder="Anything they should know…"
            className="mt-2 w-full resize-none rounded-lg border border-border bg-card p-3 text-sm outline-none focus:border-primary"
          />
        </label>
      </main>

      <StickyBar
        disabled={!reason}
        primaryLabel="Cancel booking"
        onPrimary={() => setDone(true)}
      />
    </div>
  );
}
