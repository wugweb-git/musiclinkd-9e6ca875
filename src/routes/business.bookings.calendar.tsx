import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Screen, TopBar } from "@/components/ml/ui";
import {
  BusinessOnlyGate,
  EmptyState,
  Loading,
  StatusPill,
  type Tone,
  Segmented,
} from "@/components/ml/kit";
import { useRequireBusiness } from "@/hooks/use-require-business";
import { isoDate } from "@/data/booking";
import {
  listStudioBookings,
  type BookingRequest,
  type BookingStatus,
} from "@/lib/bookings.functions";

export const Route = createFileRoute("/business/bookings/calendar")({
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

const statusTone: Record<BookingStatus, Tone> = {
  requested: "warn",
  reviewing: "warn",
  confirmed: "good",
  declined: "neutral",
  cancelled: "neutral",
  completed: "neutral",
};
const statusLabel: Record<BookingStatus, string> = {
  requested: "Requested",
  reviewing: "Reviewing",
  confirmed: "Confirmed",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
};

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
function formatTime(t: string | null) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = Number(h);
  const period = hour >= 12 ? "PM" : "AM";
  const twelve = hour % 12 || 12;
  return `${twelve}:${m} ${period}`;
}
function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function ProviderCalendar() {
  const gate = useRequireBusiness();
  return (
    <BusinessOnlyGate allowed={gate.allowed} loading={gate.loading} signedIn={gate.signedIn}>
      <ProviderCalendarContent />
    </BusinessOnlyGate>
  );
}

function ProviderCalendarContent() {
  const [view, setView] = useState<(typeof views)[number]>("Day");
  const today = new Date();
  const [cursor, setCursor] = useState(isoDate(today));
  const load = useServerFn(listStudioBookings);
  const q = useQuery({ queryKey: ["business", "bookings", "mine"], queryFn: () => load() });
  const all = q.data ?? [];

  const bookingsOn = (iso: string) =>
    all
      .filter((b) => b.session_date === iso)
      .sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? ""));

  return (
    <Screen>
      <TopBar title="Calendar" subtitle="Your studio" back="/business/bookings" />

      <div className="px-5 pt-4">
        <Segmented value={view} options={views} onChange={setView} />
      </div>

      <main className="px-5 pt-4">
        {q.isLoading ? (
          <Loading />
        ) : q.isError ? (
          <EmptyState title="Couldn't load your bookings" body="Check your connection and retry." />
        ) : (
          <>
            {view === "Day" ? (
              <DayView date={cursor} onDate={setCursor} bookingsOn={bookingsOn} />
            ) : null}
            {view === "Week" ? (
              <WeekView from={cursor} onPick={setCursor} bookingsOn={bookingsOn} />
            ) : null}
            {view === "Month" ? (
              <MonthView
                onPick={(d) => {
                  setCursor(d);
                  setView("Day");
                }}
                bookingsOn={bookingsOn}
              />
            ) : null}
          </>
        )}
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
        className="min-h-touch px-2 text-sm font-semibold text-foreground"
      >
        ← Prev
      </button>
      <p className="min-w-0 truncate text-sm font-bold">{formatDate(date)}</p>
      <button
        type="button"
        onClick={() => shift(1)}
        className="min-h-touch px-2 text-sm font-semibold text-foreground"
      >
        Next →
      </button>
    </div>
  );
}

function BlockRow({ b }: { b: BookingRequest }) {
  const isRequest = b.status === "requested" || b.status === "reviewing";
  return (
    <Link
      to={isRequest ? "/business/bookings/requests/$ref" : "/business/bookings/$ref"}
      params={{ ref: b.id }}
      className="flex min-w-0 items-start gap-3 rounded-lg bg-subtle p-3"
    >
      <span className="w-[62px] shrink-0 text-1 font-bold leading-tight">
        {formatTime(b.start_time)}
        <span className="block text-1 font-semibold text-muted-foreground">
          {formatTime(b.end_time)}
        </span>
      </span>
      <span className="mt-1 h-10 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-1 font-semibold">
          {b.room?.name ?? "Session"} ·{" "}
          {b.requester?.display_name ?? b.requester?.username ?? b.requester_name ?? "Someone"}
        </p>
        <p className="truncate text-1 text-muted-foreground">
          {b.people ? `${b.people} people` : ""}
          {b.people && b.purpose ? " · " : ""}
          {b.purpose ?? ""}
        </p>
      </div>
      <StatusPill label={statusLabel[b.status]} tone={statusTone[b.status]} />
    </Link>
  );
}

function DayView({
  date,
  onDate,
  bookingsOn,
}: {
  date: string;
  onDate: (d: string) => void;
  bookingsOn: (iso: string) => BookingRequest[];
}) {
  const items = bookingsOn(date);
  return (
    <div className="space-y-3">
      <DayNav date={date} onDate={onDate} />
      {items.length === 0 ? (
        <div className="rounded-lg bg-subtle p-5 text-center">
          <p className="text-sm font-semibold">Nothing booked</p>
          <p className="mt-1 text-1 text-muted-foreground">This day has no requests yet.</p>
          <Link
            to="/business/availability"
            className="mt-3 inline-flex min-h-touch items-center justify-center rounded-full bg-ink px-5 text-1 font-semibold text-background"
          >
            Edit availability
          </Link>
        </div>
      ) : (
        items.map((b) => <BlockRow key={b.id} b={b} />)
      )}
    </div>
  );
}

function WeekView({
  from,
  onPick,
  bookingsOn,
}: {
  from: string;
  onPick: (d: string) => void;
  bookingsOn: (iso: string) => BookingRequest[];
}) {
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
              <span className="pill min-w-0 truncate bg-background text-muted-foreground">
                {formatDate(d)}
              </span>
              <span className="shrink-0 text-1 font-semibold text-muted-foreground">
                {items.length} session{items.length === 1 ? "" : "s"}
              </span>
            </button>
            {items.length ? (
              <div className="mt-1 space-y-2">
                {items.map((b) => (
                  <BlockRow key={b.id} b={b} />
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-subtle px-4 py-2.5 text-1 text-muted-foreground">
                Open all day
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MonthView({
  onPick,
  bookingsOn,
}: {
  onPick: (d: string) => void;
  bookingsOn: (iso: string) => BookingRequest[];
}) {
  const now = new Date();
  const cells = monthGrid(now.getFullYear(), now.getMonth());
  return (
    <div>
      <div className="pill grid grid-cols-7 gap-1 text-center bg-background text-muted-foreground">
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
              className={`flex aspect-square min-w-0 flex-col items-center justify-center rounded-lg border border-border text-1 font-semibold ${
                inMonth ? "bg-card" : "bg-background text-muted-foreground"
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
      <p className="mt-3 text-1 text-muted-foreground">
        A dot marks a day with sessions. Tap a day to open it.
      </p>
    </div>
  );
}
