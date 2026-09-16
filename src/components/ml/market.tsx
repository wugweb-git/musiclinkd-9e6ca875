import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Heart, MapPin, Star, ShieldCheck, Check } from "lucide-react";
import type { Listing } from "@/data/market";
import { Btn, Chip, Sheet, VerifiedBadge } from "./ui";
import { Price } from "./kit";
import type { PriceParts } from "@/lib/price";

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
      className="flex items-center justify-center rounded-full border border-border bg-card/95 backdrop-blur transition-transform active:scale-90"
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
  return <span className="rounded-full bg-subtle pill text-muted-foreground">{value}</span>;
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

/** A listing's price: the amount, with the unit line and any price note under it. */
export function PriceBlock({ price, size = "md" }: { price: PriceParts; size?: "md" | "lg" }) {
  return (
    <Price
      price={price}
      amountClassName={size === "lg" ? "text-2xl font-bold" : "text-2 font-bold"}
    />
  );
}

export function TrustPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-status-category-bg px-2.5 py-1 text-1 font-semibold text-status-category-text">
      <ShieldCheck size={11} strokeWidth={2.2} />
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
      className="flex w-[104px] shrink-0 flex-col gap-2 rounded-lg border border-border bg-card p-3"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-md bg-subtle text-lg">
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
  const where = [l.location, l.distance].filter(Boolean).join(" · ");
  return (
    <Link
      to="/marketplace/l/$id"
      params={{ id: l.id }}
      className="block overflow-hidden rounded-lg border border-border bg-card"
    >
      <div className="relative">
        {l.photos[0] ? (
          <img
            src={l.photos[0]}
            alt={l.title}
            loading="lazy"
            className="h-40 w-full object-cover"
          />
        ) : (
          <div className="h-40 w-full bg-subtle" />
        )}
        <div className="absolute right-2 top-2">
          <SaveButton
            saved={isSaved}
            onToggle={() => (onSave ? onSave() : setLocalSaved((s) => !s))}
          />
        </div>
        <span className="absolute left-2 top-2 rounded-full pill pill-glass">{meta.tag}</span>
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <PriceBlock price={l.price} />
          {l.condition ? (
            <ConditionBadge value={l.condition} />
          ) : (
            <Rating value={l.rating} count={l.reviews} />
          )}
        </div>
        <h3 className="mt-1.5 line-clamp-2 text-2 leading-snug">{l.title}</h3>
        {l.subtitle ? (
          <p className="mt-0.5 line-clamp-1 text-1 text-muted-foreground">{l.subtitle}</p>
        ) : null}
        {where || meta.line ? (
          <div className="mt-2.5 flex items-center justify-between">
            {where ? <LocationRow text={where} /> : <span />}
            {meta.line ? <span className="text-1 text-muted-foreground">{meta.line}</span> : null}
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
      className="block w-[168px] shrink-0 overflow-hidden rounded-lg border border-border bg-card"
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
          <div className="h-full w-full bg-subtle" />
        )}
        <div className="absolute right-1.5 top-1.5">
          <SaveButton saved={saved} onToggle={() => setSaved((s) => !s)} size={30} />
        </div>
      </div>
      <div className="p-3">
        <PriceBlock price={l.price} />
        <h3 className="mt-1 line-clamp-2 text-1 leading-snug">{l.title}</h3>
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
    <article className="flex gap-3 rounded-lg border border-border bg-card p-3">
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
            <PriceBlock price={l.price} />
            <h3 className="line-clamp-2 text-1 leading-snug">{l.title}</h3>
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
        <img src={seller.photo} alt={seller.name} className="h-12 w-12 rounded-md object-cover" />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-2 font-semibold">{seller.name}</p>
          {seller.verified ? <VerifiedBadge size={14} /> : null}
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
    <div className="rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-md bg-subtle text-2xl">
        {emoji}
      </div>
      <h3 className="text-2">{title}</h3>
      <p className="mx-auto mt-1 max-w-[260px] text-xs text-muted-foreground">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ListingSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="h-40 w-full animate-pulse bg-subtle" />
      <div className="space-y-2 p-3.5">
        <div className="h-4 w-24 animate-pulse rounded-full bg-subtle" />
        <div className="h-3 w-full animate-pulse rounded-full bg-subtle" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-subtle" />
      </div>
    </div>
  );
}

const filterGroups: { label: string; options: string[] }[] = [
  { label: "Listing type", options: ["For sale", "Rental", "Service", "Space"] },
  { label: "Category", options: ["Instruments", "Audio Gear", "Studio", "Services", "Spaces"] },
  { label: "Condition", options: ["New", "Like New", "Excellent", "Good", "Fair"] },
  { label: "Brand", options: ["Fender", "Neumann", "Focusrite", "Roland", "Swaraj", "Yamaha"] },
  { label: "Location", options: ["Mumbai", "Delhi NCR", "Bengaluru", "Chennai", "Pune", "Goa"] },
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
        <h2 className="text-xl">Filters</h2>
        <button onClick={() => setSelected([])} className="text-xs font-semibold text-foreground">
          Clear all
        </button>
      </div>

      {filterGroups.map((g) => (
        <div key={g.label} className="mb-5">
          <h3 className="pill mb-2 bg-subtle text-muted-foreground">{g.label}</h3>
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
              <Check size={18} className="text-primary" aria-label="Selected" />
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
            <Check size={28} aria-hidden />
          </div>
          <h2 className="text-xl">Offer sent</h2>
          <p className="mx-auto mt-2 max-w-[260px] text-sm text-muted-foreground">
            Your offer is pending. It expires in 48 hours and continues in Connections.
          </p>
          <Btn className="mt-6 w-full" onClick={close}>
            Open conversation
          </Btn>
        </div>
      ) : (
        <>
          <h2 className="mb-4 text-xl">Make an offer</h2>
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-border p-3">
            {listing.photos[0] ? (
              <img src={listing.photos[0]} alt="" className="h-14 w-14 rounded-md object-cover" />
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
            className="mb-4 h-14 w-full rounded-full border border-border bg-card px-5 text-base font-semibold outline-none focus:border-primary"
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
            Send offer
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
              <Check size={18} className="text-primary" aria-label="Selected" />
            ) : null}
          </button>
        ))}
      </div>
      <Btn className="w-full" onClick={onClose}>
        Submit report
      </Btn>
      <Btn variant="ghost" className="mt-2 w-full" onClick={onClose}>
        Block this seller
      </Btn>
    </Sheet>
  );
}

export function SectionRow({
  title,
  hint,
  to,
  children,
}: {
  title: string;
  hint?: string;
  to?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-7">
      <div className="mb-3 flex items-baseline justify-between px-5">
        <div>
          <h2 className="text-2">{title}</h2>
          {hint ? <p className="text-1 text-muted-foreground">{hint}</p> : null}
        </div>
        {to ? (
          <Link to={to} className="text-xs font-semibold text-foreground">
            See all
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
