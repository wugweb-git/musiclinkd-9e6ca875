import { Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { CalendarDays, Package, Truck, MapPin } from "lucide-react";
import { Btn, BtnLink, Chip, Sheet, VerifiedBadge } from "./ui";
import { ConditionBadge, LocationRow, Rating, SaveButton } from "./market";
import {
  inr,
  priceFor,
  type Booking,
  type Equipment,
  type Provider,
  type RentalItem,
  type RentalStatus,
} from "@/data/rentals";

export function RentalAvailabilityBadge({
  text,
  tone = "ok",
}: {
  text: string;
  tone?: "ok" | "warn" | "off";
}) {
  const map = {
    ok: { pill: "bg-success-container text-success-strong", dot: "bg-success" },
    warn: { pill: "bg-warn-container text-warn-strong", dot: "bg-warn" },
    off: { pill: "bg-subtle text-muted-foreground", dot: "bg-muted-foreground" },
  } as const;
  const c = map[tone];
  return (
    <span className={`inline-flex max-w-full items-center gap-1 rounded-full pill ${c.pill}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${c.dot}`} />
      <span className="truncate">{text}</span>
    </span>
  );
}

export function RentalPriceBlock({ e, size = "md" }: { e: RentalItem; size?: "md" | "lg" }) {
  // Database rentals have a day rate and a price note, but no weekly or monthly rate.
  const longer =
    e.weekly != null && e.monthly != null
      ? `${inr(e.weekly)} / week · ${inr(e.monthly)} / month`
      : e.priceNote;
  return (
    <div className="min-w-0">
      {e.daily != null ? (
        <div className="flex items-baseline gap-1">
          <span
            className={`text-price ${size === "lg" ? "text-2xl font-bold" : "text-2 font-bold"}`}
          >
            {inr(e.daily)}
          </span>
          <span className="text-1 text-muted-foreground">/ day</span>
        </div>
      ) : null}
      {size === "lg" && longer ? (
        <p className="mt-1 text-1 text-muted-foreground">{longer}</p>
      ) : null}
    </div>
  );
}

export function RentalStatusPill({ status }: { status: RentalStatus }) {
  const tone: Record<RentalStatus, string> = {
    Requested: "bg-warn-container text-warn-strong",
    "Offer sent": "bg-status-category-bg text-status-category-text",
    Confirmed: "bg-subtle text-foreground",
    Active: "bg-success-container text-success-strong",
    Completed: "bg-subtle text-muted-foreground",
    Cancelled: "bg-subtle text-muted-foreground",
    Declined: "bg-subtle text-muted-foreground",
  };
  return <span className={`shrink-0 rounded-full pill ${tone[status]}`}>{status}</span>;
}

export function EquipmentCard({ e }: { e: Equipment }) {
  const [saved, setSaved] = useState(false);
  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card">
      <Link to="/marketplace/rent/e/$id" params={{ id: e.id }} className="block">
        <div className="relative">
          <img src={e.photos[0]} alt={e.name} loading="lazy" className="h-44 w-full object-cover" />
          <span className="absolute left-3 top-3 rounded-full pill pill-glass">Rental</span>
        </div>
      </Link>
      <div className="absolute" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to="/marketplace/rent/e/$id" params={{ id: e.id }} className="min-w-0 flex-1">
            <RentalPriceBlock e={e} />
            <h3 className="mt-1 line-clamp-2 text-2 leading-snug">{e.name}</h3>
            <p className="mt-0.5 truncate text-1 text-muted-foreground">
              {e.brand} · {e.model}
            </p>
          </Link>
          <SaveButton saved={saved} onToggle={() => setSaved((s) => !s)} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <RentalAvailabilityBadge text={e.availability} />
          <ConditionBadge value={e.condition} />
          <Rating value={e.rating} count={e.reviews} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <LocationRow text={`${e.location} · ${e.distance}`} />
          <Link
            to="/marketplace/rent/provider/$id"
            params={{ id: e.providerId }}
            className="shrink-0 truncate text-1 font-semibold text-foreground"
          >
            View provider
          </Link>
        </div>
        <BtnLink
          to="/marketplace/rent/request/$id"
          params={{ id: e.id }}
          variant="outline"
          className="mt-3 w-full"
        >
          Check availability
        </BtnLink>
      </div>
    </article>
  );
}

export function EquipmentTile({ e }: { e: RentalItem }) {
  return (
    <Link
      to="/marketplace/rent/e/$id"
      params={{ id: e.id }}
      className="block w-[176px] shrink-0 overflow-hidden rounded-lg border border-border bg-card"
    >
      {e.photos[0] ? (
        <img
          src={e.photos[0]}
          alt={e.name}
          loading="lazy"
          className="h-[124px] w-full object-cover"
        />
      ) : (
        <div className="h-[124px] w-full bg-subtle" />
      )}
      <div className="p-3">
        <RentalPriceBlock e={e} />
        <h3 className="mt-1 line-clamp-2 text-1 leading-snug">{e.name}</h3>
        {e.distance ? (
          <p className="mt-1 truncate text-1 text-muted-foreground">{e.distance}</p>
        ) : null}
        <div className="mt-2">
          <RentalAvailabilityBadge text={e.availableFrom ?? "Enquire"} />
        </div>
      </div>
    </Link>
  );
}

export function EquipmentRow({ e, action }: { e: RentalItem; action?: ReactNode }) {
  const [saved, setSaved] = useState(false);
  const provider = providerName(e);
  return (
    <article className="flex gap-3 rounded-lg border border-border bg-card p-3">
      <Link to="/marketplace/rent/e/$id" params={{ id: e.id }} className="shrink-0">
        {e.photos[0] ? (
          <img
            src={e.photos[0]}
            alt={e.name}
            loading="lazy"
            className="h-24 w-24 rounded-lg object-cover"
          />
        ) : (
          <div className="h-24 w-24 rounded-lg bg-subtle" />
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link to="/marketplace/rent/e/$id" params={{ id: e.id }} className="min-w-0">
            <RentalPriceBlock e={e} />
            <h3 className="line-clamp-2 text-1 leading-snug">{e.name}</h3>
          </Link>
          <SaveButton saved={saved} onToggle={() => setSaved((s) => !s)} size={32} />
        </div>
        {e.availability || e.condition ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {e.availability ? <RentalAvailabilityBadge text={e.availability} /> : null}
            {e.condition ? <ConditionBadge value={e.condition} /> : null}
          </div>
        ) : null}
        {e.distance || provider ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {e.distance ? <LocationRow text={e.distance} /> : null}
            {provider ? (
              <span className="truncate text-1 text-muted-foreground">by {provider}</span>
            ) : null}
          </div>
        ) : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </article>
  );
}

function providerName(e: RentalItem) {
  const map: Record<string, string> = {
    soundhouse: "SoundHouse Studio",
    "ravi-gear": "Ravi Deshmukh",
    "swaraj-instruments": "Swaraj Instruments",
    "pulse-live": "Pulse Live Systems",
  };
  // Database rentals have no static provider; they name the stored seller, or nobody.
  if (!e.providerId) return e.owner?.name ?? "";
  return map[e.providerId] ?? "MusicLinkd provider";
}

export function ProviderSummary({ p, compact }: { p: Provider; compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img src={p.photo} alt={p.name} className="h-12 w-12 shrink-0 rounded-md object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-2 font-semibold">{p.name}</p>
          {p.verified ? <VerifiedBadge size={14} /> : null}
        </div>
        <p className="truncate text-1 text-muted-foreground">{p.role}</p>
        {compact ? null : (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Rating value={p.rating} count={p.reviews} />
            <span className="text-1 text-muted-foreground">
              {p.completedRentals} rentals · replies {p.responseTime.toLowerCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProviderCard({ p }: { p: Provider }) {
  return (
    <Link
      to="/marketplace/rent/provider/$id"
      params={{ id: p.id }}
      className="block rounded-lg border border-border bg-card p-4"
    >
      <ProviderSummary p={p} />
      <div className="mt-3 flex flex-wrap gap-2">
        {p.badges.map((b) => (
          <span
            key={b}
            className="rounded-full bg-status-category-bg px-2.5 py-1 text-1 font-semibold text-status-category-text"
          >
            {b}
          </span>
        ))}
      </div>
    </Link>
  );
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function RentalCalendar({
  e,
  start,
  end,
  onSelect,
  month = new Date(2026, 7, 1),
}: {
  e: Equipment;
  start: number | null;
  end: number | null;
  onSelect: (day: number) => void;
  month?: Date;
}) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(year, m, 1);
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const blocked = useMemo(
    () => new Set(e.unavailableDates.map((d) => Number(d.slice(8, 10)))),
    [e.unavailableDates],
  );

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-2 font-semibold">
          {month.toLocaleString("en-IN", { month: "long", year: "numeric" })}
        </p>
        <CalendarDays size={16} className="text-muted-foreground" />
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_LABELS.map((d, i) => (
          <span key={`${d}${i}`} className="py-1 text-1 font-bold text-muted-foreground">
            {d}
          </span>
        ))}
        {Array.from({ length: lead }).map((_, i) => (
          <span key={`lead${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isBlocked = blocked.has(day);
          const inRange = start !== null && end !== null && day >= start && day <= end;
          const isEdge = day === start || day === end;
          return (
            <button
              key={day}
              type="button"
              disabled={isBlocked}
              onClick={() => onSelect(day)}
              className={`flex h-9 items-center justify-center rounded-md text-1 font-semibold transition-colors ${
                isBlocked ? "text-muted-foreground line-through opacity-50" : ""
              } ${isEdge ? "bg-primary text-primary-foreground" : inRange ? "bg-subtle text-foreground" : ""}`}
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-1 text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-primary" /> Selected
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-border" /> Unavailable
        </span>
        <span>
          Min {e.minDays} day{e.minDays > 1 ? "s" : ""} · notice {e.noticePeriod}
        </span>
      </div>
    </div>
  );
}

export function PriceBreakdown({
  e,
  days,
  quantity,
  delivery,
}: {
  e: Equipment;
  days: number;
  quantity: number;
  delivery: boolean;
}) {
  const subtotal = priceFor(e, days) * quantity;
  const deliveryFee = delivery ? (e.deliveryFee ?? 0) : 0;
  const deposit = e.deposit * quantity;
  const fees = Math.round(subtotal * 0.02);
  const total = subtotal + deliveryFee + fees;

  const rows = [
    { k: `${inr(e.daily)} × ${days} day${days > 1 ? "s" : ""} × ${quantity}`, v: inr(subtotal) },
    ...(delivery ? [{ k: "Delivery & pickup", v: inr(deliveryFee) }] : []),
    { k: "Platform fee (2%)", v: inr(fees) },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.k} className="flex items-start justify-between gap-3">
            <span className="text-1 text-muted-foreground">{r.k}</span>
            <span className="shrink-0 text-1 font-semibold">{r.v}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
        <span className="text-1 font-semibold">Estimated total</span>
        <span className="text-xl font-bold text-price">{inr(total)}</span>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3 rounded-lg bg-warn-container p-3">
        <div className="min-w-0">
          <p className="text-1 font-bold text-warn">Refundable security deposit</p>
          <p className="text-1 text-muted-foreground">
            Held by the provider, returned after the equipment is checked.
          </p>
        </div>
        <span className="shrink-0 text-1 font-bold text-price">{inr(deposit)}</span>
      </div>
      <p className="mt-3 text-1 text-muted-foreground">
        Estimate only. Nothing is charged on MusicLinkd — the provider confirms the final amount in
        your conversation.
      </p>
    </div>
  );
}

export function FulfilmentPicker({
  e,
  value,
  onChange,
}: {
  e: Equipment;
  value: string;
  onChange: (v: string) => void;
}) {
  const options = [
    ...(e.pickup
      ? [
          {
            id: "Pickup",
            icon: Package,
            line: `${e.location} · free`,
            note: "Collect from the provider",
          },
        ]
      : []),
    ...(e.delivery
      ? [
          {
            id: "Provider delivery",
            icon: Truck,
            line: `${inr(e.deliveryFee ?? 0)} · ${e.deliveryNote ?? "Within city"}`,
            note: "Provider drops off and collects",
          },
        ]
      : []),
  ];

  if (!options.length) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-1 text-muted-foreground">
        Pickup only — arrange collection with the provider in your conversation.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
      {options.map((o) => {
        const Icon = o.icon;
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className="flex w-full items-center gap-3 px-4 py-4 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-subtle">
              <Icon size={16} className={active ? "text-primary" : "text-muted-foreground"} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-1 font-semibold">{o.id}</span>
              <span className="block truncate text-1 text-muted-foreground">{o.line}</span>
            </span>
            <span
              className={`h-5 w-5 shrink-0 rounded-full border-2 ${active ? "border-primary bg-primary" : "border-border"}`}
            />
          </button>
        );
      })}
    </div>
  );
}

export function BookingCard({
  b,
  e,
  provider,
  action,
}: {
  b: Booking;
  e: Equipment;
  provider: Provider;
  action?: ReactNode;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-3">
      <div className="flex gap-3">
        <img
          src={e.photos[0]}
          alt={e.name}
          loading="lazy"
          className="h-20 w-20 shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-1 leading-snug">{e.name}</h3>
            <RentalStatusPill status={b.status} />
          </div>
          <p className="mt-1 truncate text-1 text-muted-foreground">{provider.name}</p>
          <p className="mt-1 text-1 font-semibold">
            {b.start} → {b.end} · {b.days} days
          </p>
          <p className="mt-0.5 text-1 text-muted-foreground">
            {b.fulfilment} · {inr(b.total)} {b.timeRemaining ? `· ${b.timeRemaining}` : ""}
          </p>
        </div>
      </div>
      {action ? <div className="mt-3 flex flex-wrap gap-2">{action}</div> : null}
    </article>
  );
}

export function RentalSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="h-44 w-full animate-pulse bg-subtle" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-28 animate-pulse rounded-full bg-subtle" />
        <div className="h-3 w-full animate-pulse rounded-full bg-subtle" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-subtle" />
        <div className="h-10 w-full animate-pulse rounded-full bg-subtle" />
      </div>
    </div>
  );
}

const rentalFilterGroups: { label: string; options: string[] }[] = [
  { label: "Category", options: ["Instruments", "Audio", "Studio", "DJ", "Live"] },
  { label: "Location", options: ["Mumbai", "Delhi NCR", "Bengaluru", "Pune", "Goa"] },
  { label: "Distance", options: ["Within 5 km", "Within 15 km", "Within 50 km", "Anywhere"] },
  { label: "Price per day", options: ["Under ₹1k", "₹1k–3k", "₹3k–6k", "Above ₹6k"] },
  { label: "Condition", options: ["New", "Like New", "Excellent", "Good"] },
];

const moreFilterGroups: { label: string; options: string[] }[] = [
  { label: "Price per week", options: ["Under ₹5k", "₹5k–15k", "Above ₹15k"] },
  { label: "Brand", options: ["Shure", "Fender", "Pearl", "Pioneer DJ", "JBL", "Nord", "Swaraj"] },
  { label: "Security deposit", options: ["Under ₹10k", "₹10k–30k", "Above ₹30k"] },
];

export function RentalFilterSheet({
  open,
  onClose,
  results = 42,
}: {
  open: boolean;
  onClose: () => void;
  results?: number;
}) {
  const [selected, setSelected] = useState<string[]>(["Mumbai"]);
  const [more, setMore] = useState(false);
  const [dates, setDates] = useState("Any dates");
  const [switches, setSwitches] = useState({
    available: true,
    delivery: false,
    pickup: false,
    verified: true,
  });
  const toggle = (v: string) =>
    setSelected((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  const groups = more ? [...rentalFilterGroups, ...moreFilterGroups] : rentalFilterGroups;

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl">Filters</h2>
        <button onClick={() => setSelected([])} className="text-xs font-semibold text-foreground">
          Clear all
        </button>
      </div>

      <h3 className="mb-2 text-1 font-bold uppercase tracking-wide text-muted-foreground">
        Rental dates
      </h3>
      <div className="mb-5 flex flex-wrap gap-2">
        {["Any dates", "This weekend", "Next week", "Pick dates"].map((d) => (
          <Chip key={d} active={dates === d} onClick={() => setDates(d)}>
            {d}
          </Chip>
        ))}
      </div>

      {groups.map((g) => (
        <div key={g.label} className="mb-5">
          <h3 className="mb-2 text-1 font-bold uppercase tracking-wide text-muted-foreground">
            {g.label}
          </h3>
          <div className="flex flex-wrap gap-2">
            {g.options.map((o) => (
              <Chip key={o} active={selected.includes(o)} onClick={() => toggle(o)}>
                {o}
              </Chip>
            ))}
          </div>
        </div>
      ))}

      {!more ? (
        <button
          onClick={() => setMore(true)}
          className="mb-5 text-xs font-semibold text-foreground"
        >
          More filters
        </button>
      ) : null}

      <div className="mb-6 divide-y divide-border rounded-lg border border-border">
        <RentalSwitch
          label="Available on my dates"
          value={switches.available}
          onChange={(v) => setSwitches((s) => ({ ...s, available: v }))}
        />
        <RentalSwitch
          label="Delivery available"
          value={switches.delivery}
          onChange={(v) => setSwitches((s) => ({ ...s, delivery: v }))}
        />
        <RentalSwitch
          label="Pickup available"
          value={switches.pickup}
          onChange={(v) => setSwitches((s) => ({ ...s, pickup: v }))}
        />
        <RentalSwitch
          label="Verified providers only"
          value={switches.verified}
          onChange={(v) => setSwitches((s) => ({ ...s, verified: v }))}
        />
      </div>

      <Btn className="w-full" onClick={onClose}>
        Show {results} results
      </Btn>
    </Sheet>
  );
}

function RentalSwitch({
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
      className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
    >
      <span className="text-sm font-medium">{label}</span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${value ? "bg-primary" : "bg-border"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-card transition-all ${value ? "left-6" : "left-1"}`}
        />
      </span>
    </button>
  );
}

export const rentalSortOptions = [
  "Recommended",
  "Nearest",
  "Lowest rental price",
  "Highest rental price",
  "Most popular",
  "Best rated",
  "Newest",
];

export function RentalReportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reasons = [
    "Report equipment",
    "Report provider",
    "Report a scam",
    "Incorrect information",
    "Block provider",
  ];
  return (
    <Sheet open={open} onClose={onClose} title="Report or block">
      <div className="divide-y divide-border rounded-lg border border-border">
        {reasons.map((r) => (
          <button
            key={r}
            type="button"
            onClick={onClose}
            className="w-full px-4 py-4 text-left text-sm font-medium"
          >
            {r}
          </button>
        ))}
      </div>
      <p className="mt-3 text-1 text-muted-foreground">
        Reports go to MusicLinkd moderation. Nobody is told who reported a listing.
      </p>
    </Sheet>
  );
}
