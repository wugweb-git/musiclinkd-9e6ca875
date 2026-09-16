import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Share2, Flag } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import {
  ConditionBadge,
  ListingTile,
  LocationRow,
  OfferSheet,
  PriceBlock,
  Rating,
  ReportSheet,
  SaveButton,
  SellerSummary,
  TrustPill,
} from "@/components/ml/market";
import { byId, listings, reviews, sellerById } from "@/data/market";
import { loadCatalogListings } from "@/lib/market-view";
import { priceText } from "@/lib/price";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/marketplace/l/$id")({
  // Static listings win; any other id is looked up as a database listing slug. Database listings
  // in the same category follow the static related listings.
  loader: async ({ params }) => {
    const all = await loadCatalogListings();
    return {
      catalog: byId(params.id) ? null : (all.find((x) => x.id === params.id) ?? null),
      all,
    };
  },
  head: ({ params, loaderData }) => {
    const l = byId(params.id) ?? loaderData?.catalog ?? undefined;
    const price = l ? priceText({ amount: l.price.amount, unit: l.price.unit }) : "";
    const title = l
      ? `${l.title}${price ? ` — ${price}` : ""} | MusicLinkd Market`
      : "Listing | MusicLinkd Market";
    const desc = l?.subtitle || "Listing details on the MusicLinkd marketplace.";
    const image = l?.photos[0];
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
  component: ListingDetail,
});

function ListingDetail() {
  const { id } = Route.useParams();
  const { catalog, all } = Route.useLoaderData();
  const fromCatalog = !byId(id);
  const l = byId(id) ?? catalog ?? undefined;
  const [saved, setSaved] = useState(false);
  const [offer, setOffer] = useState(false);
  const [report, setReport] = useState(false);
  const [shot, setShot] = useState(0);

  if (!l) {
    return (
      <Screen>
        <TopBar title="Listing unavailable" back="/marketplace" />
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          This listing was removed or sold.
        </p>
      </Screen>
    );
  }

  const seller = sellerById(l.sellerId);
  const where = [l.location, l.distance].filter(Boolean).join(" · ");
  const cta =
    l.type === "service"
      ? ["Enquire", "Book"]
      : l.type === "rental"
        ? ["Check availability", "Request rental"]
        : l.type === "space"
          ? ["Check availability", "Book"]
          : ["Make offer", "Message seller"];

  return (
    <Screen>
      <TopBar
        title="Listing"
        back="/marketplace"
        right={
          <div className="flex items-center gap-2">
            <button
              aria-label="Share"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
            >
              <Share2 size={iconSize.sm} />
            </button>
            <SaveButton saved={saved} onToggle={() => setSaved((s) => !s)} size={40} />
          </div>
        }
      />

      <div className="relative">
        {l.photos[shot] ? (
          <img src={l.photos[shot]} alt={l.title} className="h-64 w-full object-cover" />
        ) : null}
        {l.photos.length > 1 ? (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {l.photos.map((p, i) => (
              <button
                key={p}
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
        ) : null}
      </div>

      <div className="px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <PriceBlock price={l.price} size="lg" />
          {l.condition ? (
            <ConditionBadge value={l.condition} />
          ) : (
            <Rating value={l.rating} count={l.reviews} />
          )}
        </div>
        <h1 className="mt-2 text-3 leading-tight">{l.title}</h1>
        {l.subtitle ? <p className="mt-1 text-sm text-muted-foreground">{l.subtitle}</p> : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {where ? <LocationRow text={where} /> : null}
          {!fromCatalog || l.owner?.verified ? <TrustPill label="Industry verified" /> : null}
          <span className="text-1 text-muted-foreground">Listed {l.postedAt}</span>
        </div>

        {l.description ? (
          <>
            <h2 className="mt-6 text-2">Description</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{l.description}</p>
          </>
        ) : null}

        {l.specs.length ? (
          <>
            <h2 className="mt-6 text-2">
              {l.type === "service"
                ? "Service details"
                : l.type === "rental"
                  ? "Rental terms"
                  : "Specifications"}
            </h2>
            <dl className="mt-2 divide-y divide-border rounded-lg border border-border">
              {l.specs.map((s) => (
                <div key={s.label} className="flex items-center justify-between px-4 py-3">
                  <dt className="text-1 text-muted-foreground">{s.label}</dt>
                  <dd className="text-1 font-semibold">{s.value}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : null}

        {seller || l.owner ? (
          <h2 className="mt-6 text-2">{l.type === "product" ? "Seller" : "Provider"}</h2>
        ) : null}
        {l.owner && !seller ? (
          <div className="mt-2 rounded-lg bg-subtle p-4">
            <SellerSummary seller={l.owner} compact />
            {l.owner.username ? (
              <BtnLink
                to="/profile/$username"
                params={{ username: l.owner.username }}
                variant="outline"
                className="mt-3 w-full"
              >
                View Profile
              </BtnLink>
            ) : null}
          </div>
        ) : null}
        {seller ? (
          <div className="mt-2 rounded-lg bg-subtle p-4">
            <SellerSummary seller={seller} />
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { k: "Response", v: seller.responseRate },
                { k: "Replies in", v: seller.responseTime },
                { k: "On MusicLinkd", v: `${seller.years} yrs` },
              ].map((x) => (
                <div key={x.k} className="rounded-lg bg-subtle py-2">
                  <p className="text-1 font-bold">{x.v}</p>
                  <p className="text-1 text-muted-foreground">{x.k}</p>
                </div>
              ))}
            </div>
            <BtnLink
              to="/marketplace/seller/$id"
              params={{ id: seller.id }}
              variant="outline"
              className="mt-3 w-full"
            >
              View Profile
            </BtnLink>
          </div>
        ) : null}

        {fromCatalog ? null : (
          <>
            <h2 className="mt-6 text-2">Reviews</h2>
            <div className="mt-2 space-y-3">
              {reviews.slice(0, 2).map((r) => (
                <article key={r.id} className="rounded-lg bg-subtle p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-1 font-semibold">{r.name}</p>
                    <Rating value={r.rating} />
                  </div>
                  <p className="text-1 text-muted-foreground">
                    {r.role} · {r.context} · {r.date}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
                  {r.response ? (
                    <p className="mt-2 rounded-lg bg-subtle p-3 text-1 text-muted-foreground">
                      Seller: {r.response}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </>
        )}

        <h2 className="mt-6 text-2">Related listings</h2>
        <div className="rail mt-2 flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {[
            ...listings.filter((x) => x.id !== l.id).slice(0, 4),
            ...all.filter((x) => x.category === l.category && x.id !== l.id),
          ].map((x) => (
            <ListingTile key={x.id} l={x} />
          ))}
        </div>

        <button
          onClick={() => setReport(true)}
          className="mx-auto mt-6 flex items-center gap-1.5 text-1 font-semibold text-muted-foreground"
        >
          <Flag size={iconSize.xs} /> Report this listing
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-bar mx-auto w-full max-w-app border-t border-border bg-card/95 px-5 py-3 backdrop-blur">
        <div className="flex gap-2">
          <Btn variant="outline" className="flex-1" onClick={() => setOffer(true)}>
            {cta[0]}
          </Btn>
          <BtnLink to="/messages" className="flex-1 w-full">
            {cta[1]}
          </BtnLink>
        </div>
      </div>

      <OfferSheet open={offer} onClose={() => setOffer(false)} listing={l} />
      <ReportSheet open={report} onClose={() => setReport(false)} />
    </Screen>
  );
}
