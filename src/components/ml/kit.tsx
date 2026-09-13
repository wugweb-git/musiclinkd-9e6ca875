/**
 * Gestalt kit — reusable patterns shared by FLOW 15/16/17/18/20/22.
 * These are enhancements to the existing system (same tokens, radii, type scale),
 * not a second design language.
 */
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ChevronRight, Star } from "lucide-react";

export type Tone = "neutral" | "good" | "warn" | "bad" | "brand";

const toneStyle: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: "var(--surface-subtle)", fg: "var(--muted-foreground)" },
  good: { bg: "var(--success-container)", fg: "var(--success)" },
  warn: { bg: "var(--warn-container)", fg: "var(--warn)" },
  bad: { bg: "var(--danger-container)", fg: "var(--danger)" },
  brand: { bg: "var(--pink-container)", fg: "var(--pink-strong)" },
};

/** One status system across every flow. */
export function StatusPill({
  label,
  tone = "neutral",
  icon,
}: {
  label: string;
  tone?: Tone;
  icon?: ReactNode;
}) {
  const c = toneStyle[tone];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-1 font-bold uppercase tracking-wide"
      style={{ background: c.bg, color: c.fg }}
    >
      {icon ?? <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.fg }} />}
      {label}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-border bg-card p-4 ${className}`}>
      {children}
    </section>
  );
}

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
    <div className="rail no-scrollbar flex gap-2 overflow-x-auto" role="tablist">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="tab"
          aria-selected={value === o}
          onClick={() => onChange(o)}
          className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold ${
            value === o
              ? "border-transparent bg-selected-bg text-selected-text"
              : "border-border bg-card text-foreground"
          }`}
        >
          {o}
        </button>
      ))}
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
  to?: string;
  params?: Record<string, string>;
  onClick?: () => void;
}) {
  const inner = (
    <>
      {icon ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-subtle text-primary">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-semibold">{title}</span>
        {subtitle ? (
          <span className="block truncate text-1 text-muted-foreground">{subtitle}</span>
        ) : null}
      </span>
      {right ?? <ChevronRight size={16} className="shrink-0 text-muted-foreground" aria-hidden />}
    </>
  );
  const cls = "flex w-full items-center gap-3 rounded-md border border-border bg-card px-4 py-3";
  if (to) {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <Link to={to as any} {...(params ? { params: params as any } : {})} className={cls}>
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

export function EmptyState({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
      <h3 className="text-2 leading-tight">{title}</h3>
      <p className="mx-auto mt-2 max-w-[280px] text-1 text-muted-foreground">{body}</p>
      {children ? <div className="mt-5 flex flex-col gap-2">{children}</div> : null}
    </div>
  );
}

export function Loading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-busy>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-md bg-subtle" />
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
      className="fixed inset-0 z-50 mx-auto flex w-full max-w-app items-center justify-center px-6"
      role="dialog"
      aria-modal
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
      />
      <div className="relative w-full rounded-lg border border-border bg-card p-5">
        <h2 className="text-2 leading-tight">{title}</h2>
        {body ? <p className="mt-2 text-1 text-muted-foreground">{body}</p> : null}
        {children ? <div className="mt-4 flex flex-col gap-2">{children}</div> : null}
      </div>
    </div>
  );
}
