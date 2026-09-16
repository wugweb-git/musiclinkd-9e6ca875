import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TopBar, Btn, BtnLink, Sheet } from "@/components/ml/ui";
import {
  AvailabilityCalendar,
  CalendarSkeleton,
  DurationPicker,
  EmptyState,
  ErrorState,
  OfflineBanner,
  SlotPicker,
  StepDots,
  StickyBar,
} from "@/components/ml/booking";
import { CalendarGate, useBookingDraft } from "@/components/ml/booking-context";
import {
  availabilityFor,
  durationOptions,
  formatDate,
  formatTime,
  inr,
  nextAvailableDate,
} from "@/data/booking";
import { showDemoControls } from "@/lib/dev";

export const Route = createFileRoute("/booking/$id/schedule")({
  head: () => ({
    meta: [
      { title: "Pick a date and time — MusicLinkd booking" },
      {
        name: "description",
        content:
          "Live availability by day, open time slots and duration options with the price updating as you choose.",
      },
      { property: "og:title", content: "Pick a date and time — MusicLinkd booking" },
      {
        property: "og:description",
        content: "Availability, time slots and duration for your session.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ScheduleStep,
});

type Sim = "ok" | "loading" | "error" | "offline";

function ScheduleStep() {
  return (
    <CalendarGate>
      <Schedule />
    </CalendarGate>
  );
}

function Schedule() {
  const { bookable: b, resource: r, draft, set, price, endTime } = useBookingDraft();
  const navigate = useNavigate();
  const [sim, setSim] = useState<Sim>("ok");
  const [conflict, setConflict] = useState(false);
  const [customHours, setCustomHours] = useState(4);

  const fromPrice = Math.min(...r.tiers.map((t) => t.price));
  const day = draft.date ? availabilityFor(r.id, draft.date, fromPrice) : undefined;
  const openSlots = day?.slots.filter((s) => s.state === "open") ?? [];
  const next = nextAvailableDate(r.id, fromPrice);

  const allowed = durationOptions.filter(
    (o) =>
      r.durations.includes(o.unit) ||
      (o.unit === "hour" && r.durations.includes("hour")) ||
      o.unit === "custom",
  );

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-background pb-36">
      <TopBar
        title="Availability"
        subtitle={`${r.name} · ${b.name}`}
        back={`/booking/${b.id}/service`}
        right={
          showDemoControls ? (
            <button
              type="button"
              onClick={() => setSim(sim === "ok" ? "offline" : "ok")}
              className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
            >
              {sim === "ok" ? "Demo states" : "Reset"}
            </button>
          ) : undefined
        }
      />

      <main className="px-5 pt-4">
        <StepDots step={2} total={5} />

        {sim === "offline" ? <OfflineBanner onRetry={() => setSim("ok")} /> : null}

        <div className="mt-4">
          {sim === "loading" ? (
            <CalendarSkeleton />
          ) : sim === "error" ? (
            <ErrorState
              title="Availability didn't load"
              message="We couldn't reach this provider's calendar just now."
              onRetry={() => setSim("ok")}
            />
          ) : (
            <AvailabilityCalendar
              resourceId={r.id}
              fromPrice={fromPrice}
              {...(draft.date ? { selected: draft.date } : {})}
              onSelect={(date) => set({ date, start: undefined })}
              timezone={b.timezone}
            />
          )}
        </div>

        {sim === "ok" && draft.date ? (
          <section className="mt-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[17px]">{formatDate(draft.date)}</h2>
              <button
                type="button"
                onClick={() => set({ date: undefined, start: undefined })}
                className="text-xs font-semibold text-foreground"
              >
                Clear date
              </button>
            </div>

            {openSlots.length === 0 ? (
              <div className="mt-3">
                <EmptyState
                  title="No availability on this date"
                  body={
                    next
                      ? `The next open date is ${formatDate(next.date)}.`
                      : "This room has no open dates in the next month."
                  }
                  action={
                    <div className="flex flex-col gap-2">
                      {next ? (
                        <Btn onClick={() => set({ date: next.date, start: undefined })}>
                          Go to {formatDate(next.date)}
                        </Btn>
                      ) : null}
                      <BtnLink to="/messages" variant="outline" className="w-full">
                        Message Provider
                      </BtnLink>
                      <BtnLink to="/studio" variant="ghost" className="w-full">
                        See Similar Spaces
                      </BtnLink>
                    </div>
                  }
                />
              </div>
            ) : (
              <div className="mt-3">
                <SlotPicker
                  slots={day?.slots ?? []}
                  {...(draft.start ? { value: draft.start } : {})}
                  onChange={(start) => {
                    // Demo: the 12:00 slot shows the conflict state.
                    if (start === "12:00") {
                      setConflict(true);
                      return;
                    }
                    set({ start });
                  }}
                  timezone={b.timezone}
                />
              </div>
            )}
          </section>
        ) : null}

        {sim === "ok" && draft.start ? (
          <section className="mt-6">
            <h2 className="text-[17px]">How long do you need?</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Only durations this room supports are shown.
            </p>
            <div className="mt-3">
              <DurationPicker
                options={allowed.map((o) => ({ label: o.label, hours: o.hours }))}
                value={draft.hours}
                onChange={(hours) => set({ hours })}
                customHours={customHours}
                onCustomHours={(h) => {
                  setCustomHours(h);
                  set({ hours: h });
                }}
              />
            </div>
            <p className="mt-3 rounded-lg bg-subtle px-4 py-3 text-xs text-muted-foreground">
              {formatTime(draft.start)} – {formatTime(endTime)} · {draft.hours} hr
              {draft.hours > 1 ? "s" : ""} · {b.timezone}
            </p>
          </section>
        ) : null}

        {showDemoControls && sim === "ok" ? (
          <div className="mt-6 flex gap-2">
            <Btn variant="ghost" className="flex-1" onClick={() => setSim("loading")}>
              Loading State
            </Btn>
            <Btn variant="ghost" className="flex-1" onClick={() => setSim("error")}>
              Error State
            </Btn>
          </div>
        ) : null}
      </main>

      <StickyBar
        price={draft.start ? inr(price.total) : undefined}
        hint={
          draft.start
            ? `${formatDate(draft.date!)} · ${formatTime(draft.start)}`
            : "Select a date and time to continue"
        }
        disabled={!draft.start || sim !== "ok"}
        primaryLabel="Continue"
        onPrimary={() => navigate({ to: "/booking/$id/details", params: { id: b.id } })}
      />

      <Sheet
        open={conflict}
        onClose={() => setConflict(false)}
        title="This time is no longer available"
      >
        <p className="text-sm text-muted-foreground">
          Someone booked {draft.date ? formatDate(draft.date) : "this date"} at 12:00 PM while you
          were choosing. Your other selections are saved.
        </p>
        <div className="mt-5 space-y-2">
          <Btn className="w-full" onClick={() => setConflict(false)}>
            Choose Another Time
          </Btn>
          <Btn
            variant="outline"
            className="w-full"
            onClick={() => {
              set({ date: undefined, start: undefined });
              setConflict(false);
            }}
          >
            Choose Another Date
          </Btn>
          <Btn variant="ghost" className="w-full" onClick={() => setConflict(false)}>
            Return
          </Btn>
        </div>
      </Sheet>
    </div>
  );
}
