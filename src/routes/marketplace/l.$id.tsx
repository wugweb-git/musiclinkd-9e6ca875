import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Share2, Flag } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
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

export const Route = createFileRoute("/marketplace/l/$id")({
  head: ({ params }) => {
    const l = byId(params.id);
    const title = l ? `${l.title} — ${l.price} | MusicLinkd Market` : "Listing | MusicLinkd Market";
    const desc = l?.subtitle ?? "Listing details on the MusicLinkd marketplace.";
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
  const l = byId(id);
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

  const seller = sellerById(l.sellerId)!;
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
              <Share2 size={15} />
            </button>
            <SaveButton saved={saved} onToggle={() => setSaved((s) => !s)} size={40} />
          </div>
        }
      />

      <div className="relative">
        <img src={l.photos[shot]} alt={l.title} className="h-64 w-full object-cover" />
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
      </div>

      <div className="px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <PriceBlock price={l.price} note={l.priceNote} size="lg" />
          {l.condition ? (
            <ConditionBadge value={l.condition} />
          ) : (
            <Rating value={l.rating} count={l.reviews} />
          )}
        </div>
        <h1 className="mt-2 text-[22px] leading-tight">{l.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{l.subtitle}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <LocationRow text={`${l.location} · ${l.distance}`} />
          <TrustPill label="Industry verified" />
          <span className="text-[11px] text-muted-foreground">Listed {l.postedAt}</span>
        </div>

        <h2 className="mt-6 text-[16px]">Description</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{l.description}</p>

        <h2 className="mt-6 text-[16px]">
          {l.type === "service"
            ? "Service details"
            : l.type === "rental"
              ? "Rental terms"
              : "Specifications"}
        </h2>
        <dl className="mt-2 divide-y divide-border rounded-3xl border border-border">
          {l.specs.map((s) => (
            <div key={s.label} className="flex items-center justify-between px-4 py-3">
              <dt className="text-xs text-muted-foreground">{s.label}</dt>
              <dd className="text-xs font-semibold">{s.value}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-6 text-[16px]">{l.type === "product" ? "Seller" : "Provider"}</h2>
        <div className="mt-2 rounded-3xl border border-border bg-card p-4">
          <SellerSummary seller={seller} />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              { k: "Response", v: seller.responseRate },
              { k: "Replies in", v: seller.responseTime },
              { k: "On MusicLinkd", v: `${seller.years} yrs` },
            ].map((x) => (
              <div key={x.k} className="rounded-2xl bg-subtle py-2">
                <p className="text-[12px] font-bold">{x.v}</p>
                <p className="text-[10px] text-muted-foreground">{x.k}</p>
              </div>
            ))}
          </div>
          <Link to="/marketplace/seller/$id" params={{ id: seller.id }} className="mt-3 block">
            <Btn variant="outline" className="w-full">
              View profile
            </Btn>
          </Link>
        </div>

        <h2 className="mt-6 text-[16px]">Reviews</h2>
        <div className="mt-2 space-y-3">
          {reviews.slice(0, 2).map((r) => (
            <article key={r.id} className="rounded-3xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold">{r.name}</p>
                <Rating value={r.rating} />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {r.role} · {r.context} · {r.date}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
              {r.response ? (
                <p className="mt-2 rounded-2xl bg-subtle p-3 text-xs text-muted-foreground">
                  Seller: {r.response}
                </p>
              ) : null}
            </article>
          ))}
        </div>

        <h2 className="mt-6 text-[16px]">Related listings</h2>
        <div className="rail mt-2 flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {listings
            .filter((x) => x.id !== l.id)
            .slice(0, 4)
            .map((x) => (
              <ListingTile key={x.id} l={x} />
            ))}
        </div>

        <button
          onClick={() => setReport(true)}
          className="mx-auto mt-6 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground"
        >
          <Flag size={12} /> Report this listing
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 mx-auto w-full max-w-[430px] border-t border-border bg-card/95 px-5 py-3 backdrop-blur">
        <div className="flex gap-2">
          <Btn variant="outline" className="flex-1" onClick={() => setOffer(true)}>
            {cta[0]}
          </Btn>
          <Link to="/messages" className="flex-1">
            <Btn className="w-full">{cta[1]}</Btn>
          </Link>
        </div>
      </div>

      <OfferSheet open={offer} onClose={() => setOffer(false)} listing={l} />
      <ReportSheet open={report} onClose={() => setReport(false)} />
    </Screen>
  );
}
