import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { fileReport, type ReportSubject } from "@/lib/reports.functions";
import { makeOffer } from "@/lib/offers.functions";
import {
  Heart,
  MapPin,
  Star,
  ShieldCheck,
  Check,
  LocateFixed,
  Search,
  Guitar,
  MicVocal,
  SlidersVertical,
  Package,
  Headphones,
  Building2,
  Disc3,
  Speaker,
  ShoppingCart,
  ArrowLeft,
  ArrowRight,
  X,
  Send,
  Save,
  type LucideIcon,
} from "lucide-react";
import type { Listing } from "@/data/market";
import { rentalCategories, type RentalItem } from "@/data/rentals";
import {
  applyMarketFilter,
  emptyMarketFilter,
  priceBands,
  rateOptions,
  type MarketFilter,
} from "@/lib/market-filter";
import { Btn, Chip, IconBtn, Sheet, VerifiedBadge } from "./ui";
import { EmptyState as BaseEmptyState, Price, Segmented } from "./kit";
import { rupeeParts, unitLabel, type PriceParts } from "@/lib/price";
import { SectionActionLink } from "@/components/ml/links";
import { iconSize } from "@/lib/tokens";
import { StateIcon } from "./tab-icon";

export function SaveButton({
  saved,
  onToggle,
  size = 36,
}: {
  saved: boolean;
  onToggle: () => void;
  size?: number;
}) {
  return (
    <button
      type="button"
      aria-label={saved ? "Remove from saved" : "Save listing"}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className="flex items-center justify-center rounded-full bg-card transition-transform active:scale-97"
      style={{ width: size, height: size }}
    >
      <Heart
        size={size * 0.45}
        className={saved ? "text-primary" : "text-foreground"}
        fill={saved ? "currentColor" : "none"}
        strokeWidth={2}
      />
    </button>
  );
}

export function ConditionBadge({ value }: { value: string }) {
  return <span className="pill bg-background text-muted-foreground">{value}</span>;
}

export function Rating({
  value,
  count,
}: {
  value?: number | undefined;
  count?: number | undefined;
}) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 text-1 font-semibold text-warn">
      <Star size={iconSize.xs} fill="currentColor" strokeWidth={0} />
      {value.toFixed(1)}
      {count ? <span className="text-muted-foreground">({count})</span> : null}
    </span>
  );
}

/** A follower count beside a rating; nothing before anyone follows. */
export function Followers({ count }: { count?: number | undefined }) {
  if (!count) return null;
  return (
    <span className="text-1 text-muted-foreground">
      {count.toLocaleString("en-IN")} follower{count === 1 ? "" : "s"}
    </span>
  );
}

/** What a reviewer picked out ("On time"), as static pills under the review. */
export function ReviewTags({ tags }: { tags?: string[] | undefined }) {
  if (!tags?.length) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Tags">
      {tags.map((tag) => (
        <li key={tag} className="pill bg-background text-muted-foreground">
          {tag}
        </li>
      ))}
    </ul>
  );
}

export function LocationRow({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-1 text-muted-foreground">
      <MapPin size={iconSize.xs} strokeWidth={1.8} />
      <span className="truncate">{text}</span>
    </span>
  );
}

/** A listing's price: the amount, with the unit line and any price note under it. Never larger than
 * the title it sits under. */
export function PriceBlock({ price, size = "md" }: { price: PriceParts; size?: "md" | "lg" }) {
  return (
    <Price
      price={price}
      amountClassName={size === "lg" ? "text-3 font-bold" : "text-sm font-semibold"}
    />
  );
}

export function TrustPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-status-category-bg px-2.5 py-1 text-1 font-semibold text-status-category-text">
      <ShieldCheck size={iconSize.xs} strokeWidth={2.2} />
      {label}
    </span>
  );
}

const categoryIcons: Record<string, LucideIcon> = {
  instruments: Guitar,
  "audio-gear": MicVocal,
  audio: MicVocal,
  studio: SlidersVertical,
  rentals: Package,
  services: Headphones,
  spaces: Building2,
  dj: Disc3,
  live: Speaker,
  other: Package,
};

/** A market or rental category's line icon, in ink. */
export function MarketCategoryIcon({ slug, size = iconSize.lg }: { slug: string; size?: number }) {
  const Icon = categoryIcons[slug] ?? Package;
  return <Icon size={size} strokeWidth={1.75} className="text-foreground" aria-hidden />;
}

/** A category tile: opens the full category drawer. */
export function CategoryTile({
  slug,
  label,
  onOpen,
}: {
  slug: string;
  label: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="state-layer flex w-[104px] shrink-0 flex-col gap-2 rounded-lg bg-subtle p-3 text-left"
    >
      <span className="flex h-8 items-center">
        <MarketCategoryIcon slug={slug} />
      </span>
      <span className="text-1 font-semibold leading-tight text-foreground">{label}</span>
    </button>
  );
}

function typeMeta(l: Listing) {
  switch (l.type) {
    case "service":
      return {
        tag: "Service",
        line: l.delivery ? `Delivery ${l.delivery}` : l.remote ? "Remote" : "",
      };
    case "rental":
      return { tag: "Rental", line: l.availability ?? "Check availability" };
    case "space":
      return { tag: "Space", line: l.availability ?? "Book a slot" };
    default:
      return { tag: l.brand ?? "Product", line: l.postedAt };
  }
}

/** Physical things — gear for sale or for rent — get the product card. Services and spaces don't. */
// eslint-disable-next-line react-refresh/only-export-components -- predicate co-located with the card it gates
export const isProduct = (l: Listing) => l.type === "product" || l.type === "rental";

/** What the product card draws, whichever side of the market it came from. */
export type ProductItem = {
  /** Which detail page opens: a marketplace listing, or a piece of rental equipment. */
  opens: "listing" | "equipment";
  id: string;
  title: string;
  photos: string[];
  category: string;
  badge: string | null;
  price: PriceParts | null;
};

// eslint-disable-next-line react-refresh/only-export-components -- adapter co-located with the card
export function productFromListing(l: Listing): ProductItem {
  return {
    opens: "listing",
    id: l.id,
    title: l.title,
    photos: l.photos,
    category: l.category,
    badge: l.condition ?? typeMeta(l).tag,
    price: l.price,
  };
}

// eslint-disable-next-line react-refresh/only-export-components -- adapter co-located with the card
export function productFromRental(e: RentalItem): ProductItem {
  return {
    opens: "equipment",
    id: e.id,
    title: e.name,
    photos: e.photos,
    category: e.category ?? "other",
    badge: e.condition ?? "Rental",
    price:
      e.daily != null ? rupeeParts(e.daily, "day") : e.priceNote ? { amount: e.priceNote } : null,
  };
}

/* The badge moves by what it says. New catches the light; nearly new catches it more slowly; a
   rental breathes, as if on offer right now; worn gear and brand names stay still — a used amp
   shouldn't sparkle. Reduced motion stops all of it. */
const SWEEP =
  "bg-[linear-gradient(110deg,transparent_35%,rgb(255_255_255/0.55)_50%,transparent_65%)] bg-[length:200%_100%] bg-no-repeat";
function badgeMotion(label: string) {
  if (label === "New") return `${SWEEP} motion-safe:animate-glimmer`;
  if (label === "Like New" || label === "Excellent")
    return `${SWEEP} motion-safe:animate-glimmer-slow`;
  if (label === "Rental") return "motion-safe:animate-breathe";
  return "";
}

/*
 * The product card, drawn to the owner's reference (a 750px-wide product card). Every size, gap
 * and radius is that reference's pixel value as a share of the card's width (cqw), so the card
 * keeps its proportions at any width — a rail tile or half of a grid. Small text has a floor.
 */
export function ProductCard({
  item,
  saved,
  onSave,
  rail = false,
  preview = false,
}: {
  item: ProductItem;
  saved?: boolean;
  onSave?: () => void;
  rail?: boolean;
  /** Drawn for a listing still being written: the same card, not a link. */
  preview?: boolean;
}) {
  const [localSaved, setLocalSaved] = useState(false);
  const [shown, setShown] = useState(0);
  const [tapped, setTapped] = useState(false);
  const isSaved = saved ?? localSaved;
  const unit = unitLabel(item.price?.unit);
  const className = `group @container block ${rail ? "w-[224px] shrink-0" : ""}`;

  const body = (
    // The container can't size itself in cqw (it would measure the screen), so the card's own
    // radius, fill and shadow live one layer in, where cqw means the card's width.
    <div className="overflow-hidden rounded-[6.93cqw] bg-white shadow-[0_10px_24px_-12px_rgba(13,11,38,0.16)] transition-transform duration-[260ms] ease-spring group-active:scale-[0.96]">
      <div className="p-[2.93cqw]">
        <div className="relative aspect-[705/690] overflow-hidden rounded-[5.07cqw] bg-[#EEEEEE]">
          {item.photos.length ? (
            <div
              className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto"
              onScroll={(e) => {
                const el = e.currentTarget;
                setShown(Math.round(el.scrollLeft / el.clientWidth));
              }}
            >
              {item.photos.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt={i === 0 ? item.title : ""}
                  loading="lazy"
                  className="h-full w-full shrink-0 snap-center object-cover transition-transform duration-[600ms] ease-standard group-hover:scale-[1.04]"
                />
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <MarketCategoryIcon slug={item.category} size={36} />
            </div>
          )}
          {item.badge ? (
            <span
              className={`absolute left-[3.73cqw] top-[4cqw] rounded-full bg-white/25 px-[2.67cqw] py-[1.07cqw] text-[max(3.47cqw,11px)] leading-[1.2] text-white backdrop-blur-md ${badgeMotion(item.badge)}`}
            >
              {item.badge}
            </span>
          ) : null}
          <button
            type="button"
            aria-label={isSaved ? "Remove from saved" : "Save"}
            aria-pressed={isSaved}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setTapped(true);
              if (onSave) onSave();
              else setLocalSaved((s) => !s);
            }}
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget) setTapped(false);
            }}
            className={`absolute right-[3.47cqw] top-[2.93cqw] flex h-[10.4cqw] w-[10.4cqw] items-center justify-center rounded-full backdrop-blur-md transition-[color,background-color] duration-200 ${
              isSaved ? "bg-red-500/20 text-red-500" : "bg-white/50 text-[#0D0D0D]"
            } ${tapped ? "animate-tab-tap" : ""}`}
          >
            <StateIcon
              outline={Heart}
              solid="heart"
              active={isSaved}
              size="4.8cqw"
              move="beat"
              strokeWidth={2}
            />
          </button>
          {item.photos.length > 1 ? (
            <div
              className="absolute inset-x-0 bottom-[3.73cqw] flex justify-center gap-[1.2cqw]"
              aria-hidden
            >
              {item.photos.map((src, i) => (
                <span
                  key={src}
                  className={`h-[1.6cqw] rounded-full transition-[width,background-color] duration-300 ease-standard ${
                    i === shown ? "w-[4cqw] bg-white" : "w-[1.6cqw] bg-white/60"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="px-[5.6cqw] pb-[2.93cqw] pt-[3.2cqw]">
        <h3 className="truncate text-[max(5.33cqw,14px)] font-semibold leading-[1.15] tracking-[-0.02em] text-[#0D0D0D]">
          {item.title}
        </h3>
        <div className="mt-[4.8cqw] flex items-center justify-between gap-[2cqw]">
          {/* A rate is two values: the amount, then its unit on a small line under it. */}
          <span className="min-w-0">
            <span className="block truncate text-[max(4.8cqw,13px)] font-semibold leading-none text-price">
              {item.price?.amount ?? ""}
            </span>
            {unit ? (
              <span className="mt-[1.2cqw] block text-[max(3.47cqw,11px)] leading-none text-[#8A8A8A]">
                {unit}
              </span>
            ) : null}
          </span>
          {/* The whole card is the link; this only shows where it goes. */}
          <span
            aria-hidden
            className="flex h-[9.6cqw] w-[9.6cqw] shrink-0 items-center justify-center rounded-full bg-[#0D0D0D] text-white transition-transform duration-300 ease-spring group-hover:-rotate-12 group-hover:translate-x-[0.4cqw] group-active:scale-90"
          >
            <ShoppingCart className="h-[4.8cqw] w-[4.8cqw]" strokeWidth={2} />
          </span>
        </div>
      </div>
    </div>
  );

  if (preview) return <div className={className}>{body}</div>;
  return item.opens === "equipment" ? (
    <Link to="/marketplace/rent/e/$id" params={{ id: item.id }} className={className}>
      {body}
    </Link>
  ) : (
    <Link to="/marketplace/l/$id" params={{ id: item.id }} className={className}>
      {body}
    </Link>
  );
}

/**
 * Any marketplace listing: products and rentals get the product card. Services and spaces keep
 * their row in lists and are left out of product carousels.
 */
export function ListingCard({
  l,
  saved,
  onSave,
  rail = false,
}: {
  l: Listing;
  saved?: boolean;
  onSave?: () => void;
  rail?: boolean;
}) {
  // Carousels are product-only: a service is simply left out of a rail rather than drawn as a row.
  if (!isProduct(l)) return rail ? null : <ListingRow l={l} />;
  return (
    <ProductCard
      item={productFromListing(l)}
      rail={rail}
      {...(saved !== undefined ? { saved } : {})}
      {...(onSave ? { onSave } : {})}
    />
  );
}

/** The same, sized for a horizontal rail. */
export function ListingTile(props: { l: Listing; saved?: boolean; onSave?: () => void }) {
  return <ListingCard {...props} rail />;
}

/**
 * A list of listings: products as an unbroken two-column grid, then any services as full-width
 * rows after them. Interleaving a full-width row inside the grid leaves holes, and the market
 * leads with products.
 */
export function ListingGrid({
  items,
  saveProps,
}: {
  items: Listing[];
  saveProps?: (l: Listing) => { saved?: boolean; onSave?: () => void };
}) {
  const products = items.filter(isProduct);
  const others = items.filter((l) => !isProduct(l));
  return (
    <div className="space-y-3">
      {products.length ? (
        <div className="grid grid-cols-2 gap-3">
          {products.map((l) => (
            <ListingCard key={l.id} l={l} {...(saveProps?.(l) ?? {})} />
          ))}
        </div>
      ) : null}
      {others.map((l) => (
        <ListingRow key={l.id} l={l} />
      ))}
    </div>
  );
}

/** Rental equipment as a two-column grid of product cards. */
export function EquipmentGrid({ items }: { items: RentalItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((e) => (
        <ProductCard key={e.id} item={productFromRental(e)} />
      ))}
    </div>
  );
}

export function ListingRow({ l }: { l: Listing }) {
  const [saved, setSaved] = useState(false);
  return (
    <article className="flex gap-3 rounded-lg bg-subtle p-3">
      <Link to="/marketplace/l/$id" params={{ id: l.id }} className="shrink-0">
        {l.photos[0] ? (
          <img
            src={l.photos[0]}
            alt={l.title}
            loading="lazy"
            className="h-24 w-24 rounded-lg object-cover"
          />
        ) : (
          <div className="h-24 w-24 rounded-lg bg-subtle" />
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link to="/marketplace/l/$id" params={{ id: l.id }} className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{l.title}</h3>
            <PriceBlock price={l.price} />
          </Link>
          <SaveButton saved={saved} onToggle={() => setSaved((s) => !s)} size={32} />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {l.condition ? <ConditionBadge value={l.condition} /> : null}
          <Rating value={l.rating} count={l.reviews} />
          {l.distance ? <LocationRow text={l.distance} /> : null}
        </div>
        {l.reason ? (
          <p className="mt-1.5 truncate text-1 font-semibold text-foreground">{l.reason}</p>
        ) : null}
      </div>
    </article>
  );
}

export function SellerSummary({
  seller,
  compact = false,
}: {
  seller: {
    id?: string | null;
    name: string;
    role?: string;
    location?: string;
    verified: boolean;
    rating?: number;
    reviews?: number;
    followers?: number;
    responseTime?: string;
    photo?: string;
  };
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      {seller.photo ? (
        <img src={seller.photo} alt={seller.name} className="h-12 w-12 rounded-sm object-cover" />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-2 font-semibold">{seller.name}</p>
          {seller.verified ? <VerifiedBadge size={16} /> : null}
        </div>
        {seller.role ? (
          <p className="truncate text-1 text-muted-foreground">{seller.role}</p>
        ) : null}
        {compact || !(seller.rating || seller.followers || seller.responseTime) ? null : (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Rating value={seller.rating} count={seller.reviews} />
            <Followers count={seller.followers} />
            {seller.responseTime ? (
              <span className="text-1 text-muted-foreground">Replies {seller.responseTime}</span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

/** Market's own emoji/spacing treatment, preserved via kit.tsx's EmptyState "square-lg" variant. */
export function EmptyState({
  emoji,
  title,
  body,
  action,
}: {
  emoji: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <BaseEmptyState variant="square-lg" icon={emoji} title={title} body={body} action={action} />
  );
}

export function ListingSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg bg-subtle">
      <div className="h-40 w-full animate-pulse bg-background" />
      <div className="space-y-2 p-3.5">
        <div className="h-4 w-24 animate-pulse rounded-full bg-background" />
        <div className="h-3 w-full animate-pulse rounded-full bg-background" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-background" />
      </div>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- constant intentionally co-located with its component
export const marketCities = ["Mumbai", "Delhi NCR", "Bengaluru", "Chennai", "Pune", "Goa"];

const CITY_KEY = "ml.market.city";

/** The Market's chosen place, kept on this device. */
// eslint-disable-next-line react-refresh/only-export-components -- hook intentionally co-located with its component
export function useMarketCity() {
  const [city, setCity] = useState("Mumbai");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CITY_KEY);
      if (saved) setCity(saved);
    } catch {
      /* storage may be unavailable */
    }
  }, []);
  const choose = (next: string) => {
    setCity(next);
    try {
      window.localStorage.setItem(CITY_KEY, next);
    } catch {
      /* storage may be unavailable */
    }
  };
  return [city, choose] as const;
}

/** Choose a location: locate me or edit, then a flat list of suggested places. */
export function LocationSheet({
  open,
  onClose,
  city,
  onChoose,
}: {
  open: boolean;
  onClose: () => void;
  city: string;
  onChoose: (city: string) => void;
}) {
  const [locating, setLocating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const pick = (next: string) => {
    onChoose(next);
    setEditing(false);
    setQuery("");
    onClose();
  };
  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocating(false);
        pick("Current location");
      },
      () => setLocating(false),
      { timeout: 10000 },
    );
  };
  const shown = marketCities.filter((c) => c.toLowerCase().includes(query.toLowerCase()));
  return (
    <Sheet open={open} onClose={onClose} title="Choose a location">
      <p className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <MapPin size={iconSize.sm} aria-hidden /> {city}
      </p>
      <div className="mb-5 flex gap-2">
        <Btn
          className="flex-1"
          icon={<LocateFixed size={iconSize.sm} />}
          loading={locating}
          onClick={locate}
        >
          Locate me
        </Btn>
        <Btn variant="ghost" className="flex-1" onClick={() => setEditing((v) => !v)}>
          Edit
        </Btn>
      </div>
      {editing ? (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          aria-label="Search places"
          className="press-brand mb-3 h-12 w-full rounded-sm border border-border bg-card px-3.5 text-sm outline-none focus:border-foreground"
        />
      ) : null}
      <p className="pill mb-1 text-muted-foreground">Suggested for you</p>
      <ul>
        {shown.map((c) => (
          <li key={c}>
            <button
              type="button"
              onClick={() => pick(c)}
              className="state-layer flex w-full items-center gap-3 py-3 text-left text-sm"
            >
              <Search size={iconSize.md} className="shrink-0 text-muted-foreground" aria-hidden />
              <span className={c === city ? "font-semibold" : ""}>{c}</span>
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

/** Every category: a search field, then rows with the icon in a grey circle. */
export function CategorySheet({
  open,
  onClose,
  categories,
  rental = false,
}: {
  open: boolean;
  onClose: () => void;
  categories: readonly { slug: string; label: string }[];
  /** Rental categories open under /marketplace/rent. */
  rental?: boolean;
}) {
  const [query, setQuery] = useState("");
  const shown = categories.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));
  return (
    <Sheet open={open} onClose={onClose} title="Categories">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search"
        aria-label="Search categories"
        className="press-brand mb-3 h-12 w-full rounded-sm border border-border bg-card px-3.5 text-sm outline-none focus:border-foreground"
      />
      <ul>
        {shown.map((c) => (
          <li key={c.slug}>
            <Link
              to={rental ? "/marketplace/rent/c/$slug" : "/marketplace/c/$slug"}
              params={{ slug: c.slug }}
              onClick={onClose}
              className="state-layer flex items-center gap-3 py-2.5"
            >
              <span
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-icon-chip"
              >
                <MarketCategoryIcon slug={c.slug} />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">
                {c.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

/** The filter sheet's pick-as-many groups; which one a chip toggles is its key in MarketFilter. */
const filterGroups: {
  key: "categories" | "conditions" | "rates" | "fulfilment" | "prices";
  label: string;
  options: { label: string; value: string }[];
  /** Only for rentals: shown unless the type is For sale. */
  rentalOnly?: boolean;
}[] = [
  {
    key: "categories",
    label: "Category",
    options: rentalCategories.map((c) => ({ label: c.label, value: c.slug })),
  },
  {
    key: "conditions",
    label: "Condition",
    options: ["New", "Like New", "Used"].map((c) => ({ label: c, value: c })),
  },
  { key: "rates", label: "Rental rate", options: rateOptions, rentalOnly: true },
  {
    key: "fulfilment",
    label: "Fulfilment",
    options: ["Pickup", "Delivery"].map((c) => ({ label: c, value: c })),
  },
  {
    key: "prices",
    label: "Price",
    options: priceBands.map((b) => ({ label: b.label, value: b.label })),
  },
];

/** Sale or rental is one or the other, so it's a tab row (Segmented), not a Chip cluster. */
const listingTypes = ["All", "For sale", "For rent"] as const;

/**
 * Market's filters. The sheet edits its own copy and hands it back on Show; the count on that
 * button is what the copy would show from `items`.
 */
export function MarketFilterSheet({
  open,
  onClose,
  items,
  value,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  items: Listing[];
  value: MarketFilter;
  onApply: (f: MarketFilter) => void;
}) {
  const [f, setF] = useState<MarketFilter>(value);
  useEffect(() => {
    if (open) setF(value);
  }, [open, value]);
  const results = applyMarketFilter(items, f).length;

  const toggle = (key: (typeof filterGroups)[number]["key"], v: string) =>
    setF((cur) => ({
      ...cur,
      [key]: cur[key].includes(v) ? cur[key].filter((x) => x !== v) : [...cur[key], v],
    }));

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-3">Filters</h2>
        <button
          type="button"
          onClick={() => setF(emptyMarketFilter)}
          className="text-1 font-semibold text-foreground"
        >
          Clear all
        </button>
      </div>

      <div className="mb-5">
        <h3 className="mb-2 text-sm font-semibold text-foreground">Listing type</h3>
        <Segmented
          value={f.type}
          options={listingTypes}
          onChange={(type) => setF((cur) => ({ ...cur, type }))}
        />
      </div>

      {filterGroups
        .filter((g) => !(g.rentalOnly && f.type === "For sale"))
        .map((g) => (
          <div key={g.key} className="mb-5">
            <h3 className="mb-2 text-sm font-semibold text-foreground">{g.label}</h3>
            <div className="flex flex-wrap gap-2">
              {g.options.map((o) => (
                <Chip
                  key={o.value}
                  active={f[g.key].includes(o.value)}
                  onClick={() => toggle(g.key, o.value)}
                >
                  {o.label}
                </Chip>
              ))}
            </div>
          </div>
        ))}

      <div className="mb-6 rounded-lg border border-border">
        <SwitchRow
          label="Verified sellers only"
          value={f.verifiedOnly}
          onChange={(verifiedOnly) => setF((cur) => ({ ...cur, verifiedOnly }))}
        />
      </div>

      <Btn
        className="w-full"
        onClick={() => {
          onApply(f);
          onClose();
        }}
      >
        Show {results} result{results === 1 ? "" : "s"}
      </Btn>
    </Sheet>
  );
}

function SwitchRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between px-4 py-4 text-left"
    >
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span
        className={`relative h-7 w-12 rounded-full transition-colors ${value ? "bg-primary" : "bg-border"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-card transition-all ${value ? "left-6" : "left-1"}`}
        />
      </span>
    </button>
  );
}

export function SortSheet({
  open,
  onClose,
  value,
  onChange,
  options,
}: {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Sort by">
      <div className="divide-y divide-border rounded-lg border border-border">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => {
              onChange(o);
              onClose();
            }}
            className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-medium"
          >
            {o}
            {value === o ? (
              <Check size={iconSize.md} className="text-primary" aria-label="Selected" />
            ) : null}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

export function OfferSheet({
  open,
  onClose,
  listing,
}: {
  open: boolean;
  onClose: () => void;
  listing: Listing;
}) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const send = useServerFn(makeOffer);

  const close = () => {
    setSent(false);
    setAmount("");
    setMessage("");
    onClose();
  };

  async function submit() {
    const rupees = Number(amount.replace(/[^0-9]/g, ""));
    if (!rupees) return;
    setSending(true);
    try {
      await send({
        data: {
          listingId: listing.id,
          amountPaise: rupees * 100,
          ...(message.trim() ? { message: message.trim() } : {}),
        },
      });
      setSent(true);
    } catch {
      /* Sheet stays open with the form intact so they can just try again. */
    } finally {
      setSending(false);
    }
  }

  return (
    <Sheet open={open} onClose={close}>
      {sent ? (
        <div className="py-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-container text-success-strong">
            <Check size={iconSize.xl} aria-hidden />
          </div>
          <h2 className="text-3">Offer sent</h2>
          <p className="mx-auto mt-2 max-w-[260px] text-sm text-muted-foreground">
            Your offer is pending. The seller can accept or decline it from their side.
          </p>
          <Btn className="mt-6 w-full" onClick={close}>
            Done
          </Btn>
        </div>
      ) : (
        <>
          <h2 className="mb-4 text-3">Make an offer</h2>
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-border p-3">
            {listing.photos[0] ? (
              <img src={listing.photos[0]} alt="" className="h-14 w-14 rounded-sm object-cover" />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate text-1 font-semibold">{listing.title}</p>
              <p className="text-1 text-muted-foreground">Asking</p>
              <Price price={listing.price} amountClassName="text-1" />
            </div>
          </div>

          <label
            htmlFor="your-offer"
            className="mb-1.5 block text-1 font-medium text-muted-foreground"
          >
            Your offer
          </label>
          <input
            id="your-offer"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="₹1,70,000"
            className="mb-4 h-14 w-full rounded-full border border-border bg-card px-5 text-2 font-semibold outline-none focus:border-primary"
          />

          <label
            htmlFor="message-optional"
            className="mb-1.5 block text-1 font-medium text-muted-foreground"
          >
            Message (optional)
          </label>
          <textarea
            id="message-optional"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="I can collect this weekend."
            className="mb-3 w-full rounded-lg border border-border bg-card p-4 text-sm outline-none focus:border-primary"
          />
          <p className="mb-5 text-1 text-muted-foreground">
            Payment is arranged directly with the seller.
          </p>

          <Btn className="w-full" disabled={!amount || sending} onClick={() => void submit()}>
            {sending ? "Sending…" : "Send Offer"}
          </Btn>
        </>
      )}
    </Sheet>
  );
}

/** Files a report and says so; the sheet closes either way once it's with the team. */
export function useFileReport(onDone: () => void) {
  const report = useServerFn(fileReport);
  return useMutation({
    mutationFn: (v: { subjectType: ReportSubject; subjectId: string; reason: string }) =>
      report({ data: v }),
    onSuccess: () => {
      toast.success("Reported. Thanks — the team will look at it.");
      onDone();
    },
    onError: () => toast.error("That didn't send. Try again."),
  });
}

export function ReportSheet({
  open,
  onClose,
  subjectId,
}: {
  open: boolean;
  onClose: () => void;
  /** The listing being reported. */
  subjectId: string;
}) {
  const reasons = [
    "Incorrect information",
    "Suspected scam",
    "Item already sold",
    "Prohibited item",
    "Seller behaviour",
  ];
  const [reason, setReason] = useState(reasons[0]!);
  const send = useFileReport(onClose);
  return (
    <Sheet open={open} onClose={onClose} title="Report listing">
      <div className="mb-5 divide-y divide-border rounded-lg border border-border">
        {reasons.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReason(r)}
            className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-medium"
          >
            {r}
            {reason === r ? (
              <Check size={iconSize.md} className="text-primary" aria-label="Selected" />
            ) : null}
          </button>
        ))}
      </div>
      <Btn
        className="w-full"
        loading={send.isPending}
        onClick={() => send.mutate({ subjectType: "listing", subjectId, reason })}
      >
        Submit Report
      </Btn>
    </Sheet>
  );
}

export function SectionRow({
  title,
  hint,
  to,
  action,
  children,
}: {
  title: string;
  hint?: string;
  to?: string;
  /** Used in place of the See All link when the section opens something instead of a page. */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-7">
      <div className="mb-3 flex items-baseline justify-between px-5">
        <div>
          <h2 className="text-2">{title}</h2>
          {hint ? <p className="text-1 text-muted-foreground">{hint}</p> : null}
        </div>
        {action ??
          (to ? (
            <SectionActionLink to={to} className="text-1">
              See All
            </SectionActionLink>
          ) : null)}
      </div>
      {children}
    </section>
  );
}

/*
 * Footer for the listing flows (sell, rent out): icon-only Cancel (leave the flow) and Back beside
 * the one primary action.
 * The last step publishes; every step before it continues.
 */
export function ListingStepFooter({
  step,
  last,
  onCancel,
  onBack,
  onNext,
  disabled = false,
  busy = false,
  publishLabel,
  onSaveDraft,
}: {
  step: number;
  last: boolean;
  onCancel: () => void;
  onBack: () => void;
  onNext: () => void;
  disabled?: boolean;
  busy?: boolean;
  publishLabel: string;
  /** On the last step, a Save draft button beside Publish. */
  onSaveDraft?: () => void;
}) {
  return (
    <div className="space-y-3">
      {last && onSaveDraft ? (
        <Btn variant="outline" className="w-full" disabled={busy} onClick={onSaveDraft}>
          <Save size={iconSize.sm} aria-hidden />
          Save draft
        </Btn>
      ) : null}
      <div className="flex items-center gap-3">
        <IconBtn label="Cancel" className="h-control w-control" onClick={onCancel}>
          <X size={iconSize.md} aria-hidden />
        </IconBtn>
        {step > 0 ? (
          <IconBtn label="Back" className="h-control w-control" onClick={onBack}>
            <ArrowLeft size={iconSize.md} aria-hidden />
          </IconBtn>
        ) : null}
        <Btn className="flex-1" disabled={disabled || busy} onClick={onNext}>
          {last ? (busy ? "Publishing…" : publishLabel) : "Continue"}
          {last ? (
            <Send size={iconSize.sm} aria-hidden />
          ) : (
            <ArrowRight size={iconSize.sm} aria-hidden />
          )}
        </Btn>
      </div>
    </div>
  );
}
