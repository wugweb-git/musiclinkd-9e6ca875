import { Link } from "@tanstack/react-router";
import { Children, useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Switch } from "@/components/ui/switch";
import { saveMyProfile } from "@/lib/portfolio.functions";
import {
  CalendarDays,
  Camera,
  ChevronDown,
  CircleCheck,
  CircleSlash,
  Loader2,
  Pencil,
  BadgeCheck,
  MoreHorizontal,
  Pause,
  Play,
  Share2,
  ShieldCheck,
  Star,
  User,
  ArrowLeft,
  ChevronRight,
  MapPin,
  type LucideIcon,
  AudioLines,
  CalendarClock,
  Globe,
  Hourglass,
  Instagram,
  Youtube,
  MessageSquareQuote,
  Clock,
  Check,
  ThumbsUp,
} from "lucide-react";
import type {
  AudioTrack,
  Collaborator,
  ExperienceItem,
  MarketEntry,
  OpportunityItem,
  PersonProfile,
  ProjectItem,
  ReviewItem,
  ServiceItem,
  VideoItem,
} from "@/data/profile";
import type { WorkKind } from "@/data/portfolio";
import { Btn, BtnLink, IconBtn, IconBtnLink, Sheet } from "./ui";
import { Price, Stars, StatusPill, Tag } from "./kit";
import { PersonAvatar } from "./person-avatar";
import type { PriceParts } from "@/lib/price";
import { cn, joinParts } from "@/lib/utils";
import { LogoMark } from "./logo";
import { roleIcon } from "@/lib/role-icons";
import { labelFor, useTaxonomy } from "@/lib/taxonomy";
import { PROFILE_IMAGE_ACCEPT, type ProfileImageKind } from "@/lib/profile-images";
import { MediaEmbed } from "./media-embed";
import { recordPlay } from "@/lib/plays";
import { recordWorkEvent } from "@/lib/work-events";
import { SavedToggle } from "./saved-toggle";
import { haptic } from "@/lib/haptics";

/** Works stored in the database can be saved; demo works (non-uuid ids) can't. */
const isDbId = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
import { iconSize } from "@/lib/tokens";

/* ── Section shell ─────────────────────────────────────────── */

export function ProfileSection({
  title,
  action,
  onAction,
  aside,
  children,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  /** Controls that belong on the heading row, such as a layout switch. */
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-2">{title}</h2>
        {aside}
        {action ? (
          <button
            type="button"
            onClick={onAction}
            className="link-action hit-area rounded-full text-sm font-semibold text-pink-strong"
          >
            {action}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** Where a stacked section's footer link can go. */
export type StackDestination =
  "/portfolio" | "/services" | "/reviews" | "/profile/edit" | "/verification" | "/collab";

/**
 * The owner's own "Taking work" switch: flips availability straight from wherever it's shown
 * (Home's hero, the profile's own Location & availability card), no trip to Edit profile needed.
 */
export function AvailabilityToggle({
  available,
  tone = "subtle",
}: {
  available: boolean;
  /** "subtle" sits on a light card (the profile); "dark" sits on Home's hero. */
  tone?: "subtle" | "dark";
}) {
  const save = useServerFn(saveMyProfile);
  const [on, setOn] = useState(available);
  const [saving, setSaving] = useState(false);

  const toggle = async (next: boolean) => {
    setOn(next);
    setSaving(true);
    try {
      // "Collaborations" is one of the stored values profile-view maps to a status people see.
      await save({ data: { availability: next ? "Collaborations" : null } });
    } catch {
      setOn(!next);
      toast.error("Could not update. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const dark = tone === "dark";
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-3",
        dark ? "bg-background/10" : "bg-subtle",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm font-semibold", dark ? undefined : "text-foreground")}>
          Taking work
        </span>
        <span className={cn("block text-1", dark ? "text-background/70" : "text-muted-foreground")}>
          {on ? "People can see you are open" : "Hidden from people looking to hire"}
        </span>
      </span>
      <Switch
        checked={on}
        disabled={saving}
        onCheckedChange={(next) => void toggle(next)}
        aria-label="Taking work"
      />
    </div>
  );
}

/**
 * A stacked profile section: full-bleed block, thick divider under it, the title with the owner's
 * edit pencil on the same row, and an optional collapse for the sections people skip past.
 */
export function StackSection({
  title,
  editTo,
  editSection,
  collapsible = false,
  defaultOpen = true,
  showAll,
  onShowAll,
  showAllTo,
  action,
  children,
}: {
  title: string;
  /**
   * Owner only: where editing this section happens — the one action a section has. Visitors pass
   * nothing.
   */
  editTo?: StackDestination | undefined;
  /** With editTo "/profile/edit": the Edit profile section to open. */
  editSection?: string | undefined;
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** Footer link label, e.g. "Show all tracks". */
  showAll?: string | undefined;
  onShowAll?: (() => void) | undefined;
  /** Where the footer link goes, when it is navigation rather than a tab switch. */
  showAllTo?: StackDestination | undefined;
  /** An extra control on the heading row, left of the edit pencil. */
  action?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = `${title.replace(/\s+/g, "-").toLowerCase()}-body`;
  return (
    <section className="mt-4 rounded-lg bg-card px-4 py-5">
      <div className="flex items-center gap-1">
        <h2 className="min-w-0 flex-1 text-3 font-bold">{title}</h2>
        {action}
        {editTo ? (
          <IconBtnLink
            to={editTo}
            {...(editTo === "/profile/edit" && editSection
              ? { search: { section: editSection } }
              : {})}
            label={`Edit ${title}`}
            variant="ghost"
            className="h-10 w-10"
          >
            <Pencil size={iconSize.sm} aria-hidden />
          </IconBtnLink>
        ) : null}
        {collapsible ? (
          <IconBtn
            label={open ? `Collapse ${title}` : `Expand ${title}`}
            variant="ghost"
            className="h-10 w-10"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={bodyId}
          >
            <ChevronDown
              size={iconSize.md}
              aria-hidden
              className={cn(
                "transition-transform duration-200 ease-standard motion-reduce:transition-none",
                open ? "rotate-180" : "",
              )}
            />
          </IconBtn>
        ) : null}
      </div>
      <div id={bodyId} hidden={!open} className="mt-3">
        {children}
      </div>
      {open && showAll ? (
        showAllTo ? (
          <Link
            to={showAllTo}
            className="link-action mt-4 flex w-full items-center justify-center gap-1 border-t border-border pt-3 text-sm font-semibold text-pink-strong"
          >
            {showAll}
            <ChevronRight size={iconSize.sm} aria-hidden />
          </Link>
        ) : (
          <button
            type="button"
            onClick={onShowAll}
            className="link-action mt-4 flex w-full items-center justify-center gap-1 border-t border-border pt-3 text-sm font-semibold text-pink-strong"
          >
            {showAll}
            <ChevronRight size={iconSize.sm} aria-hidden />
          </button>
        )
      ) : null}
    </section>
  );
}

/** Body copy that stops at a few lines until someone asks for the rest. */
const clampClass: Record<number, string> = {
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
};

export function ClampedText({ text, lines = 3 }: { text: string; lines?: 2 | 3 | 4 }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <p className={cn("text-sm leading-relaxed", open ? "" : clampClass[lines])}>{text}</p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="state-layer mt-1 text-sm font-semibold text-muted-foreground"
      >
        {open ? "less" : "…more"}
      </button>
    </div>
  );
}

/** Where an owner's empty-state button goes: profile edit, or new portfolio work of one kind. */
export type ProfileEmptyCta =
  | { label: string; to: "/profile/edit" }
  | { label: string; to: "/portfolio/new/$kind"; kind: WorkKind };

export function ProfileEmpty({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: ProfileEmptyCta | undefined;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-5 text-center">
      <h3 className="text-2">{title}</h3>
      <p className="mx-auto mt-1 max-w-xs text-1 leading-relaxed text-muted-foreground">{body}</p>
      {cta ? (
        <BtnLink
          {...(cta.to === "/portfolio/new/$kind"
            ? { to: cta.to, params: { kind: cta.kind } }
            : { to: cta.to })}
          variant="outline"
          className="mt-3 min-h-touch text-1"
        >
          {cta.label}
        </BtnLink>
      ) : null}
    </div>
  );
}

/** Same frame as the loaded profile (full-bleed cover, overlapping photo, actions), so nothing jumps. */
export function ProfileSkeleton() {
  return (
    <div className="animate-pulse" role="status" aria-busy="true" aria-label="Loading profile">
      <div className="h-44 w-full bg-subtle" />
      <div className="-mt-10 px-5">
        <div className="h-20 w-20 rounded-lg border-2 border-background bg-subtle" />
        <div className="mt-3 h-4 w-2/3 rounded-full bg-subtle" />
        <div className="mt-2 h-3 w-1/2 rounded-full bg-subtle" />
      </div>
      <div className="px-5 pt-4">
        <div className="h-12 rounded-full bg-subtle" />
        <div className="mt-4 h-16 rounded-lg bg-subtle" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="mt-4 h-24 rounded-lg bg-subtle" />
        ))}
      </div>
    </div>
  );
}

/* ── Badges & pills ────────────────────────────────────────── */

export function VerificationBadge({ tier, compact }: { tier: string; compact?: boolean }) {
  const industry = tier === "Industry Verified" || tier === "Professional";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-subtle pill ${
        industry ? "text-foreground" : "text-muted-foreground"
      }`}
      title={tier}
    >
      <BadgeCheck size={iconSize.xs} aria-hidden />
      {compact ? "Verified" : tier}
    </span>
  );
}

/** The verified mark that follows a name: brand pink, icon only; the tier is its accessible name. */
export function VerifiedMark({ tier, size = 20 }: { tier: string; size?: number }) {
  return (
    <BadgeCheck
      size={size}
      className="shrink-0 fill-pink-strong text-background"
      role="img"
      aria-label={tier}
    >
      <title>{tier}</title>
    </BadgeCheck>
  );
}

/** Busy and Touring mean the person is not taking work; everything else is open. */
// eslint-disable-next-line react-refresh/only-export-components -- helper intentionally co-located with its component
export function isOpenForWork(status?: string | undefined) {
  return Boolean(status) && status !== "Busy" && status !== "Touring";
}

/** Said, in so many words, that they are not taking work. An unset status is not a no. */
// eslint-disable-next-line react-refresh/only-export-components -- helper intentionally co-located with its component
export function isUnavailableForWork(status?: string | undefined) {
  return status === "Busy" || status === "Touring";
}

/** One word for a status, so the label stays a label. */
const availabilityWord: Record<string, string> = {
  Available: "Available",
  "In Studio": "Recording",
  "Available for Shows": "Available",
  "Looking for Collaboration": "Collaborating",
  "Available for Session Work": "Available",
  Selective: "Selective",
  Busy: "Busy",
  Touring: "Touring",
};

export function StatusBadge({ status }: { status: string }) {
  const open = isOpenForWork(status);
  const Icon = open ? CircleCheck : CircleSlash;
  return (
    <StatusPill
      label={availabilityWord[status] ?? status}
      tone={open ? "good" : "neutral"}
      icon={<Icon size={12} aria-hidden />}
      className="shrink-0"
      title={status}
    />
  );
}

export function TagChip({
  children,
  tone = "subtle",
}: {
  children: ReactNode;
  tone?: "subtle" | "pink" | "purple";
}) {
  const styles: Record<string, string> = {
    subtle: "bg-background text-foreground",
    pink: "bg-background text-foreground",
    purple: "bg-status-category-bg text-status-category-text",
  };
  return (
    <span className={`rounded-full px-3 py-1.5 text-sm font-medium ${styles[tone]}`}>
      {children}
    </span>
  );
}

/**
 * Facets of a profile (genres, instruments, languages…) as one grouped list: each row is an icon
 * and a sentence-case label over its tags, rows split by hairlines. Empty rows don't render.
 */
export function ChipGroupList({ children }: { children: ReactNode }) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg bg-subtle">{children}</div>
  );
}

export function ChipGroup({
  label,
  items,
  tone,
  icon: Icon,
}: {
  label: string;
  items: string[];
  tone?: "subtle" | "pink" | "purple";
  icon?: LucideIcon;
}) {
  if (!items.length) return null;
  return (
    <div className="px-4 py-3.5">
      <p className="mb-2.5 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {Icon ? <Icon size={16} strokeWidth={1.75} aria-hidden /> : null}
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((i) => (
          <TagChip key={i} tone={tone ?? "subtle"}>
            {i}
          </TagChip>
        ))}
      </div>
    </div>
  );
}

/** A label and its value; a price value renders as amount and unit line, right-aligned. */
export function InfoRow({ label, value }: { label: string; value: string | PriceParts }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3.5">
      <span className="pill bg-background text-muted-foreground">{label}</span>
      {typeof value === "string" ? (
        <span className="max-w-3/5 text-right text-1 font-semibold">{value}</span>
      ) : (
        <Price
          price={value}
          align="end"
          className="max-w-3/5"
          amountClassName="text-1 font-semibold"
        />
      )}
    </div>
  );
}

/* ── Hero ──────────────────────────────────────────────────── */

/** The verified tick is for verified tiers only, never a default. */
function isVerifiedTier(tier: PersonProfile["verification"]) {
  return tier === "Professional" || tier === "Industry Verified";
}

/**
 * The owner's photo and cover buttons. Picking a file uploads it to the person's own storage folder
 * and writes the URL to the profile, so the change is done here rather than on another screen.
 * The studio's facility and equipment photos use the same button with their own kind.
 */
export function ImagePickButton<K extends string = ProfileImageKind>({
  kind,
  label,
  className,
  children,
  onPick,
  multiple = false,
}: {
  kind: K;
  label: string;
  className?: string;
  children: ReactNode;
  /** The screen owns the upload and the save; this button owns the file input and the spinner. */
  onPick: (kind: K, file: File) => Promise<void>;
  /** Several files in one pick, handed to onPick one after another in the order chosen. */
  multiple?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  const pick = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    try {
      for (const file of files) await onPick(kind, file);
    } finally {
      setBusy(false);
    }
  };

  return (
    <label
      className={cn(
        "state-layer flex cursor-pointer items-center justify-center rounded-full",
        busy ? "pointer-events-none opacity-60" : "",
        className,
      )}
      aria-busy={busy}
    >
      <span className="sr-only">{label}</span>
      <input
        type="file"
        accept={PROFILE_IMAGE_ACCEPT}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          void pick(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      {busy ? <Loader2 size={iconSize.sm} className="animate-spin" aria-hidden /> : children}
    </label>
  );
}

/** Window scroll in px, read on a frame, so the cover can shrink as the page moves. */
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setY(window.scrollY);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return y;
}

/**
 * The profile header: a cover that gives way as the page scrolls, the round picture overlapping
 * it, then the name and whatever lines the page adds. The person profile, business profiles and a
 * studio's booking page all use this one header.
 */
export function CoverHero({
  cover,
  photo,
  name,
  title,
  back,
  actions,
  photoPick,
  badge,
  square = false,
  children,
}: {
  /** A business's logo is square, as on LinkedIn company pages; a person's picture is round. */
  square?: boolean;
  cover?: string | undefined;
  photo?: string | undefined;
  name: string;
  /** The name line; defaults to the name as a heading. */
  title?: ReactNode;
  back?: string | undefined;
  /** Buttons on the cover, top right. */
  actions?: ReactNode;
  /** Owner only: a control laid over the picture to change it. */
  photoPick?: ReactNode;
  /** A mark overlapping the picture's corner, e.g. a verified badge. */
  badge?: ReactNode;
  children?: ReactNode;
}) {
  // LinkedIn-height cover (132px), giving way to a 72px band as the page scrolls.
  const y = useScrollY();
  const shrink = Math.min(1, Math.max(0, y / 120));
  const coverHeight = 132 - 60 * shrink;
  const photoSize = 136 - 52 * shrink;
  return (
    <header>
      <div
        className="relative overflow-hidden motion-reduce:!h-33"
        style={{ height: `${coverHeight}px` }}
      >
        {cover ? (
          <>
            <img src={cover} alt={`${name} cover`} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-ink/10" />
          </>
        ) : (
          <div className="h-full w-full bg-icon-chip" />
        )}
        {back ? (
          <Link
            to={back}
            aria-label="Back"
            className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-card/90"
          >
            <ArrowLeft size={iconSize.md} aria-hidden />
          </Link>
        ) : null}
        {actions ? <div className="absolute right-5 top-5 flex gap-2">{actions}</div> : null}
      </div>

      <div className="-mt-16 px-5">
        <div className="relative motion-reduce:!w-34" style={{ width: `${photoSize}px` }}>
          {photo ? (
            <img
              src={photo}
              alt={name}
              className={cn(
                "aspect-square w-full border-4 border-background object-cover motion-reduce:!h-34",
                square ? "rounded-lg" : "rounded-full",
              )}
            />
          ) : (
            <span
              className={cn(
                "flex aspect-square w-full items-center justify-center border-4 border-background bg-card text-muted-foreground",
                square ? "rounded-lg" : "rounded-full",
              )}
            >
              <User size={iconSize.xl} aria-label={name} />
            </span>
          )}
          {photoPick}
          {badge}
        </div>
        {title ?? (name ? <h1 className="mt-3 text-3 leading-tight">{name}</h1> : null)}
        {children}
      </div>
    </header>
  );
}

export function ProfileHero({
  p,
  owner,
  onShare,
  onMore,
  back,
  onPickImage,
}: {
  p: PersonProfile;
  owner?: boolean;
  /** Owner only: uploads the chosen file and saves it to the profile. */
  onPickImage?: ((kind: ProfileImageKind, file: File) => Promise<void>) | undefined;
  /** Left out when there is no username to share. */
  onShare?: (() => void) | undefined;
  onMore?: (() => void) | undefined;
  back?: string | undefined;
}) {
  return (
    <CoverHero
      cover={p.cover}
      photo={p.photo}
      name={p.name}
      back={back}
      square
      badge={
        isVerifiedTier(p.verification) ? (
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-card">
            <VerifiedMark tier={p.verification} size={18} />
          </span>
        ) : undefined
      }
      actions={
        <>
          {/* The owner edits the cover from the cover itself, the way people expect. */}
          {owner && onPickImage ? (
            <ImagePickButton
              kind="cover"
              label="Change cover photo"
              className="h-11 w-11 bg-card/90 text-foreground"
              onPick={onPickImage}
            >
              <Pencil size={iconSize.sm} aria-hidden />
            </ImagePickButton>
          ) : null}
          {/* The owner shares from the actions row, so the hero has no second Share. */}
          {onShare && !owner ? (
            <IconBtn label="Share Profile" variant="plain" className="bg-card/90" onClick={onShare}>
              <Share2 size={iconSize.sm} aria-hidden />
            </IconBtn>
          ) : null}
          {onMore ? (
            <IconBtn label="More Options" variant="plain" className="bg-card/90" onClick={onMore}>
              <MoreHorizontal size={iconSize.md} aria-hidden />
            </IconBtn>
          ) : null}
        </>
      }
      photoPick={
        owner && onPickImage ? (
          <ImagePickButton
            kind="avatar"
            label="Change profile photo"
            className="absolute -bottom-1 -left-1 h-9 w-9 border border-border bg-card text-foreground"
            onPick={onPickImage}
          >
            <Camera size={iconSize.sm} aria-hidden />
          </ImagePickButton>
        ) : null
      }
      title={
        p.name || p.availability ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            {/* The verified mark now sits on the avatar's corner (see `badge` above), so the name
                carries only the name and, next to it, availability. */}
            {p.name ? <h1 className="text-3 leading-tight">{p.name}</h1> : null}
            {p.availability ? <StatusBadge status={p.availability} /> : null}
            {owner ? (
              <IconBtnLink
                to="/profile/edit"
                search={{ section: "identity" }}
                label="Edit profile details"
                variant="ghost"
                className="ml-auto h-9 w-9"
              >
                <Pencil size={iconSize.sm} aria-hidden />
              </IconBtnLink>
            ) : null}
          </div>
        ) : (
          <></>
        )
      }
    >
      {p.username ? <p className="mt-0.5 text-sm text-muted-foreground">@{p.username}</p> : null}
      {/* The headline is the one line someone writes about themselves; About carries the rest. */}
      {p.headline && p.headline !== p.primaryRole ? (
        <p className="mt-1.5 text-sm leading-snug text-foreground">{p.headline}</p>
      ) : null}
      {p.location || p.yearsActive ? (
        <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-1 text-muted-foreground">
          {p.location ? (
            <span className="flex items-center gap-1">
              <MapPin size={iconSize.xs} className="shrink-0" aria-hidden />
              {p.location}
            </span>
          ) : null}
          {p.yearsActive ? (
            <span className="flex items-center gap-1">
              <CalendarDays size={iconSize.xs} className="shrink-0" aria-hidden />
              {p.yearsActive.replace(/\s*active$/i, "")} active
            </span>
          ) : null}
        </p>
      ) : null}
      {owner && p.privacy !== "Public" ? (
        <p className="mt-2 text-1 font-semibold text-warn-strong">Visibility: {p.privacy}</p>
      ) : null}
    </CoverHero>
  );
}

/* ── Portfolio pieces ──────────────────────────────────────── */

export function FeaturedCard({ featured }: { featured: NonNullable<PersonProfile["featured"]> }) {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);

  return (
    <article className="overflow-hidden rounded-lg border border-border/80 bg-card transition-all">
      <div className="relative">
        <img
          src={featured.image}
          alt={featured.title}
          className="h-44 w-full object-cover"
          loading="lazy"
        />
        <div className="media-scrim" />
        <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-background">
          <div className="min-w-0 flex-1">
            <span className="rounded-full bg-primary pill text-primary-foreground font-semibold">
              Featured {featured.kind}
            </span>
            <h3 className="mt-2 text-2 font-bold text-background">{featured.title}</h3>
            <p className="text-1 opacity-90">{featured.meta}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              aria-label={expanded ? "Hide details" : "View details"}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-foreground active:scale-95 transition-transform"
            >
              <ChevronDown
                size={iconSize.sm}
                className={cn("transition-transform duration-200", expanded && "rotate-180")}
                aria-hidden
              />
            </button>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause preview" : "Play preview"}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md active:scale-95 transition-transform"
            >
              {playing ? (
                <Pause size={iconSize.sm} aria-hidden />
              ) : (
                <Play size={iconSize.sm} aria-hidden />
              )}
            </button>
          </div>
        </div>
      </div>

      {playing || expanded ? (
        <div className="border-t border-border bg-subtle p-3.5 animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-1 font-semibold text-foreground">
              {playing ? "Playing featured work in-app" : "Featured track details"}
            </span>
            {playing ? <PlaybackBars className="h-4 gap-0.5 text-foreground" aria-hidden /> : null}
          </div>
          <p className="mt-1 text-1 leading-relaxed text-foreground">
            Mastered for Apple Digital Masters & Spotify HiFi. Recorded & produced across live
            tracking sessions.
          </p>
        </div>
      ) : null}
    </article>
  );
}

/**
 * A "now playing" indicator: 5 fixed-height bars. Replaces AgentAudioVisualizerBar
 * (agents-ui, backed by @livekit/components-react) which this call site never used
 * for real live-audio data — it always passed a hardcoded volumeBands array, and its
 * "speaking" state has no time-varying highlight sequence, so the render was already
 * static. That import alone added 1.1MB to this route's SSR bundle (see
 * docs/component-inventory-2026-09-16.md); this reproduces the same visual output
 * with none of it. agents-ui/agent-audio-visualizer-bar.tsx is left in place for
 * actual live-audio use elsewhere in the future.
 */
function PlaybackBars({ className, ...props }: { className?: string } & ComponentProps<"div">) {
  return (
    <div className={cn("relative flex items-center", className)} {...props}>
      {[0.5, 0.9, 0.35, 0.75, 0.55].map((band, i) => (
        <span
          key={i}
          className="w-[8px] min-h-[8px] rounded-full bg-current"
          style={{ height: `${band * 100}%` }}
        />
      ))}
    </div>
  );
}

export function AudioTrackCard({
  track,
  playing,
  onToggle,
}: {
  track: AudioTrack;
  playing: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  // Shown on a profile counts as a view of the work, for its owner's Performance figures.
  useEffect(() => recordWorkEvent(track.id, "view"), [track.id]);

  const isExpanded = expanded || playing;

  return (
    <article className="group overflow-hidden rounded-lg border border-border/80 bg-card transition-all duration-150 ease-standard hover:border-border">
      <div className="flex items-center gap-3 p-3">
        {track.artwork ? (
          <img
            src={track.artwork}
            alt=""
            aria-hidden
            loading="lazy"
            className="h-14 w-14 rounded-sm object-cover shadow-xs"
          />
        ) : (
          <NoCover className="h-14 w-14 shrink-0 rounded-sm shadow-xs" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-2 font-semibold text-foreground">{track.title}</h3>
            {track.featured ? (
              <span className="rounded-full bg-ink px-2 py-0.5 text-1 font-semibold text-background">
                Featured
              </span>
            ) : null}
          </div>
          <p className="truncate text-1 font-medium text-foreground">
            {joinParts(track.role, track.project)}
          </p>
          {playing ? (
            <div className="mt-1 flex items-center gap-1.5 text-foreground">
              <PlaybackBars className="h-4 justify-start gap-0.5" aria-hidden />
              <span className="eyebrow text-pink-strong">Playing in-app</span>
            </div>
          ) : track.duration ? (
            <p className="mt-0.5 text-1 text-muted-foreground">{track.duration}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          {isDbId(track.id) ? <SavedToggle targetType="portfolio" targetId={track.id} /> : null}
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-subtle active:scale-95 transition-transform"
          >
            <ChevronDown
              size={iconSize.sm}
              className={cn("transition-transform duration-200", isExpanded && "rotate-180")}
              aria-hidden
            />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!playing) recordPlay(track.id);
              onToggle();
            }}
            aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs active:scale-95 transition-transform"
          >
            {playing ? (
              <Pause size={iconSize.sm} aria-hidden />
            ) : (
              <Play size={iconSize.sm} aria-hidden />
            )}
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="border-t border-border/70 bg-subtle/50 px-4 py-3 animate-in fade-in-50 duration-150">
          {track.media ? (
            <div className="mb-2">
              <MediaEmbed
                url={track.media}
                title={track.title}
                onOpen={() => recordWorkEvent(track.id, "link_click")}
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-1 font-medium text-foreground">
                <span className="flex items-center gap-1.5">
                  <AudioLines size={14} className="text-foreground" /> In-app lossless preview
                </span>
                <span className="font-mono text-1">{track.duration ?? "3:42"}</span>
              </div>
              <div className="flex h-7 items-center gap-1 overflow-hidden rounded-sm bg-background/80 px-2 py-1">
                {[
                  4, 12, 18, 8, 22, 14, 26, 19, 11, 16, 24, 20, 15, 9, 21, 13, 27, 18, 10, 14, 22,
                  16, 8, 12, 20, 15, 23, 11, 19, 7,
                ].map((h, i) => (
                  <span
                    key={i}
                    className={cn(
                      "w-1 rounded-full transition-all duration-200",
                      playing ? "bg-foreground" : "bg-muted-foreground/40",
                      playing && i % 3 === 0 && "animate-pulse",
                    )}
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-1 text-1 text-foreground border-t border-border/40">
            <span className="font-semibold">Role: {track.role || "Producer & Mix"}</span>
            {track.project ? (
              <span className="text-muted-foreground">Project: {track.project}</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

/** A work with no cover (its link had no preview image): the logo on ink. */
export function NoCover({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center justify-center bg-ink", className)}>
      <LogoMark className="w-2/5 max-w-16 text-primary-foreground" />
    </div>
  );
}

export function VideoCard({
  v,
  layout = "card",
}: {
  v: VideoItem;
  /** "card" is the rail tile, "grid" fills a cell, "row" is a wide thumbnail-left row. */
  layout?: "card" | "grid" | "row";
}) {
  const [open, setOpen] = useState(false);
  // Shown on a profile counts as a view of the work, for its owner's Performance figures.
  useEffect(() => recordWorkEvent(v.id, "view"), [v.id]);
  const toggle = v.media
    ? () => {
        if (!open) recordPlay(v.id);
        setOpen((o) => !o);
      }
    : undefined;
  const player =
    open && v.media ? (
      <div className="mt-3 animate-in fade-in duration-200">
        <MediaEmbed
          url={v.media}
          title={v.title}
          onOpen={() => recordWorkEvent(v.id, "link_click")}
        />
      </div>
    ) : null;
  if (layout === "row") {
    return (
      <article>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={toggle}
            disabled={!toggle}
            aria-expanded={toggle ? open : undefined}
            aria-label={`Play ${v.title}`}
            className="relative h-20 w-32 shrink-0 overflow-hidden rounded-sm bg-background"
          >
            {v.thumb ? (
              <img src={v.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <NoCover className="h-full w-full" />
            )}
            {v.duration ? (
              <span className="absolute bottom-1 left-1 rounded-sm bg-ink/80 px-1.5 py-0.5 text-1 font-semibold text-background">
                {v.duration}
              </span>
            ) : null}
          </button>
          <div className="min-w-0 flex-1 py-0.5">
            <h3 className="line-clamp-2 text-2 font-semibold leading-snug">{v.title}</h3>
            <p className="mt-1 truncate text-1 text-muted-foreground">{v.context}</p>
          </div>
          {isDbId(v.id) ? <SavedToggle targetType="portfolio" targetId={v.id} /> : null}
        </div>
        {player}
      </article>
    );
  }
  return (
    <article
      className={cn(
        "overflow-hidden rounded-lg bg-subtle",
        layout === "grid" ? "w-full" : "w-[220px] shrink-0",
      )}
    >
      <div className="relative h-32">
        {v.thumb ? (
          <img src={v.thumb} alt={v.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <NoCover className="h-full w-full" />
        )}
        <button
          type="button"
          onClick={toggle}
          disabled={!toggle}
          aria-expanded={toggle ? open : undefined}
          aria-label={`Play ${v.title}`}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-card/90">
            <Play size={iconSize.sm} aria-hidden />
          </span>
        </button>
        {v.duration ? (
          <span className="absolute bottom-2 right-2 rounded-full bg-ink/80 px-2 py-0.5 text-1 font-semibold text-background">
            {v.duration}
          </span>
        ) : null}
      </div>
      <div className="p-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-1">{v.title}</h3>
            <p className="truncate text-1 text-muted-foreground">{v.context}</p>
          </div>
          {isDbId(v.id) ? <SavedToggle targetType="portfolio" targetId={v.id} size={36} /> : null}
        </div>
        {player}
      </div>
    </article>
  );
}

/** A gallery's photos, the first one large. With onOpen each photo is a button that opens them. */
export function GalleryGrid({
  images,
  onOpen,
}: {
  images: string[];
  onOpen?: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {images.map((src, i) => {
        const size = i === 0 ? "col-span-2 row-span-2 h-full min-h-[168px]" : "h-20";
        if (!onOpen) {
          return (
            <img
              key={src}
              src={src}
              alt={`Portfolio work ${i + 1}`}
              loading="lazy"
              className={`w-full rounded-lg object-cover ${size}`}
            />
          );
        }
        return (
          <button
            key={src}
            type="button"
            onClick={() => onOpen(i)}
            aria-label={`View photo ${i + 1} of ${images.length}`}
            className={`block overflow-hidden rounded-lg ${size}`}
          >
            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        );
      })}
    </div>
  );
}

export function ProjectCard({ p }: { p: ProjectItem }) {
  return (
    <article className="flex gap-3 rounded-lg bg-subtle p-3">
      {p.cover ? (
        <img
          src={p.cover}
          alt=""
          aria-hidden
          loading="lazy"
          className="h-20 w-20 rounded-lg object-cover"
        />
      ) : (
        <div aria-hidden className="h-20 w-20 shrink-0 rounded-lg bg-subtle" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 truncate text-2">{p.name}</h3>
          <TagChip tone={p.status === "Released" ? "subtle" : "pink"}>{p.status}</TagChip>
        </div>
        <p className="truncate text-1 text-muted-foreground">{p.role}</p>
        {p.collaborators ? (
          <p className="truncate text-1 text-muted-foreground">with {p.collaborators}</p>
        ) : null}
        <p className="mt-1 text-1 font-semibold text-foreground">{joinParts(p.genre, p.year)}</p>
      </div>
    </article>
  );
}

/**
 * Services provided: each service's name as a small tag (LinkedIn's pattern). A tag opens the
 * service, where its price, terms and Enquire live.
 */
export function ServicesProvided({ services }: { services: ServiceItem[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {services.map((s) => (
        <li key={s.id}>
          <Link
            to="/services/$id"
            params={{ id: s.id }}
            className="state-layer inline-flex rounded-sm bg-background px-3 py-1.5 text-sm font-medium text-foreground"
          >
            {s.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** The owner's prompt to ask past clients for a review, in the Reviews section. */
export function ReviewInviteCard() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-icon-chip text-primary-foreground">
        <MessageSquareQuote size={iconSize.md} strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">
          Invite past clients to review
        </span>
        <span className="block text-1 text-foreground">
          Ask the people who can best speak to your work.
        </span>
      </span>
      <BtnLink to="/reviews/request" variant="outline" className="min-h-control-sm shrink-0 px-4">
        Invite
      </BtnLink>
    </div>
  );
}

/**
 * A service as a booking ticket (a talent's Services tab, the Overview, the Add service preview).
 * The ticket says what you get — category and how they work, the name, a short description, up
 * to three deliverables — and its tear-off stub says what it costs and how long it takes, with the
 * one Book button. Book opens the service's booking request; the preview's does nothing.
 */
/**
 * One service, everywhere a service is shown: talent profiles, business pages, booking. A studio's
 * service lists what it uses; `onBook` replaces the default Book (the service's enquiry) — a studio
 * opens its booking flow with the service picked. `selected` marks the one picked in booking.
 */
export function ServiceCard({
  s,
  onEnquire,
  onBook,
  selected = false,
  disabled = false,
  disabledReason,
  className,
}: {
  s: ServiceItem;
  onEnquire?: (() => void) | undefined;
  onBook?: (() => void) | undefined;
  selected?: boolean | undefined;
  disabled?: boolean | undefined;
  disabledReason?: string | undefined;
  className?: string | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const real = /^[0-9a-f-]{36}$/i.test(s.id);
  const taxonomy = useTaxonomy().options;
  const category = s.categories?.[0] ? labelFor(taxonomy?.service_categories, s.categories[0]) : "";
  const meta = [category, s.mode].filter(Boolean).join(" · ");
  const allDeliverables = s.deliverables ?? [];
  const gets = expanded ? allDeliverables : allDeliverables.slice(0, 3);
  const hasDetails =
    allDeliverables.length > 3 ||
    (s.description && s.description.length > 80) ||
    (s.uses && s.uses.length > 0);

  const book = onBook ? (
    <Btn
      disabled={disabled}
      className="min-h-control-sm shrink-0 px-5 text-sm active:scale-95"
      onClick={onBook}
    >
      Book
    </Btn>
  ) : real ? (
    <BtnLink
      to="/services/$id/enquiry"
      params={{ id: s.id }}
      className={cn(
        "min-h-control-sm shrink-0 px-5 text-sm active:scale-95",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      Book
    </BtnLink>
  ) : (
    <Btn
      disabled={disabled}
      className="min-h-control-sm shrink-0 px-5 text-sm active:scale-95"
      {...(onEnquire ? { onClick: onEnquire } : {})}
    >
      Book
    </Btn>
  );

  return (
    <article
      aria-current={selected || undefined}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-lg border bg-card transition-all duration-150 ease-standard",
        selected
          ? "border-foreground ring-2 ring-foreground/15 shadow-sm"
          : "border-border/80 hover:border-foreground/40 hover:shadow-xs",
        disabled && "opacity-60",
        className,
      )}
    >
      <div className="px-4 pb-3 pt-4">
        <div className="flex items-center justify-between gap-2">
          {meta ? <p className="eyebrow truncate text-muted-foreground">{meta}</p> : <span />}
          {selected ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-1 font-semibold text-background">
              <Check size={10} strokeWidth={3} aria-hidden />
              Selected
            </span>
          ) : disabled && disabledReason ? (
            <span className="inline-flex shrink-0 items-center rounded-full bg-subtle px-2 py-0.5 text-1 font-medium text-muted-foreground">
              {disabledReason}
            </span>
          ) : null}
        </div>

        <div className="mt-1 flex items-start justify-between gap-2">
          {real ? (
            <Link
              to="/services/$id"
              params={{ id: s.id }}
              className="block text-3 font-bold leading-snug text-foreground underline-offset-4 hover:underline"
            >
              {s.name}
            </Link>
          ) : (
            <h3 className="text-3 font-bold leading-snug text-foreground">{s.name}</h3>
          )}

          {hasDetails ? (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              aria-label={expanded ? "Collapse service details" : "Expand service details"}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-1 font-semibold text-foreground hover:bg-subtle active:scale-95 transition-all"
            >
              <span>{expanded ? "Less" : "Details"}</span>
              <ChevronDown
                size={12}
                className={cn("transition-transform duration-200", expanded && "rotate-180")}
                aria-hidden
              />
            </button>
          ) : null}
        </div>

        {s.description ? (
          <p
            className={cn(
              "mt-1.5 text-1 leading-relaxed text-foreground",
              !expanded && "line-clamp-2",
            )}
          >
            {s.description}
          </p>
        ) : null}

        {gets.length ? (
          <ul className="mt-3 space-y-1.5" aria-label="What you get">
            {gets.map((d) => (
              <li key={d} className="flex items-start gap-2 text-1 font-medium text-foreground">
                <Check
                  size={14}
                  strokeWidth={2.25}
                  className="mt-0.5 shrink-0 text-foreground"
                  aria-hidden
                />
                <span className="min-w-0">{d}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {expanded && s.uses?.length ? (
          <div className="mt-3 border-t border-border/50 pt-2 animate-in fade-in-50 duration-150">
            <p className="eyebrow text-muted-foreground">Included gear & software</p>
            <p className="mt-1 text-1 font-medium text-foreground">{s.uses.join(", ")}</p>
          </div>
        ) : null}
      </div>

      {/* The stub: torn off at the notches, it carries the price, the time and Book. */}
      <div className="relative mt-auto flex items-center gap-3 border-t border-dashed border-border/80 bg-subtle/90 px-4 py-3">
        <span
          aria-hidden
          className="absolute -left-2 -top-2 h-4 w-4 rounded-full border-r border-border/80 bg-background"
        />
        <span
          aria-hidden
          className="absolute -right-2 -top-2 h-4 w-4 rounded-full border-l border-border/80 bg-background"
        />
        <div className="min-w-0 flex-1">
          {s.from ? (
            <Price
              from
              inline
              price={s.from}
              amountClassName="text-3 font-extrabold text-foreground"
            />
          ) : (
            <span className="text-sm font-bold text-foreground">On enquiry</span>
          )}
          {s.turnaround ? (
            <p className="mt-0.5 flex items-center gap-1.5 text-1 font-medium text-muted-foreground">
              <Clock size={12} className="shrink-0" aria-hidden />
              Delivered in {s.turnaround}
            </p>
          ) : null}
        </div>
        {book}
      </div>
    </article>
  );
}

export function ServiceCardSkeleton({ className }: { className?: string | undefined }) {
  return (
    <article
      className={cn(
        "flex flex-col justify-between overflow-hidden rounded-lg border border-border/60 bg-card p-4",
        className,
      )}
    >
      <div>
        <div className="h-3.5 w-24 rounded bg-subtle animate-pulse" />
        <div className="mt-2.5 h-6 w-3/4 rounded bg-subtle animate-pulse" />
        <div className="mt-2 h-4 w-full rounded bg-subtle animate-pulse" />
        <div className="mt-4 space-y-2">
          <div className="h-3.5 w-4/5 rounded bg-subtle animate-pulse" />
          <div className="h-3.5 w-2/3 rounded bg-subtle animate-pulse" />
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-dashed border-border/60 pt-3">
        <div className="h-6 w-24 rounded bg-subtle animate-pulse" />
        <div className="h-9 w-20 rounded-full bg-subtle animate-pulse" />
      </div>
    </article>
  );
}

export function ExperienceCard({ e }: { e: ExperienceItem }) {
  return (
    <div className="flex gap-3 px-4 py-4">
      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
      <div className="min-w-0">
        <h3 className="text-2">{e.title}</h3>
        <p className="text-1 font-semibold text-muted-foreground">{joinParts(e.org, e.period)}</p>
        <p className="mt-1 text-1 leading-relaxed text-muted-foreground">{e.detail}</p>
      </div>
    </div>
  );
}

export function CollaboratorCard({ c }: { c: Collaborator }) {
  const inner = (
    <>
      <img
        src={c.photo}
        alt=""
        aria-hidden
        loading="lazy"
        className="h-16 w-16 rounded-lg object-cover"
      />
      <p className="mt-2 w-20 truncate text-center text-1 font-semibold">{c.name}</p>
      <p className="text-1 text-muted-foreground">{c.kind}</p>
    </>
  );
  if (!c.link) return <div className="flex shrink-0 flex-col items-center">{inner}</div>;
  return (
    <Link
      to={c.link.to}
      {...(c.link.params ? { params: c.link.params } : {})}
      className="flex shrink-0 flex-col items-center"
    >
      {inner}
    </Link>
  );
}

/**
 * One review, read the way a liner note reads: the rating, then what they said, then who said it.
 * Reviews always sit side by side in a ReviewRail and scroll left to right; they never stack
 * (owner, 22 Sep 2026). Reviews take no replies (owner, 22 Sep 2026). `footer` holds a
 * screen's own controls, such as Report.
 */
export function ReviewCard({
  r,
  footer,
  className,
}: {
  r: ReviewItem;
  footer?: ReactNode;
  className?: string | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);

  const toggleHelpful = () => {
    haptic("select");
    setHasVoted((v) => !v);
    setHelpfulCount((c) => (hasVoted ? Math.max(0, c - 1) : c + 1));
  };

  return (
    <article
      className={cn(
        "group flex h-full w-[min(300px,82vw)] flex-col justify-between rounded-lg border border-border/80 bg-card p-4 shadow-2xs transition-all duration-150 hover:shadow-xs",
        className,
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <Stars value={r.stars} size={14} />
            <span className="text-1 font-semibold">{r.stars.toFixed(1)}</span>
          </span>
          {r.context ? (
            <span className="min-w-0 max-w-[140px] truncate rounded-full bg-subtle px-2 py-0.5 text-1 font-medium text-muted-foreground">
              {r.context}
            </span>
          ) : null}
        </div>

        <p
          className={cn(
            "mt-3 text-sm leading-relaxed text-foreground transition-[max-height] duration-200",
            expanded ? "" : "line-clamp-4",
          )}
        >
          {r.text}
        </p>
        {r.text.length > 140 ? (
          <button
            type="button"
            onClick={() => {
              haptic("select");
              setExpanded(!expanded);
            }}
            className="mt-1 inline-block text-1 font-semibold text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        ) : null}

        {r.tags?.length ? (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
            {r.tags.map((tag) => (
              <li key={tag}>
                <Tag>{tag}</Tag>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-4 border-t border-border/50 pt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <PersonAvatar name={r.by} photo={null} className="h-8 w-8 shrink-0 text-1" />
            <span className="min-w-0">
              <span className="block truncate text-1 font-semibold text-foreground">{r.by}</span>
              {r.org ? (
                <span className="block truncate text-1 text-muted-foreground">{r.org}</span>
              ) : null}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleHelpful}
            className={cn(
              "hit-area inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-1 font-medium transition-colors active:scale-95",
              hasVoted
                ? "border-foreground bg-foreground text-background font-semibold"
                : "border-border/70 bg-subtle/40 text-muted-foreground hover:text-foreground hover:bg-card",
            )}
            aria-label={hasVoted ? "Marked as helpful" : "Helpful review"}
          >
            <ThumbsUp size={11} className={hasVoted ? "fill-background" : ""} aria-hidden />
            <span>Helpful{helpfulCount > 0 ? ` · ${helpfulCount}` : ""}</span>
          </button>
        </div>
        {footer ? <div className="pt-2.5">{footer}</div> : null}
      </div>
    </article>
  );
}

export function ReviewCardSkeleton({ className }: { className?: string | undefined }) {
  return (
    <article
      className={cn(
        "flex h-52 w-[min(300px,82vw)] flex-col justify-between rounded-lg border border-border/60 bg-card p-4",
        className,
      )}
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="h-4 w-20 rounded bg-subtle animate-pulse" />
          <div className="h-4 w-16 rounded-full bg-subtle animate-pulse" />
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-3.5 w-full rounded bg-subtle animate-pulse" />
          <div className="h-3.5 w-5/6 rounded bg-subtle animate-pulse" />
          <div className="h-3.5 w-2/3 rounded bg-subtle animate-pulse" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border/50 pt-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-subtle animate-pulse" />
          <div className="space-y-1">
            <div className="h-3 w-20 rounded bg-subtle animate-pulse" />
            <div className="h-2.5 w-12 rounded bg-subtle animate-pulse" />
          </div>
        </div>
        <div className="h-6 w-14 rounded-full bg-subtle animate-pulse" />
      </div>
    </article>
  );
}

/** The one way reviews are laid out: cards side by side, scrolling left to right, edge to edge. */
export function ReviewRail({
  children,
  label = "Reviews",
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <ul
      aria-label={label}
      className="rail no-scrollbar -mx-5 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto scroll-px-5 px-5 pb-1"
    >
      {Children.toArray(children).map((child, i) => (
        <li key={i} className="flex shrink-0 snap-start">
          {child}
        </li>
      ))}
    </ul>
  );
}

export function OpportunityCard({ o }: { o: OpportunityItem }) {
  return (
    <article className={`rounded-lg p-4 bg-subtle`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-2">{o.title}</h3>
          {o.detail ? <p className="mt-0.5 text-1 text-muted-foreground">{o.detail}</p> : null}
          <Price price={o.price} className="mt-1" amountClassName="text-1 font-semibold" />
        </div>
        <Link
          to="/messages"
          className="shrink-0 rounded-full bg-ink px-3.5 py-2 text-1 font-semibold text-background"
        >
          Respond
        </Link>
      </div>
    </article>
  );
}

export function MarketEntryCard({ m }: { m: MarketEntry }) {
  // A tile, picture first: gear is chosen by how it looks, then what it is, then what it costs.
  return (
    <Link
      to={m.to}
      {...(m.params ? { params: m.params } : {})}
      className="block w-40 shrink-0 overflow-hidden rounded-lg bg-subtle"
    >
      {m.image ? (
        <img
          src={m.image}
          alt=""
          aria-hidden
          loading="lazy"
          className="aspect-[4/3] w-full object-cover"
        />
      ) : (
        <div aria-hidden className="aspect-[4/3] w-full bg-background" />
      )}
      <div className="p-3">
        <h3 className="truncate text-sm font-semibold">{m.title}</h3>
        {m.meta ? <p className="mt-0.5 truncate text-1 text-muted-foreground">{m.meta}</p> : null}
        <Price price={m.price} className="mt-1.5" amountClassName="text-sm font-semibold" />
      </div>
    </Link>
  );
}

const linkIcons: Record<string, typeof Globe> = {
  youtube: Youtube,
  instagram: Instagram,
  spotify: AudioLines,
  soundcloud: AudioLines,
  "apple music": AudioLines,
};

/**
 * Streaming and social links, everywhere they appear: one divided list, a platform icon, the
 * platform, the handle. Links store a handle and no address yet, so the rows are not tappable.
 */
export function SocialLinks({ links }: { links: { label: string; handle: string }[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg bg-subtle">
      {links.map((l) => {
        const Icon = linkIcons[l.label.toLowerCase()] ?? Globe;
        return (
          <li key={l.label} className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-foreground">
              <Icon size={16} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{l.label}</span>
              <span className="block truncate text-1 text-muted-foreground">{l.handle}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/* ── Share / QR ────────────────────────────────────────────── */

export function QrBlock({ seed }: { seed: string }) {
  const cells = Array.from({ length: 169 }).map((_, i) => {
    const code = seed.charCodeAt(i % seed.length) + i * 7;
    return code % 3 !== 0;
  });
  return (
    <div
      className="grid grid-cols-13 gap-0.5 rounded-lg bg-card p-3"
      aria-label="Profile QR code"
      role="img"
    >
      {cells.map((on, i) => (
        <span key={i} className={`aspect-square rounded-sm ${on ? "bg-ink" : ""}`} />
      ))}
    </div>
  );
}

export function ShareSheet({
  p,
  open,
  onClose,
}: {
  p: PersonProfile;
  open: boolean;
  onClose: () => void;
}) {
  // Only rendered in the browser once opened, so window and navigator are there when it shows.
  const url =
    typeof window === "undefined" ? "" : `${window.location.origin}/profile/${p.username}`;
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  return (
    <Sheet open={open} onClose={onClose} title="Share profile">
      <div className="ink-gradient overflow-hidden rounded-lg border border-border">
        <div className="flex items-center gap-3 p-4 text-background">
          {p.photo ? (
            <img src={p.photo} alt="" aria-hidden className="h-14 w-14 rounded-sm object-cover" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-sm bg-background/15">
              <User size={iconSize.lg} aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-2 text-background">{p.name}</h3>
              {isVerifiedTier(p.verification) ? (
                <BadgeCheck size={iconSize.sm} aria-label="Verified" />
              ) : null}
            </div>
            <p className="truncate text-1 opacity-80">{p.primaryRole}</p>
            <p className="truncate text-1 opacity-80">{p.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-background/15 p-4">
          <div className="w-28">
            <QrBlock seed={p.username} />
          </div>
          <div className="min-w-0 text-background">
            <p className="pill bg-subtle/60">MusicLinkd identity</p>
            <p className="mt-1 truncate text-1 font-semibold">{url.replace(/^https?:\/\//, "")}</p>
            <p className="mt-1 text-1 opacity-75">Scan to open this profile in MusicLinkd.</p>
          </div>
        </div>
      </div>

      {/* Only actions that work: copy the link, and the system share sheet where the browser has one. */}
      <div className={`mt-4 grid gap-2 ${canShare ? "grid-cols-2" : "grid-cols-1"}`}>
        <Btn
          onClick={() => {
            navigator.clipboard
              ?.writeText(url)
              .then(() => toast.success("Link copied"))
              .catch(() => toast.error("Couldn't copy the link"));
          }}
        >
          Copy Link
        </Btn>
        {canShare ? (
          <Btn
            variant="ink"
            onClick={() => {
              // A dismissed share sheet rejects; nothing to report.
              navigator.share({ title: p.name, url }).catch(() => undefined);
            }}
          >
            Share
          </Btn>
        ) : null}
      </div>
    </Sheet>
  );
}

/* ── More / safety ─────────────────────────────────────────── */

export function MoreSheet({
  open,
  onClose,
  name,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
}) {
  const items = [
    "Copy profile link",
    "Save contact",
    "Add to shortlist",
    `Restrict ${name}`,
    `Block ${name}`,
    "Report profile",
    "Report content",
  ];
  return (
    <Sheet open={open} onClose={onClose} title="More">
      <div className="divide-y divide-border rounded-lg bg-subtle">
        {items.map((i) => {
          const danger = i.startsWith("Block") || i.startsWith("Report");
          return (
            <button
              key={i}
              type="button"
              onClick={onClose}
              className={`flex w-full items-center justify-between px-4 py-4 text-left text-sm font-medium ${
                danger ? "text-destructive" : ""
              }`}
            >
              {i}
              <ChevronRight size={iconSize.sm} className="text-muted-foreground" aria-hidden />
            </button>
          );
        })}
      </div>
      <p className="mt-3 flex items-center gap-2 px-1 text-1 text-muted-foreground">
        <ShieldCheck size={iconSize.xs} aria-hidden />
        Reports are reviewed by the MusicLinkd trust team.
      </p>
    </Sheet>
  );
}

/* ── Owner mode ────────────────────────────────────────────── */

export function CompletionCard({
  percent,
  missing,
}: {
  percent: number;
  /** Each gap links to where it is filled in; profile edit when it names no place. */
  missing: { id: string; label: string; to?: string }[];
}) {
  return (
    <div className="rounded-lg bg-subtle p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2">Your profile is {percent}% complete</h2>
        <span className="text-1 font-semibold text-foreground">{missing.length} left</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-card">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Profile completion"
        />
      </div>
      <ul className="mt-3 space-y-0.5">
        {missing.map((m) => (
          <li key={m.id}>
            <Link
              to={m.to ?? "/profile/edit"}
              className="state-layer flex min-h-control-sm items-center gap-2 rounded-sm text-1 text-muted-foreground transition-transform duration-125 ease-standard active:scale-97"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {m.label}
              <ChevronRight size={iconSize.sm} className="ml-auto shrink-0" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <BtnLink to="/profile/edit" className="mt-3 min-h-touch w-full text-1">
        Complete Profile
      </BtnLink>
    </div>
  );
}
