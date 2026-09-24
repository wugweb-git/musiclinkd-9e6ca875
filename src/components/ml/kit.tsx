/**
 * Gestalt kit — reusable patterns shared by FLOW 15/16/17/18/20/22.
 * These are enhancements to the existing system (same tokens, radii, type scale),
 * not a second design language.
 */
import { Link, type LinkProps } from "@tanstack/react-router";
import { useRef, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronRight, Star, WifiOff, type LucideIcon } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { unitLabel, unitName, type PriceParts } from "@/lib/price";
import { iconSize } from "@/lib/tokens";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

export type Tone = "neutral" | "good" | "warn" | "bad" | "brand" | "category";

const toneStyle: Record<Tone, { pill: string; dot: string }> = {
  neutral: { pill: "bg-subtle text-muted-foreground", dot: "bg-muted-foreground" },
  good: { pill: "bg-success-container text-success-strong", dot: "bg-success" },
  warn: { pill: "bg-warn-container text-warn-strong", dot: "bg-warn" },
  bad: { pill: "bg-danger-container text-destructive", dot: "bg-destructive" },
  brand: { pill: "bg-ink text-primary-foreground", dot: "bg-primary-foreground" },
  // The purple "Offer sent"/category tag (rental.tsx, profile.tsx) — one more tone rather than a
  // fourth hand-typed color map.
  category: { pill: "bg-status-category-bg text-status-category-text", dot: "bg-purple" },
};

/** One status system across every flow. */
export function StatusPill({
  label,
  tone = "neutral",
  icon,
  onMedia = false,
  className = "",
  title,
}: {
  label: string;
  tone?: Tone;
  icon?: ReactNode;
  /** Over a photo or video: the blurred light material, the tone kept in the dot. */
  onMedia?: boolean;
  className?: string;
  title?: string;
}) {
  const c = toneStyle[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full pill ${onMedia ? "pill-glass" : c.pill} ${className}`}
      title={title}
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
  inline = true,
  from = false,
}: {
  price: PriceParts | null | undefined;
  align?: "start" | "center" | "end" | undefined;
  /** "inherit" leaves the amount in the surrounding colour where prices were never pink (plans). */
  tone?: "price" | "inherit" | undefined;
  className?: string | undefined;
  amountClassName?: string | undefined;
  /** Size of the unit and note lines; never larger than the amount. */
  unitClassName?: string | undefined;
  /** The unit on the amount's line as "/day" — the rule for every rate (owner, 22 Sep 2026). */
  inline?: boolean | undefined;
  /** A starting price: a small grey "From" before the amount (services). */
  from?: boolean | undefined;
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
        {from ? (
          <span className="mr-1 align-baseline text-1 font-normal text-muted-foreground">From</span>
        ) : null}
        {price.amount}
        {inline && price.unit ? (
          <span className={`${unitClassName} font-normal text-muted-foreground`}>
            /{unitName(price.unit)}
          </span>
        ) : null}
      </span>
      {unit && !inline ? (
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
 * A label as a square tag, never a pill (owner, 22 Sep 2026): review tags, conflict kinds, any
 * short fact that sits beside a title.
 */
export function Tag({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md bg-subtle px-2 py-1 text-1 font-medium text-foreground ${className}`}
    >
      {children}
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
      className={`inline-flex shrink-0 items-center rounded-full bg-pink-container bg-[linear-gradient(110deg,transparent_35%,color-mix(in_oklab,white_65%,transparent)_50%,transparent_65%)] bg-[length:200%_100%] bg-no-repeat px-2 py-0.5 text-1 font-semibold text-pink-strong motion-safe:animate-soon ${className}`}
    >
      Soon
    </span>
  );
}

/**
 * A module that's open but new: the warn (amber) tones, with the same light sweep as Soon, so the
 * two labels read as one family — amber you can use, pink you can't yet.
 */
export function BetaBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full bg-warn-container bg-[linear-gradient(110deg,transparent_35%,color-mix(in_oklab,white_65%,transparent)_50%,transparent_65%)] bg-[length:200%_100%] bg-no-repeat px-2 py-0.5 text-1 font-semibold text-warn-strong motion-safe:animate-soon ${className}`}
    >
      Beta
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
  icons,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  /** Names the group for screen readers when there is no visible label beside it. */
  label?: string;
  /** An icon before an option's label. */
  icons?: Partial<Record<T, LucideIcon>>;
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
          className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 truncate rounded-full px-2 py-2 text-1 font-semibold transition-colors ${
            value === o ? "bg-brand/20 text-pink-on-tint" : "text-muted-foreground"
          }`}
        >
          {icons?.[o]
            ? (() => {
                const Icon: LucideIcon = icons[o]!;
                return <Icon size={iconSize.sm} strokeWidth={2} aria-hidden />;
              })()
            : null}
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
/**
 * A tab's icon, only rendered when `icons` gives one for it. Animates in/out on selection change
 * (SPEC-issue17's "icon animates on state change" rule) with GSAP, skipped under
 * `prefers-reduced-motion` — the swap is instant then, same as every other reduced-motion path in
 * this app.
 */
function SegmentedIcon({ Icon, active }: { Icon: LucideIcon; active: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  useGSAP(
    () => {
      if (!ref.current || reducedMotion) return;
      gsap.fromTo(
        ref.current,
        { scale: 0.7, opacity: 0.4 },
        { scale: 1, opacity: 1, duration: 0.2, ease: "back.out(2)" },
      );
    },
    { dependencies: [active, reducedMotion], scope: ref },
  );
  return <Icon ref={ref} size={iconSize.xs} aria-hidden className={active ? "text-brand" : ""} />;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  icons,
  className = "-mx-5 border-b border-border px-5",
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  /** Per-option icon, animated in on selection (SPEC-issue17). Options without an entry render no icon. */
  icons?: Partial<Record<T, LucideIcon>>;
  /** Edge to edge with its underline by default; pass "" inside a row that draws its own line. */
  className?: string;
}) {
  return (
    <div className={`rail no-scrollbar flex overflow-x-auto ${className}`} role="tablist">
      {options.map((o) => {
        const active = value === o;
        const Icon = icons?.[o];
        return (
          <button
            key={o}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o)}
            className={`state-layer relative flex shrink-0 items-center gap-1.5 px-3 py-3 text-sm font-semibold transition-colors duration-200 ease-standard first:pl-0 ${
              active ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {Icon ? <SegmentedIcon Icon={Icon} active={active} /> : null}
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
  badge,
  right,
  to,
  params,
  hash,
  onClick,
  grouped = false,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  /** A Soon or Beta badge between the label and the chevron; keeps the chevron. */
  badge?: ReactNode;
  right?: ReactNode;
  to?: LinkProps["to"];
  params?: LinkProps["params"];
  /** A section on the target screen, without the "#". */
  hash?: string;
  onClick?: () => void;
  /** Inside a RowGroup, which draws the card and the dividers, so the row draws neither. */
  grouped?: boolean;
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
      {badge}
      {right ?? (
        <ChevronRight size={iconSize.sm} className="shrink-0 text-muted-foreground" aria-hidden />
      )}
    </>
  );
  const cls = grouped
    ? "state-layer flex w-full items-center gap-3 px-4 py-3"
    : "flex w-full items-center gap-3 rounded-lg bg-subtle px-4 py-3";
  if (to) {
    return (
      <Link
        to={to}
        {...(params ? { params } : {})}
        {...(hash ? { hash } : {})}
        {...(onClick ? { onClick } : {})}
        className={cls}
      >
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
 * An on/off switch. One implementation: notification settings and the filter sheet each drew their
 * own, which is how two switches in the same app ended up different sizes.
 */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** What it switches, for anyone who cannot see the row it sits on. */
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${checked ? "bg-primary" : "bg-background"}`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-background transition-transform ${checked ? "translate-x-5" : ""}`}
      />
    </button>
  );
}

/**
 * A titled card of Rows — one heading, then the rows in a single rounded surface with hairlines
 * between them. This is the shape the Settings page reads in (owner, 24 Sep 2026: "I like the
 * settings page UI"), shared so Settings and the menu are one thing rather than two styled copies.
 * Rows inside it take `grouped`.
 */
export function RowGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-1 font-semibold text-muted-foreground">{title}</h2>
      <ul className="divide-y divide-border overflow-hidden rounded-lg bg-subtle">{children}</ul>
    </section>
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
        <p className="mt-1 mb-5 max-w-rail-lg text-1 text-muted-foreground">{body}</p>
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
        <p className="mx-auto mt-1 max-w-rail-lg text-1 text-muted-foreground">{body}</p>
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
      <p className="mx-auto mt-2 max-w-prose-sm text-1 text-muted-foreground">{body}</p>
      {extra ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{extra}</div>
      ) : null}
    </div>
  );
}

export function OfflineBanner({
  variant = "neutral",
  title = "You're offline",
  body,
  onRetry,
}: {
  variant?: "neutral" | "warn";
  title?: string;
  body: ReactNode;
  onRetry?: (() => void) | undefined;
}) {
  if (variant === "warn") {
    return (
      <div className="mb-3 flex items-center gap-3 rounded-lg bg-warn-container px-4 py-3 text-warn-strong">
        <WifiOff size={iconSize.sm} className="shrink-0" />
        <p className="flex-1 text-1 font-semibold">{body}</p>
        {onRetry ? (
          <button type="button" onClick={onRetry} className="pill bg-background text-foreground">
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div role="status" className="mb-4 flex items-start gap-3 rounded-lg bg-subtle p-4">
      <WifiOff size={iconSize.sm} className="mt-0.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-1 text-muted-foreground">{body}</p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-touch shrink-0 text-1 font-bold text-foreground"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function StateCard({
  variant = "card",
  title,
  body,
  tone = "neutral",
  action,
  children,
}: {
  variant?: "card" | "subtle";
  title: string;
  body: string;
  tone?: "neutral" | "error";
  action?: ReactNode;
  children?: ReactNode;
}) {
  const extra = action ?? children;

  if (variant === "subtle") {
    return (
      <section className="rounded-lg bg-subtle p-6 text-center">
        <h2 className="text-2 leading-tight">{title}</h2>
        <p className="mx-auto mt-2 max-w-prose-sm text-sm text-muted-foreground">{body}</p>
        {extra ? <div className="mt-5 flex flex-col gap-2">{extra}</div> : null}
      </section>
    );
  }

  return (
    <div
      className={`rounded-lg border bg-card p-6 text-center ${tone === "error" ? "border-destructive" : "border-border"}`}
      role={tone === "error" ? "alert" : undefined}
    >
      <h3 className="text-2">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-prose-sm text-sm text-muted-foreground">{body}</p>
      {extra ? <div className="mt-4 flex justify-center">{extra}</div> : null}
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

/**
 * Gates a business-only screen (business.bookings.*, availability/pricing/policies): renders
 * children only once useRequireBusiness() confirms the signed-in account has a profile_business
 * row. See contextual-profile-rule memory for why this exists — nothing enforced it before.
 */
export function BusinessOnlyGate({
  allowed,
  loading,
  signedIn,
  children,
}: {
  allowed: boolean;
  loading: boolean;
  signedIn: boolean;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <div className="px-5 pt-6">
        <Loading rows={3} />
      </div>
    );
  }
  if (!allowed) {
    return (
      <EmptyState
        title={signedIn ? "This is for business accounts" : "Sign in with a business account"}
        body={
          signedIn
            ? "Bookings, pricing and availability are managed from a business account, not a talent one."
            : "This page belongs to your business account's own dashboard."
        }
      >
        <Link
          to="/welcome"
          className="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          {signedIn ? "Switch account" : "Sign in"}
        </Link>
      </EmptyState>
    );
  }
  return <>{children}</>;
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} out of 5`}>
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

/**
 * Centered modal, built on Radix's `Dialog` primitive (`@/components/ui/dialog.tsx`'s
 * `DialogPrimitive`, not that file's own preset styling — this keeps the existing visual output
 * exactly, the primitive is only here for focus-trap, escape-to-close and scroll-lock, which the
 * hand-rolled version this replaced never had (unlike `Sheet` in `ml/ui.tsx`, which did).
 */
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
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-sheet bg-ink/50 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={onClose}
        />
        <div className="pointer-events-none fixed inset-0 z-sheet mx-auto flex w-full max-w-app items-center justify-center px-6">
          <DialogPrimitive.Content
            onEscapeKeyDown={onClose}
            className="pointer-events-auto relative w-full rounded-3xl bg-subtle p-5 outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          >
            <DialogPrimitive.Title className="text-2 leading-tight">{title}</DialogPrimitive.Title>
            {body ? (
              <DialogPrimitive.Description className="mt-2 text-1 text-muted-foreground">
                {body}
              </DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
            )}
            {children ? <div className="mt-4 flex flex-col gap-2">{children}</div> : null}
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
