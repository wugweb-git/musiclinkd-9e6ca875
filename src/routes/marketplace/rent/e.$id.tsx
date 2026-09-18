import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Share2, Flag, Check } from "lucide-react";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import {
  ConditionBadge,
  LocationRow,
  Rating,
  SellerSummary,
  ProductCard,
  productFromRental,
} from "@/components/ml/market";
import {
  RentalAvailabilityBadge,
  RentalPriceBlock,
  RentalReportSheet,
} from "@/components/ml/rental";
import { SavedToggle } from "@/components/ml/saved-toggle";
import { inr, type RentalItem } from "@/data/rentals";
import { EmptyState, Loading, Price } from "@/components/ml/kit";
import { getListing } from "@/lib/catalog.functions";
import { loadCatalogRentals, rentalFromRow } from "@/lib/market-view";
import { getTaxonomyLabels } from "@/lib/portfolio.functions";
import { listReviewsFor } from "@/lib/reviews.functions";
import { priceText, rupeeParts } from "@/lib/price";
import { iconSize } from "@/lib/tokens";
import { rememberListingVisit } from "@/lib/device-history";

export const Route = createFileRoute("/marketplace/rent/e/$id")({
  // The id is a live rental's slug; the rest of the catalog fills in related equipment. The row's
  // own id (uuid) is what saved_items stores, so it is read alongside.
  loader: async ({ params }) => {
    const [catalog, row] = await Promise.all([
      loadCatalogRentals(),
      getListing({ data: { slug: params.id } }).catch(() => null),
    ]);
    // A rental its owner set unavailable or archived is out of browsing but can still be opened.
    const own =
      !catalog.some((x) => x.id === params.id) && row?.category === "gear_rental"
        ? rentalFromRow(row, await getTaxonomyLabels().catch(() => ({})))
        : null;
    return { catalog: own ? [own, ...catalog] : catalog, rowId: row?.id ?? null };
  },
  head: ({ params, loaderData }) => {
    const e: RentalItem | undefined = loaderData?.catalog.find((x) => x.id === params.id);
    const title = e
      ? `Rent ${e.name}${e.daily != null ? ` — ${priceText(rupeeParts(e.daily, "day"))}` : ""} | MusicLinkd`
      : "Rental | MusicLinkd";
    const desc = "Rental equipment on MusicLinkd.";
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
  const { catalog, rowId } = Route.useLoaderData();
  const e: RentalItem | undefined = catalog.find((x) => x.id === id);
  const [shot, setShot] = useState(0);
  const [report, setReport] = useState(false);
  // Feeds Market's "Recently viewed" rail, the same as opening a listing there.
  const found = Boolean(e);
  useEffect(() => {
    if (found) rememberListingVisit(id);
  }, [id, found]);
  const loadReviews = useServerFn(listReviewsFor);
  const ownerId = e?.owner?.id ?? undefined;
  const reviews = useQuery({
    queryKey: ["rent", "provider", ownerId, "reviews"],
    queryFn: () => loadReviews({ data: { profileId: ownerId! } }),
    enabled: !!ownerId,
  });

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

  const related = catalog.filter((x) => e.category && x.category === e.category && x.id !== e.id);
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
              <Share2 size={iconSize.sm} />
            </button>
            {rowId ? <SavedToggle targetType="listing" targetId={rowId} size={40} /> : null}
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
              className="h-14 w-16 rounded-sm object-cover"
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
              <p className="text-1 text-muted-foreground">
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
                  <Check size={iconSize.sm} className="shrink-0 text-primary" /> {x}
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

        {e.owner ? (
          <>
            <h2 className="mt-6 text-2">Provider</h2>
            <div className="mt-2 rounded-lg bg-subtle p-4">
              <SellerSummary seller={e.owner} compact />
              <div className="mt-3 grid grid-cols-2 gap-2">
                {e.owner.id ? (
                  <BtnLink
                    to="/marketplace/rent/provider/$id"
                    params={{ id: e.owner.id }}
                    variant="outline"
                    className="w-full"
                  >
                    View Profile
                  </BtnLink>
                ) : e.owner.username ? (
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
          </>
        ) : null}

        {ownerId ? (
          <>
            <h2 className="mt-6 text-2">Reviews</h2>
            <div className="mt-2 space-y-3">
              {reviews.isLoading ? (
                <Loading rows={2} />
              ) : reviews.data?.length ? (
                reviews.data.slice(0, 2).map((r) => (
                  <article key={r.id} className="rounded-lg bg-subtle p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-1 font-semibold">{r.author_name}</p>
                        {r.context ? (
                          <p className="truncate text-1 text-muted-foreground">{r.context}</p>
                        ) : null}
                      </div>
                      <Rating value={r.rating} />
                    </div>
                    <p className="mt-2 text-1 leading-relaxed text-muted-foreground">{r.body}</p>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="No reviews yet"
                  body="Reviews left for this provider show up here."
                />
              )}
            </div>
          </>
        ) : null}

        <h2 className="mt-6 text-2">Related equipment</h2>
      </div>

      <div className="rail flex gap-3 overflow-x-auto px-5 pb-5 no-scrollbar">
        {related.map((x) => (
          <ProductCard key={x.id} item={productFromRental(x)} rail />
        ))}
      </div>

      <div className="px-5 pb-6">
        <button
          onClick={() => setReport(true)}
          className="inline-flex items-center gap-1.5 text-1 font-semibold text-muted-foreground"
        >
          <Flag size={iconSize.xs} /> Report this listing
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-bar mx-auto w-full max-w-app border-t border-border bg-card/95 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            {e.daily != null ? (
              <Price
                price={rupeeParts(e.daily, "day")}
                amountClassName="text-sm font-bold"
                unitClassName="text-1"
              />
            ) : null}
            {barNote ? <p className="truncate text-1 text-muted-foreground">{barNote}</p> : null}
          </div>
          <BtnLink to="/marketplace/rent/request/$id" params={{ id: e.id }} className="shrink-0">
            Check Availability
          </BtnLink>
        </div>
      </div>

      <RentalReportSheet
        open={report}
        onClose={() => setReport(false)}
        subject={{ type: "rental", id: e.id }}
      />
    </Screen>
  );
}
