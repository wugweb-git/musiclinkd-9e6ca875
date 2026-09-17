import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar, Btn, BtnLink, Chip } from "@/components/ml/ui";
import { BusinessOnlyGate } from "@/components/ml/kit";
import { useRequireBusiness } from "@/hooks/use-require-business";
import { AvailabilityCalendar, PolicyCard } from "@/components/ml/booking";
import { bookables, formatDate, inr } from "@/data/booking";

export const Route = createFileRoute("/business/availability")({
  head: () => ({
    meta: [
      { title: "Manage availability — MusicLinkd provider" },
      {
        name: "description",
        content:
          "Set opening hours, block dates, adjust rates and choose instant or request-first booking.",
      },
      { property: "og:title", content: "Manage availability — MusicLinkd provider" },
      {
        property: "og:description",
        content: "Opening hours, blocked dates and booking rules for your space.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Availability,
});

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Availability() {
  const gate = useRequireBusiness();
  return (
    <BusinessOnlyGate allowed={gate.allowed} loading={gate.loading} signedIn={gate.signedIn}>
      <AvailabilityContent />
    </BusinessOnlyGate>
  );
}

function AvailabilityContent() {
  const b = bookables[0]!;
  const [resourceId, setResourceId] = useState(b.resources[0]!.id);
  const [open, setOpen] = useState<string[]>(days.slice(0, 6));
  const [blocked, setBlocked] = useState<string[]>([]);
  const [instant, setInstant] = useState(false);
  const r = b.resources.find((x) => x.id === resourceId) ?? b.resources[0]!;

  // There is no provider availability table yet, so a save is kept on this device and read back
  // after mount (reading it during render would differ from the server's HTML).
  const storageKey = `ml:provider-availability:${b.id}`;
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as { open?: string[]; blocked?: string[]; instant?: boolean };
      if (saved.open) setOpen(saved.open);
      if (saved.blocked) setBlocked(saved.blocked);
      if (typeof saved.instant === "boolean") setInstant(saved.instant);
    } catch {
      /* nothing saved */
    }
  }, [storageKey]);

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ open, blocked, instant }));
      toast.success("Availability saved on this device");
    } catch {
      toast.error("Couldn't save availability");
    }
  }

  return (
    <Screen>
      <TopBar title="Availability" subtitle={b.name} back="/business/bookings" />
      <main className="px-5 pt-2">
        <div className="rail -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar">
          {b.resources.map((x) => (
            <Chip key={x.id} active={x.id === resourceId} onClick={() => setResourceId(x.id)}>
              {x.name}
            </Chip>
          ))}
        </div>

        <h2 className="mt-5 text-2">Opening days</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {days.map((d) => {
            const on = open.includes(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                onClick={() => setOpen((v) => (on ? v.filter((x) => x !== d) : [...v, d]))}
                className={`min-h-touch min-w-[52px] rounded-full border px-3 text-sm font-semibold ${
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>

        <h2 className="mt-6 text-2">Block specific dates</h2>
        <p className="mt-1 text-1 text-muted-foreground">
          Tap a date to close {r.name} for maintenance, private sessions or holidays.
        </p>
        <div className="mt-3">
          <AvailabilityCalendar
            resourceId={r.id}
            timezone={b.timezone}
            fromPrice={r.tiers[0]?.price ?? 0}
            selected={blocked[0]}
            onSelect={(d) =>
              setBlocked((v) => (v.includes(d) ? v.filter((x) => x !== d) : [d, ...v]))
            }
          />
        </div>
        {blocked.length ? (
          <ul className="mt-3 space-y-2">
            {blocked.map((d) => (
              <li
                key={d}
                className="flex min-h-control items-center justify-between rounded-lg bg-subtle px-4 text-sm"
              >
                {formatDate(d)}
                <button
                  type="button"
                  onClick={() => setBlocked((v) => v.filter((x) => x !== d))}
                  className="min-h-control-sm text-1 font-bold text-foreground"
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <h2 className="mt-6 text-2">Booking rules</h2>
        <button
          type="button"
          onClick={() => setInstant((v) => !v)}
          aria-pressed={instant}
          className="mt-3 flex w-full items-center gap-3 rounded-lg bg-subtle p-4 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Instant booking</span>
            <span className="block text-1 text-muted-foreground">
              {instant
                ? "Requests confirm automatically."
                : "You review every request before it confirms."}
            </span>
          </span>
          <span
            className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition ${instant ? "bg-primary" : "bg-background"}`}
            aria-hidden
          >
            <span
              className={`block h-5 w-5 rounded-full bg-card transition ${instant ? "translate-x-5" : ""}`}
            />
          </span>
        </button>

        <div className="mt-3 rounded-lg bg-subtle p-4">
          <p className="text-sm font-semibold">Rate for {r.name}</p>
          <div className="mt-2 space-y-1.5">
            {r.tiers.map((p) => (
              <div key={p.label} className="flex items-baseline justify-between text-1">
                <span className="text-muted-foreground">{p.label}</span>
                <span className="font-semibold text-price">{inr(p.price)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <PolicyCard
            title="Cancellation window"
            body="Customers can cancel free up to 48 hrs before the session. Inside that window, your own cancellation terms apply."
          />
        </div>

        <Btn className="mt-6 w-full" onClick={save}>
          Save Availability
        </Btn>
        <BtnLink to="/business/bookings" variant="ghost" className="mt-2 w-full">
          Back to Workspace
        </BtnLink>
      </main>
    </Screen>
  );
}
