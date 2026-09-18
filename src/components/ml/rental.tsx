import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Package, Truck } from "lucide-react";
import { Btn, Chip, Sheet, VerifiedBadge } from "./ui";
import { Followers, Rating, useFileReport } from "./market";
import { Price } from "./kit";
import { rupeeParts } from "@/lib/price";
import { inr, priceFor, type Equipment, type RentalItem, type RentalStatus } from "@/data/rentals";
import type { RealProvider } from "@/lib/rentals.functions";
import { listListings } from "@/lib/catalog.functions";
import { rentalFromRow } from "@/lib/market-view";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { listMySavedIds } from "@/lib/saved.functions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";

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
    off: { pill: "bg-background text-muted-foreground", dot: "bg-muted-foreground" },
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
  // A weekly or monthly rate shows when the owner set one; otherwise the price note does.
  return (
    <div className="min-w-0">
      {e.daily != null ? (
        <Price
          price={rupeeParts(e.daily, "day")}
          amountClassName={size === "lg" ? "text-3 font-bold" : "text-2 font-bold"}
        />
      ) : null}
      {size === "lg" && (e.weekly != null || e.monthly != null) ? (
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
          {e.weekly != null ? (
            <Price price={rupeeParts(e.weekly, "week")} amountClassName="text-1 font-semibold" />
          ) : null}
          {e.monthly != null ? (
            <Price price={rupeeParts(e.monthly, "month")} amountClassName="text-1 font-semibold" />
          ) : null}
        </div>
      ) : size === "lg" && e.priceNote ? (
        <p className="mt-1 text-1 text-muted-foreground">{e.priceNote}</p>
      ) : null}
    </div>
  );
}

export function RentalStatusPill({ status }: { status: RentalStatus }) {
  const tone: Record<RentalStatus, string> = {
    Requested: "bg-warn-container text-warn-strong",
    "Offer sent": "bg-status-category-bg text-status-category-text",
    Confirmed: "bg-background text-foreground",
    Active: "bg-success-container text-success-strong",
    Completed: "bg-background text-muted-foreground",
    Cancelled: "bg-background text-muted-foreground",
    Declined: "bg-background text-muted-foreground",
  };
  return <span className={`shrink-0 rounded-full pill ${tone[status]}`}>{status}</span>;
}

/**
 * A rental provider as the database has them: a profile, plus rating, reviews, followers and
 * completed rentals when they have any. A listing's owner alone (id, name, photo, verified) is
 * enough for a card.
 */
export type ProviderLike = Pick<RealProvider, "id" | "name" | "photo" | "verified"> &
  Partial<Pick<RealProvider, "role" | "rating" | "reviews" | "followers" | "completedRentals">>;

export function ProviderSummary({ p, compact }: { p: ProviderLike; compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {p.photo ? (
        <img src={p.photo} alt={p.name} className="h-12 w-12 shrink-0 rounded-sm object-cover" />
      ) : (
        <div className="h-12 w-12 shrink-0 rounded-sm bg-background" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-2 font-semibold">{p.name}</p>
          {p.verified ? <VerifiedBadge size={16} /> : null}
        </div>
        {p.role ? <p className="truncate text-1 text-muted-foreground">{p.role}</p> : null}
        {compact || (p.rating == null && !p.followers && !p.completedRentals) ? null : (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Rating value={p.rating} count={p.reviews} />
            <Followers count={p.followers} />
            {p.completedRentals ? (
              <span className="text-1 text-muted-foreground">{p.completedRentals} rentals</span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

/** Opens the provider's rental page (/marketplace/rent/provider/$id, keyed by profile id). */
export function ProviderCard({ p }: { p: ProviderLike }) {
  return (
    <Link
      to="/marketplace/rent/provider/$id"
      params={{ id: p.id }}
      className="block w-full rounded-lg bg-subtle p-4 text-left"
    >
      <ProviderSummary p={p} />
    </Link>
  );
}

/** The distinct providers behind a set of live rentals, in listing order. */
// eslint-disable-next-line react-refresh/only-export-components -- helper co-located with ProviderCard
export function providersOf(items: RentalItem[]): ProviderLike[] {
  const seen = new Map<string, ProviderLike>();
  for (const e of items) {
    const o = e.owner;
    if (!o?.id || seen.has(o.id)) continue;
    seen.set(o.id, {
      id: o.id,
      name: o.name,
      photo: o.photo,
      verified: o.verified,
      ...(o.rating != null ? { rating: o.rating } : {}),
      ...(o.reviews ? { reviews: o.reviews } : {}),
      ...(o.followers ? { followers: o.followers } : {}),
    });
  }
  return [...seen.values()];
}

/**
 * The signed-in user's saved rentals. saved_items stores a listing's row id (uuid), while a
 * RentalItem is addressed by its slug, so the match is made on the listing rows themselves.
 */
// eslint-disable-next-line react-refresh/only-export-components -- hook co-located with the rental components
export function useSavedRentals(enabled = true) {
  const { signedIn } = useAuth();
  const fetchIds = useServerFn(listMySavedIds);
  const fetchRows = useServerFn(listListings);
  const fetchLabels = useServerFn(getTaxonomyLabels);
  return useQuery({
    queryKey: ["rent", "saved"],
    queryFn: async () => {
      const [ids, rows, labels] = await Promise.all([
        fetchIds({ data: { targetType: "listing" } }),
        fetchRows(),
        fetchLabels().catch((): TaxonomyLabels => ({})),
      ]);
      const saved = new Set(ids);
      return rows
        .filter((row) => row.category === "gear_rental" && saved.has(row.id))
        .map((row) => rentalFromRow(row, labels));
    },
    enabled: signedIn && enabled,
  });
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
    <div className="rounded-lg bg-subtle p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-2 font-semibold">
          {month.toLocaleString("en-IN", { month: "long", year: "numeric" })}
        </p>
        <CalendarDays size={iconSize.sm} className="text-muted-foreground" />
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
              className={`flex h-9 items-center justify-center rounded-sm text-1 font-semibold transition-colors ${
                isBlocked ? "text-muted-foreground line-through opacity-50" : ""
              } ${isEdge ? "bg-primary text-primary-foreground" : inRange ? "bg-background text-foreground" : ""}`}
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
    <div className="rounded-lg bg-subtle p-4">
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
        <span className="text-3 font-bold text-price">{inr(total)}</span>
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
    <div className="divide-y divide-border overflow-hidden rounded-lg bg-subtle">
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
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-icon-chip">
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

/**
 * A booking (rental_bookings, see rentals.functions.ts). The join only carries a listing's
 * id/title/photo, so this shows only what the booking actually has.
 */
export function BookingCard({
  title,
  photo,
  status,
  startDate,
  endDate,
  fulfilment,
  totalPaise,
  action,
}: {
  title: string;
  photo: string | null;
  status: RentalStatus;
  startDate: string;
  endDate: string;
  fulfilment: string;
  totalPaise: number | null;
  action?: ReactNode;
}) {
  const days = Math.max(
    1,
    Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000),
  );
  const fulfilmentLabel = fulfilment.replace(/_/g, " ");
  return (
    <article className="rounded-lg bg-subtle p-3">
      <div className="flex gap-3">
        {photo ? (
          <img
            src={photo}
            alt={title}
            loading="lazy"
            className="h-20 w-20 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="h-20 w-20 shrink-0 rounded-lg bg-background" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-1 leading-snug">{title}</h3>
            <RentalStatusPill status={status} />
          </div>
          <p className="mt-1 text-1 font-semibold">
            {new Date(startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} →{" "}
            {new Date(endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ·{" "}
            {days} {days === 1 ? "day" : "days"}
          </p>
          <p className="mt-0.5 text-1 text-muted-foreground capitalize">
            {fulfilmentLabel} {totalPaise != null ? `· ${inr(Math.round(totalPaise / 100))}` : ""}
          </p>
        </div>
      </div>
      {action ? <div className="mt-3 flex flex-wrap gap-2">{action}</div> : null}
    </article>
  );
}

export function RentalSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg bg-subtle">
      <div className="h-44 w-full animate-pulse bg-background" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-28 animate-pulse rounded-full bg-background" />
        <div className="h-3 w-full animate-pulse rounded-full bg-background" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-background" />
        <div className="h-10 w-full animate-pulse rounded-full bg-background" />
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
  results,
}: {
  open: boolean;
  onClose: () => void;
  results: number;
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
        <h2 className="text-3">Filters</h2>
        <button onClick={() => setSelected([])} className="text-1 font-semibold text-foreground">
          Clear all
        </button>
      </div>

      <h3 className="pill mb-2 bg-background text-muted-foreground">Rental dates</h3>
      <div className="mb-5 flex flex-wrap gap-2">
        {["Any dates", "This weekend", "Next week", "Pick dates"].map((d) => (
          <Chip key={d} active={dates === d} onClick={() => setDates(d)}>
            {d}
          </Chip>
        ))}
      </div>

      {groups.map((g) => (
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

      {!more ? (
        <button onClick={() => setMore(true)} className="mb-5 text-1 font-semibold text-foreground">
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

// eslint-disable-next-line react-refresh/only-export-components -- constant intentionally co-located with its component
export const rentalSortOptions = [
  "Recommended",
  "Nearest",
  "Lowest rental price",
  "Highest rental price",
  "Most popular",
  "Best rated",
  "Newest",
];

export function RentalReportSheet({
  open,
  onClose,
  subject,
}: {
  open: boolean;
  onClose: () => void;
  /** The rental listing, or — on a provider's page — the provider. */
  subject: { type: "rental" | "profile"; id: string };
}) {
  const send = useFileReport(onClose);
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
            // Blocking has nowhere to be stored yet, so it closes the sheet as before.
            onClick={() =>
              r.startsWith("Block")
                ? onClose()
                : send.mutate({ subjectType: subject.type, subjectId: subject.id, reason: r })
            }
            disabled={send.isPending}
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
