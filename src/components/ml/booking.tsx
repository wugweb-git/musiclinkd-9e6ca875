import { CoverHero } from "./profile";
import { busyTimesOn } from "@/lib/device-calendar";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Star,
  AlertTriangle,
  Info,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ActionBar, Btn, IconBtn, Sheet, VerifiedBadge } from "@/components/ml/ui";
import { Price, StatusPill, type Tone } from "@/components/ml/kit";
import {
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
  type Slot,
} from "@/data/booking";
import { formatDate, formatTime, isoDate } from "@/lib/when";
import { joinParts } from "@/lib/utils";
import {
  askedName,
  requestBooking,
  type BookingRequest,
  type BookingStatus as DbBookingStatus,
} from "@/lib/bookings.functions";
import { useAuth } from "@/hooks/use-auth";
import { inr } from "@/lib/price";
import { TextLink } from "@/components/ml/links";
import { iconSize } from "@/lib/tokens";
import { earliestBookingDate } from "@/lib/bookable-slots";
import { todayInIndia } from "@/lib/when";
import { sized } from "@/lib/image-url";

/* ------------------------------------------------------------------ */
/* Status                                                            */
/* ------------------------------------------------------------------ */

const bookingMetaTone: Record<"ok" | "warn" | "off" | "info", Tone> = {
  ok: "good",
  warn: "warn",
  off: "neutral",
  info: "neutral",
};

export function BookingStatusPill({ status }: { status: BookingStatus }) {
  const meta = statusMeta[status];
  return <StatusPill label={meta.label} tone={bookingMetaTone[meta.tone]} />;
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
                    ? "bg-ink text-ink-foreground"
                    : "border border-border bg-subtle text-muted-foreground"
                }`}
                aria-hidden
              >
                {done ? <Check size={iconSize.xs} /> : null}
              </span>
              {i < bookingTimeline.length - 1 ? (
                <span className={`min-h-4.5 w-px flex-1 ${done ? "bg-ink" : "bg-border"}`} />
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
          to="/profile/$username"
          params={{ username: b.username }}
          className="hit-area mt-0.5 block text-sm text-muted-foreground"
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
          <Star size={iconSize.xs} className="text-ink" /> {b.rating.toFixed(1)} ({b.reviews})
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

/* ------------------------------------------------------------------ */
/* Availability calendar                                               */
/* ------------------------------------------------------------------ */

const dayStyle: Record<DayState, string> = {
  available: "text-foreground",
  limited: "text-foreground",
  unavailable: "text-muted-foreground line-through",
  closed: "text-muted-foreground",
};

type CalendarProps =
  | {
      /** One day, from a studio's real hours (src/lib/bookable-slots.ts). There is no fallback. */
      mode?: "single" | undefined;
      selected?: string | undefined;
      onSelect: (date: string) => void;
      timezone: string;
      dayOf: (date: string) => DayAvailability;
    }
  | {
      /** A run of days for a rental: the listing's blocked days can't be picked or crossed. */
      mode: "range";
      start: string | null;
      end: string | null;
      onSelect: (date: string) => void;
      /** The listing's unavailable days, `YYYY-MM-DD`. */
      blocked: string[];
      minDays: number;
      noticePeriod: string;
    };

/**
 * The one calendar: month by month, past days not offered, every day a 48px button with a label
 * and a pressed state. A studio picks a single day from its real hours (`single`); a rental picks
 * a range around the owner's blocked days (`range`). Dates are full `YYYY-MM-DD` days.
 */
export function AvailabilityCalendar(props: CalendarProps) {
  const range = props.mode === "range";
  // Studios book from tomorrow; rentals from today, on India's calendar.
  const earliest = range ? todayInIndia() : earliestBookingDate(new Date());
  const opening = range ? (props.start ?? earliest) : (props.selected ?? earliest);
  const [cursor, setCursor] = useState(() => {
    const d = new Date(`${opening}T00:00:00`);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const days = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor]);
  const blocked = useMemo(() => new Set(range ? props.blocked : []), [range, props]);
  const first = new Date(`${earliest}T00:00:00`);
  const atFirstMonth = cursor.y === first.getFullYear() && cursor.m === first.getMonth();
  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const step = (by: number) =>
    setCursor((c) => {
      const d = new Date(c.y, c.m + by, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  return (
    <div className="rounded-lg bg-subtle p-4">
      <div className="flex items-center justify-between">
        <IconBtn
          label="Previous month"
          disabled={atFirstMonth}
          onClick={() => step(-1)}
          className={atFirstMonth ? "invisible" : ""}
        >
          <ChevronLeft size={iconSize.sm} aria-hidden />
        </IconBtn>
        <p className="text-sm font-semibold">{monthLabel}</p>
        <IconBtn label="Next month" onClick={() => step(1)}>
          <ChevronRight size={iconSize.sm} aria-hidden />
        </IconBtn>
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
          if (range) {
            const isBlocked = blocked.has(iso);
            const edge = iso === props.start || iso === props.end;
            const inRange =
              props.start !== null && props.end !== null && iso >= props.start && iso <= props.end;
            return (
              <button
                key={iso}
                type="button"
                disabled={isBlocked}
                onClick={() => props.onSelect(iso)}
                aria-label={`${formatDate(iso)}${isBlocked ? ", unavailable" : ""}`}
                aria-pressed={edge || inRange}
                className={`flex h-12 items-center justify-center rounded-sm text-sm ${
                  edge
                    ? "bg-ink font-bold text-ink-foreground"
                    : inRange
                      ? "bg-background font-semibold text-foreground"
                      : isBlocked
                        ? "bg-transparent text-muted-foreground line-through"
                        : "bg-background text-foreground"
                } ${inMonth ? "" : "opacity-35"}`}
              >
                {d.getDate()}
              </button>
            );
          }
          const a = props.dayOf(iso);
          const disabled = a.state === "unavailable" || a.state === "closed";
          const isSel = props.selected === iso;
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => props.onSelect(iso)}
              aria-label={`${formatDate(iso)} — ${a.state}`}
              aria-pressed={isSel}
              className={`flex h-12 flex-col items-center justify-center rounded-sm text-sm ${
                isSel ? "bg-ink text-ink-foreground" : disabled ? "bg-transparent" : "bg-background"
              } ${inMonth ? "" : "opacity-35"} ${isSel ? "" : dayStyle[a.state]}`}
            >
              <span className={isSel ? "font-bold" : ""}>{d.getDate()}</span>
              <span
                className={`mt-0.5 h-1 w-1 rounded-full ${
                  isSel
                    ? "bg-ink-foreground"
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
        {range ? (
          <>
            <Legend dot="bg-ink" label="Selected" />
            <Legend dot="bg-border" label="Unavailable" />
            <span>
              Min {props.minDays} day{props.minDays > 1 ? "s" : ""}, notice {props.noticePeriod}
            </span>
          </>
        ) : (
          <>
            <Legend dot="bg-success" label="Available" />
            <Legend dot="bg-warn" label="Limited" />
            <Legend dot="bg-border" label="Unavailable" />
          </>
        )}
      </div>
      {range ? null : (
        <p className="mt-2 text-1 text-muted-foreground">All times shown in {props.timezone}.</p>
      )}
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
                  ? "border-transparent bg-ink text-ink-foreground"
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
              className={`min-h-control rounded-full border px-4 text-1 font-semibold ${
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
            // The listing itself, not the whole rental marketplace.
            <TextLink
              to="/marketplace/l/$id"
              params={{ id: a.rentalListingId }}
              className="mt-1 gap-1"
            >
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

/**
 * What something costs, line by line, from the provider's own rates: a studio session (base,
 * add-ons, tax) or a rental (days, delivery, and the refundable deposit held apart). Rentals are
 * an estimate the provider confirms; nothing is charged in the app either way.
 */
export function PriceBreakdownCard({ p, compact }: { p: PriceLines; compact?: boolean }) {
  return (
    <div className="rounded-lg bg-subtle p-4">
      <PriceRow label={p.baseLabel} value={inr(p.base)} />
      {p.addOns.map((a) => (
        <PriceRow key={a.name} label={a.name} value={inr(a.price)} muted />
      ))}
      <div className="my-2 h-px bg-border" />
      <PriceRow label="Subtotal" value={inr(p.subtotal)} />
      {p.taxPct ? <PriceRow label={`Taxes (${p.taxPct}%)`} value={inr(p.tax)} muted /> : null}
      <div className="my-2 h-px bg-border" />
      <PriceRow label={p.estimate ? "Estimated total" : "Total"} value={inr(p.total)} strong />
      {p.deposit ? (
        <div className="mt-3 flex items-start justify-between gap-3 rounded-lg bg-warn-container p-3">
          <div className="min-w-0">
            <p className="text-1 font-bold text-warn-strong">Refundable security deposit</p>
            <p className="text-1 text-muted-foreground">
              Held by the provider, returned after the equipment is checked.
            </p>
          </div>
          <span className="shrink-0 text-1 font-bold text-price">{inr(p.deposit)}</span>
        </div>
      ) : null}
      {compact ? null : p.estimate ? (
        <p className="mt-3 text-1 text-muted-foreground">
          Estimate only. Nothing is charged on MusicLinkd — the provider confirms the final amount
          in your conversation.
        </p>
      ) : (
        <p className="mt-3 text-1 text-muted-foreground">
          Prices come from the provider's configured rates. You settle payment with the provider
          directly.
        </p>
      )}
    </div>
  );
}

function PriceRow({
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
          <AlertTriangle size={iconSize.sm} className="text-ink" />
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
        className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--ink)]"
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
  date,
  start,
  end,
  people,
  service,
}: {
  b: Bookable;
  date: string;
  start: string;
  end: string;
  people: number;
  /** The service booked. */
  service?: string | undefined;
}) {
  return (
    <div className="rounded-lg bg-subtle p-4">
      <div className="flex gap-3">
        <img
          src={sized(b.hero, { width: 64 })}
          alt=""
          className="h-16 w-16 shrink-0 rounded-lg object-cover"
          loading="lazy"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{b.name}</p>
          <p className="truncate text-1 text-muted-foreground">{service ?? ""}</p>
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

/* ------------------------------------------------------------------ */
/* Studio booking record                                               */
/* ------------------------------------------------------------------ */

/** A stored booking's status as both sides read it. */
const STUDIO_BOOKING_STATUS: Record<DbBookingStatus, { label: string; tone: Tone }> = {
  requested: { label: "Requested", tone: "warn" },
  reviewing: { label: "Provider reviewing", tone: "warn" },
  confirmed: { label: "Confirmed", tone: "good" },
  declined: { label: "Declined", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  completed: { label: "Completed", tone: "neutral" },
};

/** A confirmed session whose day has passed is history: it reads as completed. */
// eslint-disable-next-line react-refresh/only-export-components -- shared with the list screens
export function shownBookingStatus(
  b: Pick<BookingRequest, "status" | "session_date">,
  today = isoDate(new Date()),
): DbBookingStatus {
  return b.status === "confirmed" && b.session_date !== null && b.session_date < today
    ? "completed"
    : b.status;
}

/**
 * One studio booking request, from the database (booking_requests), for either side. The studio
 * sees who asked (their name opens their profile), the place and service, when, and their notes, with
 * the screen's own actions below; the person who booked sees the studio and the studio's reply,
 * and the whole record opens their booking. No price: nothing is paid in the app.
 */
export function BookingRecord({
  b,
  side,
  actions,
}: {
  b: BookingRequest;
  side: "studio" | "requester";
  /** The studio side's controls for this record (Reviewing, Review). */
  actions?: ReactNode | undefined;
}) {
  const status = STUDIO_BOOKING_STATUS[shownBookingStatus(b)];
  const when = joinParts(
    b.session_date ? formatDate(b.session_date) : "No date",
    b.start_time ? formatTime(b.start_time.slice(0, 5)) : "",
    b.hours ? `${b.hours} hrs` : "",
    side === "studio" && b.people ? `${b.people} people` : "",
  );
  const studioName = askedName(b) ?? (side === "studio" ? "Your space" : "Studio");
  // What was booked: the service, or what was asked for on older bookings.
  const what = b.service?.name ?? b.purpose ?? "";
  const pill = <StatusPill label={status.label} tone={status.tone} className="shrink-0" />;

  if (side === "requester") {
    return (
      <Link
        to="/booking/confirmed/$ref"
        params={{ ref: b.id }}
        className="state-layer block rounded-lg bg-subtle p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-2 font-semibold">{studioName}</p>
            <p className="mt-0.5 truncate text-1 text-muted-foreground">
              {joinParts(what, b.studio?.location ?? "")}
            </p>
          </div>
          {pill}
        </div>
        <p className="mt-2 text-1 text-muted-foreground">{when}</p>
        {b.reply ? (
          <p className="mt-2 line-clamp-2 text-1 text-muted-foreground">{b.reply}</p>
        ) : null}
      </Link>
    );
  }

  const who = b.requester?.display_name ?? b.requester?.username ?? b.requester_name ?? "Someone";
  return (
    <article className="rounded-lg bg-subtle p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {b.requester?.username ? (
            <Link
              to="/profile/$username"
              params={{ username: b.requester.username }}
              className="block truncate text-2 font-semibold"
            >
              {who}
            </Link>
          ) : (
            <p className="truncate text-2 font-semibold">{who}</p>
          )}
          <p className="mt-0.5 truncate text-1 text-muted-foreground">
            {joinParts(studioName, what)}
          </p>
        </div>
        {pill}
      </div>
      <p className="mt-2 text-1 text-muted-foreground">{when}</p>
      {b.notes ? <p className="mt-2 text-1 leading-relaxed">{b.notes}</p> : null}
      {actions ? <div className="mt-3 flex gap-2">{actions}</div> : null}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

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
    <ActionBar>
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
    </ActionBar>
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
          className={`h-1.5 rounded-full transition-all ${i < step ? "w-6 bg-ink" : "w-1.5 bg-border"}`}
        />
      ))}
    </div>
  );
}

/**
 * Photos a studio added as proof of one amenity or equipment item, each at full width in a sheet.
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
            src={sized(src, { width: 412 })}
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
 * An amenity or equipment pill. With photos it becomes a button showing the first one as a small
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
      className={`state-layer hit-area flex items-center gap-1.5 py-1 pr-3 ${Icon ? "pl-3" : "pl-1"} ${className}`}
    >
      {Icon ? <Icon size={iconSize.sm} className="text-foreground" aria-hidden /> : null}
      {Icon ? null : (
        <img
          src={sized(photos[0], { width: 24 })}
          alt=""
          className="h-6 w-6 rounded-full object-cover"
          loading="lazy"
        />
      )}
      {label}
      {Icon ? (
        <img
          src={sized(photos[0], { width: 24 })}
          alt=""
          className="h-6 w-6 rounded-full object-cover"
          loading="lazy"
        />
      ) : null}
      <span className="tabular-nums text-foreground">{photos.length}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Request a session — a dated request, with no calendar to pick from  */
/* ------------------------------------------------------------------ */

export type SessionRequest = {
  /** Empty for async work (a remote-only service): no date step. */
  date: string;
  start: string;
  hours: number;
  people: number;
  notes: string;
};

/**
 * The date you want, and what for, when there is no calendar to pick a slot from: a business
 * without weekly hours, or a talent's service (owner, 3 Oct 2026: every service is bookable). The
 * one who is asked accepts or declines. `who` names them in the closing line.
 */
export function RequestSessionSheet({
  open,
  onClose,
  onSend,
  pending,
  who,
  error,
  dated = true,
}: {
  open: boolean;
  onClose: () => void;
  onSend: (request: SessionRequest) => void;
  pending: boolean;
  who: string;
  /**
   * False for a service that isn't booked for a time (remote-only, async): no date, start, hours
   * or people — just what it's for (owner, 4 Oct 2026, queue item 12).
   */
  dated?: boolean | undefined;
  /** Why the last send failed, shown in the sheet itself as well as the toast. */
  error?: string | null | undefined;
}) {
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [hours, setHours] = useState("3");
  const [people, setPeople] = useState("2");
  const [notes, setNotes] = useState("");
  // 5c (Android, opt-in): the person's own busy times that day, as a hint only.
  const [busyTimes, setBusyTimes] = useState<string[]>([]);
  useEffect(() => {
    if (!date) {
      setBusyTimes([]);
      return;
    }
    let live = true;
    void busyTimesOn(date).then((t) => {
      if (live) setBusyTimes(t);
    });
    return () => {
      live = false;
    };
  }, [date]);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={dated ? "Request a session" : "Request this service"}
    >
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if ((date || !dated) && !pending)
            onSend({
              date,
              start,
              hours: Number(hours),
              people: Number(people),
              notes: notes.trim(),
            });
        }}
      >
        {dated ? (
          <>
            <label className="block text-1 font-semibold" htmlFor="booking-date">
              Date
            </label>
            <input
              id="booking-date"
              type="date"
              min={earliestBookingDate()}
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="min-h-control w-full rounded-lg border border-input bg-card px-4 text-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {busyTimes.length ? (
              <p className="text-1 text-muted-foreground">
                Busy in your calendar: {busyTimes.join(", ")}
              </p>
            ) : null}
            <div className="flex gap-3">
              <span className="flex-1">
                <label className="block text-1 font-semibold" htmlFor="booking-start">
                  Start
                </label>
                <input
                  id="booking-start"
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="mt-1 min-h-control w-full rounded-lg border border-input bg-card px-4 text-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </span>
              <span className="w-24">
                <label className="block text-1 font-semibold" htmlFor="booking-hours">
                  Hours
                </label>
                <input
                  id="booking-hours"
                  type="number"
                  min={1}
                  max={24}
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="mt-1 min-h-control w-full rounded-lg border border-input bg-card px-4 text-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </span>
              <span className="w-24">
                <label className="block text-1 font-semibold" htmlFor="booking-people">
                  People
                </label>
                <input
                  id="booking-people"
                  type="number"
                  min={1}
                  max={200}
                  value={people}
                  onChange={(e) => setPeople(e.target.value)}
                  className="mt-1 min-h-control w-full rounded-lg border border-input bg-card px-4 text-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </span>
            </div>
          </>
        ) : null}
        <label className="block text-1 font-semibold" htmlFor="booking-notes">
          Anything they should know
        </label>
        <textarea
          id="booking-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What you are recording, gear you need, who is coming."
          className="w-full resize-none rounded-lg border border-input bg-card p-4 text-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {error ? (
          <p role="alert" className="text-1 text-destructive">
            {error}
          </p>
        ) : null}
        <Btn type="submit" className="w-full" disabled={dated && !date} loading={pending}>
          Send request
        </Btn>
        <p className="text-1 text-muted-foreground">
          Nothing is charged here. {who} replies, and you settle payment with them.
        </p>
      </form>
    </Sheet>
  );
}

/**
 * Book on a service with no booking flow of its own (a talent's, or a business without a place):
 * the request sheet, sent as a booking of that service. Open with a service; close with null.
 */
export function ServiceRequestSheet({
  service,
  who,
  onClose,
}: {
  service: { id: string; name: string; timeBased?: boolean | undefined } | null;
  who: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const send = useServerFn(requestBooking);
  const request = useMutation({
    mutationFn: (r: SessionRequest) =>
      send({
        data: {
          serviceId: service!.id,
          purpose: service!.name,
          ...(r.date ? { date: r.date } : {}),
          ...(r.date && r.start ? { startTime: r.start } : {}),
          ...(r.date && r.hours ? { hours: r.hours } : {}),
          ...(r.date && r.people ? { people: r.people } : {}),
          ...(r.notes ? { notes: r.notes } : {}),
        },
      }),
    onSuccess: ({ id }) => {
      onClose();
      void navigate({ to: "/booking/confirmed/$ref", params: { ref: id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't send. Try again."),
  });
  return (
    <RequestSessionSheet
      // A fresh form for each service.
      key={service?.id ?? "none"}
      open={Boolean(service)}
      onClose={onClose}
      onSend={(r) => request.mutate(r)}
      pending={request.isPending}
      who={who}
      dated={service?.timeBased !== false}
      error={request.error instanceof Error ? request.error.message : null}
    />
  );
}

/** Book on a service card: signed in, open the request sheet; signed out, sign in first. */
// eslint-disable-next-line react-refresh/only-export-components -- hook belongs with its sheet
export function useServiceRequest() {
  const { signedIn } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState<{
    id: string;
    name: string;
    timeBased?: boolean | undefined;
  } | null>(null);
  return {
    service,
    close: () => setService(null),
    book: (s: { id: string; name: string; timeBased?: boolean | undefined }) =>
      signedIn
        ? setService({ id: s.id, name: s.name, timeBased: s.timeBased })
        : void navigate({ to: "/welcome" }),
  };
}
