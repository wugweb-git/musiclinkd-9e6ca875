import { CoverHero } from "./profile";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Calendar,
  Check,
  ChevronRight,
  Clock,
  MapPin,
  Star,
  Users,
  AlertTriangle,
  Info,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Btn, Sheet, VerifiedBadge } from "@/components/ml/ui";
import {
  EmptyState as BaseEmptyState,
  OfflineBanner as BaseOfflineBanner,
  Price,
} from "@/components/ml/kit";
import {
  availabilityFor,
  formatDate,
  formatTime,
  inr,
  isoDate,
  lowestRate,
  monthGrid,
  statusMeta,
  bookingTimeline,
  type AddOn,
  type Bookable,
  type Booking,
  type BookingStatus,
  type DayAvailability,
  type DayState,
  type PriceLines,
  type Resource,
  type Slot,
} from "@/data/booking";
import { TextLink } from "@/components/ml/links";
import { iconSize } from "@/lib/tokens";
import { earliestBookingDate } from "@/lib/studio-slots";

/* ------------------------------------------------------------------ */
/* Status                                                            */
/* ------------------------------------------------------------------ */

const toneStyle: Record<string, { pill: string; dot: string }> = {
  ok: { pill: "bg-success-container text-success-strong", dot: "bg-success" },
  warn: { pill: "bg-warn-container text-warn-strong", dot: "bg-warn" },
  info: { pill: "bg-background text-foreground", dot: "bg-foreground" },
  off: { pill: "bg-background text-muted-foreground", dot: "bg-muted-foreground" },
};

export function BookingStatusPill({ status }: { status: BookingStatus }) {
  const meta = statusMeta[status];
  const c = toneStyle[meta.tone]!;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full pill ${c.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} aria-hidden />
      {meta.label}
    </span>
  );
}

export function BookingTimeline({ status }: { status: BookingStatus }) {
  const idx = bookingTimeline.findIndex((s) => s.status === status);
  const terminal = ["cancelled", "rejected", "expired", "noShow"].includes(status);
  return (
    <ol className="space-y-0" aria-label="Booking progress">
      {bookingTimeline.map((s, i) => {
        const done = !terminal && i <= idx;
        const current = !terminal && i === idx;
        return (
          <li key={s.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-1 ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-subtle text-muted-foreground"
                }`}
                aria-hidden
              >
                {done ? <Check size={iconSize.xs} strokeWidth={3} /> : "·"}
              </span>
              {i < bookingTimeline.length - 1 ? (
                <span className={`min-h-4.5 w-px flex-1 ${done ? "bg-primary" : "bg-border"}`} />
              ) : null}
            </div>
            <p
              className={`pb-3 text-sm ${current ? "font-semibold" : done ? "text-muted-foreground" : "text-muted-foreground"}`}
            >
              {s.label}
              {current ? (
                <span className="pill ml-2 bg-background text-foreground">Now</span>
              ) : null}
            </p>
          </li>
        );
      })}
      {terminal ? (
        <li className="mt-1 rounded-lg bg-subtle px-3 py-2 text-1 text-muted-foreground">
          This booking ended as <span className="font-semibold">{statusMeta[status].label}</span>.
        </li>
      ) : null}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Entity + resource                                                   */
/* ------------------------------------------------------------------ */

/** A studio's header: the profile page's own CoverHero, with the business's picture as its logo. */
export function BookableHero({ b, back }: { b: Bookable; back?: string }) {
  return (
    <CoverHero
      cover={b.hero}
      photo={b.logo}
      name={b.name}
      square
      back={back}
      title={
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <h1 className="flex items-center gap-1.5 text-3 leading-tight">
            {b.name}
            {b.verified ? <VerifiedBadge size={16} /> : null}
          </h1>
          {b.kind ? <span className="pill bg-subtle text-muted-foreground">{b.kind}</span> : null}
        </div>
      }
    >
      {/* A studio is a business profile: its @username opens that profile. */}
      {b.username ? (
        <Link
          to="/business/$id"
          params={{ id: b.username }}
          className="mt-0.5 block text-sm text-muted-foreground"
        >
          @{b.username}
        </Link>
      ) : null}
      {b.followers ? (
        <p className="mt-1.5 text-1 text-muted-foreground">
          {b.followers.toLocaleString("en-IN")} follower{b.followers === 1 ? "" : "s"}
        </p>
      ) : null}
    </CoverHero>
  );
}

export function EntityMetaRow({ b }: { b: Bookable }) {
  // Database studios have no distance, and a rating only once reviewed; skip what is empty.
  const place = b.city;
  const where = [place, b.distanceKm ? `${b.distanceKm} km` : ""].filter(Boolean).join(" · ");
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-1 text-muted-foreground">
      {b.rating ? (
        <span className="inline-flex items-center gap-1">
          <Star size={iconSize.xs} className="text-primary" /> {b.rating.toFixed(1)} ({b.reviews})
        </span>
      ) : null}
      {where ? (
        <span className="inline-flex items-center gap-1">
          <MapPin size={iconSize.xs} /> {where}
        </span>
      ) : null}
      {b.responseTime ? (
        <span className="inline-flex items-center gap-1">
          <Clock size={iconSize.xs} /> {b.responseTime}
        </span>
      ) : null}
    </div>
  );
}

export function ResourceCard({
  r,
  selected,
  onSelect,
}: {
  r: Resource;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const from = lowestRate(r.tiers);
  return (
    <div
      className={`overflow-hidden rounded-lg border-2 bg-background ${
        selected ? "border-foreground bg-background" : "border-transparent bg-background"
      }`}
    >
      <div className="flex gap-3 p-3">
        {r.photo ? (
          <img
            src={r.photo}
            alt=""
            className="h-20 w-20 shrink-0 rounded-lg object-cover"
            loading="lazy"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{r.name}</p>
          {r.description ? (
            <p className="mt-0.5 line-clamp-2 text-1 text-muted-foreground">{r.description}</p>
          ) : null}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-1 text-muted-foreground">
            {r.capacity ? (
              <span className="inline-flex items-center gap-1">
                <Users size={iconSize.xs} /> Up to {r.capacity}
              </span>
            ) : null}
            {r.availabilityNote ? (
              <span className="inline-flex items-center gap-1">
                <Calendar size={iconSize.xs} /> {r.availabilityNote}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      {r.equipment.length ? (
        <div className="flex flex-wrap gap-1.5 px-3 pb-3">
          {r.equipment.slice(0, 3).map((e) => (
            <span
              key={e}
              className="rounded-full bg-background px-2.5 py-1 text-1 text-muted-foreground"
            >
              {e}
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <div className="min-w-0">
          <Price price={from} amountClassName="text-sm font-semibold" />
          <p className="text-1 text-muted-foreground">
            {r.model === "instant" ? "Instant booking" : "Request to book"}
          </p>
        </div>
        <Btn variant={selected ? "primary" : "outline"} onClick={onSelect ?? (() => undefined)}>
          {selected ? "Selected" : "Select"}
        </Btn>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Availability calendar                                               */
/* ------------------------------------------------------------------ */

const dayStyle: Record<DayState, string> = {
  available: "text-foreground",
  limited: "text-foreground",
  unavailable: "text-muted-foreground line-through",
  closed: "text-muted-foreground",
};

export function AvailabilityCalendar({
  resourceId,
  fromPrice,
  selected,
  onSelect,
  timezone,
  dayOf,
}: {
  resourceId: string;
  fromPrice: number;
  selected?: string | undefined;
  onSelect: (date: string) => void;
  timezone: string;
  /** A database studio's real day (src/lib/studio-slots.ts); the design-time schedule otherwise. */
  dayOf?: ((date: string) => DayAvailability) | undefined;
}) {
  const today = new Date();
  const earliest = earliestBookingDate(today);
  const [cursor, setCursor] = useState(() => {
    const d = new Date(`${earliest}T00:00:00`);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const days = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor]);
  // Nothing before tomorrow is shown, so the calendar opens on tomorrow's month and stops there.
  const first = new Date(`${earliest}T00:00:00`);
  const atFirstMonth = cursor.y === first.getFullYear() && cursor.m === first.getMonth();
  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-lg bg-subtle p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          disabled={atFirstMonth}
          onClick={() =>
            setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { ...c, m: c.m - 1 }))
          }
          className={`flex h-10 w-10 items-center justify-center rounded-full border border-border ${
            atFirstMonth ? "invisible" : ""
          }`}
        >
          ‹
        </button>
        <p className="text-sm font-semibold">{monthLabel}</p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() =>
            setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { ...c, m: c.m + 1 }))
          }
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border"
        >
          ›
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-1 font-medium uppercase text-muted-foreground">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((d) => {
          const iso = isoDate(d);
          const inMonth = d.getMonth() === cursor.m;
          if (iso < earliest) return <span key={iso} aria-hidden className="h-12" />;
          const a = dayOf ? dayOf(iso) : availabilityFor(resourceId, iso, fromPrice);
          // Bookings start tomorrow at the earliest, whatever the schedule says.
          const disabled = a.state === "unavailable" || a.state === "closed";
          const isSel = selected === iso;
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(iso)}
              aria-label={`${formatDate(iso)} — ${a.state}`}
              aria-pressed={isSel}
              className={`flex h-12 flex-col items-center justify-center rounded-sm text-sm ${
                isSel
                  ? "bg-primary text-primary-foreground"
                  : disabled
                    ? "bg-transparent"
                    : "bg-background"
              } ${inMonth ? "" : "opacity-35"} ${isSel ? "" : dayStyle[a.state]}`}
            >
              <span className={isSel ? "font-bold" : ""}>{d.getDate()}</span>
              <span
                className={`mt-0.5 h-1 w-1 rounded-full ${
                  isSel
                    ? "bg-primary-foreground"
                    : a.state === "available"
                      ? "bg-success"
                      : a.state === "limited"
                        ? "bg-warn"
                        : ""
                }`}
                aria-hidden
              />
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-1 text-muted-foreground">
        <Legend dot="bg-success" label="Available" />
        <Legend dot="bg-warn" label="Limited" />
        <Legend dot="bg-border" label="Unavailable" />
      </div>
      <p className="mt-2 text-1 text-muted-foreground">All times shown in {timezone}.</p>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}

export function SlotPicker({
  slots,
  value,
  onChange,
  timezone,
}: {
  slots: Slot[];
  value?: string | undefined;
  onChange: (start: string) => void;
  timezone: string;
}) {
  if (slots.length === 0) {
    return null;
  }
  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((s) => {
          const open = s.state === "open";
          const active = value === s.start;
          return (
            <button
              key={s.start}
              type="button"
              disabled={!open}
              onClick={() => onChange(s.start)}
              aria-pressed={active}
              aria-label={`${formatTime(s.start)} to ${formatTime(s.end)} — ${open ? "available" : s.state}`}
              className={`min-h-control rounded-lg border px-2 text-1 font-semibold ${
                active
                  ? "border-transparent bg-primary text-primary-foreground"
                  : open
                    ? "border-border bg-card text-foreground"
                    : "border-transparent bg-background text-muted-foreground line-through"
              }`}
            >
              {formatTime(s.start)}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-1 text-muted-foreground">Slots are shown in {timezone}.</p>
    </div>
  );
}

export function DurationPicker({
  options,
  value,
  onChange,
  customHours,
  onCustomHours,
}: {
  options: { label: string; hours: number }[];
  value: number;
  onChange: (hours: number) => void;
  customHours?: number | undefined;
  onCustomHours?: (h: number) => void;
}) {
  const isCustom = !options.some((o) => o.hours === value && o.hours !== 0);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o.hours === 0 ? isCustom : value === o.hours;
          return (
            <button
              key={o.label}
              type="button"
              onClick={() => onChange(o.hours === 0 ? (customHours ?? 4) : o.hours)}
              aria-pressed={active}
              className={`min-h-touch rounded-full border px-4 text-1 font-semibold ${
                active
                  ? "border-transparent bg-selected-bg text-selected-text"
                  : "border-border bg-card"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {isCustom && onCustomHours ? (
        <label className="mt-3 flex items-center gap-3 rounded-lg bg-subtle px-4 py-3">
          <span className="text-1 font-semibold">Custom hours</span>
          <input
            type="number"
            min={1}
            max={12}
            value={customHours ?? value}
            onChange={(e) => onCustomHours(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
            className="w-16 rounded-sm border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Add-ons + price                                                     */
/* ------------------------------------------------------------------ */

export function AddOnCard({
  a,
  selected,
  onToggle,
}: {
  a: AddOn;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`rounded-lg border-2 bg-background p-4 ${selected ? "border-foreground bg-background" : "border-transparent bg-background"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{a.name}</p>
          {a.description ? (
            <p className="mt-0.5 text-1 text-muted-foreground">{a.description}</p>
          ) : null}
          {a.unpriced ? null : (
            <Price
              price={{ amount: inr(a.price), unit: a.perHour ? "hour" : a.unit }}
              className="mt-1.5"
              amountClassName="text-sm font-semibold"
            />
          )}
          {a.rentalListingId ? (
            <TextLink to="/marketplace/rent" className="mt-1 gap-1">
              Rental Marketplace <ChevronRight size={iconSize.xs} />
            </TextLink>
          ) : null}
        </div>
        {a.available ? (
          <Btn variant={selected ? "primary" : "outline"} onClick={onToggle}>
            {selected ? "Added" : "Add"}
          </Btn>
        ) : (
          <span className="rounded-full bg-background px-3 py-2 text-1 font-semibold text-muted-foreground">
            Unavailable
          </span>
        )}
      </div>
    </div>
  );
}

export function PriceBreakdownCard({ p, compact }: { p: PriceLines; compact?: boolean }) {
  return (
    <div className="rounded-lg bg-subtle p-4">
      <Row label={p.baseLabel} value={inr(p.base)} />
      {p.addOns.map((a) => (
        <Row key={a.name} label={a.name} value={inr(a.price)} muted />
      ))}
      <div className="my-2 h-px bg-border" />
      <Row label="Subtotal" value={inr(p.subtotal)} />
      {p.taxPct ? <Row label={`Taxes (${p.taxPct}%)`} value={inr(p.tax)} muted /> : null}
      <div className="my-2 h-px bg-border" />
      <Row label="Total" value={inr(p.total)} strong />
      {!compact ? (
        <p className="mt-3 text-1 text-muted-foreground">
          Prices come from the provider's configured rates. You settle payment with the provider
          directly.
        </p>
      ) : null}
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  strong,
}: {
  label: string;
  value: string;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span
        className={`min-w-0 flex-1 truncate text-sm ${muted ? "text-muted-foreground" : "text-muted-foreground"}`}
      >
        {label}
      </span>
      <span
        className={`shrink-0 text-sm text-price ${strong ? "text-2 font-bold" : "font-semibold"}`}
      >
        {value}
      </span>
    </div>
  );
}

export function PolicyCard({
  title,
  body,
  critical,
}: {
  title: string;
  body: string;
  critical?: boolean | undefined;
}) {
  return (
    <div className="rounded-lg bg-subtle p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        {critical ? (
          <AlertTriangle size={iconSize.sm} className="text-primary" />
        ) : (
          <Info size={iconSize.sm} className="text-muted-foreground" />
        )}
        {title}
      </p>
      <p className="mt-1 text-1 leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

export function AcknowledgeRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg bg-subtle p-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--primary)]"
      />
      <span className="text-1 leading-relaxed text-muted-foreground">{label}</span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Summary + list cards                                                */
/* ------------------------------------------------------------------ */

export function BookingSummaryCard({
  b,
  r,
  date,
  start,
  end,
  people,
}: {
  b: Bookable;
  r: Resource;
  date: string;
  start: string;
  end: string;
  people: number;
}) {
  return (
    <div className="rounded-lg bg-subtle p-4">
      <div className="flex gap-3">
        <img
          src={r.photo}
          alt=""
          className="h-16 w-16 shrink-0 rounded-lg object-cover"
          loading="lazy"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{b.name}</p>
          <p className="truncate text-1 text-muted-foreground">{r.name}</p>
          <p className="mt-1 truncate text-1 text-muted-foreground">{b.city}</p>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-1">
        <Detail label="Date" value={formatDate(date)} />
        <Detail label="Time" value={`${formatTime(start)} – ${formatTime(end)}`} />
        <Detail label="Timezone" value={b.timezone} />
        <Detail label="People" value={`${people}`} />
      </dl>
    </div>
  );
}

export function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="pill bg-background text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-semibold">{value}</dd>
    </div>
  );
}

export function ProviderRequestCard({
  booking,
  entityResource,
}: {
  booking: Booking;
  entityResource: string;
}) {
  return (
    <div className="rounded-lg bg-subtle p-4">
      <div className="flex items-start gap-3">
        <img
          src={booking.customerAvatar}
          alt=""
          className="h-11 w-11 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{booking.customer}</p>
          <p className="truncate text-1 text-muted-foreground">{booking.customerRole}</p>
        </div>
        <BookingStatusPill status={booking.status} />
      </div>
      <div className="mt-3 rounded-lg bg-subtle px-3 py-2 text-1 text-muted-foreground">
        <p className="font-semibold text-foreground">{entityResource}</p>
        <p className="mt-0.5">
          {formatDate(booking.date)} · {formatTime(booking.start)} – {formatTime(booking.end)} ·{" "}
          {booking.hours} hrs
        </p>
        <p className="mt-0.5">
          {booking.people} people · {booking.purpose}
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-bold text-price">{inr(booking.amount)}</span>
        <TextLink
          to="/business/bookings/requests/$ref"
          params={{ ref: booking.ref }}
          className="gap-1 text-1 font-bold"
        >
          Review Request <ChevronRight size={iconSize.sm} />
        </TextLink>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export function OfflineBanner({ onRetry }: { onRetry?: () => void }) {
  return (
    <BaseOfflineBanner
      body="Availability may have changed. We won't confirm a booking until you're back online."
      onRetry={onRetry}
    />
  );
}

export function ErrorState({
  variant = "card",
  title,
  message,
  body,
  onRetry,
}: {
  variant?: "card" | "subtle";
  title?: string | undefined;
  /** "card" variant's copy prop. */
  message?: string;
  /** "subtle" variant's copy prop. */
  body?: string;
  onRetry?: (() => void) | undefined;
}) {
  if (variant === "subtle") {
    return (
      <div className="flex flex-col items-center rounded-lg bg-subtle px-6 py-12 text-center">
        <AlertTriangle size={iconSize.lg} className="mb-3 text-destructive" />
        <h3 className="text-2">{title ?? "We couldn't load this collaboration."}</h3>
        <p className="mt-1 mb-5 text-1 text-muted-foreground">
          {body ?? "Check your connection and try again."}
        </p>
        {onRetry ? (
          <Btn onClick={onRetry}>
            <RefreshCw size={iconSize.sm} className="mr-2" /> Retry
          </Btn>
        ) : null}
      </div>
    );
  }

  return (
    <div role="alert" className="rounded-lg border border-destructive/40 bg-card p-5 text-center">
      <AlertTriangle size={iconSize.lg} className="mx-auto text-destructive" />
      <p className="mt-2 font-semibold">{title ?? "Something went wrong"}</p>
      <p className="mt-1 text-1 text-muted-foreground">{message}</p>
      {onRetry ? (
        <Btn className="mt-4 w-full" onClick={onRetry}>
          Try Again
        </Btn>
      ) : null}
    </div>
  );
}

/** Booking's own icon/spacing treatment, preserved via kit.tsx's EmptyState "bare" variant. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode | undefined;
}) {
  return (
    <BaseEmptyState
      variant="bare"
      icon={<Calendar size={iconSize.lg} className="mx-auto text-muted-foreground" />}
      title={title}
      body={body}
      action={action}
    />
  );
}

export function BookingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-lg bg-subtle" />
      ))}
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="rounded-lg bg-subtle p-4" aria-hidden>
      <div className="h-5 w-32 animate-pulse rounded-full bg-background" />
      <div className="mt-4 grid grid-cols-7 gap-1">
        {Array.from({ length: 28 }, (_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-sm bg-subtle" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sticky action bar                                                   */
/* ------------------------------------------------------------------ */

export function StickyBar({
  primaryLabel,
  onPrimary,
  hint,
  price,
  disabled,
  secondary,
}: {
  primaryLabel: string;
  onPrimary: () => void;
  hint?: string | undefined;
  price?: string | undefined;
  disabled?: boolean | undefined;
  secondary?: ReactNode | undefined;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-nav mx-auto w-full max-w-app border-t border-border bg-card/95 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          {price ? <p className="truncate text-2 font-bold text-price">{price}</p> : null}
          {hint ? <p className="truncate text-1 text-muted-foreground">{hint}</p> : null}
        </div>
        {secondary}
        <Btn
          className={disabled ? "min-w-[9.5rem] opacity-50" : "min-w-[9.5rem]"}
          onClick={disabled ? () => undefined : onPrimary}
        >
          {primaryLabel}
        </Btn>
      </div>
    </div>
  );
}

export function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div
      className="flex items-center gap-1.5"
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Step ${step} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${i < step ? "w-6 bg-primary" : "w-1.5 bg-border"}`}
        />
      ))}
    </div>
  );
}

/**
 * Photos a studio added as proof of one facility or equipment item, each at full width in a sheet.
 * Open while `photos` has any; the studio page and the owner's editor both use it.
 */
export function PhotoSheet({
  title,
  photos,
  onClose,
}: {
  title: string;
  photos: string[];
  onClose: () => void;
}) {
  return (
    <Sheet open={photos.length > 0} onClose={onClose} title={title}>
      <div className="space-y-3">
        {photos.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`${title}, ${i + 1} of ${photos.length}`}
            className="w-full rounded-lg bg-subtle object-contain"
            loading="lazy"
          />
        ))}
      </div>
    </Sheet>
  );
}

/**
 * A facility or equipment pill. With photos it becomes a button showing the first one as a small
 * thumbnail and the count, and opens them; without, it stays a plain label.
 */
export function ProofPill({
  label,
  photos,
  onOpen,
  className,
  icon: Icon,
}: {
  label: string;
  photos: string[] | undefined;
  onOpen: () => void;
  className: string;
  /** An amenity's line icon: it leads the label, and the photo thumbnail follows it. */
  icon?: LucideIcon;
}) {
  if (!photos?.length) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${className}`}>
        {Icon ? <Icon size={iconSize.sm} className="text-foreground" aria-hidden /> : null}
        {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${label}, ${photos.length} ${photos.length === 1 ? "photo" : "photos"}`}
      className={`state-layer flex items-center gap-1.5 py-1 pr-3 ${Icon ? "pl-3" : "pl-1"} ${className}`}
    >
      {Icon ? <Icon size={iconSize.sm} className="text-foreground" aria-hidden /> : null}
      {Icon ? null : (
        <img src={photos[0]} alt="" className="h-6 w-6 rounded-full object-cover" loading="lazy" />
      )}
      {label}
      {Icon ? (
        <img src={photos[0]} alt="" className="h-6 w-6 rounded-full object-cover" loading="lazy" />
      ) : null}
      <span className="tabular-nums text-foreground">{photos.length}</span>
    </button>
  );
}
