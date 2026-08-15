import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Share2, Flag, Check } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { ConditionBadge, LocationRow, Rating, SaveButton } from "@/components/ml/market";
import {
  EquipmentTile,
  ProviderSummary,
  RentalAvailabilityBadge,
  RentalPriceBlock,
  RentalReportSheet,
} from "@/components/ml/rental";
import {
  equipment,
  equipmentById,
  inr,
  providerById,
  rentalReviews,
} from "@/data/rentals";

export const Route = createFileRoute("/marketplace/rent/e/$id")({
  head: ({ params }) => {
    const e = equipmentById(params.id);
    const title = e ? `Rent ${e.name} — ${inr(e.daily)}/day | MusicLinkd` : "Rental | MusicLinkd";
    const desc = e
      ? `${e.brand} ${e.model} for rent in ${e.location}. ${e.availability}. Deposit ${inr(e.deposit)}.`
      : "Rental equipment on MusicLinkd.";
    const image = e?.photos[0];
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
    };
  },
  component: RentalDetail,
});

function RentalDetail() {
  const { id } = Route.useParams();
  const e = equipmentById(id);
  const [saved, setSaved] = useState(false);
  const [shot, setShot] = useState(0);
  const [report, setReport] = useState(false);

  if (!e) {
    return (
      <Screen>
        <TopBar title="Rental unavailable" back="/marketplace/rent" />
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          This listing was removed or is no longer available for rent.
        </p>
      </Screen>
    );
  }

  const p = providerById(e.providerId)!;
  const related = equipment.filter((x) => x.category === e.category && x.id !== e.id).slice(0, 5);

  return (
    <Screen>
      <TopBar
        title="Rental"
        back="/marketplace/rent"
        right={
          <div className="flex shrink-0 items-center gap-2">
            <button
              aria-label="Share"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
            >
              <Share2 size={15} />
            </button>
            <SaveButton saved={saved} onToggle={() => setSaved((s) => !s)} size={40} />
          </div>
        }
      />

      <div className="relative">
        <img src={e.photos[shot]} alt={e.name} className="h-64 w-full object-cover" />
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {e.photos.map((src, i) => (
            <button
              key={src}
              aria-label={`Photo ${i + 1}`}
              onClick={() => setShot(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === shot ? 18 : 6,
                background: i === shot ? "var(--primary)" : "var(--border)",
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto px-5 pt-3 no-scrollbar">
        {e.photos.map((src, i) => (
          <button key={src} onClick={() => setShot(i)} className="shrink-0">
            <img
              src={src}
              alt=""
              className="h-14 w-16 rounded-xl object-cover"
              style={{ outline: i === shot ? "2px solid var(--primary)" : "none" }}
            />
          </button>
        ))}
      </div>

      <div className="px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <RentalPriceBlock e={e} size="lg" />
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <ConditionBadge value={e.condition} />
            <Rating value={e.rating} count={e.reviews} />
          </div>
        </div>
        <h1 className="mt-2 text-[22px] leading-tight">{e.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {e.brand} · {e.model} · {e.rentals} completed rentals
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <RentalAvailabilityBadge text={e.availability} />
          <LocationRow text={`${e.location} · ${e.distance}`} />
        </div>

        <div
          className="mt-4 flex items-start justify-between gap-3 rounded-3xl p-4"
          style={{ background: "var(--warn-container)" }}
        >
          <div className="min-w-0">
            <p className="text-[12px] font-bold" style={{ color: "var(--warn)" }}>
              Refundable security deposit
            </p>
            <p className="text-[11px] text-muted-foreground">
              Held by the provider for the rental period.
            </p>
          </div>
          <span className="shrink-0 text-[15px] font-bold">{inr(e.deposit)}</span>
        </div>

        <h2 className="mt-6 text-[16px]">Description</h2>
        <p className="mt-2 text-sm leading-relaxed text-text2">{e.description}</p>

        <h2 className="mt-6 text-[16px]">Specifications</h2>
        <dl className="mt-2 divide-y divide-border rounded-3xl border border-border">
          {e.specs.map((s) => (
            <div key={s.label} className="flex items-center justify-between gap-3 px-4 py-3">
              <dt className="text-xs text-muted-foreground">{s.label}</dt>
              <dd className="text-right text-xs font-semibold">{s.value}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-6 text-[16px]">What's included</h2>
        <ul className="mt-2 space-y-2 rounded-3xl border border-border p-4">
          {e.included.map((x) => (
            <li key={x} className="flex items-center gap-2 text-[13px]">
              <Check size={14} className="shrink-0 text-primary" /> {x}
            </li>
          ))}
        </ul>

        <h2 className="mt-6 text-[16px]">Rental terms</h2>
        <dl className="mt-2 divide-y divide-border rounded-3xl border border-border">
          {[
            { k: "Daily", v: inr(e.daily) },
            { k: "Weekly", v: inr(e.weekly) },
            { k: "Monthly", v: inr(e.monthly) },
            { k: "Minimum rental", v: `${e.minDays} day${e.minDays > 1 ? "s" : ""}` },
            { k: "Maximum rental", v: `${e.maxDays} days` },
            { k: "Notice period", v: e.noticePeriod },
            { k: "Quantity available", v: `${e.quantity}` },
            {
              k: "Pickup / delivery",
              v: e.delivery
                ? `${e.pickup ? "Pickup or " : ""}delivery ${inr(e.deliveryFee ?? 0)}`
                : "Pickup only",
            },
          ].map((r) => (
            <div key={r.k} className="flex items-center justify-between gap-3 px-4 py-3">
              <dt className="text-xs text-muted-foreground">{r.k}</dt>
              <dd className="text-xs font-semibold">{r.v}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-6 text-[16px]">Provider</h2>
        <div className="mt-2 rounded-3xl border border-border bg-card p-4">
          <ProviderSummary p={p} />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              { k: "Response", v: p.responseRate },
              { k: "Replies in", v: p.responseTime },
              { k: "Rentals", v: `${p.completedRentals}` },
            ].map((x) => (
              <div key={x.k} className="rounded-2xl bg-subtle py-2">
                <p className="truncate text-[12px] font-bold">{x.v}</p>
                <p className="text-[10px] text-muted-foreground">{x.k}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link to="/marketplace/rent/provider/$id" params={{ id: p.id }}>
              <Btn variant="outline" className="w-full">View profile</Btn>
            </Link>
            <Link to="/messages">
              <Btn variant="outline" className="w-full">Message</Btn>
            </Link>
          </div>
        </div>

        <h2 className="mt-6 text-[16px]">Reviews</h2>
        <div className="mt-2 space-y-3">
          {rentalReviews.slice(0, 2).map((r) => (
            <article key={r.id} className="rounded-3xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">{r.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{r.context}</p>
                </div>
                <Rating value={r.rating} />
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-text2">{r.body}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.tags.map((t) => (
                  <span key={t} className="rounded-full bg-subtle px-2 py-1 text-[10px] font-semibold text-text2">
                    {t}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <h2 className="mt-6 text-[16px]">Related equipment</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto px-5 pb-5 no-scrollbar">
        {related.map((x) => (
          <EquipmentTile key={x.id} e={x} />
        ))}
      </div>

      <div className="px-5 pb-6">
        <button
          onClick={() => setReport(true)}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground"
        >
          <Flag size={12} /> Report this listing
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 mx-auto w-full max-w-[430px] border-t border-border bg-card/95 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold">
              {inr(e.daily)} <span className="text-[11px] font-normal text-muted-foreground">/ day</span>
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              Deposit {inr(e.deposit)} · {e.availability}
            </p>
          </div>
          <Link to="/marketplace/rent/request/$id" params={{ id: e.id }} className="shrink-0">
            <Btn>Check availability</Btn>
          </Link>
        </div>
      </div>

      <RentalReportSheet open={report} onClose={() => setReport(false)} />
    </Screen>
  );
}
