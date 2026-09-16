import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { StickyBar } from "@/components/ml/booking";
import { getBookable, inr } from "@/data/booking";

export const Route = createFileRoute("/provider/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — MusicLinkd provider" },
      {
        name: "description",
        content:
          "Set hourly, half-day, full-day and session rates for each room, plus add-on prices and the deposit you take at booking.",
      },
      { property: "og:title", content: "Pricing — MusicLinkd provider" },
      { property: "og:description", content: "Rates, add-ons and deposit for your space." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  const entity = getBookable("octave-sound-labs");
  const [deposit, setDeposit] = useState(entity?.depositPct ?? 25);
  const [rates, setRates] = useState<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    entity?.resources.forEach((r) => r.tiers.forEach((t) => (out[`${r.id}:${t.unit}`] = t.price)));
    return out;
  });
  const [addOns, setAddOns] = useState<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    entity?.addOns.forEach((a) => (out[a.id] = a.price));
    return out;
  });

  if (!entity) return null;

  return (
    <Screen bottomNav={false}>
      <TopBar title="Pricing" subtitle={entity.name} back="/provider/bookings" />

      <main className="space-y-6 px-5 pb-40 pt-4">
        <p className="rounded-lg bg-subtle px-4 py-3 text-1 text-muted-foreground">
          Rates shown here are what customers see on the booking screens. Changes apply to new
          bookings only.
        </p>

        {entity.resources.map((r) => (
          <section key={r.id} className="min-w-0">
            <h2 className="truncate text-2">{r.name}</h2>
            <p className="mt-0.5 truncate text-1 text-muted-foreground">{r.description}</p>
            <div className="mt-3 space-y-2">
              {r.tiers.map((t) => (
                <MoneyRow
                  key={`${r.id}:${t.unit}`}
                  label={t.label}
                  hint={`${t.hours || "custom"} hr`}
                  value={rates[`${r.id}:${t.unit}`] ?? t.price}
                  onChange={(v) => setRates((s) => ({ ...s, [`${r.id}:${t.unit}`]: v }))}
                />
              ))}
            </div>
          </section>
        ))}

        <section className="min-w-0">
          <h2 className="text-2">Add-ons</h2>
          <p className="mt-0.5 text-1 text-muted-foreground">
            Optional extras customers can add to a session.
          </p>
          <div className="mt-3 space-y-2">
            {entity.addOns.map((a) => (
              <MoneyRow
                key={a.id}
                label={a.name}
                hint={a.perHour ? "per hour" : "per session"}
                value={addOns[a.id] ?? a.price}
                onChange={(v) => setAddOns((s) => ({ ...s, [a.id]: v }))}
              />
            ))}
          </div>
        </section>

        <section className="min-w-0">
          <h2 className="text-2">Deposit</h2>
          <p className="mt-0.5 text-1 text-muted-foreground">
            Share of the total collected when a booking is confirmed. The balance is due at the
            studio.
          </p>
          <div className="mt-3 rounded-lg border border-border bg-card p-4">
            <label htmlFor="deposit" className="text-1 font-semibold">
              Deposit percentage
            </label>
            <input
              id="deposit"
              type="range"
              min={0}
              max={100}
              step={5}
              value={deposit}
              onChange={(e) => setDeposit(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--primary)]"
            />
            <div className="mt-2 flex items-center justify-between text-1">
              <span className="font-bold">{deposit}%</span>
              <span className="text-muted-foreground">
                On a {inr(10000)} session that's {inr(Math.round(10000 * (deposit / 100)))} upfront
              </span>
            </div>
          </div>
        </section>

        <p className="text-1 text-muted-foreground">
          Taxes are applied at {entity.taxPct}% on top of the session total.
        </p>
      </main>

      <StickyBar
        primaryLabel="Save pricing"
        hint="Applies to new bookings only"
        onPrimary={() => toast.success("Pricing saved for this session")}
      />
    </Screen>
  );
}

function MoneyRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const id = `rate-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-3">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block truncate text-1 font-semibold">
          {label}
        </label>
        {hint ? <p className="truncate text-1 text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-1 rounded-full bg-subtle px-3 py-2">
        <span className="text-1 font-semibold text-muted-foreground">₹</span>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 bg-transparent text-right text-1 font-bold outline-none"
        />
      </div>
    </div>
  );
}
