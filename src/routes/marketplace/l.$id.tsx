import { createFileRoute } from "@tanstack/react-router";
import { reviewItemFrom } from "@/lib/review-item";
import { ReviewCard, ReviewRail } from "@/components/ml/profile";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Award,
  Cable,
  CalendarClock,
  CalendarDays,
  CircleCheck,
  Flag,
  Hash,
  Info,
  MapPin,
  MessageCircle,
  Palette,
  PenLine,
  Plug,
  Ruler,
  Shapes,
  Share2,
  SlidersVertical,
  Sparkles,
  Tag,
  Truck,
  Weight,
  type LucideIcon,
} from "lucide-react";
import { ActionBar, Screen, TopBar, Btn, BtnLink, IconBtn, IconBtnLink } from "@/components/ml/ui";
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
  MarketCategoryIcon,
  SellerCard,
  TrustPill,
} from "@/components/ml/market";
import { EmptyState, LoadError, Loading } from "@/components/ml/kit";
import { loadCatalogListings, loadListingBySlug } from "@/lib/market-view";
import { useSavedListings } from "@/hooks/use-saved-listings";
import { rememberListingVisit } from "@/lib/device-history";
import { listReviewsFor } from "@/lib/reviews.functions";
import { countSellerListings } from "@/lib/catalog.functions";
import { inr, priceText } from "@/lib/price";
import { iconSize } from "@/lib/tokens";
import { sized } from "@/lib/image-url";

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
  const strip = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const taxonomy = useGearTaxonomy();
  const loadReviews = useServerFn(listReviewsFor);
  const ownerId = l?.owner?.id;
  const countListings = useServerFn(countSellerListings);
  const sellerListings = useQuery({
    queryKey: ["marketplace", "seller-listings", ownerId],
    queryFn: () => countListings({ data: { profileId: ownerId! } }),
    enabled: !!ownerId,
  });
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
  // The listing's own fields as one details list (condition is the badge by the price); the
  // seller's specifications follow, without repeating a label already shown.
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
        { label: "Fulfilment", value: fulfil },
        { label: "City", value: where },
      ].filter((f) => f.value)
    : [];
  /*
   * What renting this actually commits you to. These lived on a second detail screen
   * (/marketplace/rent/e/$id), so the row you were looking at told you the price here and the
   * deposit there. They belong with the listing. Only what is set is shown.
   */
  const terms = rental
    ? [
        ...(l.weekly != null ? [{ label: "Weekly", value: inr(l.weekly) }] : []),
        ...(l.monthly != null ? [{ label: "Monthly", value: inr(l.monthly) }] : []),
        ...(l.minDays != null
          ? [{ label: "Minimum rental", value: `${l.minDays} day${l.minDays > 1 ? "s" : ""}` }]
          : []),
        ...(l.maxDays != null ? [{ label: "Maximum rental", value: `${l.maxDays} days` }] : []),
        ...(l.noticePeriod ? [{ label: "Notice period", value: l.noticePeriod }] : []),
        ...(l.quantity != null ? [{ label: "Quantity available", value: `${l.quantity}` }] : []),
        // No stored fee is not a free delivery, so the amount shows only when it is set.
        ...(l.deliverable
          ? [
              {
                label: "Delivery",
                value: `${l.pickup ? "Pickup or " : ""}delivery${l.deliveryFee != null ? ` ${inr(l.deliveryFee)}` : ""}`,
              },
            ]
          : []),
        ...(l.deliveryNote ? [{ label: "Delivery note", value: l.deliveryNote }] : []),
      ]
    : [];
  const details = [
    ...facts,
    ...l.specs.filter(
      (sp) =>
        sp.label.toLowerCase() !== "condition" &&
        !facts.some((f) => f.label.toLowerCase() === sp.label.toLowerCase()),
    ),
  ];
  const related = all.filter(
    (x) => x.id !== l.id && (l.gear ? x.gear === l.gear : x.category === l.category),
  );

  const productPrice = l.price.amount.replace(/[^0-9.]/g, "") || "0";
  const productStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: l.title,
    description: l.subtitle || l.title,
    image: l.photos,
    category: l.category,
    brand: l.brand ? { "@type": "Brand", name: l.brand } : undefined,
    itemCondition:
      l.condition === "New"
        ? "https://schema.org/NewCondition"
        : l.condition === "Like New"
          ? "https://schema.org/LikeNewCondition"
          : "https://schema.org/UsedCondition",
    offers: {
      "@type": "Offer",
      price: productPrice,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      seller: l.owner
        ? {
            "@type": "Person",
            name: l.owner.name,
          }
        : undefined,
    },
  };

  return (
    <Screen className="pb-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData) }}
      />
      {/* Media runs under the top bar: full width, as tall as the screen allows (a square on a
          phone, at most 62% of the viewport). Back, share and save float over it. */}
      {/* Zero-height sticky strip: the buttons ride over the photo and stay on screen when it
          scrolls away. */}
      <div className="sticky top-0 z-bar h-0">
        <div className="flex items-center justify-between px-5 pt-4">
          <IconBtnLink label="Back" to="/marketplace" className="bg-white/85 backdrop-blur">
            <ArrowLeft size={iconSize.md} aria-hidden />
          </IconBtnLink>
          <div className="flex items-center gap-2">
            <IconBtn
              label="Share"
              className="bg-white/85 backdrop-blur"
              onClick={() => void shareLink({ title: l.title, url: window.location.href })}
            >
              <Share2 size={iconSize.sm} aria-hidden />
            </IconBtn>
            <SaveButton saved={saved} onToggle={toggleSaved} size={40} />
          </div>
        </div>
      </div>

      <div className="relative">
        {l.photos.length ? (
          <>
            <div
              ref={strip}
              className="no-scrollbar flex h-[min(100vw,62vh)] max-h-[640px] snap-x snap-mandatory overflow-x-auto bg-card"
              onScroll={(e) => {
                const el = e.currentTarget;
                setShot(Math.round(el.scrollLeft / el.clientWidth));
              }}
            >
              {l.photos.map((src, i) => (
                <img
                  key={src}
                  src={sized(src, { width: 412 })}
                  alt={i === 0 ? l.title : `${l.title}, photo ${i + 1}`}
                  className="h-full w-full shrink-0 snap-center object-cover"
                />
              ))}
            </div>
            <div
              className={`pointer-events-none absolute inset-x-0 bottom-3 items-center justify-center gap-1.5 ${l.photos.length > 1 ? "flex" : "hidden"}`}
            >
              {l.photos.map((p, i) => (
                <span
                  key={p}
                  aria-hidden
                  className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${i === shot ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
                />
              ))}
            </div>
            <span className="absolute bottom-3 right-4 rounded-sm bg-black/55 px-2 py-0.5 text-1 font-semibold text-white">
              {shot + 1}/{l.photos.length}
            </span>
          </>
        ) : (
          <div className="flex h-[min(100vw,62vh)] items-center justify-center bg-card">
            <MarketCategoryIcon slug={l.gear ?? "other"} size={48} />
          </div>
        )}
      </div>

      {/* Every photo as a thumbnail; tap one to jump to it. */}
      {l.photos.length > 1 ? (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pt-3">
          {l.photos.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Photo ${i + 1}`}
              aria-current={i === shot}
              onClick={() => {
                const el = strip.current;
                if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
              }}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-sm border-2 ${i === shot ? "border-foreground" : "border-transparent opacity-70"}`}
            >
              <img src={sized(src, { width: 412 })} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
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

        {rental && l.deposit != null ? (
          <div className="mt-6 rounded-lg bg-warn-container p-4">
            <p className="text-sm font-semibold text-warn-strong">
              Refundable security deposit {inr(l.deposit)}
            </p>
            <p className="mt-1 text-1 text-warn-strong">
              Held by the provider and returned when the equipment comes back as it went out.
            </p>
          </div>
        ) : null}

        {terms.length ? (
          <>
            <h2 className="mt-6 text-2">Rental terms</h2>
            <dl className="mt-2 divide-y divide-border rounded-lg bg-card">
              {terms.map((t) => (
                <div key={t.label} className="flex items-center gap-3 px-4 py-3">
                  <dt className="min-w-0 flex-1 text-1 text-foreground">{t.label}</dt>
                  <dd className="text-right text-1 font-semibold">{t.value}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : null}

        {details.length ? (
          <>
            <h2 className="mt-6 text-2">Details</h2>
            <dl className="mt-2 divide-y divide-border rounded-lg bg-card">
              {details.map((d) => {
                const Icon = detailIcon(d.label);
                return (
                  <div key={d.label} className="flex items-center gap-3 px-4 py-3">
                    <Icon size={iconSize.md} strokeWidth={1.75} className="shrink-0" aria-hidden />
                    <dt className="min-w-0 flex-1 text-1 text-foreground">{d.label}</dt>
                    <dd className="text-right text-1 font-semibold">{d.value}</dd>
                  </div>
                );
              })}
            </dl>
          </>
        ) : null}

        {l.included?.length ? (
          <>
            <h2 className="mt-6 text-2">What's included</h2>
            <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-card p-4">
              {l.included.map((x) => (
                <li key={x} className="flex items-center gap-2 text-1 text-foreground">
                  <CircleCheck
                    size={iconSize.sm}
                    strokeWidth={1.75}
                    className="shrink-0"
                    aria-hidden
                  />
                  {x}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {l.owner ? (
          <>
            <h2 className="mt-6 text-2">{l.type === "product" ? "Seller" : "Provider"}</h2>
            <div className="mt-2">
              <SellerCard seller={l.owner} listings={sellerListings.data ?? null} />
            </div>
          </>
        ) : null}

        {ownerId ? (
          <>
            <h2 className="mt-6 text-2">Reviews</h2>
            <div className="mt-2">
              {realReviews.isLoading ? (
                <Loading rows={2} />
              ) : realReviews.isError ? (
                <LoadError what="these reviews" />
              ) : realReviews.data?.length ? (
                <ReviewRail>
                  {realReviews.data.map((r) => (
                    <ReviewCard key={r.id} r={reviewItemFrom(r)} />
                  ))}
                </ReviewRail>
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
      <ActionBar>
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
      </ActionBar>

      <OfferSheet open={offer} onClose={() => setOffer(false)} listing={l} />
      <ReportSheet open={report} onClose={() => setReport(false)} subjectId={l.id} />
    </Screen>
  );
}

/** A line icon for each details row, by its label; anything unknown gets the info mark. */
const detailIcons: Record<string, LucideIcon> = {
  "listed for": Tag,
  type: Shapes,
  brand: Award,
  model: Hash,
  condition: Sparkles,
  fulfilment: Truck,
  city: MapPin,
  connectivity: Cable,
  power: Plug,
  weight: Weight,
  year: CalendarDays,
  channels: SlidersVertical,
  dimensions: Ruler,
  size: Ruler,
  colour: Palette,
  color: Palette,
};

function detailIcon(label: string): LucideIcon {
  return detailIcons[label.toLowerCase()] ?? Info;
}
