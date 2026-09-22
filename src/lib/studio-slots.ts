import { isoDate, type DayAvailability, type Slot } from "@/data/booking";

/*
 * A database studio's real availability: its weekly opening hours, minus the times taken by
 * confirmed bookings and closed by the owner, minus the hours already past or inside the studio's
 * notice, with its blackout days closed. Hour slots, the way
 * the booking calendar has always shown them. Times are the studio's own wall clock.
 * Schema: supabase/migrations/20260921110000_studio_calendar.sql
 */

export const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export type OpenSpan = { open: string; close: string };
/** studios.weekly_hours — a missing or empty day is closed. */
export type WeeklyHours = Partial<Record<Weekday, OpenSpan[]>>;

/** studios.blackout_dates — whole days the studio is closed, both ends included ("yyyy-mm-dd"). */
export type BlackoutRange = { from: string; to: string };

/**
 * The owner's rules on top of the weekly hours: the notice needed before a session, and blackout
 * days. Schema: supabase/migrations/20260922280000_booking_rules.sql
 */
export type BookingRules = { noticeHours?: number; blackouts?: BlackoutRange[] };

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** The stored blackout ranges, keeping only well-formed ones, earliest first. */
export function parseBlackouts(raw: unknown): BlackoutRange[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (r): r is BlackoutRange =>
        !!r &&
        typeof r === "object" &&
        YMD.test(String((r as BlackoutRange).from)) &&
        YMD.test(String((r as BlackoutRange).to)) &&
        (r as BlackoutRange).from <= (r as BlackoutRange).to,
    )
    .map(({ from, to }) => ({ from, to }))
    .sort((a, b) => a.from.localeCompare(b.from));
}

/** Whether a day falls inside one of the blackout ranges. */
export const isBlackout = (date: string, blackouts: BlackoutRange[] = []) =>
  blackouts.some((r) => date >= r.from && date <= r.to);

/** Whether a session on `date` at `time` ("hh:mm", studio clock) starts inside the notice window. */
export function insideNotice(
  date: string,
  time: string | null | undefined,
  noticeHours = 0,
  now = new Date(),
) {
  if (!noticeHours) return false;
  // Studios keep India's wall clock (all are in India today); the server's own clock is UTC.
  const start = new Date(`${date}T${(time ?? "00:00").slice(0, 5)}:00+05:30`).getTime();
  return start < now.getTime() + noticeHours * 3_600_000;
}

/** A taken or closed interval, "yyyy-mm-ddThh:mm:ss" local. No room means every room. */
export type BusyInterval = { roomId: string | null; start: string; end: string };

const HHMM = /^([01]\d|2[0-4]):[0-5]\d$/;

/** The stored value, keeping only well-formed days and spans (the owner writes it). */
export function parseWeeklyHours(raw: unknown): WeeklyHours {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: WeeklyHours = {};
  for (const day of WEEKDAYS) {
    const spans = (raw as Record<string, unknown>)[day];
    if (!Array.isArray(spans)) continue;
    const valid = spans.filter(
      (s): s is OpenSpan =>
        !!s &&
        typeof s === "object" &&
        HHMM.test(String((s as OpenSpan).open)) &&
        HHMM.test(String((s as OpenSpan).close)) &&
        minutes((s as OpenSpan).open) < minutes((s as OpenSpan).close),
    );
    if (valid.length) out[day] = valid.map(({ open, close }) => ({ open, close }));
  }
  return out;
}

const DAY_SHORT: Record<Weekday, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};
const WEEK_FROM_MONDAY: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/**
 * The weekly hours as the one line profiles show, e.g. "Mon–Sat 10:00–20:00 · Sun closed".
 * Neighbouring days with the same hours are joined. Null when no day is open.
 */
export function hoursLine(w: WeeklyHours): string | null {
  if (!hasWeeklyHours(w)) return null;
  const label = (d: Weekday) => {
    const spans = w[d] ?? [];
    return spans.length ? spans.map((s) => `${s.open}–${s.close}`).join(", ") : "closed";
  };
  const runs: { from: Weekday; to: Weekday; hours: string }[] = [];
  for (const d of WEEK_FROM_MONDAY) {
    const hours = label(d);
    const last = runs[runs.length - 1];
    if (last && last.hours === hours) last.to = d;
    else runs.push({ from: d, to: d, hours });
  }
  return runs
    .map((r) => `${DAY_SHORT[r.from]}${r.from === r.to ? "" : `–${DAY_SHORT[r.to]}`} ${r.hours}`)
    .join(" · ");
}

export const hasWeeklyHours = (w: WeeklyHours) => WEEKDAYS.some((d) => (w[d]?.length ?? 0) > 0);

function minutes(hhmm: string) {
  const [h = "0", m = "0"] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
}

const pad = (n: number) => String(n).padStart(2, "0");
const at = (date: string, hour: number) => new Date(`${date}T${pad(hour)}:00:00`).getTime();

/** Today's date in India, whatever clock the code runs on (the server's is UTC). */
const INDIA_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The earliest day a session can be asked for: tomorrow in India. Today and earlier are never offered. */
export function earliestBookingDate(now = new Date()) {
  const [y = 0, m = 1, d = 1] = INDIA_DATE.format(now).split("-").map(Number);
  return isoDate(new Date(y, m - 1, d + 1));
}

/** How far ahead the calendar reads bookings; later dates are not offered. */
export const WINDOW_DAYS = 180;

export function calendarWindow(now = new Date()) {
  const end = new Date(now);
  end.setDate(now.getDate() + WINDOW_DAYS);
  return { from: isoDate(now), to: isoDate(end) };
}

/** One room's day: whole-hour slots inside the opening hours, each open, booked or past. */
export function studioDay(
  weekly: WeeklyHours,
  busy: BusyInterval[],
  roomId: string,
  date: string,
  fromPrice: number,
  rules: BookingRules = {},
  now = new Date(),
): DayAvailability {
  const d = new Date(`${date}T00:00:00`);
  const { to } = calendarWindow(now);
  if (date < earliestBookingDate(now) || date > to)
    return { date, state: "unavailable", slots: [] };

  const spans = weekly[WEEKDAYS[d.getDay()]!] ?? [];
  if (!spans.length || isBlackout(date, rules.blackouts))
    return { date, state: "closed", slots: [] };
  // No slot starts inside the notice the studio needs.
  const earliest = now.getTime() + (rules.noticeHours ?? 0) * 3_600_000;

  const taken = busy
    .filter((b) => b.roomId === null || b.roomId === roomId)
    .map((b) => [new Date(b.start).getTime(), new Date(b.end).getTime()] as const);

  const slots: Slot[] = [];
  for (const span of spans) {
    // A slot is a whole hour that fits inside the span.
    const first = Math.ceil(minutes(span.open) / 60);
    const last = Math.floor(minutes(span.close) / 60);
    for (let h = first; h < last; h += 1) {
      const start = at(date, h);
      const end = start + 3_600_000;
      const booked = taken.some(([s, e]) => s < end && e > start);
      slots.push({
        start: `${pad(h)}:00`,
        end: `${pad(h + 1)}:00`,
        state: booked ? "booked" : start < earliest ? "blocked" : "open",
      });
    }
  }
  slots.sort((a, b) => a.start.localeCompare(b.start));
  const open = slots.filter((s) => s.state === "open").length;
  return {
    date,
    state: open === 0 ? "unavailable" : open <= 3 ? "limited" : "available",
    slots,
    fromPrice,
  };
}

/** The first day after `after` with an open slot, inside the calendar window. */
export function nextOpenDay(
  dayOf: (date: string) => DayAvailability,
  after = new Date(),
): DayAvailability | undefined {
  for (let i = 1; i <= WINDOW_DAYS; i += 1) {
    const d = new Date(after);
    d.setDate(after.getDate() + i);
    const a = dayOf(isoDate(d));
    if (a.state === "available" || a.state === "limited") return a;
  }
  return undefined;
}

/** Whether `hours` from `start` stay on consecutive open slots of the day. */
export function spanIsOpen(day: DayAvailability | undefined, start: string, hours: number) {
  if (!day) return false;
  const h = Number(start.split(":")[0]);
  return Array.from({ length: Math.max(1, hours) }, (_, i) => `${pad(h + i)}:00`).every(
    (s) => day.slots.find((slot) => slot.start === s)?.state === "open",
  );
}
