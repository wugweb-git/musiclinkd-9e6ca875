import type { BookingRequest } from "@/lib/bookings.functions";

/*
 * Which booking requests ask for the same time. A request doesn't hold its slot (owner, 21 Sep
 * 2026): several people can ask for one hour, and the business decides who gets it. Shared by the
 * conflicts screen and the request screen.
 */

const ACTIVE = ["requested", "reviewing", "confirmed"];

/** Same studio, same room (or the whole studio), same day, and the hours cross. */
export function overlaps(a: BookingRequest, b: BookingRequest) {
  if (a.id === b.id || a.session_date !== b.session_date) return false;
  if ((a.studio?.id ?? a.studio_name) !== (b.studio?.id ?? b.studio_name)) return false;
  if (a.room && b.room && a.room.id !== b.room.id) return false;
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

/** The other requests still waiting for an answer that ask for the same time as this one. */
export function waitingAlongside(request: BookingRequest, bookings: BookingRequest[]) {
  return bookings.filter(
    (b) => (b.status === "requested" || b.status === "reviewing") && overlaps(request, b),
  );
}
