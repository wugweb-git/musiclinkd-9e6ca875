import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Screen, TopBar, Btn, Chip } from "@/components/ml/ui";
import { StickyBar } from "@/components/ml/booking";
import { getBookable } from "@/data/booking";

export const Route = createFileRoute("/provider/policies")({
  head: () => ({
    meta: [
      { title: "Booking policies — MusicLinkd provider" },
      {
        name: "description",
        content:
          "Cancellation, rescheduling, deposit, payment, overtime, arrival and equipment rules customers must accept before they book your space.",
      },
      { property: "og:title", content: "Booking policies — MusicLinkd provider" },
      {
        property: "og:description",
        content: "The rules customers agree to when booking your space.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Policies,
});

const cancellationWindows = ["Flexible · 24 hrs", "Moderate · 48 hrs", "Strict · 7 days"] as const;

const sections = [
  {
    id: "cancellation",
    title: "Cancellation",
    placeholder: "What happens when a customer cancels, and what is refunded.",
  },
  {
    id: "reschedule",
    title: "Rescheduling",
    placeholder: "How far ahead a session can be moved, and how many times.",
  },
  {
    id: "deposit",
    title: "Deposit",
    placeholder: "What you take upfront and whether it is refundable.",
  },
  {
    id: "payment",
    title: "Payment",
    placeholder: "When the balance is due and which methods you accept.",
  },
  {
    id: "overtime",
    title: "Overtime",
    placeholder: "What you charge if a session runs past its end time.",
  },
  {
    id: "arrival",
    title: "Arrival & access",
    placeholder: "Entry, setup time, ID and late arrival.",
  },
  {
    id: "equipment",
    title: "Equipment & damage",
    placeholder: "What's included, what's chargeable and damage liability.",
  },
] as const;

function Policies() {
  const entity = getBookable("octave-sound-labs");
  const [window, setWindow] = useState<(typeof cancellationWindows)[number]>("Moderate · 48 hrs");
  const [text, setText] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    sections.forEach((s) => {
      const match = entity?.policies.find((p) => p.title.toLowerCase().includes(s.id.slice(0, 6)));
      out[s.id] = match?.body ?? "";
    });
    return out;
  });

  return (
    <Screen bottomNav={false}>
      <TopBar title="Policies" subtitle={entity?.name ?? "Your space"} back="/provider/bookings" />

      <main className="space-y-6 px-5 pb-40 pt-4">
        <p className="rounded-lg bg-subtle px-4 py-3 text-1 text-muted-foreground">
          Customers see these before they request a session and must accept them to book. Keep them
          short and specific.
        </p>

        <section>
          <h2 className="text-2">Cancellation window</h2>
          <div className="rail no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            {cancellationWindows.map((w) => (
              <Chip key={w} active={window === w} onClick={() => setWindow(w)}>
                {w}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-1 text-muted-foreground">
            Cancellations inside this window keep the deposit.
          </p>
        </section>

        {sections.map((s) => (
          <section key={s.id} className="min-w-0">
            <label htmlFor={s.id} className="text-2">
              {s.title}
            </label>
            <textarea
              id={s.id}
              rows={3}
              value={text[s.id] ?? ""}
              placeholder={s.placeholder}
              onChange={(e) => setText((t) => ({ ...t, [s.id]: e.target.value }))}
              className="mt-2 w-full resize-none rounded-lg bg-subtle p-4 text-1 leading-relaxed outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </section>
        ))}
      </main>

      <StickyBar
        primaryLabel="Save policies"
        hint="Applies to new bookings only"
        onPrimary={() => toast.success("Policies saved for this session")}
      />
    </Screen>
  );
}
