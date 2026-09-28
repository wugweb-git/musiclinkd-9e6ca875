import { toast } from "sonner";
import { DOWNLOAD_UNAVAILABLE, downloadBlob, openExternal } from "@/lib/download";

/*
 * What the booking screens hand off to the phone: the calendar, the maps app and the share sheet.
 * All three run in the browser and send nothing to our servers.
 */

type CalendarEvent = {
  /** Unique per booking, so adding it twice updates the same calendar entry. */
  uid: string;
  title: string;
  /** "2026-09-19" */
  date: string;
  /** "16:00" */
  start: string;
  /** "20:00"; an end before the start runs past midnight. */
  end: string;
  location: string;
  description?: string | undefined;
};

/** Floating local time ("20260919T160000"), so the session lands at the hour it was booked for. */
function icsTime(date: string, time: string, addDays = 0) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + addDays);
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `${ymd}T${time.replace(":", "")}00`;
}

const escapeIcs = (text: string) =>
  text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

/** Downloads a one-event .ics file, which phones and desktop calendars open as "Add event". */
export function addToCalendar(e: CalendarEvent) {
  const overnight = e.end <= e.start;
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MusicLinkd//Bookings//EN",
    "BEGIN:VEVENT",
    `UID:${e.uid}@musiclinkd`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${icsTime(e.date, e.start)}`,
    `DTEND:${icsTime(e.date, e.end, overnight ? 1 : 0)}`,
    `SUMMARY:${escapeIcs(e.title)}`,
    `LOCATION:${escapeIcs(e.location)}`,
    ...(e.description ? [`DESCRIPTION:${escapeIcs(e.description)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  // It used to toast success whether or not anything was saved. In the Android wrap nothing was.
  if (downloadBlob(`${e.uid}.ics`, blob)) toast.success("Calendar event downloaded");
  else toast.error(DOWNLOAD_UNAVAILABLE);
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
