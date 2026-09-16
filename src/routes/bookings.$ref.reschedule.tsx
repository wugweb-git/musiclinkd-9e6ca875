import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import {
  AvailabilityCalendar,
  Detail,
  EmptyState,
  SlotPicker,
  StickyBar,
} from "@/components/ml/booking";
import {
  availabilityFor,
  formatDate,
  formatTime,
  getBookable,
  getBooking,
  getResource,
} from "@/data/booking";

export const Route = createFileRoute("/bookings/$ref/reschedule")({
  head: () => ({
    meta: [
      { title: "Reschedule booking — MusicLinkd" },
      {
        name: "description",
        content:
          "Move your session to a new date and time. The provider confirms the change before it's final.",
      },
      { property: "og:title", content: "Reschedule booking — MusicLinkd" },
      { property: "og:description", content: "Pick a new date and time for your session." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reschedule,
});

function Reschedule() {
  const { ref } = Route.useParams();
  const bk = getBooking(ref);
  const b = getBookable(bk?.bookableId ?? "");
  const r = getResource(b, bk?.resourceId);
  const [date, setDate] = useState<string | undefined>(undefined);
  const [start, setStart] = useState<string | undefined>(undefined);
  const [sent, setSent] = useState(false);

  if (!bk || !b || !r) {
    return (
      <Screen>
        <TopBar title="Reschedule" back="/bookings" />
        <div className="px-5 pt-4">
          <EmptyState title="Booking not found" body="This booking can no longer be changed." />
        </div>
      </Screen>
    );
  }

  const day = date ? availabilityFor(r.id, date, r.tiers[0]?.price ?? 0) : undefined;

  if (sent) {
    return (
      <Screen>
        <TopBar title="Reschedule" back="/bookings" />
        <main className="px-5 pt-6">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="font-semibold">Reschedule request sent</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {b.name} will confirm the new slot. Your original time stays held until they respond.
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
              <Detail label="Original" value={`${formatDate(bk.date)} · ${formatTime(bk.start)}`} />
              <Detail
                label="Requested"
                value={`${date ? formatDate(date) : "—"} · ${start ? formatTime(start) : "—"}`}
              />
            </dl>
            <BtnLink to="/bookings/$ref" params={{ ref: bk.ref }} className="mt-4 w-full">
              Back to Booking
            </BtnLink>
          </div>
        </main>
      </Screen>
    );
  }

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-background pb-32">
      <TopBar title="Reschedule" subtitle={`#${bk.ref} · ${b.name}`} back={`/bookings/${bk.ref}`} />
      <main className="px-5 pt-4">
        <div className="rounded-lg bg-subtle p-4 text-xs">
          <p className="font-semibold text-text1">
            Current: {formatDate(bk.date)} · {formatTime(bk.start)} – {formatTime(bk.end)}
          </p>
          <p className="mt-1 text-muted-foreground">
            Free reschedule up to 48 hrs before the session. Later changes may carry the provider's
            fee.
          </p>
        </div>

        <h2 className="mt-6 text-[17px]">Pick a new date</h2>
        <div className="mt-3">
          <AvailabilityCalendar
            resourceId={r.id}
            timezone={b.timezone}
            fromPrice={r.tiers[0]?.price ?? 0}
            selected={date}
            onSelect={(d) => {
              setDate(d);
              setStart(undefined);
            }}
          />
        </div>

        {day ? (
          <>
            <h2 className="mt-6 text-[17px]">New start time</h2>
            <div className="mt-3">
              <SlotPicker
                slots={day.slots}
                value={start}
                onChange={setStart}
                timezone={b.timezone}
              />
            </div>
          </>
        ) : null}
      </main>

      <StickyBar
        price={date && start ? `${formatDate(date)} · ${formatTime(start)}` : "Select a slot"}
        hint="Provider must approve the change"
        disabled={!date || !start}
        primaryLabel="Request reschedule"
        onPrimary={() => setSent(true)}
      />
    </div>
  );
}
