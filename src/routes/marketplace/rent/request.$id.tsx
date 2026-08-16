import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import {
  FulfilmentPicker,
  PriceBreakdown,
  ProviderSummary,
  RentalAvailabilityBadge,
  RentalCalendar,
} from "@/components/ml/rental";
import { equipmentById, inr, providerById } from "@/data/rentals";

export const Route = createFileRoute("/marketplace/rent/request/$id")({
  head: ({ params }) => {
    const e = equipmentById(params.id);
    const title = e ? `Request ${e.name} | MusicLinkd Rentals` : "Rental request | MusicLinkd";
    return {
      meta: [
        { title },
        {
          name: "description",
          content: "Pick your rental dates, quantity and pickup or delivery, then send the request to the provider.",
        },
        { property: "og:title", content: title },
        { property: "og:description", content: "Check availability and request equipment on MusicLinkd." },
      ],
    };
  },
  component: RequestFlow,
});

type Step = "dates" | "summary" | "request" | "confirmed";

function RequestFlow() {
  const { id } = Route.useParams();
  const e = equipmentById(id);
  const [step, setStep] = useState<Step>("dates");
  const [start, setStart] = useState<number | null>(18);
  const [end, setEnd] = useState<number | null>(22);
  const [qty, setQty] = useState(1);
  const [fulfilment, setFulfilment] = useState("Pickup");
  const [note, setNote] = useState("");

  if (!e) {
    return (
      <Screen>
        <TopBar title="Rental unavailable" back="/marketplace/rent" />
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          This equipment is no longer listed for rent.
        </p>
      </Screen>
    );
  }

  const p = providerById(e.providerId)!;
  const days = start !== null && end !== null ? Math.max(end - start + 1, e.minDays) : e.minDays;
  const delivery = fulfilment !== "Pickup";

  const pick = (day: number) => {
    if (start === null || (start !== null && end !== null)) {
      setStart(day);
      setEnd(null);
      return;
    }
    if (day < start) {
      setStart(day);
      return;
    }
    setEnd(day);
  };

  const titles: Record<Step, string> = {
    dates: "Check availability",
    summary: "Rental summary",
    request: "Rental request",
    confirmed: "Rental confirmed",
  };

  return (
    <Screen>
      <TopBar
        title={titles[step]}
        subtitle={e.name}
        back="/marketplace/rent"
      />

      <div className="px-5 py-4">
        <div className="mb-4 flex gap-1.5">
          {(["dates", "summary", "request", "confirmed"] as Step[]).map((s, i) => {
            const order = ["dates", "summary", "request", "confirmed"];
            const active = order.indexOf(step) >= i;
            return (
              <span
                key={s}
                className="h-1 flex-1 rounded-full"
                style={{ background: active ? "var(--primary)" : "var(--border)" }}
              />
            );
          })}
        </div>

        <div className="mb-4 flex items-center gap-3 rounded-3xl border border-border bg-card p-3">
          <img src={e.photos[0]} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">{e.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {inr(e.daily)} / day · deposit {inr(e.deposit)}
            </p>
          </div>
        </div>

        {step === "dates" ? (
          <>
            <RentalCalendar e={e} start={start} end={end} onSelect={pick} />
            <div className="mt-4 flex items-center justify-between rounded-3xl border border-border bg-card px-4 py-3">
              <div>
                <p className="text-[13px] font-semibold">Quantity</p>
                <p className="text-[11px] text-muted-foreground">{e.quantity} available</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  aria-label="Decrease"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border"
                >
                  <Minus size={14} />
                </button>
                <span className="w-5 text-center text-[15px] font-bold">{qty}</span>
                <button
                  aria-label="Increase"
                  onClick={() => setQty((q) => Math.min(e.quantity, q + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {end === null ? (
                <RentalAvailabilityBadge text="Select an end date" tone="warn" />
              ) : (
                <RentalAvailabilityBadge text={`Available · ${days} days`} />
              )}
              <span className="text-[11px] text-muted-foreground">
                Aug {start ?? "–"} → Aug {end ?? "–"}
              </span>
            </div>
            <Btn className="mt-5 w-full" onClick={() => setStep("summary")}>
              Continue
            </Btn>
          </>
        ) : null}

        {step === "summary" ? (
          <>
            <h2 className="mb-2 text-[15px]">Delivery or pickup</h2>
            <FulfilmentPicker e={e} value={fulfilment} onChange={setFulfilment} />
            <h2 className="mb-2 mt-5 text-[15px]">Price breakdown</h2>
            <PriceBreakdown e={e} days={days} quantity={qty} delivery={delivery} />
            <Btn className="mt-5 w-full" onClick={() => setStep("request")}>
              Request rental
            </Btn>
            <Btn variant="outline" className="mt-2 w-full" onClick={() => setStep("dates")}>
              Change dates
            </Btn>
          </>
        ) : null}

        {step === "request" ? (
          <>
            <div className="rounded-3xl border border-border bg-card p-4">
              <ProviderSummary p={p} />
            </div>
            <dl className="mt-4 divide-y divide-border rounded-3xl border border-border">
              {[
                { k: "Dates", v: `Aug ${start} – Aug ${end} (${days} days)` },
                { k: "Quantity", v: `${qty}` },
                { k: "Fulfilment", v: fulfilment },
                { k: "Location", v: e.location },
              ].map((r) => (
                <div key={r.k} className="flex items-center justify-between gap-3 px-4 py-3">
                  <dt className="text-xs text-muted-foreground">{r.k}</dt>
                  <dd className="text-right text-xs font-semibold">{r.v}</dd>
                </div>
              ))}
            </dl>
            <label className="mb-1.5 mt-4 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Message to provider (optional)
            </label>
            <textarea
              value={note}
              onChange={(ev) => setNote(ev.target.value)}
              rows={3}
              placeholder="Recording at Famous Studios, need it from 10 am on the 18th."
              className="w-full rounded-3xl border border-border bg-card p-4 text-sm outline-none focus:border-primary"
            />
            <p className="mt-3 text-[11px] text-muted-foreground">
              No payment is taken now. The provider confirms availability and the final amount in your
              conversation.
            </p>
            <Btn className="mt-4 w-full" onClick={() => setStep("confirmed")}>
              Send rental request
            </Btn>
            <Btn variant="outline" className="mt-2 w-full" onClick={() => setStep("summary")}>
              Save draft
            </Btn>
          </>
        ) : null}

        {step === "confirmed" ? (
          <div className="py-6 text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl"
              style={{ background: "var(--success-container)" }}
            >
              ✓
            </div>
            <h2 className="text-xl">Request sent</h2>
            <p className="mx-auto mt-2 max-w-[280px] text-sm text-muted-foreground">
              {p.name} usually replies {p.responseTime.toLowerCase()}. You'll get a notification when
              they accept, decline or counter.
            </p>
            <dl className="mt-5 divide-y divide-border rounded-3xl border border-border text-left">
              {[
                { k: "Reference", v: "ML-RNT-48310" },
                { k: "Equipment", v: e.name },
                { k: "Dates", v: `Aug ${start} – Aug ${end}` },
                { k: "Fulfilment", v: fulfilment },
                { k: "Deposit", v: inr(e.deposit * qty) },
              ].map((r) => (
                <div key={r.k} className="flex items-center justify-between gap-3 px-4 py-3">
                  <dt className="text-xs text-muted-foreground">{r.k}</dt>
                  <dd className="text-right text-xs font-semibold">{r.v}</dd>
                </div>
              ))}
            </dl>
            <Link to="/marketplace/rent/mine" className="mt-5 block">
              <Btn className="w-full">View rental</Btn>
            </Link>
            <Link to="/messages" className="mt-2 block">
              <Btn variant="outline" className="w-full">Message provider</Btn>
            </Link>
          </div>
        ) : null}
      </div>
    </Screen>
  );
}
