import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Package, Truck } from "lucide-react";
import { VerifiedBadge } from "./ui";
import { Followers, Rating } from "./market";
import { Price, StatusPill, type Tone } from "./kit";
import { rupeeParts } from "@/lib/price";
import { type Equipment, type RentalItem, type RentalStatus } from "@/data/rentals";
import { inr } from "@/lib/price";
import type { RealProvider } from "@/lib/rentals.functions";
import { listListings } from "@/lib/catalog.functions";
import { rentalFromRow } from "@/lib/market-view";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { listMySavedIds } from "@/lib/saved.functions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";
import { shownPlace } from "@/lib/place";
import { PersonAvatar } from "./person-avatar";
import { sized } from "@/lib/image-url";

const rentalAvailabilityTone: Record<"ok" | "warn" | "off", Tone> = {
  ok: "good",
  warn: "warn",
  off: "neutral",
};

/** Thin `StatusPill` wrapper: rental listing cards call this by name, `StatusPill` renders it. */
export function RentalAvailabilityBadge({
  text,
  tone = "ok",
}: {
  text: string;
  tone?: "ok" | "warn" | "off";
}) {
  return (
    <StatusPill label={text} tone={rentalAvailabilityTone[tone]} className="max-w-full truncate" />
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

const rentalStatusTone: Record<RentalStatus, Tone> = {
  Requested: "warn",
  // Purple is for the category badge only; an offer waiting on the renter is a warning state.
  "Offer sent": "warn",
  Confirmed: "neutral",
  Active: "good",
  Completed: "neutral",
  Cancelled: "neutral",
  Declined: "neutral",
};

export function RentalStatusPill({ status }: { status: RentalStatus }) {
  return (
    <StatusPill label={status} tone={rentalStatusTone[status]} icon={<></>} className="shrink-0" />
  );
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
      <PersonAvatar
        name={p.name}
        photo={p.photo ? sized(p.photo, { width: 48 }) : null}
        className="h-12 w-12 shrink-0 text-1"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-2 font-semibold">{p.name}</p>
          {p.verified ? <VerifiedBadge size={16} /> : null}
        </div>
        {p.role ? <p className="truncate text-1 text-muted-foreground">{p.role}</p> : null}
        {/* A zero rating shows nothing, so it can't be the only thing holding the row open. */}
        {compact || (!p.rating && !p.followers && !p.completedRentals) ? null : (
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

/** Opens the provider's seller page (/marketplace/seller/$id, keyed by profile id). */
export function ProviderCard({ p }: { p: ProviderLike }) {
  return (
    <Link
      to="/marketplace/seller/$id"
      params={{ id: p.id }}
      className="block w-full rounded-lg bg-subtle p-4 text-left"
    >
      <ProviderSummary p={p} />
    </Link>
  );
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

/** How a rental changes hands, as the value rental_bookings.fulfilment stores. */
export type Fulfilment = "pickup" | "provider_delivery";
// eslint-disable-next-line react-refresh/only-export-components -- labels belong with their picker
export const fulfilmentLabels: Record<Fulfilment, string> = {
  pickup: "Pickup",
  provider_delivery: "Provider delivery",
};

export function FulfilmentPicker({
  e,
  value,
  onChange,
}: {
  e: Equipment;
  value: Fulfilment;
  onChange: (v: Fulfilment) => void;
}) {
  const options: {
    id: Fulfilment;
    icon: typeof Package;
    line: string;
    note: string;
  }[] = [
    ...(e.pickup
      ? [
          {
            id: "pickup" as const,
            icon: Package,
            line: `${shownPlace(e.location)} · free`,
            note: "Collect from the provider",
          },
        ]
      : []),
    ...(e.delivery
      ? [
          {
            id: "provider_delivery" as const,
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
    <div
      role="radiogroup"
      aria-label="Fulfilment"
      className="divide-y divide-border overflow-hidden rounded-lg bg-subtle"
    >
      {options.map((o) => {
        const Icon = o.icon;
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className="flex w-full items-center gap-3 px-4 py-4 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-icon-chip">
              <Icon
                size={iconSize.sm}
                aria-hidden
                className={active ? "text-ink-foreground" : "text-ink-foreground/60"}
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-1 font-semibold">{fulfilmentLabels[o.id]}</span>
              <span className="block truncate text-1 text-muted-foreground">{o.line}</span>
            </span>
            <span
              className={`h-5 w-5 shrink-0 rounded-full border-2 ${active ? "border-ink bg-ink" : "border-border"}`}
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
            src={sized(photo, { width: 80 })}
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
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${value ? "bg-ink" : "bg-border"}`}
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
