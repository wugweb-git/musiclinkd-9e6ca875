/**
 * Gestalt kit — reusable patterns shared by FLOW 15/16/17/18/20/22.
 * These are enhancements to the existing system (same tokens, radii, type scale),
 * not a second design language.
 */
import { Link, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ChevronRight, Star } from "lucide-react";
import { unitLabel, type PriceParts } from "@/lib/price";
import { iconSize } from "@/lib/tokens";

export type Tone = "neutral" | "good" | "warn" | "bad" | "brand";

const toneStyle: Record<Tone, { pill: string; dot: string }> = {
  neutral: { pill: "bg-subtle text-muted-foreground", dot: "bg-muted-foreground" },
  good: { pill: "bg-success-container text-success-strong", dot: "bg-success" },
  warn: { pill: "bg-warn-container text-warn-strong", dot: "bg-warn" },
  bad: { pill: "bg-danger-container text-destructive", dot: "bg-destructive" },
  brand: { pill: "bg-ink text-primary-foreground", dot: "bg-primary-foreground" },
};

/** One status system across every flow. */
export function StatusPill({
  label,
  tone = "neutral",
  icon,
  onMedia = false,
}: {
  label: string;
  tone?: Tone;
  icon?: ReactNode;
  /** Over a photo or video: the blurred light material, the tone kept in the dot. */
  onMedia?: boolean;
}) {
  const c = toneStyle[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full pill ${onMedia ? "pill-glass" : c.pill}`}
    >
      {icon ?? <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />}
      {label}
    </span>
  );
}

/**
 * A rate as two values: the amount in brand pink, and under it the unit line ("per hour") in small
 * muted type. Price text that is not a unit ("+ ₹5,000 deposit") is its own muted line. A price with
 * no unit shows only the amount. `amountClassName` keeps each place's size and weight; `align="end"`
 * right-aligns both lines in rows where the amount sits on the right.
 */
export function Price({
  price,
  align = "start",
  tone = "price",
  className = "",
  amountClassName = "",
  unitClassName = "text-1",
}: {
  price: PriceParts | null | undefined;
  align?: "start" | "center" | "end" | undefined;
  /** "inherit" leaves the amount in the surrounding colour where prices were never pink (plans). */
  tone?: "price" | "inherit" | undefined;
  className?: string | undefined;
  amountClassName?: string | undefined;
  /** Size of the unit and note lines; never larger than the amount. */
  unitClassName?: string | undefined;
}) {
  if (!price?.amount) return null;
  const unit = unitLabel(price.unit);
  const alignment =
    align === "end"
      ? "items-end text-right"
      : align === "center"
        ? "items-center text-center"
        : "items-start";
  return (
    <span className={`inline-flex min-w-0 flex-col ${alignment} ${className}`}>
      <span className={`${tone === "price" ? "text-price" : ""} ${amountClassName}`}>
        {price.amount}
      </span>
      {unit ? (
        <span className={`${unitClassName} font-normal leading-tight text-muted-foreground`}>
          {unit}
        </span>
      ) : null}
      {price.note ? (
        <span className={`${unitClassName} font-normal leading-tight text-muted-foreground`}>
          {price.note}
        </span>
      ) : null}
    </span>
  );
}

/**
 * A feature that is placed in a later phase: its entry stays visible but does nothing. Wrap the
 * entry's label with it, and render the entry as a plain element rather than a link.
 */
export function SoonBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full bg-pink-container px-2 py-0.5 text-1 font-semibold text-pink-strong ${className}`}
    >
      Soon
    </span>
  );
}

/** The maker's credit: Sign in and Settings, same place at the foot of each. */
export function MadeByWugweb() {
  return (
    <p className="px-1 pt-2 text-center text-1 text-muted-foreground">
      <a
        href="https://wugweb.com"
        target="_blank"
        rel="noopener noreferrer"
        className="link-action"
      >
        Made by Wugweb
      </a>
    </p>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg bg-subtle p-4 ${className}`}>{children}</section>;
}

/**
 * A choice between a handful of options, as one row of equal segments. Use it wherever the options
 * are alternatives to each other — privacy, visibility, who can message you. `Chip` stays for
 * multi-select and for filters that wrap.
 */
export function SegmentedField<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  /** Names the group for screen readers when there is no visible label beside it. */
  label?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label ?? ""}
      className="flex w-full items-stretch gap-1 rounded-full border border-border bg-subtle p-1"
    >
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={`min-w-0 flex-1 truncate rounded-full px-2 py-2 text-1 font-semibold transition-colors ${
            value === o ? "bg-brand/20 text-pink-on-tint" : "text-muted-foreground"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/**
 * Views of one list (For you / Recent / Nearby): underline tabs, the way the public profile does
 * it. Every screen that switches views uses this, so the pattern reads the same everywhere. Pills
 * stay for filters that narrow a list; `SegmentedField` stays for settings answers.
 */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="rail no-scrollbar -mx-5 flex overflow-x-auto border-b border-border px-5"
      role="tablist"
    >
      {options.map((o) => {
        const active = value === o;
        return (
          <button
            key={o}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o)}
            className={`state-layer relative shrink-0 px-3 py-3 text-sm font-semibold transition-colors duration-200 ease-standard first:pl-0 ${
              active ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {o}
            {active ? (
              <span className="absolute inset-x-3 bottom-0 h-0.5 animate-underline rounded-full bg-brand [button:first-child>&]:left-0" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function Row({
  icon,
  title,
  subtitle,
  right,
  to,
  params,
  onClick,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  to?: LinkProps["to"];
  params?: LinkProps["params"];
  onClick?: () => void;
}) {
  const inner = (
    <>
      {icon ? (
        <span className="flex h-10 w-7 shrink-0 items-center justify-center text-foreground">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-semibold">{title}</span>
        {subtitle ? (
          <span className="block truncate text-1 text-muted-foreground">{subtitle}</span>
        ) : null}
      </span>
      {right ?? <ChevronRight size={iconSize.sm} className="shrink-0 text-muted-foreground" aria-hidden />}
    </>
  );
  const cls = "flex w-full items-center gap-3 rounded-lg bg-subtle px-4 py-3";
  if (to) {
    return (
      <Link to={to} {...(params ? { params } : {})} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/**
 * `icon` is for states that carry a meaning the words alone don't — offline, failed to load.
 *
 * `variant` reproduces the icon treatment three other modules each hand-rolled before this was
 * consolidated (see docs/component-inventory-2026-09-16.md): "circle-sm" (default, this module's
 * original look), "bare" (icon.tsx-era booking screens — no circle, tighter padding, no title
 * heading tag, no body max-width), "circle-lg" (collab screens — bigger, tinted circle), and
 * "square-lg" (market screens — square swatch, sized for an emoji character rather than an icon).
 * Each variant is byte-for-byte the markup it replaces, so no screen's pixels changed when the
 * three duplicate EmptyStates were removed in favour of this one.
 */
export type EmptyStateVariant = "circle-sm" | "bare" | "circle-lg" | "square-lg";

export function EmptyState({
  icon,
  variant = "circle-sm",
  title,
  body,
  action,
  children,
}: {
  icon?: ReactNode;
  variant?: EmptyStateVariant;
  title: string;
  body: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  const extra = action ?? children;

  if (variant === "bare") {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
        {icon}
        <p className="mt-2 font-semibold">{title}</p>
        <p className="mt-1 text-1 text-muted-foreground">{body}</p>
        {extra ? <div className="mt-4">{extra}</div> : null}
      </div>
    );
  }

  if (variant === "circle-lg") {
    return (
      <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
        {icon ? (
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-subtle text-primary">
            {icon}
          </span>
        ) : null}
        <h3 className="text-2">{title}</h3>
        <p className="mt-1 mb-5 max-w-[260px] text-1 text-muted-foreground">{body}</p>
        {extra}
      </div>
    );
  }

  if (variant === "square-lg") {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
        {icon ? (
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-sm bg-subtle text-3">
            {icon}
          </div>
        ) : null}
        <h3 className="text-2">{title}</h3>
        <p className="mx-auto mt-1 max-w-[260px] text-1 text-muted-foreground">{body}</p>
        {extra ? <div className="mt-5">{extra}</div> : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-border bg-card px-6 py-8 text-center">
      {icon ? (
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-sm bg-subtle">
          {icon}
        </span>
      ) : null}
      <h3 className="text-2 leading-tight">{title}</h3>
      <p className="mx-auto mt-2 max-w-[280px] text-1 text-muted-foreground">{body}</p>
      {extra ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{extra}</div>
      ) : null}
    </div>
  );
}

export function Loading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-busy>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-lg bg-subtle" />
      ))}
    </div>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? "text-primary" : "text-border"}
          fill={i <= Math.round(value) ? "currentColor" : "none"}
          aria-hidden
        />
      ))}
    </span>
  );
}

export function Meter({
  label,
  value,
  max,
  hint,
}: {
  label: string;
  value: number;
  max: number;
  hint?: string;
}) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-1">
        <span className="font-semibold">{label}</span>
        <span className="text-muted-foreground">{hint ?? value}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-subtle">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Reason chip used by recommendations everywhere they appear. */
export function ReasonChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block max-w-full break-words rounded-full bg-subtle px-2.5 py-1 text-1 font-semibold leading-snug text-muted-foreground">
      {children}
    </span>
  );
}

export function Dialog({
  open,
  title,
  body,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  body?: string;
  onClose: () => void;
  children?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-sheet mx-auto flex w-full max-w-app items-center justify-center px-6"
      role="dialog"
      aria-modal
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
      />
      <div className="relative w-full rounded-3xl bg-subtle p-5">
        <h2 className="text-2 leading-tight">{title}</h2>
        {body ? <p className="mt-2 text-1 text-muted-foreground">{body}</p> : null}
        {children ? <div className="mt-4 flex flex-col gap-2">{children}</div> : null}
      </div>
    </div>
  );
}
