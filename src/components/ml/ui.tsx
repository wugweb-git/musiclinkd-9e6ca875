import { Link, createLink, useRouterState, type LinkProps } from "@tanstack/react-router";
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
  LoaderCircle,
  Compass,
  ShoppingBag,
  MessageCircle,
  User,
  ArrowLeft,
  Mic,
  Search,
  Grid2x2,
  ArrowLeftRight,
  Bell,
  Home,
  FolderKanban,
  BriefcaseBusiness,
  Handshake,
  UsersRound,
  Package,
  CalendarCheck,
  Building2,
  CalendarClock,
  Inbox,
  Star,
  BadgeCheck,
  Bookmark,
  QrCode,
  Settings,
  CircleHelp,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { iconSize } from "@/lib/tokens";
import { BetaBadge, Row, RowGroup, SoonBadge } from "./kit";
import { stageOf } from "@/lib/release";
import { useRequireBusiness } from "@/hooks/use-require-business";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useDismissable } from "@/hooks/use-dismissable";
import { TabIcon, type SolidIcon } from "./tab-icon";

/*
 * The app shell: centred, capped at the phone width, full viewport height. `100dvh` rather than
 * `100vh` so the browser's own chrome doesn't push the page end off screen on a phone.
 *
 * The bottom nav is a route-type rule: shown on the four tabs and on every section root the menu
 * offers, hidden on pushed screens (detail, form, settings sub-page, flow). Section roots are in
 * because arriving at one from the menu used to leave you with no nav at all — only a back arrow
 * to a screen you had not come from. It is drawn once in the root layout (AppNav), not per screen,
 * so it stays mounted between tabs and its icons can animate from one state to the next. Screen
 * only reserves room for it; `className` carries a screen's own bottom clearance.
 */
// eslint-disable-next-line react-refresh/only-export-components -- helper intentionally co-located with its component
export function isNavRoot(path: string) {
  const p = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return navRoots.has(p);
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
  bottomNav ??= isNavRoot(path);
  const clearance = className || (bottomNav ? "pb-nav-clear" : "pb-8");
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full min-w-[350px] max-w-app flex-col bg-background">
      <div className={`flex-1 ${clearance}`}>{children}</div>
    </div>
  );
}

/**
 * The bar of actions pinned to the bottom of a screen: Apply, Publish, Book, Send invites, Save.
 *
 * There were eleven of these, hand-written, in seven versions — three backgrounds, three border
 * treatments, four bottom paddings and two blur strengths, none of it decided. Five of them also
 * sat at `bottom-16`, reserving room for a bottom nav that does not render on a detail page, so the
 * button floated above a strip of bare background. One of them had no safe-area padding at all, so
 * on a notched phone the button sat under the home indicator.
 *
 * It sits below the nav (`z-bar` under `z-nav`) and is laid out `max-w-app` so it lines up with the
 * page rather than the window. Children are whatever the screen needs; the chrome is not the
 * screen's business.
 */
export function ActionBar({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-bar mx-auto w-full max-w-app border-t border-border bg-card/95 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

/** The one bottom nav, mounted in the root layout and shown on every nav root. */
export function AppNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return isNavRoot(path) ? <BottomNav /> : null;
}

// eslint-disable-next-line react-refresh/only-export-components -- constant intentionally co-located with its component
export const navItems: {
  to: string;
  label: string;
  icon: LucideIcon;
  solid: SolidIcon;
}[] = [
  { to: "/home", label: "Home", icon: Home, solid: "home" },
  { to: "/discover", label: "Discover", icon: Compass, solid: "compass" },
  { to: "/messages", label: "Connections", icon: MessageCircle, solid: "speech" },
  { to: "/marketplace", label: "Market", icon: ShoppingBag, solid: "bag" },
  { to: "/profile", label: "Profile", icon: User, solid: "person" },
];

/*
 * Every module not already reachable another way, grouped, for the menu. Restructured 28 Sep 2026
 * (owner). Cut: the four tab roots (Discover, Connections, Market, Profile) — a permanent icon in
 * the bar below already covers them; Studios — a business type, not its own category, kept alive
 * elsewhere only for legacy links; Search and Categories — both reachable from the search icon in
 * every header; Recommendations — already a card on Discover. Saved and Recently viewed, being the
 * same idea (things kept for later vs. things opened before), are one row now, not two.
 */
const menuGroups: {
  title: string;
  items: {
    to: NonNullable<LinkProps["to"]>;
    label: string;
    icon: LucideIcon;
    search?: LinkProps["search"];
  }[];
}[] = [
  {
    title: "Browse",
    items: [{ to: "/saved", label: "Saved & recently viewed", icon: Bookmark }],
  },
  {
    title: "My work",
    items: [
      { to: "/portfolio", label: "Portfolio", icon: FolderKanban },
      { to: "/services", label: "Services", icon: BriefcaseBusiness },
      { to: "/opportunities", label: "Opportunities", icon: Megaphone },
      { to: "/collab", label: "Collaborations", icon: Handshake },
      { to: "/bands", label: "Bands", icon: UsersRound },
      { to: "/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    title: "Rentals & bookings",
    items: [
      { to: "/marketplace", search: { view: "Rent" }, label: "Rentals", icon: Package },
      { to: "/bookings", label: "Bookings", icon: CalendarCheck },
    ],
  },
  {
    title: "Business",
    items: [
      { to: "/business/bookings", label: "Booking requests", icon: CalendarClock },
      { to: "/leads", label: "Leads", icon: Inbox },
    ],
  },
  {
    title: "You",
    items: [
      { to: "/notifications", label: "Notifications", icon: Bell },
      { to: "/identity/qr", label: "QR & Card", icon: QrCode },
      { to: "/verification", label: "Verification", icon: BadgeCheck },
      { to: "/accounts", label: "Switch account", icon: ArrowLeftRight },
    ],
  },
  {
    title: "App",
    items: [
      { to: "/settings", label: "Settings", icon: Settings },
      { to: "/help", label: "Help", icon: CircleHelp },
    ],
  },
];

/**
 * Every route that carries the bottom nav: the four tabs, plus every section root the menu offers.
 * Built from the two lists above so a new menu entry inherits the nav with no further wiring.
 */
const navRoots = new Set<string>([
  ...navItems.map((i) => i.to),
  ...menuGroups.flatMap((g) => g.items.map((i) => i.to)),
]);

/**
 * Four tabs and a menu. A tab shows only its icon until it is the one you are on; then its label
 * opens beside the icon. The menu holds every module, so nothing depends on finding a shortcut.
 */
export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  // Business is a business account's own area; a talent account doesn't see it (journey lock).
  const { allowed: isBusiness } = useRequireBusiness();
  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-nav mx-auto w-full max-w-app border-t border-border bg-card/95 backdrop-blur">
        <ul className="flex items-stretch justify-between gap-1 px-2 pb-[env(safe-area-inset-bottom)]">
          {navItems.map((item) => {
            const active = path === item.to || path.startsWith(`${item.to}/`);
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
                    <span className="flex text-foreground">
                      <TabIcon
                        outline={item.icon}
                        solid={item.solid}
                        active={active}
                        size={iconSize.md}
                      />
                    </span>
                    {active ? (
                      <span className="whitespace-nowrap text-sm font-semibold text-foreground">
                        {item.label}
                      </span>
                    ) : null}
                    {stageOf(item.to) === "soon" ? (
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
                <Grid2x2
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
        {menuGroups.map((group) => {
          // The business entries are for a business page's own account.
          const items = group.items.filter((i) => !i.to.startsWith("/business") || isBusiness);
          if (!items.length) return null;
          return (
            <RowGroup key={group.title} title={group.title}>
              {items.map((item) => {
                const Icon = item.icon;
                const stage = stageOf(item.to);
                return (
                  <li key={item.label}>
                    <Row
                      grouped
                      to={item.to}
                      {...(item.search ? { search: item.search } : {})}
                      title={item.label}
                      icon={<Icon size={iconSize.md} strokeWidth={1.75} aria-hidden />}
                      onClick={() => setMenuOpen(false)}
                      {...(stage === "soon"
                        ? { badge: <SoonBadge /> }
                        : stage === "beta"
                          ? { badge: <BetaBadge /> }
                          : {})}
                    />
                  </li>
                );
              })}
            </RowGroup>
          );
        })}
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
  // subtitle is intentionally never rendered (owner rule) — the prop stays so existing callers
  // don't need touching, but the top bar is title-only, no exceptions.
  void subtitle;
  return (
    <header className="pt-safe sticky top-0 z-bar flex items-center gap-3 bg-background/90 px-5 pb-4 backdrop-blur">
      {back ? (
        <Link
          to={back}
          className="hit-area flex h-10 w-10 shrink-0 items-center justify-center transition-transform duration-200 ease-standard active:scale-97"
          aria-label="Back"
        >
          <ArrowLeft size={iconSize.md} aria-hidden />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-3 leading-tight">{title}</h1>
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
  /**
   * A picker is full: a tap shakes the chip and vibrates instead of selecting. Border dims and the
   * label drops to `text-muted-foreground` — legible, not the old opacity-50 (3.64:1, failed the
   * a11y gate) — because it's aria-disabled, not disabled: still reachable and tappable on purpose.
   */
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
        atLimit ? "border-border/50" : ""
      } ${refused ? "animate-shake" : picked && active ? "animate-select" : ""} ${media ? "py-1 pl-1 pr-4" : "px-4"} ${
        active
          ? "border-transparent bg-selected-bg text-selected-text"
          : `border-border bg-card ${atLimit ? "text-muted-foreground" : "text-foreground"}`
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
    <BadgeCheck
      size={size}
      className="shrink-0 fill-pink-strong text-background"
      role="img"
      aria-label="Verified"
    >
      <title>Verified</title>
    </BadgeCheck>
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
 * Filled buttons go disabled the Material way: a faint ink container with faint ink text
 * (disabled:text-foreground/40 on disabled:bg-foreground/10 — close to Material 3's own 38%
 * content / 12% container spec). That treatment is correct only for a real `disabled` button:
 * WCAG 1.4.3 exempts inactive UI components from contrast requirements, and a native `disabled`
 * button leaves the tab order entirely, so nobody is meant to read it.
 *
 * `aria-disabled` and `data-pending` are not that — both stay genuinely tappable/focusable by
 * design (see `pending`'s doc comment below: "looks disabled but still takes the tap, so the form
 * can say what is missing"; `atLimit`'s aria-disabled chip "shakes and vibrates instead of
 * selecting"). A control a user can still reach and act on has to stay legible, so those two use
 * `text-muted-foreground` — the app's existing de-emphasized-but-readable text token (13.25:1 on
 * this container, comfortably past AA) — instead of the near-invisible `/40` used for true
 * `disabled` (found via Storybook's a11y gate — see docs/token-scale-spec-2026-09-16.md).
 */
const filledDisabled =
  "disabled:bg-foreground/10 disabled:text-foreground/40 aria-disabled:bg-foreground/10 aria-disabled:text-muted-foreground data-pending:bg-foreground/10 data-pending:text-muted-foreground";
const dimDisabled =
  "disabled:opacity-50 aria-disabled:text-muted-foreground data-pending:text-muted-foreground";

const btnVariants: Record<BtnVariant, string> = {
  primary: `bg-primary text-primary-foreground ${filledDisabled}`,
  ink: `bg-ink text-background ${filledDisabled}`,
  outline: `border border-border bg-card text-foreground ${dimDisabled}`,
  ghost: `bg-subtle text-muted-foreground ${dimDisabled}`,
  // bg-brand-button, not bg-brand: white text on --brand itself only reaches 3.56:1 (owner, 23 Sep).
  brand: `bg-brand-button text-white ${filledDisabled}`,
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
  const reducedMotion = usePrefersReducedMotion();
  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    if (reducedMotion) return;
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
  titleAction,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  /**
   * One control beside the title — "Clear all", a search toggle. Drawers used to hand-roll their
   * own title row to get this, which meant passing no `title` and leaving the dialog with no
   * accessible name.
   */
  titleAction?: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ start: number; dy: number } | null>(null);
  // Escape and Android's back button, through the one shared dismiss stack.
  useDismissable(open, onClose);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => opener?.focus?.();
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
        {title ? (
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="min-w-0 flex-1 truncate text-3">{title}</h2>
            {titleAction}
          </div>
        ) : null}
        {/* One rhythm for every drawer's body. space-y only separates siblings, so a drawer that
            already wraps its own content is unaffected. */}
        <div className="space-y-4">{children}</div>
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
