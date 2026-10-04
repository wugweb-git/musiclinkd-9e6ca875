/*
 * Whether a service is booked for a time (owner, 4 Oct 2026, queue item 12): the Service decides,
 * never the profile. In person or touring means a date and time, and protection against overlapping
 * bookings; remote-only work is async — no date step, no lock. The database decides the same way
 * (service_is_time_based, 20261004170000). Work modes come spelled two ways ("in_person" on
 * services, "in-person" on profiles), so separators are ignored.
 */
export function isTimeBasedService(workModes: string[] | null | undefined): boolean {
  const modes = (workModes ?? []).map((m) => m.replace(/[-_\s]/g, "").toLowerCase());
  if (!modes.length) return true;
  return modes.some((m) => m === "inperson" || m === "touring" || m === "hybrid");
}
