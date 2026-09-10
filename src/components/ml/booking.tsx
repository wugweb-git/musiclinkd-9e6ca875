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
  WifiOff,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Btn, VerifiedBadge } from "@/components/ml/ui";
import {
  availabilityFor,
  formatDate,
  formatTime,
  inr,
  isoDate,
  monthGrid,
  paymentMeta,
  statusMeta,
  bookingTimeline,
  type AddOn,
  type Bookable,
  type Booking,
  type BookingStatus,
  type DayState,
  type PaymentStatus,
  type PriceLines,
  type Resource,
  type Slot,
} from "@/data/booking";

/* ------------------------------------------------------------------ */
/* Status + payment                                                    */
/* ------------------------------------------------------------------ */

const toneStyle: Record<string, { bg: string; fg: string }> = {
  ok: { bg: "var(--success-container)", fg: "var(--success)" },
  warn: { bg: "var(--warn-container)", fg: "var(--warn)" },
  info: { bg: "var(--pink-container)", fg: "var(--primary)" },
  off: { bg: "var(--surface-subtle)", fg: "var(--text-2)" },
};

export function BookingStatusPill({ status }: { status: BookingStatus }) {
  const meta = statusMeta[status];
  const c = toneStyle[meta.tone]!;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
      style={{ background: c.bg, color: c.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.fg }} aria-hidden />
      {meta.label}
    </span>
  );
}

export function PaymentPill({ status }: { status: PaymentStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-text2">
      {paymentMeta[status]}
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
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-subtle text-muted-foreground"
                }`}
                aria-hidden
              >
                {done ? <Check size={11} strokeWidth={3} /> : "·"}
              </span>
              {i < bookingTimeline.length - 1 ? (
                <span
                  className={`w-px flex-1 ${done ? "bg-primary" : "bg-border"}`}
                  style={{ minHeight: 18 }}
                />
              ) : null}
            </div>
            <p
              className={`pb-3 text-sm ${current ? "font-semibold" : done ? "text-text2" : "text-muted-foreground"}`}
            >
              {s.label}
              {current ? (
                <span className="ml-2 text-[11px] font-bold uppercase text-primary">Now</span>
              ) : null}
            </p>
          </li>
        );
      })}
      {terminal ? (
        <li className="mt-1 rounded-2xl bg-subtle px-3 py-2 text-xs text-text2">
          This booking ended as <span className="font-semibold">{statusMeta[status].label}</span>.
        </li>
      ) : null}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Entity + resource                                                   */
/* ------------------------------------------------------------------ */

export function BookableHero({ b }: { b: Bookable }) {
  return (
    <div className="relative">
      <img
        src={b.hero}
        alt={`${b.name} — ${b.kind}`}
        className="h-56 w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-navy/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
        <span className="inline-flex rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-text2">
          {b.kind}
        </span>
        <h1 className="mt-2 flex items-center gap-2 text-[24px] leading-tight text-background">
          <span className="truncate">{b.name}</span>
          {b.verified ? <VerifiedBadge size={16} /> : null}
        </h1>
      </div>
    </div>
  );
}

export function EntityMetaRow({ b }: { b: Bookable }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text2">
      <span className="inline-flex items-center gap-1">
        <Star size={13} className="text-primary" /> {b.rating} ({b.reviews})
      </span>
      <span className="inline-flex items-center gap-1">
        <MapPin size={13} /> {b.area}, {b.city} · {b.distanceKm} km
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock size={13} /> {b.responseTime}
      </span>
    </div>
  );
}

export function BookableEntityCard({ b }: { b: Bookable }) {
  const from = Math.min(...b.resources.flatMap((r) => r.tiers.map((t) => t.price)));
  return (
    <Link
      to="/booking/$id"
      params={{ id: b.id }}
      className="block overflow-hidden rounded-3xl border border-border bg-card"
    >
      <img src={b.hero} alt={b.name} className="h-36 w-full object-cover" loading="lazy" />
      <div className="p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          {b.kind}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 truncate font-semibold">
          {b.name} {b.verified ? <VerifiedBadge size={14} /> : null}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {b.area}, {b.city} · from {inr(from)}
        </p>
      </div>
    </Link>
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
  const from = Math.min(...r.tiers.map((t) => t.price));
  return (
    <div
      className={`overflow-hidden rounded-3xl border bg-card ${
        selected ? "border-primary" : "border-border"
      }`}
    >
      <div className="flex gap-3 p-3">
        <img
          src={r.photo}
          alt=""
          className="h-20 w-20 shrink-0 rounded-2xl object-cover"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{r.name}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text2">
            <span className="inline-flex items-center gap-1">
              <Users size={12} /> Up to {r.capacity}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar size={12} /> {r.availabilityNote}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 px-3 pb-3">
        {r.equipment.slice(0, 3).map((e) => (
          <span key={e} className="rounded-full bg-subtle px-2.5 py-1 text-[11px] text-text2">
            {e}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{inr(from)}</p>
          <p className="text-[11px] text-muted-foreground">
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
}: {
  resourceId: string;
  fromPrice: number;
  selected?: string | undefined;
  onSelect: (date: string) => void;
  timezone: string;
}) {
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const days = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor]);
  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() =>
            setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { ...c, m: c.m - 1 }))
          }
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border"
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

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-muted-foreground">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((d) => {
          const iso = isoDate(d);
          const inMonth = d.getMonth() === cursor.m;
          const a = availabilityFor(resourceId, iso, fromPrice);
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
              className={`flex h-12 flex-col items-center justify-center rounded-2xl text-sm ${
                isSel
                  ? "bg-primary text-primary-foreground"
                  : disabled
                    ? "bg-transparent"
                    : "bg-subtle"
              } ${inMonth ? "" : "opacity-35"} ${isSel ? "" : dayStyle[a.state]}`}
            >
              <span className={isSel ? "font-bold" : ""}>{d.getDate()}</span>
              <span
                className="mt-0.5 h-1 w-1 rounded-full"
                aria-hidden
                style={{
                  background: isSel
                    ? "var(--primary-foreground)"
                    : a.state === "available"
                      ? "var(--success)"
                      : a.state === "limited"
                        ? "var(--warn)"
                        : "transparent",
                }}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-[11px] text-text2">
        <Legend color="var(--success)" label="Available" />
        <Legend color="var(--warn)" label="Limited" />
        <Legend color="var(--border)" label="Unavailable / closed" />
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">All times shown in {timezone}.</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
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
              className={`min-h-12 rounded-2xl border px-2 text-xs font-semibold ${
                active
                  ? "border-transparent bg-primary text-primary-foreground"
                  : open
                    ? "border-border bg-card text-foreground"
                    : "border-transparent bg-subtle text-muted-foreground line-through"
              }`}
            >
              {formatTime(s.start)}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">Slots are shown in {timezone}.</p>
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
              className={`min-h-11 rounded-full border px-4 text-xs font-semibold ${
                active ? "border-transparent bg-navy text-background" : "border-border bg-card"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {isCustom && onCustomHours ? (
        <label className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
          <span className="text-xs font-semibold">Custom hours</span>
          <input
            type="number"
            min={1}
            max={12}
            value={customHours ?? value}
            onChange={(e) => onCustomHours(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
            className="w-16 rounded-xl border border-border bg-background px-3 py-2 text-sm"
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
      className={`rounded-3xl border bg-card p-4 ${selected ? "border-primary" : "border-border"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{a.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>
          <p className="mt-1.5 text-sm font-semibold">
            {inr(a.price)}
            {a.perHour ? (
              <span className="text-xs font-normal text-muted-foreground"> / hour</span>
            ) : null}
          </p>
          {a.rentalListingId ? (
            <Link
              to="/marketplace/rent"
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-primary"
            >
              Rental marketplace <ChevronRight size={12} />
            </Link>
          ) : null}
        </div>
        {a.available ? (
          <Btn variant={selected ? "primary" : "outline"} onClick={onToggle}>
            {selected ? "Added" : "Add"}
          </Btn>
        ) : (
          <span className="rounded-full bg-subtle px-3 py-2 text-[11px] font-semibold text-muted-foreground">
            Unavailable
          </span>
        )}
      </div>
    </div>
  );
}

export function PriceBreakdownCard({ p, compact }: { p: PriceLines; compact?: boolean }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <Row label={p.baseLabel} value={inr(p.base)} />
      {p.addOns.map((a) => (
        <Row key={a.name} label={a.name} value={inr(a.price)} muted />
      ))}
      <div className="my-2 h-px bg-border" />
      <Row label="Subtotal" value={inr(p.subtotal)} />
      <Row label={`Taxes (${p.taxPct}%)`} value={inr(p.tax)} muted />
      <div className="my-2 h-px bg-border" />
      <Row label="Total" value={inr(p.total)} strong />
      {p.deposit > 0 ? (
        <>
          <Row label="Deposit due now" value={inr(p.deposit)} />
          <Row label="Balance at the studio" value={inr(p.balance)} muted />
        </>
      ) : null}
      {!compact ? (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Prices come from the provider's configured rates. Nothing is charged until you confirm.
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
        className={`min-w-0 flex-1 truncate text-sm ${muted ? "text-muted-foreground" : "text-text2"}`}
      >
        {label}
      </span>
      <span className={`shrink-0 text-sm ${strong ? "text-base font-bold" : "font-semibold"}`}>
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
    <div className="rounded-3xl border border-border bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        {critical ? (
          <AlertTriangle size={14} className="text-primary" />
        ) : (
          <Info size={14} className="text-muted-foreground" />
        )}
        {title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-text2">{body}</p>
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
    <label className="flex items-start gap-3 rounded-3xl border border-border bg-card p-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--primary)]"
      />
      <span className="text-xs leading-relaxed text-text2">{label}</span>
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
    <div className="rounded-3xl border border-border bg-card p-4">
      <div className="flex gap-3">
        <img
          src={r.photo}
          alt=""
          className="h-16 w-16 shrink-0 rounded-2xl object-cover"
          loading="lazy"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{b.name}</p>
          <p className="truncate text-xs text-muted-foreground">{r.name}</p>
          <p className="mt-1 truncate text-xs text-text2">
            {b.area}, {b.city}
          </p>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
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
      <dt className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm font-semibold">{value}</dd>
    </div>
  );
}

export function BookingListCard({
  booking,
  entityName,
  resourceName,
  provider,
}: {
  booking: Booking;
  entityName: string;
  resourceName: string;
  provider?: boolean | undefined;
}) {
  return (
    <Link
      to={provider ? "/provider/bookings/$ref" : "/bookings/$ref"}
      params={{ ref: booking.ref }}
      className="block rounded-3xl border border-border bg-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{provider ? booking.customer : entityName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {resourceName} · {booking.purpose}
          </p>
        </div>
        <BookingStatusPill status={booking.status} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text2">
        <span className="inline-flex items-center gap-1">
          <Calendar size={13} /> {formatDate(booking.date)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={13} /> {formatTime(booking.start)} – {formatTime(booking.end)}
        </span>
        <span className="font-semibold text-foreground">{inr(booking.amount)}</span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-[11px] text-muted-foreground">#{booking.ref}</span>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
          View booking <ChevronRight size={14} />
        </span>
      </div>
    </Link>
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
    <div className="rounded-3xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <img
          src={booking.customerAvatar}
          alt=""
          className="h-11 w-11 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{booking.customer}</p>
          <p className="truncate text-xs text-muted-foreground">{booking.customerRole}</p>
        </div>
        <BookingStatusPill status={booking.status} />
      </div>
      <div className="mt-3 rounded-2xl bg-subtle px-3 py-2 text-xs text-text2">
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
        <span className="text-sm font-bold">{inr(booking.amount)}</span>
        <Link
          to="/provider/bookings/requests/$ref"
          params={{ ref: booking.ref }}
          className="inline-flex items-center gap-1 text-xs font-bold text-primary"
        >
          Review request <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export function PaymentSummaryCard({ p, paid }: { p: PriceLines; paid?: boolean }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Payment</p>
      <Row label="Total booking value" value={inr(p.total)} />
      <Row
        label={paid ? "Deposit paid" : "Deposit due now"}
        value={inr(p.deposit || p.total)}
        strong
      />
      <Row label="Balance at the studio" value={inr(p.deposit ? p.balance : 0)} muted />
      <p className="mt-3 text-[11px] text-muted-foreground">
        Payments are handled by the provider's payment partner. MusicLinkd never stores your card
        details.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export function OfflineBanner({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
    >
      <WifiOff size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">You're offline</p>
        <p className="mt-0.5 text-xs text-text2">
          Availability may have changed. We won't confirm a booking until you're back online.
        </p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 shrink-0 text-xs font-bold text-primary"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string | undefined;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div role="alert" className="rounded-3xl border border-destructive/40 bg-card p-5 text-center">
      <AlertTriangle size={22} className="mx-auto text-destructive" />
      <p className="mt-2 font-semibold">{title}</p>
      <p className="mt-1 text-xs text-text2">{message}</p>
      <Btn className="mt-4 w-full" onClick={onRetry}>
        Try again
      </Btn>
    </div>
  );
}

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
    <div className="rounded-3xl border border-dashed border-border bg-card p-6 text-center">
      <Calendar size={22} className="mx-auto text-muted-foreground" />
      <p className="mt-2 font-semibold">{title}</p>
      <p className="mt-1 text-xs text-text2">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function BookingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-3xl bg-subtle" />
      ))}
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="rounded-3xl border border-border bg-card p-4" aria-hidden>
      <div className="h-5 w-32 animate-pulse rounded-full bg-subtle" />
      <div className="mt-4 grid grid-cols-7 gap-1">
        {Array.from({ length: 28 }, (_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-2xl bg-subtle" />
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
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[430px] border-t border-border bg-card/95 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          {price ? <p className="truncate text-base font-bold">{price}</p> : null}
          {hint ? <p className="truncate text-[11px] text-muted-foreground">{hint}</p> : null}
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
