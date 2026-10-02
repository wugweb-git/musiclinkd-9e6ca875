import { iconSize } from "@/lib/tokens";
import { CalendarDays } from "lucide-react";
import { EmptyState, LoadError, OfflineBanner } from "@/components/ml/kit";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Screen, TopBar, Btn, BtnLink, Sheet } from "@/components/ml/ui";
import {
  AvailabilityCalendar,
  CalendarSkeleton,
  DurationPicker,
  SlotPicker,
  StepDots,
  StickyBar,
} from "@/components/ml/booking";
import { CalendarGate, useBookingDraft } from "@/components/ml/booking-context";
import { durationOptions } from "@/data/booking";
import { formatDate, formatTime } from "@/lib/when";
import { inr } from "@/lib/price";
import { showDemoControls } from "@/lib/dev";
import { getStudioCalendar } from "@/lib/studio-calendar.functions";
import {
  calendarWindow,
  earliestBookingDate,
  hasWeeklyHours,
  nextOpenDay,
  spanIsOpen,
  studioDay,
} from "@/lib/studio-slots";

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
  // The start time that was taken while it was being chosen.
  const [conflict, setConflict] = useState<string | null>(null);
  const [customHours, setCustomHours] = useState(4);

  const fromPrice = Math.min(...r.tiers.map((t) => t.price));
  // The studio's weekly hours and its taken and closed times, read again every minute so a slot
  // someone else books meanwhile stops being offered.
  const range = useMemo(() => calendarWindow(), []);
  const loadCalendar = useServerFn(getStudioCalendar);
  const calendar = useQuery({
    queryKey: ["studio-calendar", b.id, range.from],
    queryFn: () => loadCalendar({ data: { slug: b.id, ...range } }),
    refetchInterval: 60_000,
  });
  const cal = calendar.data;
  const dayOf = useCallback(
    // The studio's notice and blackout days (cal) close slots and days on top of its hours.
    (date: string) =>
      studioDay(cal?.weeklyHours ?? {}, cal?.busy ?? [], r.id, date, fromPrice, cal),
    [cal, r.id, fromPrice],
  );
  const day = useMemo(
    () => (draft.date && cal ? dayOf(draft.date) : undefined),
    [draft.date, cal, dayOf],
  );
  const openSlots = day?.slots.filter((s) => s.state === "open") ?? [];
  const next = useMemo(() => (cal ? nextOpenDay(dayOf) : undefined), [cal, dayOf]);
  // The whole session has to sit on open hours, not only its first one.
  const fits = Boolean(draft.start && spanIsOpen(day, draft.start, draft.hours));

  // A draft kept from an earlier visit can hold a day that is now too soon: drop it.
  useEffect(() => {
    if (draft.date && draft.date < earliestBookingDate())
      set({ date: undefined, start: undefined });
  }, [draft.date, set]);

  useEffect(() => {
    if (!draft.start || !day) return;
    if (day.slots.find((s) => s.start === draft.start)?.state !== "open") {
      setConflict(draft.start);
      set({ start: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the day's slots change
  }, [day]);

  // Database studios keep their own wall clock and store no zone name.
  const timezone = b.timezone || "studio time";

  const allowed = durationOptions.filter(
    (o) =>
      r.durations.includes(o.unit) ||
      (o.unit === "hour" && r.durations.includes("hour")) ||
      o.unit === "custom",
  );

  return (
    <Screen className="pb-nav-clear">
      <TopBar
        title="Availability"
        subtitle={[draft.purpose, b.name].filter(Boolean).join(" · ")}
        back={`/booking/${b.id}/service`}
        right={
          showDemoControls ? (
            <button
              type="button"
              onClick={() => setSim(sim === "ok" ? "offline" : "ok")}
              className="pill bg-subtle text-muted-foreground"
            >
              {sim === "ok" ? "Demo states" : "Reset"}
            </button>
          ) : undefined
        }
      />

      <main className="px-5 pt-4">
        <StepDots step={2} total={5} />

        {sim === "offline" ? (
          <OfflineBanner
            body="Availability may have changed. We won't confirm a booking until you're back online."
            onRetry={() => setSim("ok")}
          />
        ) : null}

        <div className="mt-4">
          {sim === "loading" || calendar.isLoading ? (
            <CalendarSkeleton />
          ) : sim === "error" || calendar.isError ? (
            <LoadError
              what="this provider's availability"
              action={
                <Btn
                  onClick={() => {
                    setSim("ok");
                    void calendar.refetch();
                  }}
                >
                  Try Again
                </Btn>
              }
            />
          ) : cal && !hasWeeklyHours(cal.weeklyHours) ? (
            <EmptyState
              icon={<CalendarDays size={iconSize.lg} aria-hidden />}
              title="Availability not set"
              body="This studio hasn't added its opening hours yet. Message them to ask about a date."
              action={
                <BtnLink to="/messages" variant="outline" className="w-full">
                  Message Provider
                </BtnLink>
              }
            />
          ) : (
            <AvailabilityCalendar
              {...(draft.date ? { selected: draft.date } : {})}
              onSelect={(date) => set({ date, start: undefined })}
              timezone={timezone}
              dayOf={dayOf}
            />
          )}
        </div>

        {sim === "ok" && cal && draft.date ? (
          <section className="mt-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-2">{formatDate(draft.date)}</h2>
              <button
                type="button"
                onClick={() => set({ date: undefined, start: undefined })}
                className="text-1 font-semibold text-foreground"
              >
                Clear date
              </button>
            </div>

            {openSlots.length === 0 ? (
              <div className="mt-3">
                <EmptyState
                  icon={<CalendarDays size={iconSize.lg} aria-hidden />}
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
                      <BtnLink
                        to="/discover/$slug"
                        params={{ slug: "studios" }}
                        variant="ghost"
                        className="w-full"
                      >
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
                  onChange={(start) => set({ start })}
                  timezone={timezone}
                />
              </div>
            )}
          </section>
        ) : null}

        {sim === "ok" && draft.start ? (
          <section className="mt-6">
            <h2 className="text-2">How long do you need?</h2>
            <p className="mt-1 text-1 text-muted-foreground">
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
            <p className="mt-3 rounded-lg bg-subtle px-4 py-3 text-1 text-muted-foreground">
              {formatTime(draft.start)} – {formatTime(endTime)} · {draft.hours} hr
              {draft.hours > 1 ? "s" : ""} · {timezone}
            </p>
            {fits ? null : (
              <p className="mt-2 text-1 text-muted-foreground">
                This runs into a taken or closed hour. Pick a shorter time or an earlier start.
              </p>
            )}
          </section>
        ) : null}

        {showDemoControls && sim === "ok" ? (
          <div className="mt-6 flex gap-2">
            <Btn variant="ghost" className="flex-1" onClick={() => setSim("loading")}>
              Loading state
            </Btn>
            <Btn variant="ghost" className="flex-1" onClick={() => setSim("error")}>
              Error state
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
        disabled={!draft.start || !fits || sim !== "ok"}
        primaryLabel="Continue"
        onPrimary={() => navigate({ to: "/booking/$id/details", params: { id: b.id } })}
      />

      <Sheet
        open={conflict !== null}
        onClose={() => setConflict(null)}
        title="This time is no longer available"
      >
        <p className="text-sm text-muted-foreground">
          Someone booked {draft.date ? formatDate(draft.date) : "this date"} at{" "}
          {conflict ? formatTime(conflict) : ""} while you were choosing. Your other selections are
          saved.
        </p>
        <div className="mt-5 space-y-2">
          <Btn className="w-full" onClick={() => setConflict(null)}>
            Choose Another Time
          </Btn>
          <Btn
            variant="outline"
            className="w-full"
            onClick={() => {
              set({ date: undefined, start: undefined });
              setConflict(null);
            }}
          >
            Choose Another Date
          </Btn>
          <Btn variant="ghost" className="w-full" onClick={() => setConflict(null)}>
            Return
          </Btn>
        </div>
      </Sheet>
    </Screen>
  );
}
