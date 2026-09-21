import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Share2, Flag, PenLine, MessageCircle, CalendarClock, Tag } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink, IconBtn } from "@/components/ml/ui";
import { MediaEmbed } from "@/components/ml/media-embed";
import { useAuth } from "@/hooks/use-auth";
import { shareLink } from "@/lib/booking-actions";
import { gearTypeOf, useGearTaxonomy } from "@/lib/listing-category";
import { shownPlace } from "@/lib/place";
import {
  ConditionBadge,
  ListingTile,
  LocationRow,
  OfferSheet,
  PriceBlock,
  Rating,
  ReportSheet,
  ReviewTags,
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
  const { user } = useAuth();
  const taxonomy = useGearTaxonomy();
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

  const goods = l.type === "product" || l.type === "rental";
  const rental = l.type === "rental";
  const mine = Boolean(user?.id && l.owner?.id === user.id);
  const where = shownPlace(l.location);
  // The listing's own fields as one details list; any older stored spec rows follow, without
  // repeating a label already shown.
  const fulfil =
    l.pickup && l.deliverable
      ? "Pickup or delivery"
      : l.deliverable
        ? "Delivery"
        : l.pickup
          ? "Pickup"
          : "";
  const facts = goods
    ? [
        { label: "Listed for", value: rental ? "Rent" : "Sale" },
        { label: "Type", value: gearTypeOf(l.itemCategory, taxonomy)?.label ?? "" },
        { label: "Brand", value: l.brand ?? "" },
        { label: "Model", value: l.model ?? "" },
        { label: "Condition", value: l.condition ?? "" },
        { label: "Fulfilment", value: fulfil },
        { label: "City", value: where },
      ].filter((f) => f.value)
    : [];
  const details = [
    ...facts,
    ...l.specs.filter((sp) => !facts.some((f) => f.label.toLowerCase() === sp.label.toLowerCase())),
  ];
  const related = all.filter(
    (x) => x.id !== l.id && (l.gear ? x.gear === l.gear : x.category === l.category),
  );

  return (
    <Screen className="pb-28">
      <TopBar
        title="Listing"
        back="/marketplace"
        right={
          <div className="flex items-center gap-2">
            <IconBtn
              label="Share"
              onClick={() => void shareLink({ title: l.title, url: window.location.href })}
            >
              <Share2 size={iconSize.sm} aria-hidden />
            </IconBtn>
            <SaveButton saved={saved} onToggle={toggleSaved} size={40} />
          </div>
        }
      />

      {/* Photos: swipe between them; the dots follow. */}
      {l.photos.length ? (
        <div className="relative">
          <div
            className="no-scrollbar flex aspect-square snap-x snap-mandatory overflow-x-auto bg-subtle"
            onScroll={(e) => {
              const el = e.currentTarget;
              setShot(Math.round(el.scrollLeft / el.clientWidth));
            }}
          >
            {l.photos.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={i === 0 ? l.title : `${l.title}, photo ${i + 1}`}
                className="h-full w-full shrink-0 snap-center object-cover"
              />
            ))}
          </div>
          {l.photos.length > 1 ? (
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden>
              {l.photos.map((p, i) => (
                <span
                  key={p}
                  className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${i === shot ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

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
        {l.subtitle ? <p className="mt-1 text-sm text-foreground">{l.subtitle}</p> : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {where ? <LocationRow text={where} /> : null}
          {l.owner?.verified ? <TrustPill label="Industry verified" /> : null}
          <span className="text-1 text-foreground">Listed {l.postedAt}</span>
        </div>

        {l.videoUrl ? (
          <div className="mt-6">
            <MediaEmbed url={l.videoUrl} title={l.title} />
          </div>
        ) : null}

        {l.description ? (
          <>
            <h2 className="mt-6 text-2">Description</h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{l.description}</p>
          </>
        ) : null}

        {details.length ? (
          <>
            <h2 className="mt-6 text-2">Details</h2>
            <dl className="mt-2 divide-y divide-border rounded-lg bg-card">
              {details.map((d) => (
                <div key={d.label} className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-1 text-foreground">{d.label}</dt>
                  <dd className="text-right text-1 font-semibold">{d.value}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : null}

        {l.included?.length ? (
          <>
            <h2 className="mt-6 text-2">What's included</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {l.included.map((x) => (
                <li key={x} className="pill bg-card text-foreground">
                  {x}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {l.owner ? (
          <>
            <h2 className="mt-6 text-2">{l.type === "product" ? "Seller" : "Provider"}</h2>
            <div className="mt-2 rounded-lg bg-subtle p-4">
              <SellerSummary seller={l.owner} />
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
                    <p className="mt-2 text-sm text-foreground">{r.body}</p>
                    <ReviewTags tags={r.tags} />
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

        {related.length ? (
          <>
            <h2 className="mt-6 text-2">Related listings</h2>
            <div className="rail mt-2 flex gap-3 overflow-x-auto pb-1 no-scrollbar">
              {related.map((x) => (
                <ListingTile key={x.id} l={x} />
              ))}
            </div>
          </>
        ) : null}

        {mine ? null : (
          <button
            onClick={() => setReport(true)}
            className="mx-auto mt-6 flex items-center gap-1.5 text-1 font-semibold text-foreground"
          >
            <Flag size={iconSize.xs} /> Report this listing
          </button>
        )}
      </div>

      {/* One primary action: yours → Edit; for sale → Make offer; for rent → Request rental. No
          payment anywhere — the rest happens between the two people. */}
      <div className="fixed inset-x-0 bottom-0 z-bar mx-auto w-full max-w-app bg-background/95 px-5 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur">
        {mine && l.dbId ? (
          <div className="flex gap-2">
            <BtnLink to="/marketplace/mine" variant="outline" className="flex-1">
              My listings
            </BtnLink>
            <BtnLink to="/marketplace/sell" search={{ edit: l.dbId }} className="flex-1">
              <PenLine size={iconSize.sm} aria-hidden />
              Edit listing
            </BtnLink>
          </div>
        ) : (
          <div className="flex gap-2">
            <BtnLink to="/messages" variant="outline" className="flex-1">
              <MessageCircle size={iconSize.sm} aria-hidden />
              Message
            </BtnLink>
            {rental ? (
              <BtnLink to="/marketplace/rent/request/$id" params={{ id: l.id }} className="flex-1">
                <CalendarClock size={iconSize.sm} aria-hidden />
                Request rental
              </BtnLink>
            ) : goods ? (
              <Btn className="flex-1" onClick={() => setOffer(true)}>
                <Tag size={iconSize.sm} aria-hidden />
                Make offer
              </Btn>
            ) : null}
          </div>
        )}
      </div>

      <OfferSheet open={offer} onClose={() => setOffer(false)} listing={l} />
      <ReportSheet open={report} onClose={() => setReport(false)} subjectId={l.id} />
    </Screen>
  );
}
