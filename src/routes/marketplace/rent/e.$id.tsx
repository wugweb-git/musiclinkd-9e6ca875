import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Share2, Flag, Check } from "lucide-react";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import {
  ConditionBadge,
  LocationRow,
  Rating,
  SaveButton,
  SellerSummary,
} from "@/components/ml/market";
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
  type RentalItem,
} from "@/data/rentals";
import { Price } from "@/components/ml/kit";
import { loadCatalogRentals } from "@/lib/market-view";
import { priceText, rupeeParts } from "@/lib/price";

export const Route = createFileRoute("/marketplace/rent/e/$id")({
  // Static equipment wins; any other id is looked up as a database rental slug. Database rentals
  // also fill in related equipment after the static ones.
  loader: () => loadCatalogRentals(),
  head: ({ params, loaderData }) => {
    const known = equipmentById(params.id);
    const e: RentalItem | undefined = known ?? loaderData?.find((x) => x.id === params.id);
    const title = e
      ? `Rent ${e.name}${e.daily != null ? ` — ${priceText(rupeeParts(e.daily, "day"))}` : ""} | MusicLinkd`
      : "Rental | MusicLinkd";
    const desc = known
      ? `${known.brand} ${known.model} for rent in ${known.location}. ${known.availability}. Deposit ${inr(known.deposit)}.`
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
  const catalog = Route.useLoaderData();
  const e: RentalItem | undefined = equipmentById(id) ?? catalog.find((x) => x.id === id);
  const fromCatalog = !equipmentById(id);
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

  const p = e.providerId ? providerById(e.providerId) : undefined;
  const related = [
    ...equipment.filter((x) => x.category === e.category && x.id !== e.id).slice(0, 5),
    ...catalog.filter((x) => e.category && x.category === e.category && x.id !== e.id),
  ];
  const byline = [e.brand, e.model, e.rentals != null ? `${e.rentals} completed rentals` : ""]
    .filter(Boolean)
    .join(" · ");
  const where = [e.location, e.distance].filter(Boolean).join(" · ");
  const terms = [
    ...(e.daily != null ? [{ k: "Daily", v: inr(e.daily) }] : []),
    ...(e.weekly != null ? [{ k: "Weekly", v: inr(e.weekly) }] : []),
    ...(e.monthly != null ? [{ k: "Monthly", v: inr(e.monthly) }] : []),
    ...(e.minDays != null
      ? [{ k: "Minimum rental", v: `${e.minDays} day${e.minDays > 1 ? "s" : ""}` }]
      : []),
    ...(e.maxDays != null ? [{ k: "Maximum rental", v: `${e.maxDays} days` }] : []),
    ...(e.noticePeriod ? [{ k: "Notice period", v: e.noticePeriod }] : []),
    ...(e.quantity != null ? [{ k: "Quantity available", v: `${e.quantity}` }] : []),
    ...(e.pickup != null && e.delivery != null
      ? [
          {
            k: "Delivery",
            v: e.delivery
              ? `${e.pickup ? "Pickup or " : ""}delivery ${inr(e.deliveryFee ?? 0)}`
              : "Pickup only",
          },
        ]
      : []),
  ];
  const barNote = [e.deposit != null ? `Deposit ${inr(e.deposit)}` : e.priceNote, e.availability]
    .filter(Boolean)
    .join(" · ");

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
        {e.photos[shot] ? (
          <img src={e.photos[shot]} alt={e.name} className="h-64 w-full object-cover" />
        ) : null}
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
      <div className="rail flex gap-2 overflow-x-auto px-5 pt-3 no-scrollbar">
        {e.photos.map((src, i) => (
          <button key={src} onClick={() => setShot(i)} className="shrink-0">
            <img
              src={src}
              alt=""
              className="h-14 w-16 rounded-md object-cover"
              style={{ outline: i === shot ? "2px solid var(--primary)" : "none" }}
            />
          </button>
        ))}
      </div>

      <div className="px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <RentalPriceBlock e={e} size="lg" />
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {e.condition ? <ConditionBadge value={e.condition} /> : null}
            <Rating value={e.rating} count={e.reviews} />
          </div>
        </div>
        <h1 className="mt-2 text-3 leading-tight">{e.name}</h1>
        {byline ? <p className="mt-1 text-sm text-muted-foreground">{byline}</p> : null}
        {e.availability || where ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {e.availability ? <RentalAvailabilityBadge text={e.availability} /> : null}
            {where ? <LocationRow text={where} /> : null}
          </div>
        ) : null}

        {e.deposit != null ? (
          <div
            className="mt-4 flex items-start justify-between gap-3 rounded-lg p-4"
            style={{ background: "var(--warn-container)" }}
          >
            <div className="min-w-0">
              <p className="text-1 font-bold" style={{ color: "var(--warn)" }}>
                Refundable security deposit
              </p>
              <p className="text-0 text-muted-foreground">
                Held by the provider for the rental period.
              </p>
            </div>
            <span className="shrink-0 text-sm font-bold">{inr(e.deposit)}</span>
          </div>
        ) : null}

        {e.description ? (
          <>
            <h2 className="mt-6 text-2">Description</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{e.description}</p>
          </>
        ) : null}

        {e.specs?.length ? (
          <>
            <h2 className="mt-6 text-2">Specifications</h2>
            <dl className="mt-2 divide-y divide-border rounded-lg border border-border">
              {e.specs.map((s) => (
                <div key={s.label} className="flex items-center justify-between gap-3 px-4 py-3">
                  <dt className="text-1 text-muted-foreground">{s.label}</dt>
                  <dd className="text-right text-1 font-semibold">{s.value}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : null}

        {e.included?.length ? (
          <>
            <h2 className="mt-6 text-2">What's included</h2>
            <ul className="mt-2 space-y-2 rounded-lg border border-border p-4">
              {e.included.map((x) => (
                <li key={x} className="flex items-center gap-2 text-1">
                  <Check size={14} className="shrink-0 text-primary" /> {x}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {terms.length ? (
          <>
            <h2 className="mt-6 text-2">Rental terms</h2>
            <dl className="mt-2 divide-y divide-border rounded-lg border border-border">
              {terms.map((r) => (
                <div key={r.k} className="flex items-center justify-between gap-3 px-4 py-3">
                  <dt className="text-1 text-muted-foreground">{r.k}</dt>
                  <dd className="text-1 font-semibold">{r.v}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : null}

        {p || e.owner ? <h2 className="mt-6 text-2">Provider</h2> : null}
        {e.owner && !p ? (
          <div className="mt-2 rounded-lg border border-border bg-card p-4">
            <SellerSummary seller={e.owner} compact />
            <div className="mt-3 grid grid-cols-2 gap-2">
              {e.owner.username ? (
                <BtnLink
                  to="/profile/$username"
                  params={{ username: e.owner.username }}
                  variant="outline"
                  className="w-full"
                >
                  View Profile
                </BtnLink>
              ) : null}
              <BtnLink to="/messages" variant="outline" className="w-full">
                Message
              </BtnLink>
            </div>
          </div>
        ) : null}
        {p ? (
          <div className="mt-2 rounded-lg border border-border bg-card p-4">
            <ProviderSummary p={p} />
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { k: "Response", v: p.responseRate },
                { k: "Replies in", v: p.responseTime },
                { k: "Rentals", v: `${p.completedRentals}` },
              ].map((x) => (
                <div key={x.k} className="rounded-lg bg-subtle py-2">
                  <p className="truncate text-1 font-bold">{x.v}</p>
                  <p className="text-0 text-muted-foreground">{x.k}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <BtnLink
                to="/marketplace/rent/provider/$id"
                params={{ id: p.id }}
                variant="outline"
                className="w-full"
              >
                View Profile
              </BtnLink>
              <BtnLink to="/messages" variant="outline" className="w-full">
                Message
              </BtnLink>
            </div>
          </div>
        ) : null}

        {fromCatalog ? null : (
          <>
            <h2 className="mt-6 text-2">Reviews</h2>
            <div className="mt-2 space-y-3">
              {rentalReviews.slice(0, 2).map((r) => (
                <article key={r.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-1 font-semibold">{r.name}</p>
                      <p className="truncate text-0 text-muted-foreground">{r.context}</p>
                    </div>
                    <Rating value={r.rating} />
                  </div>
                  <p className="mt-2 text-1 leading-relaxed text-muted-foreground">{r.body}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-subtle px-2 py-1 text-0 font-semibold text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        <h2 className="mt-6 text-2">Related equipment</h2>
      </div>

      <div className="rail flex gap-3 overflow-x-auto px-5 pb-5 no-scrollbar">
        {related.map((x) => (
          <EquipmentTile key={x.id} e={x} />
        ))}
      </div>

      <div className="px-5 pb-6">
        <button
          onClick={() => setReport(true)}
          className="inline-flex items-center gap-1.5 text-0 font-semibold text-muted-foreground"
        >
          <Flag size={12} /> Report this listing
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 mx-auto w-full max-w-app border-t border-border bg-card/95 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            {e.daily != null ? (
              <Price
                price={rupeeParts(e.daily, "day")}
                amountClassName="text-sm font-bold"
                unitClassName="text-0"
              />
            ) : null}
            {barNote ? <p className="truncate text-0 text-muted-foreground">{barNote}</p> : null}
          </div>
          {fromCatalog ? (
            // The request flow needs dates, rates and a deposit a database rental does not store.
            <BtnLink to="/messages" className="shrink-0">
              Check Availability
            </BtnLink>
          ) : (
            <BtnLink to="/marketplace/rent/request/$id" params={{ id: e.id }} className="shrink-0">
              Check Availability
            </BtnLink>
          )}
        </div>
      </div>

      <RentalReportSheet open={report} onClose={() => setReport(false)} />
    </Screen>
  );
}
