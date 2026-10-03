import type { BookingRequest } from "@/lib/bookings.functions";
import {
  WEEKDAYS,
  hasWeeklyHours,
  isBlackout,
  type BlackoutRange,
  type WeeklyHours,
} from "@/lib/bookable-slots";

/*
 * Which booking requests ask for the same time. A request doesn't hold its slot (owner, 21 Sep
 * 2026): several people can ask for one hour, and the business decides who gets it. Shared by the
 * conflicts screen and the request screen.
 */

const ACTIVE = ["requested", "reviewing", "confirmed"];

/**
 * Same place (or the same provider, for a service with no place), same day, and the hours cross.
 * One calendar per place (owner, 3 Oct 2026): any two bookings of it can clash.
 */
export function overlaps(a: BookingRequest, b: BookingRequest) {
  if (a.id === b.id || a.session_date !== b.session_date) return false;
  const place = (r: BookingRequest) => r.studio?.id ?? r.bookable_name ?? r.service?.profile_id;
  if (place(a) !== place(b)) return false;
  if (!a.start_time || !a.end_time || !b.start_time || !b.end_time) return false;
  return a.start_time < b.end_time && b.start_time < a.end_time;
}

/** Every pair of active requests that ask for the same time. */
export function findConflicts(bookings: BookingRequest[]) {
  const active = bookings.filter((b) => ACTIVE.includes(b.status));
  const pairs: { a: BookingRequest; b: BookingRequest }[] = [];
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      if (overlaps(active[i]!, active[j]!)) pairs.push({ a: active[i]!, b: active[j]! });
    }
  }
  return pairs;
}

export type AvailabilityConflict = {
  booking: BookingRequest;
  kind: "Outside your hours" | "No availability";
  detail: string;
};

const mins = (hhmm: string) => {
  const [h = "0", m = "0"] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
};

/**
 * Active requests from today on that the studio's own calendar doesn't allow: on a blackout day
 * or a weekday it is closed ("No availability"), or at a time outside that day's opening hours
 * ("Outside your hours"). The weekly hours only count once the studio has set some.
 */
export function availabilityConflicts(
  bookings: BookingRequest[],
  cal: { weeklyHours: WeeklyHours; blackouts: BlackoutRange[] },
  today: string,
): AvailabilityConflict[] {
  const hasHours = hasWeeklyHours(cal.weeklyHours);
  const out: AvailabilityConflict[] = [];
  for (const b of bookings) {
    if (!ACTIVE.includes(b.status) || b.session_date < today) continue;
    if (isBlackout(b.session_date, cal.blackouts)) {
      out.push({ booking: b, kind: "No availability", detail: "on a day you've blacked out" });
      continue;
    }
    if (!hasHours) continue;
    const day = WEEKDAYS[new Date(`${b.session_date}T00:00:00`).getDay()]!;
    const spans = cal.weeklyHours[day] ?? [];
    if (!spans.length) {
      out.push({ booking: b, kind: "No availability", detail: "on a day you're closed" });
      continue;
    }
    if (!b.start_time) continue;
    const start = mins(b.start_time.slice(0, 5));
    // An end at midnight ("00:00") is the end of the day.
    const end = b.end_time ? mins(b.end_time.slice(0, 5)) || 24 * 60 : start + (b.hours ?? 1) * 60;
    if (!spans.some((s) => start >= mins(s.open) && end <= mins(s.close))) {
      const hours = spans.map((s) => `${s.open}–${s.close}`).join(", ");
      out.push({ booking: b, kind: "Outside your hours", detail: `outside your hours (${hours})` });
    }
  }
  return out;
}

/** The other requests still waiting for an answer that ask for the same time as this one. */
export function waitingAlongside(request: BookingRequest, bookings: BookingRequest[]) {
  return bookings.filter(
    (b) => (b.status === "requested" || b.status === "reviewing") && overlaps(request, b),
  );
}
