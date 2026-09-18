import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
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
import { EmptyState, Loading } from "@/components/ml/kit";
import { loadCatalogListings, loadListingBySlug } from "@/lib/market-view";
import { useSavedListings } from "@/hooks/use-saved-listings";
import { rememberListingVisit } from "@/lib/device-history";
import { listReviewsFor } from "@/lib/reviews.functions";
import { priceText } from "@/lib/price";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/marketplace/l/$id")({
  // The id is a database listing slug; related listings are the other listings in its category.
  loader: async ({ params }) => {
    const all = await loadCatalogListings();
    // Not in browsing (a service, or set unavailable/archived) is not the same as not existing.
    const catalog = all.find((x) => x.id === params.id) ?? (await loadListingBySlug(params.id));
    return { catalog, all };
  },
  head: ({ loaderData }) => {
    const l = loaderData?.catalog ?? undefined;
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
  const l = catalog ?? undefined;
  const { has: isSaved, toggle: toggleSave } = useSavedListings();
  // Saves are keyed by the listing's row uuid; the route id is its slug.
  const saved = l?.dbId ? isSaved(l.dbId) : false;
  const toggleSaved = () => (l?.dbId ? toggleSave(l.dbId) : undefined);
  const [offer, setOffer] = useState(false);
  const [report, setReport] = useState(false);
  const [shot, setShot] = useState(0);
  const loadReviews = useServerFn(listReviewsFor);
  const ownerId = l?.owner?.id;
  const realReviews = useQuery({
    queryKey: ["marketplace", "listing-owner-reviews", ownerId],
    queryFn: () => loadReviews({ data: { profileId: ownerId! } }),
    enabled: !!ownerId,
  });
  // Goods only: the market's recently viewed rail never lists services.
  const viewedType = l?.type;
  useEffect(() => {
    if (viewedType === "product" || viewedType === "rental") rememberListingVisit(id);
  }, [id, viewedType]);

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
            <SaveButton saved={saved} onToggle={toggleSaved} size={40} />
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
          {l.owner?.verified ? <TrustPill label="Industry verified" /> : null}
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

        {l.owner ? (
          <>
            <h2 className="mt-6 text-2">{l.type === "product" ? "Seller" : "Provider"}</h2>
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
          </>
        ) : null}

        {ownerId ? (
          <>
            <h2 className="mt-6 text-2">Reviews</h2>
            <div className="mt-2 space-y-3">
              {realReviews.isLoading ? (
                <Loading rows={2} />
              ) : realReviews.data?.length ? (
                realReviews.data.map((r) => (
                  <article key={r.id} className="rounded-lg bg-subtle p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-1 font-semibold">{r.author_name}</p>
                      <Rating value={r.rating} />
                    </div>
                    <p className="text-1 text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-IN")}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
                    {r.response ? (
                      <p className="mt-2 rounded-lg bg-subtle p-3 text-1 text-muted-foreground">
                        Seller: {r.response}
                      </p>
                    ) : null}
                  </article>
                ))
              ) : (
                <EmptyState title="No reviews yet" body="No one has reviewed this seller yet." />
              )}
            </div>
          </>
        ) : null}

        <h2 className="mt-6 text-2">Related listings</h2>
        <div className="rail mt-2 flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {all
            .filter((x) => x.category === l.category && x.id !== l.id)
            .map((x) => (
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
      <ReportSheet open={report} onClose={() => setReport(false)} subjectId={l.id} />
    </Screen>
  );
}
