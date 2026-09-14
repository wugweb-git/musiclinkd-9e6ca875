import { Link, createLink, useRouterState } from "@tanstack/react-router";
import type { AnchorHTMLAttributes, ReactNode, Ref } from "react";
import {
  Check,
  Home,
  Compass,
  Store,
  MessageCircle,
  User,
  ArrowLeft,
  Mic,
  Search,
} from "lucide-react";

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
  { to: "/discover", label: "Discover", icon: Compass },
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
                      ? "flex h-7 w-12 items-center justify-center rounded-full bg-background"
                      : "flex h-7 w-12 items-center justify-center"
                  }
                >
                  <Icon
                    size={20}
                    className={active ? "text-primary" : "text-muted-foreground"}
                    strokeWidth={active ? 2.4 : 1.8}
                  />
                </span>
                <span
                  className={`text-1 font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}
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
          className="hit-area flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card transition-transform duration-200 ease-standard active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft size={18} aria-hidden />
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
      <Search size={18} className="shrink-0 text-muted-foreground" aria-hidden />
      <input
        value={value}
        onFocus={onFocus}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder ?? "Search"}
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      <span className="h-6 w-px bg-border" />
      <Mic size={18} className="shrink-0 text-muted-foreground" aria-hidden />
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
      <Check size={Math.round(size * 0.65)} strokeWidth={3} aria-hidden />
    </span>
  );
}

/*
 * Three button shapes, one vocabulary:
 *   <Btn>Continue</Btn>                                  text
 *   <Btn icon={<Mail size={18} />}>Continue with email</Btn>   icon + text (icon leads)
 *   <IconBtn label="Back"><ArrowLeft size={18} /></IconBtn>     icon only, 48dp, label is the name
 * BtnLink and IconBtnLink are the same shapes as router links.
 */
export function Btn({
  children,
  icon,
  variant = "primary",
  className = "",
  onClick,
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  /** Leading icon. Decorative: the text is the button's name. */
  icon?: ReactNode;
  variant?: BtnVariant;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={btnClass(variant, className)}
    >
      {icon ? (
        <span aria-hidden className="inline-flex shrink-0">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
}

type BtnVariant = "primary" | "ink" | "ghost" | "outline";

const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-primary text-primary-foreground",
  ink: "bg-ink text-background",
  outline: "border border-border bg-card text-foreground",
  ghost: "bg-subtle text-muted-foreground",
};

function btnClass(variant: BtnVariant, className: string) {
  return `inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-transform active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 ${btnVariants[variant]} ${className}`;
}

function BtnAnchor({
  variant = "primary",
  className = "",
  icon,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: BtnVariant;
  icon?: ReactNode;
  ref?: Ref<HTMLAnchorElement>;
}) {
  return (
    <a {...props} className={btnClass(variant, className)}>
      {icon ? (
        <span aria-hidden className="inline-flex shrink-0">
          {icon}
        </span>
      ) : null}
      {children}
    </a>
  );
}

/** A router link that looks like `Btn`. One element, one tab stop — never wrap `Btn` in `Link`. */
export const BtnLink = createLink(BtnAnchor);

type IconBtnVariant = "outline" | "ink" | "ghost" | "plain";
const iconBtnVariants: Record<IconBtnVariant, string> = {
  outline: "border border-border bg-card text-foreground",
  ink: "bg-ink text-primary-foreground",
  ghost: "bg-subtle text-foreground",
  plain: "text-foreground",
};
function iconBtnClass(variant: IconBtnVariant, className: string) {
  return `hit-area inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-200 ease-standard active:scale-95 disabled:pointer-events-none disabled:opacity-60 ${iconBtnVariants[variant]} ${className}`;
}

/** Icon-only button. 40px to look at, 48dp to touch; `label` is its accessible name. */
export function IconBtn({
  label,
  children,
  variant = "outline",
  className = "",
  onClick,
  disabled = false,
}: {
  label: string;
  children: ReactNode;
  variant?: IconBtnVariant;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={iconBtnClass(variant, className)}
    >
      {children}
    </button>
  );
}

function IconAnchor({
  label,
  variant = "outline",
  className = "",
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  label: string;
  variant?: IconBtnVariant;
  ref?: Ref<HTMLAnchorElement>;
}) {
  return (
    <a {...props} aria-label={label} title={label} className={iconBtnClass(variant, className)}>
      {children}
    </a>
  );
}

/** Icon-only router link. */
export const IconBtnLink = createLink(IconAnchor);

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
        className="absolute inset-0 animate-in fade-in bg-ink/50 backdrop-blur-[2px] duration-200"
      />
      <div className="relative max-h-[88vh] animate-in slide-in-from-bottom overflow-y-auto rounded-t-2xl border border-border bg-card px-5 pb-8 pt-3 no-scrollbar duration-300 ease-enter">
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
        <span className="hit-area shrink-0 whitespace-nowrap text-1 font-semibold text-foreground">
          {action}
        </span>
      ) : null}
    </div>
  );
}
