import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar, Chip } from "@/components/ml/ui";
import { BookingStatusPill } from "@/components/ml/booking";
import {
  bookings,
  formatDate,
  formatTime,
  getBookable,
  getResource,
  isoDate,
  monthGrid,
  providerRequests,
  providerToday,
  type Booking,
} from "@/data/booking";

export const Route = createFileRoute("/provider/bookings/calendar")({
  head: () => ({
    meta: [
      { title: "Booking calendar — MusicLinkd provider" },
      {
        name: "description",
        content:
          "Day, week and month views of every confirmed session and pending request in your space, so you can see occupancy at a glance.",
      },
      { property: "og:title", content: "Booking calendar — MusicLinkd provider" },
      { property: "og:description", content: "See your sessions by day, week or month." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProviderCalendar,
});

const views = ["Day", "Week", "Month"] as const;

const all: Booking[] = [...providerToday, ...providerRequests, ...bookings];

function label(b: Booking) {
  const entity = getBookable(b.bookableId);
  const resource = getResource(entity, b.resourceId);
  return `${resource?.name ?? "Session"} · ${b.customer}`;
}

function bookingsOn(iso: string) {
  return all.filter((b) => b.date === iso).sort((a, b) => a.start.localeCompare(b.start));
}

function ProviderCalendar() {
  const [view, setView] = useState<(typeof views)[number]>("Day");
  const today = new Date();
  const [cursor, setCursor] = useState(isoDate(today));

  return (
    <Screen>
      <TopBar title="Calendar" subtitle="Octave Sound Labs" back="/provider/bookings" />

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pt-4">
        {views.map((v) => (
          <Chip key={v} active={view === v} onClick={() => setView(v)}>
            {v}
          </Chip>
        ))}
      </div>

      <main className="px-5 pt-4">
        {view === "Day" ? <DayView date={cursor} onDate={setCursor} /> : null}
        {view === "Week" ? <WeekView from={cursor} onPick={setCursor} /> : null}
        {view === "Month" ? (
          <MonthView
            onPick={(d) => {
              setCursor(d);
              setView("Day");
            }}
          />
        ) : null}
      </main>
    </Screen>
  );
}

function DayNav({ date, onDate }: { date: string; onDate: (d: string) => void }) {
  const shift = (days: number) => {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + days);
    onDate(isoDate(d));
  };
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => shift(-1)}
        className="min-h-11 px-2 text-sm font-semibold text-primary"
      >
        ← Prev
      </button>
      <p className="min-w-0 truncate text-[15px] font-bold">{formatDate(date)}</p>
      <button
        type="button"
        onClick={() => shift(1)}
        className="min-h-11 px-2 text-sm font-semibold text-primary"
      >
        Next →
      </button>
    </div>
  );
}

function BlockRow({ b }: { b: Booking }) {
  return (
    <Link
      to="/provider/bookings/$ref"
      params={{ ref: b.ref }}
      className="flex min-w-0 items-start gap-3 rounded-3xl border border-border bg-card p-3"
    >
      <span className="w-[62px] shrink-0 text-[12px] font-bold leading-tight">
        {formatTime(b.start)}
        <span className="block text-[10px] font-semibold text-muted-foreground">
          {formatTime(b.end)}
        </span>
      </span>
      <span className="mt-1 h-10 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold">{label(b)}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {b.people} people · {b.purpose}
        </p>
      </div>
      <BookingStatusPill status={b.status} />
    </Link>
  );
}

function DayView({ date, onDate }: { date: string; onDate: (d: string) => void }) {
  const items = bookingsOn(date);
  return (
    <div className="space-y-3">
      <DayNav date={date} onDate={onDate} />
      {items.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-5 text-center">
          <p className="text-[14px] font-semibold">Nothing booked</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            This day is completely open. Block it off in Availability if you're not taking sessions.
          </p>
          <Link
            to="/provider/availability"
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-navy px-5 text-xs font-semibold text-background"
          >
            Edit availability
          </Link>
        </div>
      ) : (
        items.map((b) => <BlockRow key={b.ref} b={b} />)
      )}
    </div>
  );
}

function WeekView({ from, onPick }: { from: string; onPick: (d: string) => void }) {
  const start = new Date(`${from}T00:00:00`);
  start.setDate(start.getDate() - start.getDay());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return isoDate(d);
  });
  return (
    <div className="space-y-3">
      {days.map((d) => {
        const items = bookingsOn(d);
        return (
          <div key={d} className="min-w-0">
            <button
              type="button"
              onClick={() => onPick(d)}
              className="flex w-full min-w-0 items-center justify-between gap-3 py-1 text-left"
            >
              <span className="min-w-0 truncate text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
                {formatDate(d)}
              </span>
              <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
                {items.length} session{items.length === 1 ? "" : "s"}
              </span>
            </button>
            {items.length ? (
              <div className="mt-1 space-y-2">
                {items.map((b) => (
                  <BlockRow key={b.ref} b={b} />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-subtle px-4 py-2.5 text-[11px] text-text2">
                Open all day
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MonthView({ onPick }: { onPick: (d: string) => void }) {
  const now = new Date();
  const cells = monthGrid(now.getFullYear(), now.getMonth());
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((d) => {
          const iso = isoDate(d);
          const inMonth = d.getMonth() === now.getMonth();
          const count = bookingsOn(iso).length;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onPick(iso)}
              aria-label={`${formatDate(iso)}, ${count} session${count === 1 ? "" : "s"}`}
              className={`flex aspect-square min-w-0 flex-col items-center justify-center rounded-2xl border border-border text-[12px] font-semibold ${
                inMonth ? "bg-card" : "bg-subtle text-muted-foreground"
              }`}
            >
              {d.getDate()}
              <span
                className={`mt-0.5 h-1.5 w-1.5 rounded-full ${count ? "bg-primary" : ""}`}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        A dot marks a day with sessions. Tap a day to open it.
      </p>
    </div>
  );
}
