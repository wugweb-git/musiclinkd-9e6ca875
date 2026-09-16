import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import {
  FulfilmentPicker,
  PriceBreakdown,
  ProviderSummary,
  RentalAvailabilityBadge,
  RentalCalendar,
} from "@/components/ml/rental";
import { equipmentById, inr, providerById } from "@/data/rentals";
import { Price } from "@/components/ml/kit";
import { rupeeParts } from "@/lib/price";

export const Route = createFileRoute("/marketplace/rent/request/$id")({
  head: ({ params }) => {
    const e = equipmentById(params.id);
    const title = e ? `Request ${e.name} | MusicLinkd Rentals` : "Rental request | MusicLinkd";
    return {
      meta: [
        { title },
        {
          name: "description",
          content:
            "Pick your rental dates, quantity and pickup or delivery, then send the request to the provider.",
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: "Check availability and request equipment on MusicLinkd.",
        },
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
      <TopBar title={titles[step]} subtitle={e.name} back="/marketplace/rent" />

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

        <div className="mb-4 flex items-center gap-3 rounded-lg bg-subtle p-3">
          <img src={e.photos[0]} alt="" className="h-14 w-14 shrink-0 rounded-sm object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-1 font-semibold">{e.name}</p>
            <Price
              price={rupeeParts(e.daily, "day")}
              amountClassName="text-1 font-semibold"
              unitClassName="text-1"
            />
            <p className="truncate text-1 text-muted-foreground">Deposit {inr(e.deposit)}</p>
          </div>
        </div>

        {step === "dates" ? (
          <>
            <RentalCalendar e={e} start={start} end={end} onSelect={pick} />
            <div className="mt-4 flex items-center justify-between rounded-lg bg-subtle px-4 py-3">
              <div>
                <p className="text-1 font-semibold">Quantity</p>
                <p className="text-1 text-muted-foreground">{e.quantity} available</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  aria-label="Decrease"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border"
                >
                  <Minus size={16} />
                </button>
                <span className="w-5 text-center text-sm font-bold">{qty}</span>
                <button
                  aria-label="Increase"
                  onClick={() => setQty((q) => Math.min(e.quantity, q + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {end === null ? (
                <RentalAvailabilityBadge text="Select an end date" tone="warn" />
              ) : (
                <RentalAvailabilityBadge text={`Available · ${days} days`} />
              )}
              <span className="text-1 text-muted-foreground">
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
            <h2 className="mb-2 text-sm">Delivery or pickup</h2>
            <FulfilmentPicker e={e} value={fulfilment} onChange={setFulfilment} />
            <h2 className="mb-2 mt-5 text-sm">Price breakdown</h2>
            <PriceBreakdown e={e} days={days} quantity={qty} delivery={delivery} />
            <Btn className="mt-5 w-full" onClick={() => setStep("request")}>
              Request Rental
            </Btn>
            <Btn variant="outline" className="mt-2 w-full" onClick={() => setStep("dates")}>
              Change Dates
            </Btn>
          </>
        ) : null}

        {step === "request" ? (
          <>
            <div className="rounded-lg bg-subtle p-4">
              <ProviderSummary p={p} />
            </div>
            <dl className="mt-4 divide-y divide-border rounded-lg border border-border">
              {[
                { k: "Dates", v: `Aug ${start} – Aug ${end} (${days} days)` },
                { k: "Quantity", v: `${qty}` },
                { k: "Fulfilment", v: fulfilment },
                { k: "Location", v: e.location },
              ].map((r) => (
                <div key={r.k} className="flex items-center justify-between gap-3 px-4 py-3">
                  <dt className="text-1 text-muted-foreground">{r.k}</dt>
                  <dd className="text-right text-1 font-semibold">{r.v}</dd>
                </div>
              ))}
            </dl>
            <label
              htmlFor="message-to-provider-optional"
              className="mb-1.5 mt-4 block text-1 font-medium text-muted-foreground"
            >
              Message to provider (optional)
            </label>
            <textarea
              id="message-to-provider-optional"
              value={note}
              onChange={(ev) => setNote(ev.target.value)}
              rows={3}
              placeholder="Recording at Famous Studios, need it from 10 am on the 18th."
              className="w-full rounded-lg border border-border bg-card p-4 text-sm outline-none focus:border-primary"
            />
            <p className="mt-3 text-1 text-muted-foreground">
              No payment is taken now. The provider confirms availability and the final amount in
              your conversation.
            </p>
            <Btn className="mt-4 w-full" onClick={() => setStep("confirmed")}>
              Send Rental Request
            </Btn>
            <Btn variant="outline" className="mt-2 w-full" onClick={() => setStep("summary")}>
              Save Draft
            </Btn>
          </>
        ) : null}

        {step === "confirmed" ? (
          <div className="py-6 text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3"
              style={{ background: "var(--success-container)" }}
            >
              ✓
            </div>
            <h2 className="text-3">Request sent</h2>
            <p className="mx-auto mt-2 max-w-[280px] text-sm text-muted-foreground">
              {p.name} usually replies {p.responseTime.toLowerCase()}. You'll get a notification
              when they accept, decline or counter.
            </p>
            <dl className="mt-5 divide-y divide-border rounded-lg border border-border text-left">
              {[
                { k: "Reference", v: "ML-RNT-48310" },
                { k: "Equipment", v: e.name },
                { k: "Dates", v: `Aug ${start} – Aug ${end}` },
                { k: "Fulfilment", v: fulfilment },
                { k: "Deposit", v: inr(e.deposit * qty) },
              ].map((r) => (
                <div key={r.k} className="flex items-center justify-between gap-3 px-4 py-3">
                  <dt className="text-1 text-muted-foreground">{r.k}</dt>
                  <dd className="text-right text-1 font-semibold">{r.v}</dd>
                </div>
              ))}
            </dl>
            <BtnLink to="/marketplace/rent/mine" className="mt-5 w-full">
              View Rental
            </BtnLink>
            <BtnLink to="/messages" variant="outline" className="mt-2 w-full">
              Message Provider
            </BtnLink>
          </div>
        ) : null}
      </div>
    </Screen>
  );
}
