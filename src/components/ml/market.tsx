import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Heart, MapPin, Star, ShieldCheck, Check, LocateFixed, Search } from "lucide-react";
import type { Listing } from "@/data/market";
import { Btn, Chip, Sheet, VerifiedBadge } from "./ui";
import { EmptyState as BaseEmptyState, Price } from "./kit";
import type { PriceParts } from "@/lib/price";
import { SectionActionLink } from "@/components/ml/links";

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
      className="flex items-center justify-center rounded-full bg-card/90 backdrop-blur transition-transform active:scale-97"
      style={{ width: size, height: size }}
    >
      <Heart
        size={size * 0.45}
        className={saved ? "text-primary" : "text-muted-foreground"}
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
      <Star size={12} fill="currentColor" strokeWidth={0} />
      {value}
      {count ? <span className="text-muted-foreground">({count})</span> : null}
    </span>
  );
}

export function LocationRow({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-1 text-muted-foreground">
      <MapPin size={12} strokeWidth={1.8} />
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
      <ShieldCheck size={12} strokeWidth={2.2} />
      {label}
    </span>
  );
}

export function CategoryTile({
  slug,
  label,
  emoji,
  count,
}: {
  slug: string;
  label: string;
  emoji: string;
  count: string;
}) {
  return (
    <Link
      to="/marketplace/c/$slug"
      params={{ slug }}
      className="flex w-[104px] shrink-0 flex-col gap-2 rounded-lg bg-subtle p-3"
    >
      <span className="flex h-8 items-center text-4 leading-none" aria-hidden>
        {emoji}
      </span>
      <span className="text-1 font-semibold leading-tight">{label}</span>
      <span className="text-1 text-muted-foreground">{count}</span>
    </Link>
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

export function ListingCard({
  l,
  saved,
  onSave,
}: {
  l: Listing;
  saved?: boolean;
  onSave?: () => void;
}) {
  const [localSaved, setLocalSaved] = useState(false);
  const isSaved = saved ?? localSaved;
  const meta = typeMeta(l);
  // The same order as an opportunity: what it is, then its terms as one quiet line, then price.
  // The type or brand and the condition read as words, not as badges stacked on the photo.
  const terms = [meta.tag, l.condition].filter(Boolean).join(" · ");
  const where = [l.location, l.distance].filter(Boolean).join(" · ");
  return (
    <Link
      to="/marketplace/l/$id"
      params={{ id: l.id }}
      className="block overflow-hidden rounded-lg bg-subtle"
    >
      <div className="relative">
        {l.photos[0] ? (
          <img
            src={l.photos[0]}
            alt={l.title}
            loading="lazy"
            className="aspect-[16/10] w-full object-cover"
          />
        ) : (
          <div className="aspect-[16/10] w-full bg-background" />
        )}
        <div className="absolute right-2 top-2">
          <SaveButton
            saved={isSaved}
            onToggle={() => (onSave ? onSave() : setLocalSaved((s) => !s))}
          />
        </div>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-2 font-semibold leading-snug">{l.title}</h3>
        {terms ? <p className="mt-1 truncate text-1 text-muted-foreground">{terms}</p> : null}
        <div className="mt-3 flex items-end justify-between gap-3">
          <PriceBlock price={l.price} />
          {l.rating ? (
            <Rating value={l.rating} count={l.reviews} />
          ) : meta.line ? (
            <span className="shrink-0 text-1 text-muted-foreground">{meta.line}</span>
          ) : null}
        </div>
        {where ? (
          <div className="mt-3">
            <LocationRow text={where} />
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export function ListingTile({ l }: { l: Listing }) {
  const [saved, setSaved] = useState(false);
  return (
    <Link
      to="/marketplace/l/$id"
      params={{ id: l.id }}
      className="block w-[168px] shrink-0 overflow-hidden rounded-lg bg-subtle"
    >
      <div className="relative h-[124px]">
        {l.photos[0] ? (
          <img
            src={l.photos[0]}
            alt={l.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-background" />
        )}
        <div className="absolute right-1.5 top-1.5">
          <SaveButton saved={saved} onToggle={() => setSaved((s) => !s)} size={32} />
        </div>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{l.title}</h3>
        <div className="mt-1.5">
          <PriceBlock price={l.price} />
        </div>
        {l.distance ? (
          <p className="mt-1 truncate text-1 text-muted-foreground">{l.distance}</p>
        ) : null}
      </div>
    </Link>
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
    id?: string;
    name: string;
    role?: string;
    location?: string;
    verified: boolean;
    rating?: number;
    reviews?: number;
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
        {compact || !(seller.rating || seller.responseTime) ? null : (
          <div className="mt-1 flex items-center gap-2">
            <Rating value={seller.rating} count={seller.reviews} />
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

export const marketCities = ["Mumbai", "Delhi NCR", "Bengaluru", "Chennai", "Pune", "Goa"];

const CITY_KEY = "ml.market.city";

/** The Market's chosen place, kept on this device. */
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
        <MapPin size={16} aria-hidden /> {city}
      </p>
      <div className="mb-5 flex gap-2">
        <Btn
          className="flex-1"
          icon={<LocateFixed size={16} />}
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
              <Search size={20} className="shrink-0 text-muted-foreground" aria-hidden />
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
}: {
  open: boolean;
  onClose: () => void;
  categories: readonly { slug: string; label: string; emoji: string; count: string }[];
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
              to="/marketplace/c/$slug"
              params={{ slug: c.slug }}
              onClick={onClose}
              className="state-layer flex items-center gap-3 py-2.5"
            >
              <span
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-icon-chip text-3 leading-none"
              >
                {c.emoji}
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold">{c.label}</span>
              <span className="text-1 text-muted-foreground">{c.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

const filterGroups: { label: string; options: string[] }[] = [
  { label: "Listing type", options: ["For sale", "Rental", "Service", "Space"] },
  { label: "Category", options: ["Instruments", "Audio Gear", "Studio", "Services", "Spaces"] },
  { label: "Condition", options: ["New", "Like New", "Excellent", "Good", "Fair"] },
  { label: "Brand", options: ["Fender", "Neumann", "Focusrite", "Roland", "Swaraj", "Yamaha"] },
  { label: "Location", options: marketCities },
  { label: "Distance", options: ["Within 5 km", "Within 15 km", "Within 50 km", "Anywhere"] },
  { label: "Price", options: ["Under ₹10k", "₹10k–50k", "₹50k–1L", "Above ₹1L"] },
];

export function MarketFilterSheet({
  open,
  onClose,
  results = 214,
}: {
  open: boolean;
  onClose: () => void;
  results?: number;
}) {
  const [selected, setSelected] = useState<string[]>(["For sale", "Mumbai"]);
  const [verified, setVerified] = useState(true);
  const [available, setAvailable] = useState(false);

  const toggle = (v: string) =>
    setSelected((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-3">Filters</h2>
        <button onClick={() => setSelected([])} className="text-1 font-semibold text-foreground">
          Clear all
        </button>
      </div>

      {filterGroups.map((g) => (
        <div key={g.label} className="mb-5">
          <h3 className="pill mb-2 bg-background text-muted-foreground">{g.label}</h3>
          <div className="flex flex-wrap gap-2">
            {g.options.map((o) => (
              <Chip key={o} active={selected.includes(o)} onClick={() => toggle(o)}>
                {o}
              </Chip>
            ))}
          </div>
        </div>
      ))}

      <div className="mb-6 divide-y divide-border rounded-lg border border-border">
        <SwitchRow label="Verified sellers only" value={verified} onChange={setVerified} />
        <SwitchRow label="Available right now" value={available} onChange={setAvailable} />
      </div>

      <Btn className="w-full" onClick={onClose}>
        Show {results} results
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
      <span className="text-sm font-medium">{label}</span>
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
              <Check size={20} className="text-primary" aria-label="Selected" />
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

  const close = () => {
    setSent(false);
    onClose();
  };

  return (
    <Sheet open={open} onClose={close}>
      {sent ? (
        <div className="py-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-container text-success-strong">
            <Check size={32} aria-hidden />
          </div>
          <h2 className="text-3">Offer sent</h2>
          <p className="mx-auto mt-2 max-w-[260px] text-sm text-muted-foreground">
            Your offer is pending. It expires in 48 hours and continues in Connections.
          </p>
          <Btn className="mt-6 w-full" onClick={close}>
            Open Conversation
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
            placeholder="I can collect from Dadar this weekend."
            className="mb-3 w-full rounded-lg border border-border bg-card p-4 text-sm outline-none focus:border-primary"
          />
          <p className="mb-5 text-1 text-muted-foreground">
            Offers expire after 48 hours. Payment is arranged directly with the seller.
          </p>

          <Btn className="w-full" onClick={() => setSent(true)}>
            Send Offer
          </Btn>
        </>
      )}
    </Sheet>
  );
}

export function ReportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reasons = [
    "Incorrect information",
    "Suspected scam",
    "Item already sold",
    "Prohibited item",
    "Seller behaviour",
  ];
  const [reason, setReason] = useState(reasons[0]!);
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
              <Check size={20} className="text-primary" aria-label="Selected" />
            ) : null}
          </button>
        ))}
      </div>
      <Btn className="w-full" onClick={onClose}>
        Submit Report
      </Btn>
      <Btn variant="ghost" className="mt-2 w-full" onClick={onClose}>
        Block This Seller
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
