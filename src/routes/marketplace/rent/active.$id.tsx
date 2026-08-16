import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn, Chip, Sheet } from "@/components/ml/ui";
import { Rating } from "@/components/ml/market";
import {
  ProviderSummary,
  RentalCalendar,
  RentalStatusPill,
} from "@/components/ml/rental";
import { bookingById, equipmentById, inr, providerById } from "@/data/rentals";

export const Route = createFileRoute("/marketplace/rent/active/$id")({
  head: ({ params }) => {
    const b = bookingById(params.id);
    const e = b ? equipmentById(b.equipmentId) : undefined;
    const title = e ? `${e.name} rental · ${b?.status} | MusicLinkd` : "Rental | MusicLinkd";
    return {
      meta: [
        { title },
        {
          name: "description",
          content: "Manage this rental — dates, pickup, extensions, returns and reviews.",
        },
        { property: "og:title", content: title },
        { property: "og:description", content: "Rental details and actions on MusicLinkd." },
      ],
    };
  },
  component: RentalBooking,
});

function RentalBooking() {
  const { id } = Route.useParams();
  const b = bookingById(id);
  const [extend, setExtend] = useState(false);
  const [ret, setRet] = useState(false);
  const [review, setReview] = useState(false);
  const [newEnd, setNewEnd] = useState<number | null>(21);
  const [returned, setReturned] = useState(false);
  const [stars, setStars] = useState(5);
  const [tags, setTags] = useState<string[]>(["Condition as described"]);

  if (!b) {
    return (
      <Screen>
        <TopBar title="Rental not found" back="/marketplace/rent/mine" />
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          This rental is no longer available on your account.
        </p>
      </Screen>
    );
  }

  const e = equipmentById(b.equipmentId)!;
  const p = providerById(e.providerId)!;
  const isCompleted = b.bucket === "Completed" || returned;
  const extraDays = newEnd ? Math.max(0, newEnd - 18) : 0;

  return (
    <Screen>
      <TopBar title="Rental" subtitle={b.ref} back="/marketplace/rent/mine" />

      <div className="px-5 py-4">
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <img src={e.photos[0]} alt={e.name} className="h-40 w-full object-cover" />
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-[17px] leading-tight">{e.name}</h1>
              <RentalStatusPill status={returned ? "Completed" : b.status} />
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {b.start} → {b.end} · {b.days} days · {b.quantity} unit{b.quantity > 1 ? "s" : ""}
            </p>
            {b.timeRemaining && !isCompleted ? (
              <div
                className="mt-3 rounded-2xl px-3 py-2 text-[12px] font-bold"
                style={{ background: "var(--success-container)", color: "var(--success)" }}
              >
                {b.timeRemaining} · return by {b.returnBy}
              </div>
            ) : null}
          </div>
        </div>

        <dl className="mt-4 divide-y divide-border rounded-3xl border border-border">
          {[
            { k: "Booking reference", v: b.ref },
            { k: "Fulfilment", v: b.fulfilment },
            { k: "Rental total", v: inr(b.total) },
            { k: "Security deposit", v: inr(b.deposit) },
            ...(b.returnBy ? [{ k: "Return deadline", v: b.returnBy }] : []),
            ...(b.note ? [{ k: "Instructions", v: b.note }] : []),
          ].map((r) => (
            <div key={r.k} className="flex items-start justify-between gap-3 px-4 py-3">
              <dt className="shrink-0 text-xs text-muted-foreground">{r.k}</dt>
              <dd className="text-right text-xs font-semibold">{r.v}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-6 text-[16px]">Provider</h2>
        <div className="mt-2 rounded-3xl border border-border bg-card p-4">
          <ProviderSummary p={p} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link to="/messages">
              <Btn variant="outline" className="w-full">Message</Btn>
            </Link>
            <Link to="/marketplace/rent/provider/$id" params={{ id: p.id }}>
              <Btn variant="outline" className="w-full">Profile</Btn>
            </Link>
          </div>
        </div>

        <h2 className="mt-6 text-[16px]">Actions</h2>
        <div className="mt-2 space-y-2">
          {!isCompleted && b.bucket === "Active" ? (
            <>
              <Btn variant="outline" className="w-full" onClick={() => setExtend(true)}>
                Request extension
              </Btn>
              <Btn className="w-full" onClick={() => setRet(true)}>
                Return equipment
              </Btn>
            </>
          ) : null}
          {isCompleted ? (
            <>
              <Btn className="w-full" onClick={() => setReview(true)}>
                Rate provider & equipment
              </Btn>
              <Link to="/marketplace/rent/e/$id" params={{ id: e.id }} className="block">
                <Btn variant="outline" className="w-full">Book again</Btn>
              </Link>
              <Link to="/marketplace/rent/c/$slug" params={{ slug: e.category }} className="block">
                <Btn variant="outline" className="w-full">Browse similar equipment</Btn>
              </Link>
            </>
          ) : null}
          <button className="w-full py-2 text-[11px] font-semibold text-muted-foreground">
            Report an issue with this rental
          </button>
        </div>
      </div>

      <Sheet open={extend} onClose={() => setExtend(false)} title="Extend rental">
        <p className="mb-3 text-[12px] text-muted-foreground">
          Current end date {b.end}. Pick a new end date — the provider confirms availability.
        </p>
        <RentalCalendar e={e} start={18} end={newEnd} onSelect={(d) => setNewEnd(d)} />
        <dl className="mt-4 divide-y divide-border rounded-3xl border border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <dt className="text-xs text-muted-foreground">Additional days</dt>
            <dd className="text-xs font-semibold">{extraDays}</dd>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <dt className="text-xs text-muted-foreground">Additional cost</dt>
            <dd className="text-xs font-semibold">{inr(extraDays * e.daily * b.quantity)}</dd>
          </div>
        </dl>
        {e.unavailableDates.length ? (
          <p className="mt-3 text-[11px] text-muted-foreground">
            Some dates are already reserved by another renter and cannot be selected.
          </p>
        ) : null}
        <Btn className="mt-4 w-full" onClick={() => setExtend(false)}>
          Request extension
        </Btn>
      </Sheet>

      <Sheet open={ret} onClose={() => setRet(false)} title="Return equipment">
        <dl className="divide-y divide-border rounded-3xl border border-border">
          {[
            { k: "Equipment", v: e.name },
            { k: "Return date", v: b.returnBy ?? b.end },
            { k: "Return method", v: b.fulfilment === "Pickup" ? "Drop at provider" : "Provider collects" },
          ].map((r) => (
            <div key={r.k} className="flex items-center justify-between gap-3 px-4 py-3">
              <dt className="text-xs text-muted-foreground">{r.k}</dt>
              <dd className="text-right text-xs font-semibold">{r.v}</dd>
            </div>
          ))}
        </dl>
        <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Condition confirmation
        </p>
        <div className="flex flex-wrap gap-2">
          {["Same as received", "Minor wear", "Damage to report"].map((c) => (
            <Chip key={c} active={c === "Same as received"}>{c}</Chip>
          ))}
        </div>
        <button className="mt-4 w-full rounded-3xl border border-dashed border-border py-6 text-[12px] font-semibold text-muted-foreground">
          + Add return photos (optional)
        </button>
        <textarea
          rows={3}
          placeholder="Notes for the provider"
          className="mt-3 w-full rounded-3xl border border-border bg-card p-4 text-sm outline-none focus:border-primary"
        />
        <p className="mt-3 text-[11px] text-muted-foreground">
          The deposit is released by the provider once they have checked the equipment.
        </p>
        <Btn
          className="mt-4 w-full"
          onClick={() => {
            setReturned(true);
            setRet(false);
            setReview(true);
          }}
        >
          Confirm return
        </Btn>
      </Sheet>

      <Sheet open={review} onClose={() => setReview(false)} title="Rate this rental">
        <div className="mb-4 flex items-center gap-3 rounded-3xl border border-border p-3">
          <img src={e.photos[0]} alt="" className="h-12 w-12 rounded-2xl object-cover" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold">{e.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{p.name}</p>
          </div>
        </div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Overall experience
        </p>
        <div className="mb-4 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setStars(n)}
              className="text-2xl"
              aria-label={`${n} stars`}
              style={{ opacity: n <= stars ? 1 : 0.25 }}
            >
              ★
            </button>
          ))}
        </div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          What went well
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {["Equipment condition", "Accuracy", "Communication", "Pickup", "Delivery", "Value"].map((t) => (
            <Chip
              key={t}
              active={tags.includes(t)}
              onClick={() => setTags((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))}
            >
              {t}
            </Chip>
          ))}
        </div>
        <textarea
          rows={3}
          placeholder="Write a short review (optional)"
          className="w-full rounded-3xl border border-border bg-card p-4 text-sm outline-none focus:border-primary"
        />
        <div className="mt-3 flex items-center justify-between rounded-3xl bg-subtle px-4 py-3">
          <span className="text-[12px] font-semibold">Your rating</span>
          <Rating value={stars} />
        </div>
        <Btn className="mt-4 w-full" onClick={() => setReview(false)}>
          Submit review
        </Btn>
      </Sheet>
    </Screen>
  );
}
