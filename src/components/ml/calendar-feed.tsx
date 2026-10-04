import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Btn, Sheet } from "@/components/ml/ui";
import { createCalendarFeed, type CalendarFeedLinks } from "@/lib/calendar-feed.functions";
import { openExternal } from "@/lib/download";
import { iconSize } from "@/lib/tokens";

/*
 * Settings → Integrations → Calendar (queue item 5d, 4 Oct 2026): subscribe once and your confirmed
 * bookings and rentals appear in Google, Apple or Outlook calendar by themselves — new, changed and
 * cancelled ones too. Nothing is downloaded. The link is private and shown once, when made; making
 * a new one stops the old one.
 */
export function CalendarFeedRow() {
  const create = useServerFn(createCalendarFeed);
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<CalendarFeedLinks | null>(null);
  const [busy, setBusy] = useState(false);

  const make = async () => {
    setBusy(true);
    try {
      setLinks(await create());
    } catch {
      toast.error("Couldn't make your calendar link. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="state-layer flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="flex h-10 w-7 shrink-0 items-center justify-center">
          <CalendarDays size={24} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-2 font-semibold">Calendar</span>
          <span className="block truncate text-1 text-muted-foreground">
            Your bookings in your calendar app
          </span>
        </span>
        <ChevronRight size={iconSize.md} className="shrink-0 text-muted-foreground" aria-hidden />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Calendar">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Subscribe once and your confirmed bookings and rentals appear in your calendar, and stay
            up to date. The link is private to you.
          </p>
          {links ? (
            <>
              <Btn className="w-full" onClick={() => openExternal(links.google)}>
                Google Calendar
              </Btn>
              <Btn variant="outline" className="w-full" onClick={() => openExternal(links.webcal)}>
                Apple Calendar
              </Btn>
              <Btn variant="outline" className="w-full" onClick={() => openExternal(links.outlook)}>
                Outlook
              </Btn>
              <Btn variant="ghost" className="w-full" loading={busy} onClick={() => void make()}>
                Reset link
              </Btn>
              <p className="text-1 text-muted-foreground">
                Reset makes a new link; calendars using the old one stop updating.
              </p>
            </>
          ) : (
            <Btn className="w-full" loading={busy} onClick={() => void make()}>
              Get my calendar link
            </Btn>
          )}
        </div>
      </Sheet>
    </>
  );
}
