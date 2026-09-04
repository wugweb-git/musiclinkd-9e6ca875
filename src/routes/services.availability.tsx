import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarOff, Plus } from "lucide-react";
import { Screen, TopBar, Btn, Chip, Sheet } from "@/components/ml/ui";
import { Card, EmptyState } from "@/components/ml/kit";
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
      { name: "description", content: "Weekly hours, notice period and time off — the calendar every booking checks." },
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

  const toggleDay = (day: string) =>
    setDays((list) => list.map((d) => (d.day === day ? { ...d, enabled: !d.enabled } : d)));

  return (
    <Screen>
      <TopBar title="Availability" subtitle="Used by every booking request" back="/services" />

      <div className="space-y-4 px-5 pt-4 pb-6">
        <Card className="space-y-3">
          <h2 className="text-[15px]">Right now you are</h2>
          <div className="flex flex-wrap gap-2">
            {availabilityStates.map((s) => (
              <Chip key={s} active={state === s} onClick={() => setState(s)}>
                {s}
              </Chip>
            ))}
          </div>
          <p className="text-[12px] text-muted-foreground">
            This shows as a badge on your profile, in Discover and on every service you offer.
          </p>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-[15px]">Weekly hours</h2>
          {days.map((d) => (
            <div key={d.day} className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold">{d.day}</p>
                <p className="text-[11px] text-muted-foreground">{d.enabled ? `${d.from} – ${d.to}` : "Unavailable"}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={d.enabled}
                aria-label={`${d.day} availability`}
                onClick={() => toggleDay(d.day)}
                className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${d.enabled ? "bg-primary" : "bg-subtle"}`}
              >
                <span className={`block h-5 w-5 rounded-full bg-background transition-transform ${d.enabled ? "translate-x-5" : ""}`} />
              </button>
            </div>
          ))}
        </Card>

        <Card className="space-y-3">
          <h2 className="text-[15px]">Notice needed</h2>
          <div className="flex flex-wrap gap-2">
            {bookingWindows.map((w) => (
              <Chip key={w} active={notice === w} onClick={() => setNotice(w)}>
                {w}
              </Chip>
            ))}
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[15px]">Time off</h2>
            <button type="button" onClick={() => setAddOff(true)} className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary">
              <Plus size={14} /> Add
            </button>
          </div>
          {off.length ? (
            off.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">{o.label}</p>
                  <p className="text-[11px] text-muted-foreground">{o.range}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOff((list) => list.filter((x) => x.id !== o.id))}
                  className="text-[12px] font-semibold text-muted-foreground"
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <EmptyState title="No time off" body="Block dates you are travelling or on another project." />
          )}
        </Card>

        <Card className="space-y-1">
          <p className="flex items-center gap-2 text-[13px] font-semibold">
            <CalendarOff size={15} /> Bookings already confirmed
          </p>
          <p className="text-[12px] text-muted-foreground">
            Changing hours never cancels a confirmed booking — manage those in your provider calendar.
          </p>
          <Link to="/provider/bookings/calendar">
            <Btn variant="ghost" className="w-full">
              Open calendar
            </Btn>
          </Link>
        </Card>
      </div>

      <Sheet open={addOff} onClose={() => setAddOff(false)} title="Add time off">
        <div className="space-y-2">
          {[
            { id: "off-n1", label: "This weekend", range: "6–7 Sep" },
            { id: "off-n2", label: "Next week", range: "8–14 Sep" },
            { id: "off-n3", label: "Rest of the month", range: "8–30 Sep" },
          ].map((o) => (
            <Btn
              key={o.id}
              variant="outline"
              className="w-full"
              onClick={() => {
                setOff((list) => [...list, o]);
                setAddOff(false);
              }}
            >
              {o.label} · {o.range}
            </Btn>
          ))}
        </div>
      </Sheet>
    </Screen>
  );
}
