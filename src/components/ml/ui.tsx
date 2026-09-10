import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Home, Compass, Store, MessageCircle, User } from "lucide-react";

export function Screen({
  children,
  bottomNav = true,
}: {
  children: ReactNode;
  bottomNav?: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-app flex-col bg-background">
      <div className={bottomNav ? "flex-1 pb-nav-clear" : "flex-1 pb-8"}>{children}</div>
      {bottomNav ? <BottomNav /> : null}
    </div>
  );
}

const navItems = [
  { to: "/feed", label: "Home", icon: Home },
  { to: "/", label: "Discover", icon: Compass },
  { to: "/messages", label: "Connections", icon: MessageCircle },
  { to: "/marketplace", label: "Market", icon: Store },
  { to: "/me", label: "Profile", icon: User },
];

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-app border-t border-border bg-card/95 backdrop-blur">
      <ul className="flex items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const active = path === item.to;
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex-1">
              <Link to={item.to} className="flex h-16 flex-col items-center justify-center gap-1">
                <span
                  className={
                    active
                      ? "flex h-7 w-12 items-center justify-center rounded-full"
                      : "flex h-7 w-12 items-center justify-center"
                  }
                  style={active ? { background: "var(--pink-container)" } : undefined}
                >
                  <Icon
                    size={20}
                    className={active ? "text-primary" : "text-muted-foreground"}
                    strokeWidth={active ? 2.4 : 1.8}
                  />
                </span>
                <span
                  className={`text-1 font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function TopBar({
  title,
  subtitle,
  back,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-5 py-4 backdrop-blur">
      {back ? (
        <Link
          to={back}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-lg"
          aria-label="Back"
        >
          ←
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-3 leading-tight">{title}</h1>
        {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {right}
    </header>
  );
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search talent, studios, bands, labels...",
  onFocus,
}: {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  onFocus?: () => void;
}) {
  return (
    <div className="flex h-14 items-center gap-3 rounded-full border border-border bg-card px-5">
      <span className="text-muted-foreground">⌕</span>
      <input
        value={value}
        onFocus={onFocus}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder ?? "Search"}
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      <span className="h-6 w-px bg-border" />
      <span className="text-sm">🎙</span>
    </div>
  );
}

export function Chip({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
        active
          ? "border-transparent bg-selected-bg text-selected-text"
          : "border-border bg-card text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-primary text-1 font-bold text-primary-foreground"
      style={{ width: size, height: size }}
      title="Verified"
    >
      ✓
    </span>
  );
}

export function AvailabilityBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    Available: { bg: "var(--success-container)", fg: "var(--success)" },
    Selective: { bg: "var(--warn-container)", fg: "var(--warn)" },
    Booked: { bg: "var(--surface-subtle)", fg: "var(--text-secondary)" },
  };
  const c = map[status] ?? map["Booked"]!;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-1 font-bold uppercase tracking-wide"
      style={{ background: c.bg, color: c.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.fg }} />
      {status}
    </span>
  );
}

export function Btn({
  children,
  variant = "primary",
  className = "",
  onClick,
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  variant?: "primary" | "navy" | "ghost" | "outline";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const styles: Record<string, string> = {
    primary: "bg-primary text-primary-foreground",
    navy: "bg-navy text-background",
    outline: "border border-border bg-card text-foreground",
    ghost: "bg-subtle text-text2",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold transition-transform active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Sheet({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 mx-auto flex w-full max-w-app flex-col justify-end">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-navy/50 backdrop-blur-[2px]"
      />
      <div className="relative max-h-[88vh] overflow-y-auto rounded-t-lg border border-border bg-card px-5 pb-8 pt-3 no-scrollbar">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        {title ? <h2 className="mb-4 text-xl">{title}</h2> : null}
        {children}
      </div>
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3 px-5">
      <h2 className="min-w-0 truncate text-2">{title}</h2>
      {action ? (
        <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-primary">
          {action}
        </span>
      ) : null}
    </div>
  );
}
