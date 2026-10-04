import { useState } from "react";
import {
  autoSyncOn,
  busyHintsOn,
  deviceCalendarAvailable,
  disableAutoSync,
  enableAutoSync,
  setBusyHints,
} from "@/lib/device-calendar";
import { Switch } from "@/components/ml/kit";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Btn, Sheet } from "@/components/ml/ui";
import {
  createCalendarFeed,
  listMyCalendarItems,
  type CalendarFeedLinks,
} from "@/lib/calendar-feed.functions";
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
  // In the Android app only: the phone's own calendar, both opt-in (5b, 5c).
  const onDevice = deviceCalendarAvailable();
  const loadItems = useServerFn(listMyCalendarItems);
  const [syncing, setSyncing] = useState(autoSyncOn);
  const [hints, setHints] = useState(busyHintsOn);

  const toggleSync = async (on: boolean) => {
    try {
      if (!on) {
        await disableAutoSync();
        setSyncing(false);
        return;
      }
      if (await enableAutoSync(await loadItems())) setSyncing(true);
      else toast.error("Calendar access wasn't allowed");
    } catch {
      toast.error("Couldn't reach your calendar. Try again.");
    }
  };
  const toggleHints = async (on: boolean) => {
    if (await setBusyHints(on)) setHints(on);
    else toast.error("Calendar access wasn't allowed");
  };

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
          {onDevice ? (
            <div className="space-y-3 border-t border-border pt-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm">Keep my bookings in my calendar</span>
                <Switch
                  checked={syncing}
                  onChange={(on) => void toggleSync(on)}
                  label="Keep my bookings in my calendar"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm">Show my busy times when booking</span>
                <Switch
                  checked={hints}
                  onChange={(on) => void toggleHints(on)}
                  label="Show my busy times when booking"
                />
              </div>
              <p className="text-1 text-muted-foreground">
                Bookings go into a calendar named MusicLinkd on this phone. Busy times stay on this
                phone and are only a hint; a booking is confirmed by the other person.
              </p>
            </div>
          ) : null}
        </div>
      </Sheet>
    </>
  );
}
