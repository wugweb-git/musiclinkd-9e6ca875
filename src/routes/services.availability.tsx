import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarOff, Plus } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink, Chip, Sheet } from "@/components/ml/ui";
import { Card, EmptyState, Row, SegmentedField } from "@/components/ml/kit";
import {
  MiniCalendar,
  MiniCalendarDay,
  MiniCalendarDays,
  MiniCalendarNavigation,
} from "@/components/kibo-ui/mini-calendar";

/** "14 Sep" — the shape every date on this screen takes. */
const dayLabel = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
import {
  weeklyAvailability,
  timeOff,
  availabilityStates,
  bookingWindows,
  noticeDefault,
  type AvailabilityState,
} from "@/data/services";

export const Route = createFileRoute("/services/availability")({
  head: () => ({
    meta: [
      { title: "Availability | MusicLinkd" },
      {
        name: "description",
        content: "Weekly hours, notice period and time off — the calendar every booking checks.",
      },
      { property: "og:title", content: "Availability | MusicLinkd" },
      { property: "og:description", content: "Control when people can book you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Availability,
});

function Availability() {
  const [state, setState] = useState<AvailabilityState>("Available now");
  const [notice, setNotice] = useState(noticeDefault);
  const [days, setDays] = useState(weeklyAvailability);
  const [off, setOff] = useState(timeOff);
  const [addOff, setAddOff] = useState(false);
  const [offStart, setOffStart] = useState<Date | undefined>(undefined);
  const [offEnd, setOffEnd] = useState<Date | undefined>(undefined);
  const [offLength, setOffLength] = useState("1 day");

  const toggleDay = (day: string) =>
    setDays((list) => list.map((d) => (d.day === day ? { ...d, enabled: !d.enabled } : d)));

  return (
    <Screen>
      <TopBar title="Availability" subtitle="Used by every booking request" back="/services" />

      <div className="space-y-4 px-5 pt-4 pb-6">
        <Card className="space-y-3">
          <h2 className="text-sm">Right now you are</h2>
          <div className="flex flex-wrap gap-2">
            {availabilityStates.map((s) => (
              <Chip key={s} active={state === s} onClick={() => setState(s)}>
                {s}
              </Chip>
            ))}
          </div>
          <p className="text-1 text-muted-foreground">
            This shows as a badge on your profile, in Discover and on every service you offer.
          </p>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm">Weekly hours</h2>
          {days.map((d) => (
            <div
              key={d.day}
              className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0"
            >
              <div className="min-w-0">
                <p className="text-1 font-semibold">{d.day}</p>
                <p className="text-1 text-muted-foreground">
                  {d.enabled ? `${d.from} – ${d.to}` : "Unavailable"}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={d.enabled}
                aria-label={`${d.day} availability`}
                onClick={() => toggleDay(d.day)}
                className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${d.enabled ? "bg-primary" : "bg-subtle"}`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-background transition-transform ${d.enabled ? "translate-x-5" : ""}`}
                />
              </button>
            </div>
          ))}
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm">Notice needed</h2>
          <SegmentedField
            label="Notice needed"
            value={notice}
            options={bookingWindows}
            onChange={setNotice}
          />
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm">Time off</h2>
            <button
              type="button"
              onClick={() => setAddOff(true)}
              className="inline-flex items-center gap-1 text-1 font-semibold text-foreground"
            >
              <Plus size={16} /> Add
            </button>
          </div>
          {off.length ? (
            off.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-1 font-semibold">{o.label}</p>
                  <p className="text-1 text-muted-foreground">{o.range}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOff((list) => list.filter((x) => x.id !== o.id))}
                  className="text-1 font-semibold text-muted-foreground"
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <EmptyState
              title="No time off"
              body="Block dates you are travelling or on another project."
            />
          )}
        </Card>

        <Card className="space-y-1">
          <p className="flex items-center gap-2 text-1 font-semibold">
            <CalendarOff size={16} /> Bookings already confirmed
          </p>
          <p className="text-1 text-muted-foreground">
            Changing hours never cancels a confirmed booking — manage those in your provider
            calendar.
          </p>
          <BtnLink to="/provider/bookings/calendar" variant="ghost" className="w-full">
            Open Calendar
          </BtnLink>
        </Card>

        <Row
          icon={<CalendarOff size={16} />}
          title="Booking conflicts"
          subtitle="Requests that overlap your hours or time off"
          to="/services/conflicts"
        />
      </div>

      <Sheet open={addOff} onClose={() => setAddOff(false)} title="Add time off">
        {/* Pick the days you are away rather than choosing between three canned ranges. */}
        <MiniCalendar
          value={offStart}
          onValueChange={(d) => {
            setOffStart(d);
            if (offEnd && d && d > offEnd) setOffEnd(undefined);
          }}
          days={5}
          className="w-full justify-between"
        >
          <MiniCalendarNavigation direction="prev" />
          <MiniCalendarDays className="flex-1 justify-between">
            {(date) => <MiniCalendarDay date={date} key={date.toISOString()} />}
          </MiniCalendarDays>
          <MiniCalendarNavigation direction="next" />
        </MiniCalendar>

        <p className="mt-3 text-1 text-muted-foreground">
          {offStart ? `Away from ${dayLabel(offStart)}` : "Pick the first day you are away."}
        </p>

        <div className="mt-2">
          <SegmentedField
            label="How long"
            value={offLength}
            options={["1 day", "2 days", "A week"]}
            onChange={setOffLength}
          />
        </div>

        <Btn
          className="mt-4 w-full"
          disabled={!offStart}
          onClick={() => {
            if (!offStart) return;
            const span = offLength === "1 day" ? 0 : offLength === "2 days" ? 1 : 6;
            const end = new Date(offStart);
            end.setDate(end.getDate() + span);
            setOff((list) => [
              ...list,
              {
                id: `off-${offStart.toISOString().slice(0, 10)}`,
                label: "Time off",
                range: span === 0 ? dayLabel(offStart) : `${dayLabel(offStart)} – ${dayLabel(end)}`,
              },
            ]);
            setOffStart(undefined);
            setAddOff(false);
          }}
        >
          Block these days
        </Btn>
      </Sheet>
    </Screen>
  );
}
