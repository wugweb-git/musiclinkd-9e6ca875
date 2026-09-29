/*
 * Dates and times as the app writes them. These lived in `src/data/booking.ts` beside the booking
 * fixtures, which put a dozen route files on the hardcoded-content import list for the sake of
 * three pure functions that hold no data.
 *
 * A stored date is always `YYYY-MM-DD` in the viewer's own day, never a UTC instant: a session on
 * the 3rd is on the 3rd wherever it is read.
 */

/** A Date as the `YYYY-MM-DD` the app stores, in local time rather than UTC. */
export function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Today's `YYYY-MM-DD` in India (UTC+5:30), where every listing and studio is. The server's clock
 * is UTC and the viewer's may be anything, so this is the one "today" both sides agree on: the page
 * the server draws and the page the browser hydrates show the same first bookable day.
 */
export function todayInIndia(now = Date.now()) {
  return new Date(now + 5.5 * 3_600_000).toISOString().slice(0, 10);
}

/** "2026-09-24" → "Wed, 24 Sep". Parsed at local midnight so the day never slips a timezone. */
export function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

/** "14:30" → "2:30 PM". */
export function formatTime(t: string) {
  const [h = "0", m = "00"] = t.split(":");
  const hh = Number(h);
  const suffix = hh >= 12 ? "PM" : "AM";
  const disp = hh % 12 === 0 ? 12 : hh % 12;
  return `${disp}:${m} ${suffix}`;
}
