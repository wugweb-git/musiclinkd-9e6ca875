import { isNativeApp } from "@/lib/native-auth";
import type { CalendarItem } from "@/lib/calendar-feed.server";

/*
 * The phone's own calendar, in the Android app only (queue item 5, Release 2, 4 Oct 2026). Both
 * opt-in, both off by default, and MusicLinkd stays the only authority:
 *
 *   5b  "Keep my bookings in my calendar": a calendar named MusicLinkd (one switch hides or
 *       removes it all), into which confirmed bookings and rentals are written, updated and
 *       removed to match. Event ids live on this device only (localStorage), never in the
 *       database; nothing is read back.
 *   5c  "Show my busy times when booking": the person's own events for a day, as a hint while
 *       they pick a time. Never uploaded or stored; the server still checks and decides.
 */

const SYNC_KEY = "ml:calendar-sync";
const BUSY_KEY = "ml:calendar-busy-hints";

type SyncState = {
  calendarId: string;
  /** item key → device event id and the item's last written shape. */
  events: Record<string, { id: string; sig: string }>;
};

function readSync(): SyncState | null {
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    return raw ? (JSON.parse(raw) as SyncState) : null;
  } catch {
    return null;
  }
}

function writeSync(state: SyncState | null) {
  try {
    if (state) localStorage.setItem(SYNC_KEY, JSON.stringify(state));
    else localStorage.removeItem(SYNC_KEY);
  } catch {
    // Storage blocked: the switch simply won't stay on.
  }
}

const plugin = async () => (await import("@ebarooni/capacitor-calendar")).CapacitorCalendar;

export const deviceCalendarAvailable = () => isNativeApp();
export const autoSyncOn = () => readSync() !== null;

/** Turns 5b on: write access, the MusicLinkd calendar, a first sync. False if access was refused. */
export async function enableAutoSync(items: CalendarItem[]): Promise<boolean> {
  const cal = await plugin();
  const { result } = await cal.requestWriteOnlyCalendarAccess();
  if (result !== "granted") return false;
  const { id } = await cal.createCalendar({ title: "MusicLinkd", color: "#EA4C89" });
  writeSync({ calendarId: id, events: {} });
  await syncDeviceCalendar(items);
  return true;
}

/** Turns 5b off and removes the MusicLinkd calendar, with everything in it. */
export async function disableAutoSync() {
  const state = readSync();
  writeSync(null);
  if (!state) return;
  try {
    await (await plugin()).deleteCalendar({ id: state.calendarId });
  } catch {
    // Already removed by the person in their calendar app.
  }
}

const sig = (i: CalendarItem) => [i.title, i.start, i.end, i.allDay, i.location].join("|");

/** Brings the MusicLinkd calendar in line with the confirmed bookings and rentals given. */
export async function syncDeviceCalendar(items: CalendarItem[]) {
  const state = readSync();
  if (!state || !isNativeApp()) return;
  const cal = await plugin();
  const wanted = new Map(items.map((i) => [i.key, i]));
  for (const [key, item] of wanted) {
    const have = state.events[key];
    const fields = {
      title: item.title,
      startDate: item.start,
      endDate: item.end,
      isAllDay: item.allDay,
      ...(item.location ? { location: item.location } : {}),
      url: item.url,
    };
    if (!have) {
      const { id } = await cal.createEvent({ ...fields, calendarId: state.calendarId });
      if (id) state.events[key] = { id, sig: sig(item) };
    } else if (have.sig !== sig(item)) {
      await cal.modifyEvent({ id: have.id, ...fields });
      have.sig = sig(item);
    }
  }
  const gone = Object.keys(state.events).filter((k) => !wanted.has(k));
  if (gone.length) {
    await cal.deleteEventsById({ ids: gone.map((k) => state.events[k]!.id) });
    for (const k of gone) delete state.events[k];
  }
  writeSync(state);
}

export const busyHintsOn = () => {
  try {
    return localStorage.getItem(BUSY_KEY) === "1";
  } catch {
    return false;
  }
};

/** Turns 5c on (read access) or off. False if access was refused. */
export async function setBusyHints(on: boolean): Promise<boolean> {
  try {
    if (!on) {
      localStorage.removeItem(BUSY_KEY);
      return true;
    }
    const { result } = await (await plugin()).requestReadOnlyCalendarAccess();
    if (result !== "granted") return false;
    localStorage.setItem(BUSY_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

/** The person's own busy times on a day ("2026-10-05"), as "10:00–12:00", from their calendar. */
export async function busyTimesOn(date: string): Promise<string[]> {
  if (!isNativeApp() || !busyHintsOn()) return [];
  try {
    const from = new Date(`${date}T00:00:00+05:30`).getTime();
    const { result } = await (await plugin()).listEventsInRange({ from, to: from + 86_400_000 });
    const hhmm = (ms: number) => new Date(ms + 19_800_000).toISOString().slice(11, 16);
    return result
      .filter((e) => !e.isAllDay)
      .sort((a, b) => a.startDate - b.startDate)
      .map((e) => `${hhmm(e.startDate)}–${hhmm(e.endDate)}`);
  } catch {
    return [];
  }
}
