import { toast } from "sonner";
import { openExternal } from "@/lib/download";
import { isNativeApp } from "@/lib/native-auth";

/*
 * What the booking screens hand off to the phone: the calendar, the maps app and the share sheet.
 * None of them sends anything to our servers.
 */

type CalendarEvent = {
  /** The booking's id. */
  uid: string;
  title: string;
  /** "2026-09-19" */
  date: string;
  /** "16:00"; absent for a whole-day booking (no time was asked for). */
  start?: string | undefined;
  /** "20:00"; an end before the start runs past midnight. Absent: the start plus `hours`. */
  end?: string | undefined;
  hours?: number | undefined;
  location: string;
  description?: string | undefined;
};

/*
 * Add to calendar (owner, 4 Oct 2026, queue item 5): never a downloaded .ics file — the system's
 * own calendar. In the Android app, the calendar app's own "new event" screen, pre-filled (no
 * permission: it is the platform's insert intent); on the web, Google Calendar's own add-event page
 * (which opens the Google Calendar app on Android). MusicLinkd stays the source of truth; this
 * mirrors a confirmed booking for the person, nothing is read back.
 */

/** The booking's start and end as instants. Bookings are in India time; an end before the start runs past midnight. */
function span(e: CalendarEvent) {
  if (!e.start) {
    const day = new Date(`${e.date}T00:00:00+05:30`).getTime();
    return { start: day, end: day + 86_400_000, allDay: true };
  }
  const start = new Date(`${e.date}T${e.start}:00+05:30`).getTime();
  let end = e.end
    ? new Date(`${e.date}T${e.end}:00+05:30`).getTime()
    : start + (e.hours ?? 1) * 3_600_000;
  if (end <= start) end += 86_400_000;
  return { start, end, allDay: false };
}

/** "20260919T103000Z", as Google Calendar's add-event link takes it. */
const utcStamp = (ms: number) =>
  new Date(ms)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

/**
 * Opens the system calendar's add-event screen for a booking. Resolves "app" when the Android
 * calendar's own screen opened (it doesn't say whether the person saved — so the caller offers
 * "Open in calendar", never claims "Added"), "web" when Google Calendar's page opened, "failed"
 * when neither could.
 */
export async function addToCalendar(e: CalendarEvent): Promise<"app" | "web" | "failed"> {
  const { start, end, allDay } = span(e);
  if (isNativeApp()) {
    try {
      const { CapacitorCalendar } = await import("@ebarooni/capacitor-calendar");
      await CapacitorCalendar.createEventWithPrompt({
        title: e.title,
        location: e.location,
        ...(e.description ? { description: e.description } : {}),
        startDate: start,
        endDate: end,
        isAllDay: allDay,
      });
      return "app";
    } catch {
      toast.error("Couldn't open your calendar");
      return "failed";
    }
  }
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    // A whole day is two dates; a timed booking, two instants.
    dates: allDay
      ? `${e.date.replace(/-/g, "")}/${new Date(end + 19_800_000).toISOString().slice(0, 10).replace(/-/g, "")}`
      : `${utcStamp(start)}/${utcStamp(end)}`,
    location: e.location,
    details: e.description ?? "",
    ctz: "Asia/Kolkata",
  });
  openExternal(`https://calendar.google.com/calendar/render?${params.toString()}`);
  return "web";
}

/** The phone's calendar app, at a booking's day (after "Add to calendar" in the Android app). */
export async function openInCalendar(e: Pick<CalendarEvent, "date" | "start">) {
  try {
    const { CapacitorCalendar } = await import("@ebarooni/capacitor-calendar");
    await CapacitorCalendar.openCalendar({
      date: new Date(`${e.date}T${e.start ?? "00:00"}:00+05:30`).getTime(),
    });
  } catch {
    toast.error("Couldn't open your calendar");
  }
}

/** Opens directions to a place in Google Maps (the app on a phone that has it). */
export function openDirections(place: string) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place)}`;
  openExternal(url);
}

/** The share sheet where the device has one; otherwise the link goes to the clipboard. */
export async function shareLink({ title, url }: { title: string; url: string }) {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title, url });
    } catch {
      // Closing the sheet is not an error.
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  } catch {
    toast.error("Couldn't copy the link");
  }
}
