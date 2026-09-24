import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import {
  FulfilmentPicker,
  PriceBreakdown,
  ProviderSummary,
  RentalAvailabilityBadge,
  RentalCalendar,
} from "@/components/ml/rental";
import { Loading, Price, StepProgress } from "@/components/ml/kit";
import { inr } from "@/lib/price";
import { rupeeParts } from "@/lib/price";
import { iconSize } from "@/lib/tokens";
import { useAuth } from "@/hooks/use-auth";
import {
  getRentalListingDetail,
  getRentalProvider,
  requestRentalBooking,
} from "@/lib/rentals.functions";

export const Route = createFileRoute("/marketplace/rent/request/$id")({
  loader: ({ params }) => getRentalListingDetail({ data: { slug: params.id } }).catch(() => null),
  head: ({ loaderData }) => {
    const e = loaderData;
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

/**
 * A listing, from the database. RentalCalendar/FulfilmentPicker/PriceBreakdown take it as-is —
 * the listing carries every field Equipment requires (see
 * 20260918110000_rental_equipment_fields.sql). The provider is a RealProvider: no
 * badges/responseRate/responseTime, see rentals.functions.ts for why.
 */
function RequestFlow() {
  const { id: slug } = Route.useParams();
  const initial = Route.useLoaderData();
  const { signedIn } = useAuth();
  const queryClient = useQueryClient();
  const loadListing = useServerFn(getRentalListingDetail);
  const loadProvider = useServerFn(getRentalProvider);
  const send = useServerFn(requestRentalBooking);

  const eq = useQuery({
    queryKey: ["rental-listing", slug],
    queryFn: () => loadListing({ data: { slug } }),
    ...(initial ? { initialData: initial } : {}),
  });
  const equipment = eq.data;
  const prov = useQuery({
    queryKey: ["rental-provider", equipment?.providerId],
    queryFn: () => loadProvider({ data: { profileId: equipment!.providerId } }),
    enabled: Boolean(equipment?.providerId),
  });

  const [step, setStep] = useState<Step>("dates");
  const [start, setStart] = useState<number | null>(18);
  const [end, setEnd] = useState<number | null>(22);
  const [qty, setQty] = useState(1);
  const [fulfilment, setFulfilment] = useState("Pickup");
  const [note, setNote] = useState("");
  const [bookingId, setBookingId] = useState<string | null>(null);

  const request = useMutation({
    mutationFn: () => {
      const year = 2026;
      const month = 7; // RentalCalendar's fixed month, August (0-indexed).
      const iso = (day: number) => new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
      return send({
        data: {
          listingSlug: slug,
          startDate: iso(start ?? 1),
          endDate: iso(end ?? start ?? 1),
          quantity: qty,
          fulfilment: fulfilment === "Pickup" ? "pickup" : "provider_delivery",
          ...(note ? { note } : {}),
        },
      });
    },
    onSuccess: (row) => {
      setBookingId(row.id);
      setStep("confirmed");
      queryClient.invalidateQueries({ queryKey: ["rental-bookings", "mine"] });
    },
    onError: () => toast.error("That didn't send. Try again."),
  });

  if (eq.isLoading) {
    return (
      <Screen>
        <TopBar title="Rental" back="/marketplace/rent" />
        <div className="px-5 py-4">
          <Loading rows={3} />
        </div>
      </Screen>
    );
  }

  if (!equipment) {
    return (
      <Screen>
        <TopBar title="Rental unavailable" back="/marketplace/rent" />
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          This equipment is no longer listed for rent.
        </p>
      </Screen>
    );
  }

  const e = equipment;
  const p = prov.data;
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
        <StepProgress
          total={4}
          current={["dates", "summary", "request", "confirmed"].indexOf(step)}
          className="mb-4"
        />

        <div className="mb-4 flex items-center gap-3 rounded-lg bg-subtle p-3">
          {e.photos[0] ? (
            <img src={e.photos[0]} alt="" className="h-14 w-14 shrink-0 rounded-sm object-cover" />
          ) : (
            <div className="h-14 w-14 shrink-0 rounded-sm bg-background" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-1 font-semibold">{e.name}</p>
            <Price
              price={rupeeParts(e.daily, "day")}
              amountClassName="text-1 font-semibold"
              unitClassName="text-1"
            />
            {e.deposit ? (
              <p className="truncate text-1 text-muted-foreground">Deposit {inr(e.deposit)}</p>
            ) : null}
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
                  <Minus size={iconSize.sm} />
                </button>
                <span className="w-5 text-center text-sm font-bold">{qty}</span>
                <button
                  aria-label="Increase"
                  onClick={() => setQty((q) => Math.min(e.quantity, q + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border"
                >
                  <Plus size={iconSize.sm} />
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
              {p ? <ProviderSummary p={p} /> : <Loading rows={1} />}
            </div>
            <dl className="mt-4 divide-y divide-border rounded-lg border border-border">
              {[
                { k: "Dates", v: `Aug ${start} – Aug ${end} (${days} days)` },
                { k: "Quantity", v: `${qty}` },
                { k: "Fulfilment", v: fulfilment },
                ...(e.location ? [{ k: "Location", v: e.location }] : []),
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
            <Btn
              className="mt-4 w-full"
              loading={request.isPending}
              onClick={() => {
                if (!signedIn) {
                  toast.error("Sign in to send a rental request.");
                  return;
                }
                request.mutate();
              }}
            >
              Send Rental Request
            </Btn>
            <Btn variant="outline" className="mt-2 w-full" onClick={() => setStep("summary")}>
              Save Draft
            </Btn>
          </>
        ) : null}

        {step === "confirmed" ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-container text-3">
              ✓
            </div>
            <h2 className="text-3">Request sent</h2>
            <p className="mx-auto mt-2 max-w-prose-sm text-sm text-muted-foreground">
              {p?.name ?? "The provider"} will confirm availability. You'll get a notification when
              they accept, decline or counter.
            </p>
            <dl className="mt-5 divide-y divide-border rounded-lg border border-border text-left">
              {[
                { k: "Equipment", v: e.name },
                { k: "Dates", v: `Aug ${start} – Aug ${end}` },
                { k: "Fulfilment", v: fulfilment },
                ...(e.deposit ? [{ k: "Deposit", v: inr(e.deposit * qty) }] : []),
              ].map((r) => (
                <div key={r.k} className="flex items-center justify-between gap-3 px-4 py-3">
                  <dt className="text-1 text-muted-foreground">{r.k}</dt>
                  <dd className="text-right text-1 font-semibold">{r.v}</dd>
                </div>
              ))}
            </dl>
            {bookingId ? (
              <Link to="/marketplace/rent/active/$id" params={{ id: bookingId }} className="block">
                <Btn className="mt-5 w-full">View Rental</Btn>
              </Link>
            ) : null}
            <BtnLink to="/messages" variant="outline" className="mt-2 w-full">
              Message Provider
            </BtnLink>
          </div>
        ) : null}
      </div>
    </Screen>
  );
}
