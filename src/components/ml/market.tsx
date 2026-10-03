import { Link, useNavigate } from "@tanstack/react-router";
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
  ChevronRight,
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
  ArrowUpRight,
  Piano,
  Drum,
  Wind,
  AudioWaveform,
  Music,
  SlidersHorizontal,
  AudioLines,
  Gauge,
  Megaphone,
  Cable,
  ArrowLeft,
  ArrowRight,
  X,
  Send,
  Save,
  type LucideIcon,
} from "lucide-react";
import type { Listing } from "@/data/market";
import { useSavedListings } from "@/hooks/use-saved-listings";
import { PersonAvatar } from "./person-avatar";
import { useGearTaxonomy, type GearTaxonomy } from "@/lib/listing-category";
import { useTaxonomy } from "@/lib/taxonomy";
import {
  DrawerList,
  DrawerOptionRow,
  DrawerSearch,
  DrawerSearchButton,
  SheetSectionHeading,
  matching,
} from "./drawer-list";
import {
  applyMarketFilter,
  conditionOptions,
  emptyMarketFilter,
  fulfilmentOptions,
  priceBands,
  rateOptions,
  typeOptions,
  type MarketFilter,
} from "@/lib/market-filter";
import { Btn, Chip, IconBtn, Sheet, VerifiedBadge } from "./ui";
import { EmptyState as BaseEmptyState, Price, Segmented } from "./kit";
import { unitLabel, unitName, type PriceParts } from "@/lib/price";
import { SectionActionLink } from "@/components/ml/links";
import { iconSize } from "@/lib/tokens";
import { StateIcon } from "./tab-icon";
import { sized } from "@/lib/image-url";

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
      aria-label={saved ? "Remove bookmark" : "Bookmark listing"}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className="hit-area flex items-center justify-center rounded-full bg-card transition-transform active:scale-97"
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
    <span className="inline-flex items-center gap-1 text-1 font-semibold text-warn-strong">
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
      inline
      amountClassName={size === "lg" ? "text-3 font-bold" : "text-sm font-semibold"}
      unitClassName={size === "lg" ? "text-sm" : "text-1"}
    />
  );
}

export function TrustPill({ label }: { label: string }) {
  return (
    // A trust signal, not a category: neutral ink on grey. Purple is the category badge's alone.
    <span className="inline-flex items-center gap-1 rounded-full bg-subtle px-2.5 py-1 text-1 font-semibold text-foreground">
      <ShieldCheck size={iconSize.xs} strokeWidth={2.2} aria-hidden />
      {label}
    </span>
  );
}

const categoryIcons: Record<string, LucideIcon> = {
  // Instrument families and equipment categories (the taxonomy's Market categories).
  guitar: Guitar,
  keys: Piano,
  percussion: Drum,
  wind: Wind,
  bowed: AudioWaveform,
  strings: Music,
  indian_string: Music,
  electronic: SlidersHorizontal,
  microphones: MicVocal,
  audio_interfaces: AudioLines,
  studio_monitors: Speaker,
  mixers: SlidersVertical,
  preamps: Gauge,
  headphones: Headphones,
  controllers: Disc3,
  pa_systems: Megaphone,
  backline: Cable,
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

/** A market or rental category's line icon, in ink by default — pass className to override on a
 * dark surface (e.g. inside bg-icon-chip, which is near-black). */
export function MarketCategoryIcon({
  slug,
  size = iconSize.lg,
  className = "text-foreground",
}: {
  slug: string;
  size?: number;
  className?: string;
}) {
  const Icon = categoryIcons[slug] ?? Package;
  return <Icon size={size} strokeWidth={1.75} className={className} aria-hidden />;
}

/** A category tile: opens the full category drawer. */
export function CategoryTile({
  slug,
  label,
  onOpen,
  icon,
}: {
  slug: string;
  label: string;
  onOpen: () => void;
  /** In place of the category's own icon (See all's arrow). */
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="state-layer flex w-[104px] shrink-0 flex-col gap-2 rounded-lg bg-subtle p-3 text-left"
    >
      <span className="flex h-8 items-center">{icon ?? <MarketCategoryIcon slug={slug} />}</span>
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

/** How a product card's badge moves: keyed off what the listing is, never off the badge's words. */
type BadgeMotion = "glimmer" | "glimmer-slow" | "breathe" | "still";

/** What the product card draws. Every product opens its listing (/marketplace/l/$id). */
export type ProductItem = {
  id: string;
  /** The listing's row uuid, which saves are keyed by. No uuid, no save control. */
  saveId?: string | undefined;
  title: string;
  photos: string[];
  category: string;
  badge: { label: string; motion: BadgeMotion } | null;
  price: PriceParts | null;
};

/* The badge moves by what the item is. New catches the light; nearly new catches it more slowly; a
   rental breathes, as if on offer right now; worn gear and brand names stay still — a used amp
   shouldn't sparkle. Reduced motion stops all of it. */
const CONDITION_MOTION: Record<NonNullable<Listing["condition"]>, BadgeMotion> = {
  New: "glimmer",
  "Like New": "glimmer-slow",
  Excellent: "glimmer-slow",
  Good: "still",
  Fair: "still",
  Used: "still",
};
const SWEEP =
  "bg-[linear-gradient(110deg,transparent_35%,rgb(255_255_255/0.55)_50%,transparent_65%)] bg-[length:200%_100%] bg-no-repeat";
const MOTION_CLASS: Record<BadgeMotion, string> = {
  glimmer: `${SWEEP} motion-safe:animate-glimmer`,
  "glimmer-slow": `${SWEEP} motion-safe:animate-glimmer-slow`,
  breathe: "motion-safe:animate-breathe",
  still: "",
};

// eslint-disable-next-line react-refresh/only-export-components -- adapter co-located with the card
export function productFromListing(l: Listing): ProductItem {
  const tag = typeMeta(l).tag;
  return {
    id: l.id,
    saveId: l.dbId,
    title: l.title,
    photos: l.photos,
    category: l.category,
    badge: l.condition
      ? { label: l.condition, motion: CONDITION_MOTION[l.condition] }
      : tag
        ? { label: tag, motion: l.type === "rental" ? "breathe" : "still" }
        : null,
    price: l.price,
  };
}

/*
 * The product card, drawn to the owner's reference (a 750px-wide product card): a photo in a
 * rounded frame inside a white card, the title, then the price with a round arrow showing where
 * the card goes. Sizes, radii and colours are tokens. The save heart sits over the photo as a
 * sibling of the card's link, never inside it.
 */
export function ProductCard({
  item,
  saved,
  onSave,
  rail = false,
  preview = false,
}: {
  item: ProductItem;
  saved?: boolean | undefined;
  onSave?: (() => void) | undefined;
  rail?: boolean | undefined;
  /** Drawn for a listing still being written: the same card, not a link. */
  preview?: boolean | undefined;
}) {
  const store = useSavedListings();
  const [shown, setShown] = useState(0);
  const [tapped, setTapped] = useState(false);
  // Saves are persisted (saved_items); a card with nothing to save against shows no heart.
  const canSave = !preview && Boolean(onSave || item.saveId);
  const isSaved = saved ?? (item.saveId ? store.has(item.saveId) : false);
  const unit = unitName(item.price?.unit);

  const body = (
    <div className="overflow-hidden rounded-lg bg-card shadow-sm transition-transform duration-300 ease-spring group-active:scale-[0.96]">
      <div className="p-2">
        <div className="relative aspect-square overflow-hidden rounded-md bg-subtle">
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
                  src={sized(src, { width: 412 })}
                  alt={i === 0 ? item.title : ""}
                  loading="lazy"
                  className="h-full w-full shrink-0 snap-center object-cover transition-transform duration-500 ease-standard group-hover:scale-[1.04]"
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
              className={`absolute left-2 top-2 rounded-full bg-background/25 px-2 py-1 text-1 leading-none text-background backdrop-blur-md ${MOTION_CLASS[item.badge.motion]}`}
            >
              {item.badge.label}
            </span>
          ) : null}
          {item.photos.length > 1 ? (
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1" aria-hidden>
              {item.photos.map((src, i) => (
                <span
                  key={src}
                  className={`h-1 rounded-full transition-[width,background-color] duration-300 ease-standard ${
                    i === shown ? "w-3 bg-background" : "w-1 bg-background/60"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="px-4 pb-3 pt-2">
        <h3 className="truncate text-sm font-semibold text-foreground">{item.title}</h3>
        <div className="mt-3 flex items-center justify-between gap-2">
          {/* A rate reads as one line: the amount, then "/day" in the small grey unit style. */}
          <span className="min-w-0 truncate leading-none">
            <span className="text-sm font-semibold text-price">{item.price?.amount ?? ""}</span>
            {unit ? <span className="text-1 text-muted-foreground">/{unit}</span> : null}
          </span>
          {/* The whole card is the link; this only shows where it goes. Nothing is bought here. */}
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-background transition-transform duration-300 ease-spring group-hover:translate-x-0.5 group-active:scale-90"
          >
            <ArrowUpRight size={iconSize.sm} strokeWidth={2} />
          </span>
        </div>
      </div>
    </div>
  );

  const heart = canSave ? (
    <button
      type="button"
      aria-label={isSaved ? "Remove bookmark" : "Bookmark"}
      aria-pressed={isSaved}
      onClick={() => {
        setTapped(true);
        if (onSave) onSave();
        else if (item.saveId) store.toggle(item.saveId);
      }}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) setTapped(false);
      }}
      className={`hit-area absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-md transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        tapped ? "animate-tab-tap" : ""
      }`}
    >
      <StateIcon
        outline={Heart}
        solid="heart"
        active={isSaved}
        size={iconSize.sm}
        move="beat"
        strokeWidth={2}
      />
    </button>
  ) : null;

  const width = rail ? "w-rail-md shrink-0" : "";
  if (preview) return <div className={`group relative block ${width}`}>{body}</div>;
  // Sale and rent are one flow, so a listing has one detail screen (/marketplace/l/$id).
  return (
    <div className={`group relative ${width}`}>
      <Link to="/marketplace/l/$id" params={{ id: item.id }} className="block">
        {body}
      </Link>
      {heart}
    </div>
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

export function ListingRow({ l }: { l: Listing }) {
  const store = useSavedListings();
  return (
    <article className="flex gap-3 rounded-lg bg-subtle p-3">
      <Link to="/marketplace/l/$id" params={{ id: l.id }} className="shrink-0">
        {l.photos[0] ? (
          <img
            src={sized(l.photos[0], { width: 96 })}
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
          {l.dbId ? (
            <SaveButton
              saved={store.has(l.dbId)}
              onToggle={() => l.dbId && store.toggle(l.dbId)}
              size={32}
            />
          ) : null}
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

/**
 * The seller on a listing page: the whole card opens their profile. Photo (initials when there is
 * none), name and badge, then one line of standing — rating, how many listings they have open in
 * Market (counted by the database; nothing while it loads), followers. A rental provider shares
 * the identity pieces but has its own card (ProviderCard, rental.tsx).
 */
export function SellerCard({
  seller,
  listings,
}: {
  seller: {
    name: string;
    username?: string | null;
    photo?: string;
    verified: boolean;
    rating?: number;
    reviews?: number;
    followers?: number;
  };
  /** Null while the count loads or when it could not be read: the line leaves it out. */
  listings: number | null;
}) {
  const facts = [
    listings ? `${listings} listing${listings === 1 ? "" : "s"}` : null,
    seller.followers ? `${seller.followers} follower${seller.followers === 1 ? "" : "s"}` : null,
  ].filter(Boolean);
  const body = (
    <>
      <PersonAvatar
        name={seller.name}
        photo={seller.photo ? sized(seller.photo, { width: 56 }) : null}
        className="h-14 w-14 shrink-0 text-2"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-foreground">{seller.name}</span>
          {seller.verified ? <VerifiedBadge size={16} /> : null}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-1 text-foreground">
          {seller.rating ? <Rating value={seller.rating} count={seller.reviews} /> : null}
          {facts.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </span>
      </span>
      {seller.username ? (
        <ChevronRight size={iconSize.md} className="shrink-0" aria-hidden />
      ) : null}
    </>
  );
  const cls = "flex items-center gap-3 rounded-lg bg-card p-4";
  return seller.username ? (
    <Link
      to="/profile/$username"
      params={{ username: seller.username }}
      className={`state-layer ${cls}`}
    >
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
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

/*
 * The six places offered first, each with a centre so Locate me can pick the nearest. Every name
 * here has to be a city the taxonomy knows, because that is what listings store: "Delhi NCR" and
 * "Goa" were neither cities nor taxonomy rows, so choosing one filtered to nothing while looking
 * like it had worked. Searching reaches every city, not just these six.
 */
// eslint-disable-next-line react-refresh/only-export-components -- constant intentionally co-located with its component
export const marketCities = ["Mumbai", "New Delhi", "Bengaluru", "Chennai", "Pune", "Panjim"];

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

/** Where each Market city is, for Locate me (nearest city) and the map. */
const cityCentres: Record<string, [number, number]> = {
  Mumbai: [19.076, 72.8777],
  "New Delhi": [28.6139, 77.209],
  Bengaluru: [12.9716, 77.5946],
  Chennai: [13.0827, 80.2707],
  Pune: [18.5204, 73.8567],
  Panjim: [15.4909, 73.8278],
};

function nearestCity(lat: number, lng: number) {
  let best = marketCities[0]!;
  let bestD = Infinity;
  for (const c of marketCities) {
    const centre = cityCentres[c];
    if (!centre) continue;
    const d = (centre[0] - lat) ** 2 + (centre[1] - lng) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

/**
 * Choose a location, drawn after Facebook Marketplace's: a map of where you are with the place
 * under it, Locate me and Edit, then suggested places. Locate me reads the device's position and
 * picks the nearest Market city; Edit searches the list.
 */
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
  const [here, setHere] = useState<[number, number] | null>(null);
  const allCities = useTaxonomy().options?.cities ?? [];
  const pick = (next: string) => {
    onChoose(next);
    setEditing(false);
    setQuery("");
    onClose();
  };
  const locate = () => {
    if (!navigator.geolocation) {
      toast.error("This device can't share its location");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setHere([pos.coords.latitude, pos.coords.longitude]);
        onChoose(nearestCity(pos.coords.latitude, pos.coords.longitude));
      },
      () => {
        setLocating(false);
        toast.error("Couldn't get your location — pick a city instead");
      },
      { timeout: 10000 },
    );
  };
  const centre = here ?? cityCentres[city];
  const mapSrc = centre
    ? `https://maps.google.com/maps?q=${centre[0]},${centre[1]}&z=${here ? 13 : 10}&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(`${city}, India`)}&z=10&output=embed`;
  // The six suggested places while idle; every city the taxonomy knows once you search, so a
  // place outside the shortlist can still be chosen rather than being unreachable.
  const term = query.trim().toLowerCase();
  const shown = term
    ? allCities.map((c) => c.label).filter((c) => c.toLowerCase().includes(term))
    : marketCities;
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Choose a location"
      titleAction={
        <DrawerSearchButton
          open={editing}
          onToggle={() => {
            if (editing) setQuery("");
            setEditing((v) => !v);
          }}
          label="Search a city"
        />
      }
    >
      <div className="overflow-hidden rounded-lg bg-card">
        {open ? (
          <iframe
            key={mapSrc}
            title={`Map of ${city}`}
            src={mapSrc}
            loading="lazy"
            className="pointer-events-none h-40 w-full border-0"
          />
        ) : null}
        <div className="p-4">
          <p className="mb-3 text-sm font-semibold text-foreground">{city}</p>
          <div className="flex gap-2">
            <Btn
              className="flex-1"
              icon={<LocateFixed size={iconSize.sm} />}
              loading={locating}
              onClick={locate}
            >
              Locate me
            </Btn>
          </div>
        </div>
      </div>
      {editing ? (
        <DrawerSearch
          value={query}
          onChange={setQuery}
          placeholder="Search a city"
          label="Search places"
        />
      ) : null}
      <SheetSectionHeading>Suggested for you</SheetSectionHeading>
      <DrawerList label="Suggested places">
        {shown.map((c) => (
          <DrawerOptionRow
            key={c}
            option={{ value: c, label: c, icon: MapPin }}
            selected={c === city}
            onClick={() => pick(c)}
          />
        ))}
      </DrawerList>
    </Sheet>
  );
}

/** Every category: the shared option list (search, then rows with the icon); a row opens it. */
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
  const navigate = useNavigate();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const shown = matching(
    categories.map((c) => ({
      value: c.slug,
      label: c.label,
      iconNode: (
        <MarketCategoryIcon slug={c.slug} size={iconSize.md} className="text-primary-foreground" />
      ),
    })),
    query,
  );
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Categories"
      titleAction={
        <DrawerSearchButton
          open={searching}
          onToggle={() => {
            if (searching) setQuery("");
            setSearching((v) => !v);
          }}
          label="Search categories"
        />
      }
    >
      {searching ? (
        <DrawerSearch value={query} onChange={setQuery} label="Search categories" />
      ) : null}
      <DrawerList label="Categories" empty="Nothing matches — try a broader word.">
        {shown.map((o) => (
          <DrawerOptionRow
            key={o.value}
            option={o}
            onClick={() => {
              onClose();
              void navigate({
                to: rental ? "/marketplace/rent/c/$slug" : "/marketplace/c/$slug",
                params: { slug: o.value },
              });
            }}
          />
        ))}
      </DrawerList>
    </Sheet>
  );
}

/** The filter sheet's pick-as-many groups; which one a chip toggles is its key in MarketFilter. */
type FilterGroup = {
  key: "types" | "categories" | "conditions" | "rates" | "fulfilment" | "prices";
  label: string;
  options: { label: string; value: string }[];
  /** Only for rentals: hidden when only For sale is picked. */
  rentalOnly?: boolean;
};

/** The filter groups; categories come from the taxonomy. */
const filterGroupsFor = (taxonomy: GearTaxonomy): FilterGroup[] => [
  {
    key: "types",
    label: "Listing type",
    options: typeOptions,
  },
  {
    key: "categories",
    label: "Category",
    options: taxonomy.categories.map((c) => ({ label: c.label, value: c.slug })),
  },
  {
    key: "conditions",
    label: "Condition",
    options: conditionOptions,
  },
  { key: "rates", label: "Rental rate", options: rateOptions, rentalOnly: true },
  {
    key: "fulfilment",
    label: "Fulfilment",
    options: fulfilmentOptions,
  },
  {
    key: "prices",
    label: "Price",
    options: priceBands.map((b) => ({ label: b.label, value: b.key })),
  },
];

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
  const taxonomy = useGearTaxonomy();
  const [f, setF] = useState<MarketFilter>(value);
  useEffect(() => {
    if (open) setF(value);
  }, [open, value]);
  const results = applyMarketFilter(items, f).length;

  const toggle = (key: FilterGroup["key"], v: string) =>
    setF((cur) => ({
      ...cur,
      [key]: cur[key].includes(v) ? cur[key].filter((x) => x !== v) : [...cur[key], v],
    }));

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filters"
      titleAction={
        <button
          type="button"
          onClick={() => setF(emptyMarketFilter)}
          className="shrink-0 text-1 font-semibold text-foreground"
        >
          Clear all
        </button>
      }
    >
      {filterGroupsFor(taxonomy)
        .filter((g) => !(g.rentalOnly && f.types.length === 1 && f.types[0] === "sale"))
        .map((g) => (
          <div key={g.key} className="mb-5">
            <SheetSectionHeading>{g.label}</SheetSectionHeading>
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

/**
 * The filters in force, under the view tabs: one chip each (tap to drop it) and Clear all. Shows
 * nothing when no filter is set.
 */
export function ActiveFilters({
  value,
  onChange,
  before,
  after,
}: {
  value: MarketFilter;
  onChange: (f: MarketFilter) => void;
  /** Leads the row (a result count); the row then shows even with no filter set. */
  before?: ReactNode;
  /** Ends the row, before Clear all (the sort in force). */
  after?: ReactNode;
}) {
  const taxonomy = useGearTaxonomy();
  const chips = filterGroupsFor(taxonomy).flatMap((g) =>
    value[g.key].map((v) => ({
      key: g.key,
      value: v,
      label: g.options.find((o) => o.value === v)?.label ?? v,
    })),
  );
  if (value.verifiedOnly)
    chips.push({ key: "verified" as never, value: "verified", label: "Verified sellers" });
  if (!chips.length && !before && !after) return null;
  return (
    <div className="rail no-scrollbar flex items-center gap-2 overflow-x-auto px-5 pb-4">
      {before}
      {chips.length ? (
        <button
          type="button"
          onClick={() => onChange(emptyMarketFilter)}
          className="hit-area shrink-0 px-1 text-1 font-semibold text-foreground underline underline-offset-2"
        >
          Clear all
        </button>
      ) : null}
      {chips.map((c) => (
        <button
          key={`${c.key}-${c.value}`}
          type="button"
          aria-label={`Remove ${c.label}`}
          onClick={() =>
            onChange(
              c.value === "verified"
                ? { ...value, verifiedOnly: false }
                : {
                    ...value,
                    [c.key]: (value[c.key as FilterGroup["key"]] ?? []).filter(
                      (x) => x !== c.value,
                    ),
                  },
            )
          }
          className="state-layer hit-area inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-card py-1.5 pl-2.5 pr-2 text-1 font-medium text-foreground"
        >
          {c.label}
          <X size={iconSize.xs} aria-hidden />
        </button>
      ))}
      {after}
    </div>
  );
}

/** The Filters button: dark with a count while any filter is set. */
export function FilterButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={count ? `Filters, ${count} applied` : "Filters"}
      onClick={onClick}
      className={`hit-area relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${count ? "border-foreground bg-ink text-background" : "border-border bg-card"}`}
    >
      <SlidersHorizontal size={iconSize.sm} aria-hidden />
      {count ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-button px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      ) : null}
    </button>
  );
}

/** A label with an on/off switch; the filter sheet and a collab's join link use it. */
export function SwitchRow({
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
  labels,
}: {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  /** What each option says, when the value is a key rather than its own wording. */
  labels?: Record<string, string> | undefined;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Sort by">
      <DrawerList label="Sort by">
        {options.map((o) => (
          <DrawerOptionRow
            key={o}
            option={{ value: o, label: labels?.[o] ?? o }}
            selected={value === o}
            onClick={() => {
              onChange(o);
              onClose();
            }}
          />
        ))}
      </DrawerList>
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
    if (!rupees || !listing.dbId) return;
    setSending(true);
    try {
      await send({
        data: {
          // Offers are keyed by the listing's row uuid; `id` is its slug.
          listingId: listing.dbId,
          amountPaise: rupees * 100,
          ...(message.trim() ? { message: message.trim() } : {}),
        },
      });
      setSent(true);
    } catch {
      // The sheet stays open with the form intact so they can try again.
      toast.error("Your offer didn't send. Try again.");
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
              <img
                src={sized(listing.photos[0], { width: 56 })}
                alt=""
                className="h-14 w-14 rounded-sm object-cover"
              />
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

          <Btn
            className="w-full"
            disabled={!amount || !listing.dbId}
            loading={sending}
            onClick={() => void submit()}
          >
            Send Offer
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
      toast.success("Report sent");
      onDone();
    },
    onError: () => toast.error("That didn't send. Try again."),
  });
}

/** What a report can say, by what is being reported. The stored reason is the label. */
const REPORT_REASONS: Record<ReportSubject, { key: string; label: string }[]> = {
  listing: [
    { key: "incorrect", label: "Incorrect information" },
    { key: "scam", label: "Suspected scam" },
    { key: "sold", label: "Item already sold" },
    { key: "prohibited", label: "Prohibited item" },
    { key: "seller", label: "Seller behaviour" },
  ],
  rental: [
    { key: "incorrect", label: "Incorrect information" },
    { key: "scam", label: "Suspected scam" },
    { key: "equipment", label: "Equipment not as described" },
    { key: "provider", label: "Provider behaviour" },
  ],
  profile: [
    { key: "impersonation", label: "Pretending to be someone" },
    { key: "spam", label: "Spam or scam" },
    { key: "offensive", label: "Offensive content" },
    { key: "stolen_work", label: "Someone else's work" },
  ],
  review: [
    { key: "false", label: "False or misleading" },
    { key: "offensive", label: "Offensive content" },
    { key: "unrelated", label: "Not about real work" },
  ],
};
const REPORT_TITLE: Record<ReportSubject, string> = {
  listing: "Report listing",
  rental: "Report rental",
  profile: "Report profile",
  review: "Report review",
};

/**
 * The one report sheet, for anything that can be reported (reports table): pick a reason, send.
 * The reasons follow the subject; the chosen one is a checked radio. Nothing is sent until a
 * reason is picked, and success is said only once the report is stored.
 */
export function ReportSheet({
  open,
  onClose,
  subject,
  title,
}: {
  open: boolean;
  onClose: () => void;
  subject: { type: ReportSubject; id: string };
  /** Overrides the sheet's title, e.g. "Report Ana". */
  title?: string | undefined;
}) {
  const reasons = REPORT_REASONS[subject.type];
  const [reason, setReason] = useState<string | null>(null);
  const close = () => {
    setReason(null);
    onClose();
  };
  const send = useFileReport(close);
  const picked = reasons.find((r) => r.key === reason);
  return (
    <Sheet open={open} onClose={close} title={title ?? REPORT_TITLE[subject.type]}>
      <div
        role="radiogroup"
        aria-label="Why are you reporting this?"
        className="mb-3 divide-y divide-border rounded-lg border border-border"
      >
        {reasons.map((r) => (
          <button
            key={r.key}
            type="button"
            role="radio"
            aria-checked={reason === r.key}
            onClick={() => setReason(r.key)}
            className="flex min-h-12 w-full items-center justify-between px-4 py-3 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {r.label}
            {reason === r.key ? <Check size={iconSize.md} aria-hidden /> : null}
          </button>
        ))}
      </div>
      <p className="mb-5 text-1 text-muted-foreground">Nobody is told who reported this.</p>
      <Btn
        className="w-full"
        disabled={!picked}
        loading={send.isPending}
        onClick={() =>
          picked &&
          send.mutate({ subjectType: subject.type, subjectId: subject.id, reason: picked.label })
        }
      >
        Send Report
      </Btn>
    </Sheet>
  );
}

export function SectionRow({
  title,
  hint,
  to,
  search,
  action,
  children,
}: {
  title: string;
  hint?: string;
  to?: string;
  /** Search params for the See All link, e.g. the hub opened on its Rent view. */
  search?: Record<string, string>;
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
            <SectionActionLink to={to} {...(search ? { search } : {})} className="text-1">
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
