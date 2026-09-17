import { Link, createLink, useRouterState } from "@tanstack/react-router";
import { haptic } from "@/lib/haptics";
import {
  useEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import {
  Check,
  LoaderCircle,
  Home,
  Compass,
  Store,
  MessageCircle,
  User,
  ArrowLeft,
  Mic,
  Search,
  Menu,
  Bell,
  FolderKanban,
  BriefcaseBusiness,
  Handshake,
  UsersRound,
  Package,
  CalendarCheck,
  Building2,
  Star,
  BadgeCheck,
  Sparkles,
  Bookmark,
  History,
  LayoutGrid,
  QrCode,
  Mic2,
  Settings,
  CircleHelp,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { iconSize } from "@/lib/tokens";
import { SoonBadge } from "./kit";

/*
 * The app shell: centred, capped at the phone width, full viewport height. `100dvh` rather than
 * `100vh` so the browser's own chrome doesn't push the page end off screen on a phone.
 *
 * The bottom nav is a route-type rule: shown on the five tab roots, hidden on every pushed screen
 * (detail, form, settings sub-page, flow). A sheet opened over a tab root leaves it as it was.
 * `bottomNav` overrides the rule; `className` carries a screen's own bottom clearance.
 */
export function isTabRoot(path: string) {
  const p = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return navItems.some((item) => item.to === p);
}

export function Screen({
  children,
  bottomNav,
  className = "",
}: {
  children: ReactNode;
  bottomNav?: boolean;
  className?: string;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  bottomNav ??= isTabRoot(path);
  const clearance = className || (bottomNav ? "pb-nav-clear" : "pb-8");
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full min-w-[350px] max-w-app flex-col bg-background">
      <div className={`flex-1 ${clearance}`}>{children}</div>
      {bottomNav ? <BottomNav /> : null}
    </div>
  );
}

export const navItems = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/messages", label: "Connections", icon: MessageCircle, soon: true },
  { to: "/marketplace", label: "Market", icon: Store },
  { to: "/profile", label: "Profile", icon: User },
];

/** Every module, grouped, for the menu. The five tabs are here too, so the menu is complete. */
const menuGroups: {
  title: string;
  items: { to: string; label: string; icon: LucideIcon; soon?: boolean }[];
}[] = [
  {
    title: "Main",
    items: [
      { to: "/home", label: "Home", icon: Home },
      { to: "/discover", label: "Discover", icon: Compass },
      { to: "/search", label: "Search", icon: Search, soon: true },
      { to: "/messages", label: "Connections", icon: MessageCircle, soon: true },
      { to: "/notifications", label: "Notifications", icon: Bell, soon: true },
      { to: "/profile", label: "Profile", icon: User },
    ],
  },
  {
    title: "Your work",
    items: [
      { to: "/portfolio", label: "Portfolio", icon: FolderKanban },
      { to: "/services", label: "Services", icon: BriefcaseBusiness },
      { to: "/opportunities", label: "Opportunities", icon: Megaphone },
      { to: "/collab", label: "Collaborations", icon: Handshake, soon: true },
      { to: "/bands", label: "Bands", icon: UsersRound, soon: true },
      { to: "/reviews", label: "Reviews", icon: Star, soon: true },
      { to: "/verification", label: "Verification", icon: BadgeCheck },
      { to: "/identity/qr", label: "QR & Card", icon: QrCode },
    ],
  },
  {
    title: "Market & bookings",
    items: [
      { to: "/marketplace", label: "Market", icon: Store },
      { to: "/marketplace/rent", label: "Rentals", icon: Package },
      { to: "/bookings", label: "Bookings", icon: CalendarCheck, soon: true },
      { to: "/studio", label: "Studios", icon: Mic2 },
      { to: "/business", label: "Business", icon: Building2 },
      { to: "/categories", label: "Categories", icon: LayoutGrid },
    ],
  },
  {
    title: "For you",
    items: [
      { to: "/saved", label: "Saved", icon: Bookmark },
      { to: "/recently-viewed", label: "Recently viewed", icon: History, soon: true },
    ],
  },
  {
    title: "Account",
    items: [
      { to: "/settings", label: "Settings", icon: Settings },
      { to: "/help", label: "Help", icon: CircleHelp, soon: true },
    ],
  },
];

/**
 * Five tabs and a menu. A tab shows only its icon until it is the one you are on; then its label
 * opens beside the icon. The menu holds every module, so nothing depends on finding a shortcut.
 */
export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-nav mx-auto w-full max-w-app border-t border-border bg-card/95 backdrop-blur">
        <ul className="flex items-stretch justify-between gap-1 px-2 pb-[env(safe-area-inset-bottom)]">
          {navItems.map((item) => {
            const active = path === item.to || path.startsWith(`${item.to}/`);
            const Icon = item.icon;
            return (
              <li key={item.to} className={active ? "flex-[2]" : "flex-1"}>
                <Link
                  to={item.to}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className="flex h-16 items-center justify-center"
                >
                  <span
                    className={`relative flex h-10 items-center justify-center gap-2 rounded-full transition-[background-color,padding] duration-200 ease-standard ${
                      active ? "bg-background px-4" : "w-10"
                    }`}
                  >
                    <Icon
                      size={iconSize.md}
                      className="shrink-0 text-foreground"
                      strokeWidth={active ? 2.4 : 1.8}
                      aria-hidden
                    />
                    {active ? (
                      <span className="whitespace-nowrap text-sm font-semibold text-foreground">
                        {item.label}
                      </span>
                    ) : null}
                    {item.soon ? (
                      <span
                        aria-hidden
                        className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full bg-muted-foreground"
                      />
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="flex h-16 w-full items-center justify-center"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full">
                <Menu
                  size={iconSize.md}
                  className="text-foreground"
                  strokeWidth={1.8}
                  aria-hidden
                />
              </span>
            </button>
          </li>
        </ul>
      </nav>
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
        <div className="space-y-5 pb-2">
          {menuGroups.map((group) => (
            <section key={group.title}>
              <h2 className="mb-1 text-1 font-semibold text-muted-foreground">{group.title}</h2>
              <ul className="divide-y divide-border">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => setMenuOpen(false)}
                        className="state-layer flex min-h-control items-center gap-3 py-2 text-sm font-semibold text-foreground"
                      >
                        <Icon size={iconSize.md} className="shrink-0" aria-hidden />
                        <span className="min-w-0 flex-1">{item.label}</span>
                        {item.soon ? <SoonBadge /> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </Sheet>
    </>
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
    <header className="sticky top-0 z-bar flex items-center gap-3 border-b border-border bg-background/90 px-5 py-4 backdrop-blur">
      {back ? (
        <Link
          to={back}
          className="hit-area flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card transition-transform duration-200 ease-standard active:scale-97"
          aria-label="Back"
        >
          <ArrowLeft size={iconSize.md} aria-hidden />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-3 leading-tight">{title}</h1>
        {subtitle ? <p className="truncate text-1 text-muted-foreground">{subtitle}</p> : null}
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
    <div className="flex h-14 items-center gap-3 rounded-full bg-subtle px-5">
      <Search size={iconSize.md} className="shrink-0 text-muted-foreground" aria-hidden />
      <input
        value={value}
        onFocus={onFocus}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder ?? "Search"}
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      <span className="h-6 w-px bg-border" />
      <Mic size={iconSize.md} className="shrink-0 text-muted-foreground" aria-hidden />
    </div>
  );
}

/*
 * Chip: the one pill chip. Filters, tabs, tags and every picker use it.
 *
 *   <Chip active={on} onClick={…}>Hindi</Chip>                       text
 *   <Chip media={<Mic size={iconSize.sm} />} active={on}>Singer</Chip>         icon in a circle
 *   <Chip media="https://…/rock.jpg">Rock</Chip>                       image in a circle
 *
 * States: selected (ink with white text, with a small spring when picked), pressed (state layer and a small scale),
 * focus ring, disabled at 50%.
 * `aria-pressed` is set whenever `active` is given, so toggles read as toggles. Touch area is 48dp.
 */
export function Chip({
  children,
  active,
  onClick,
  media,
  disabled = false,
  atLimit = false,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  /** A leading circle: an icon element, an image URL, or nothing. */
  media?: ReactNode;
  disabled?: boolean;
  /** A picker is full: looks disabled, and a tap shakes the chip and vibrates instead of selecting. */
  atLimit?: boolean;
}) {
  const [refused, setRefused] = useState(false);
  // Only a chip the person just picked springs; chips already selected when the screen opens do not.
  const [picked, setPicked] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        if (atLimit) {
          haptic("error");
          setRefused(true);
          return;
        }
        setPicked(true);
        onClick?.();
      }}
      onAnimationEnd={() => {
        setRefused(false);
        setPicked(false);
      }}
      disabled={disabled}
      aria-disabled={atLimit || undefined}
      aria-pressed={active === undefined ? undefined : active}
      className={`state-layer hit-area inline-flex min-h-control-sm shrink-0 items-center gap-2 rounded-full border text-sm font-medium transition-[transform,background-color,border-color,color,opacity] duration-200 ease-standard active:scale-97 disabled:pointer-events-none disabled:opacity-50 ${
        atLimit ? "opacity-50" : ""
      } ${refused ? "animate-shake" : picked && active ? "animate-select" : ""} ${media ? "py-1 pl-1 pr-4" : "px-4"} ${
        active
          ? "border-transparent bg-selected-bg text-selected-text"
          : "border-border bg-card text-foreground"
      }`}
    >
      {media ? (
        <span
          aria-hidden
          className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ${
            active ? "bg-background/15 text-selected-text" : "bg-subtle text-muted-foreground"
          }`}
        >
          {typeof media === "string" ? (
            <img src={media} alt="" className="h-full w-full object-cover" />
          ) : (
            media
          )}
        </span>
      ) : null}
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
 * Buttons. Three shapes, one set of states.
 *
 *   <Btn>Continue</Btn>                                          text
 *   <Btn icon={<Mail size={20} />}>Continue with email</Btn>      icon + text (icon leads)
 *   <IconBtn label="Back"><ArrowLeft size={iconSize.md} /></IconBtn>        icon only, 48dp, label is the name
 *   BtnLink and IconBtnLink are the same shapes as router links.
 *
 * States (Material 3): enabled; hovered (pointer devices only) and pressed, shown by a state layer of
 * the content colour at 8% / 12%; focused, the global :focus-visible ring; disabled, inert (filled:
 * a 10% ink container, outline and ghost: 50%);
 * loading, a spinner in place of the icon, aria-busy, and inert while it lasts.
 * Motion: a ripple from the touch point, a 2% press scale, and the state layer fading in. All of it
 * stops under prefers-reduced-motion. Styles: `state-layer`, `ripple` in styles.css.
 */

/** `brand` is for branded blocks only (a pink hero or promo), never an ordinary action. */
type BtnVariant = "primary" | "ink" | "ghost" | "outline" | "brand";

/*
 * Filled buttons go disabled the Material way: a faint ink container with faint ink text, so a
 * Continue that is not ready yet does not read as a grey button you can press. When it becomes
 * ready, the container fills to ink over --duration-2.
 */
const filledDisabled =
  "disabled:bg-foreground/10 disabled:text-foreground/40 aria-disabled:bg-foreground/10 aria-disabled:text-foreground/40 data-pending:bg-foreground/10 data-pending:text-foreground/40";
const dimDisabled = "disabled:opacity-50 aria-disabled:opacity-50 data-pending:opacity-50";

const btnVariants: Record<BtnVariant, string> = {
  primary: `bg-primary text-primary-foreground ${filledDisabled}`,
  ink: `bg-ink text-background ${filledDisabled}`,
  outline: `border border-border bg-card text-foreground ${dimDisabled}`,
  ghost: `bg-subtle text-muted-foreground ${dimDisabled}`,
  brand: `bg-brand text-white ${filledDisabled}`,
};

const btnBase =
  "state-layer press-brand relative inline-flex min-h-control select-none items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-[transform,background-color,color] duration-200 ease-standard active:scale-97 disabled:pointer-events-none aria-disabled:pointer-events-none";

function btnClass(variant: BtnVariant, className: string) {
  return `${btnBase} ${btnVariants[variant]} ${className}`;
}

type Ripple = { id: number; x: number; y: number; size: number };

/** Touch ripple: a circle of the content colour grows from where the finger landed. */
function useRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    const size = Math.hypot(r.width, r.height) * 2;
    const ripple = { id: e.timeStamp, x: e.clientX - r.left, y: e.clientY - r.top, size };
    setRipples((list) => [...list.slice(-2), ripple]);
    window.setTimeout(() => setRipples((list) => list.filter((x) => x.id !== ripple.id)), 550);
  };
  const layer = (
    <span aria-hidden className="ripple-clip pointer-events-none absolute inset-0">
      {ripples.map((r) => (
        <span
          key={r.id}
          className="ripple absolute rounded-full bg-current"
          // computed: where the touch landed and how far the circle must grow
          style={{ left: r.x - r.size / 2, top: r.y - r.size / 2, width: r.size, height: r.size }}
        />
      ))}
    </span>
  );
  return { onPointerDown, layer };
}

function BtnContent({
  icon,
  loading,
  children,
}: {
  icon?: ReactNode;
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <span className="relative inline-flex items-center justify-center gap-2">
      {loading ? (
        <LoaderCircle size={iconSize.md} className="shrink-0 animate-spin" aria-hidden />
      ) : icon ? (
        <span aria-hidden className="inline-flex shrink-0">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}

export function Btn({
  children,
  icon,
  variant = "primary",
  className = "",
  onClick,
  type = "button",
  disabled = false,
  pending = false,
  loading = false,
}: {
  children: ReactNode;
  /** Leading icon. Decorative: the text is the button's name. */
  icon?: ReactNode;
  variant?: BtnVariant;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  /** Not ready yet: looks disabled but still takes the tap, so the form can say what is missing. */
  pending?: boolean;
  /** Work in progress: shows a spinner, keeps the label and width, and ignores taps. */
  loading?: boolean;
}) {
  const ripple = useRipple();
  return (
    <button
      type={type}
      onClick={onClick}
      onPointerDown={ripple.onPointerDown}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-pending={pending || undefined}
      className={btnClass(variant, className)}
    >
      {ripple.layer}
      <BtnContent icon={icon} loading={loading}>
        {children}
      </BtnContent>
    </button>
  );
}

function BtnAnchor({
  variant = "primary",
  className = "",
  icon,
  children,
  onPointerDown,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: BtnVariant;
  icon?: ReactNode;
  ref?: Ref<HTMLAnchorElement>;
}) {
  const ripple = useRipple();
  return (
    <a
      {...props}
      onPointerDown={(e) => {
        ripple.onPointerDown(e);
        onPointerDown?.(e);
      }}
      className={btnClass(variant, className)}
    >
      {ripple.layer}
      <BtnContent icon={icon}>{children}</BtnContent>
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
  return `hit-area state-layer press-brand inline-flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full transition-transform duration-125 ease-standard active:scale-97 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 ${iconBtnVariants[variant]} ${className}`;
}

/** Icon-only button. 40px to look at, 48dp to touch; `label` is its accessible name. */
export function IconBtn({
  label,
  children,
  variant = "outline",
  className = "",
  onClick,
  disabled = false,
  loading = false,
}: {
  label: string;
  children: ReactNode;
  variant?: IconBtnVariant;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const ripple = useRipple();
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      onPointerDown={ripple.onPointerDown}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={iconBtnClass(variant, className)}
    >
      {ripple.layer}
      <span className="relative inline-flex">
        {loading ? (
          <LoaderCircle size={iconSize.md} className="animate-spin" aria-hidden />
        ) : (
          children
        )}
      </span>
    </button>
  );
}

function IconAnchor({
  label,
  variant = "outline",
  className = "",
  children,
  onPointerDown,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  label: string;
  variant?: IconBtnVariant;
  ref?: Ref<HTMLAnchorElement>;
}) {
  const ripple = useRipple();
  return (
    <a
      {...props}
      aria-label={label}
      title={label}
      onPointerDown={(e) => {
        ripple.onPointerDown(e);
        onPointerDown?.(e);
      }}
      className={iconBtnClass(variant, className)}
    >
      {ripple.layer}
      <span className="relative inline-flex">{children}</span>
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
  const panel = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ start: number; dy: number } | null>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  const dy = drag?.dy ?? 0;
  return (
    <div className="fixed inset-0 z-sheet mx-auto flex w-full max-w-app flex-col justify-end">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 animate-in fade-in bg-ink/50 backdrop-blur-[2px] duration-200"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={dy ? { transform: `translateY(${dy}px)` } : undefined}
        className={`relative max-h-[88vh] animate-in slide-in-from-bottom overflow-y-auto rounded-t-3xl border border-border bg-card px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-3 outline-none no-scrollbar duration-300 ease-enter ${drag ? "" : "transition-transform"}`}
      >
        <div
          aria-hidden
          className="-mx-5 -mt-3 mb-1 touch-none px-5 pb-3 pt-3"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setDrag({ start: e.clientY, dy: 0 });
          }}
          onPointerMove={(e) => {
            if (drag) setDrag({ ...drag, dy: Math.max(0, e.clientY - drag.start) });
          }}
          onPointerUp={() => {
            if (drag && drag.dy > 80) onClose();
            setDrag(null);
          }}
          onPointerCancel={() => setDrag(null)}
        >
          <div className="mx-auto h-1 w-10 rounded-full bg-border" />
        </div>
        {title ? <h2 className="mb-4 text-3">{title}</h2> : null}
        {children}
      </div>
    </div>
  );
}

/**
 * Section title with an optional action beside it. The action brings its own colour — use
 * `SectionActionLink` (brand pink) for the "See All" role; this header never forces one.
 */
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3 px-5">
      <h2 className="min-w-0 truncate text-2">{title}</h2>
      {action ? (
        <span className="hit-area shrink-0 whitespace-nowrap text-1 font-semibold">{action}</span>
      ) : null}
    </div>
  );
}
