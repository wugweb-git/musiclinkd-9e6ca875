import { Link } from "@tanstack/react-router";
import { profileUrl } from "@/lib/site";
import { Children, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
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
  User,
  ArrowLeft,
  ChevronRight,
  MapPin,
  type LucideIcon,
  AudioLines,
  Globe,
  Instagram,
  Youtube,
  MessageSquareQuote,
  Clock,
  Check,
  Star,
} from "lucide-react";
import type {
  AudioTrack,
  ExperienceItem,
  TalentProfile,
  ProjectItem,
  ReviewItem,
  ServiceItem,
  VerificationTier,
  VideoItem,
} from "@/data/profile";
import type { WorkKind } from "@/data/portfolio";
import { Btn, BtnLink, IconBtn, IconBtnLink, Sheet } from "./ui";
import { Card, Meter, Price, Stars, StatusPill, Tag } from "./kit";
import { PersonAvatar } from "./person-avatar";
import type { PriceParts } from "@/lib/price";
import { cn, joinParts } from "@/lib/utils";
import { LogoMark } from "./logo";
import { roleIcon } from "@/lib/role-icons";
import { labelFor, useTaxonomy } from "@/lib/taxonomy";
import { PROFILE_IMAGE_ACCEPT, type ProfileImageKind } from "@/lib/profile-images";
import { MediaEmbed } from "./media-embed";
import { QrCode } from "./qr";
import { recordPlay } from "@/lib/plays";
import { recordWorkEvent } from "@/lib/work-events";
import { SavedToggle } from "./saved-toggle";
import type { ProfileGaps } from "@/lib/profile-map";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReportSheet } from "./market";
import { saveTarget } from "@/lib/saved.functions";
import { useAuth } from "@/hooks/use-auth";
import { haptic } from "@/lib/haptics";

/** Works stored in the database can be saved; demo works (non-uuid ids) can't. */
const isDbId = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
import { iconSize } from "@/lib/tokens";
import { initialsOf } from "./viewer";
import { imageWidth, sized } from "@/lib/image-url";

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
            className="link-action mt-4 flex min-h-touch w-full items-center justify-center gap-1 border-t border-border pt-1 text-sm font-semibold text-pink-strong"
          >
            {showAll}
            <ChevronRight size={iconSize.sm} aria-hidden />
          </Link>
        ) : (
          <button
            type="button"
            onClick={onShowAll}
            className="link-action mt-4 flex min-h-touch w-full items-center justify-center gap-1 border-t border-border pt-1 text-sm font-semibold text-pink-strong"
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
        className="state-layer hit-area mt-1 text-sm font-semibold text-muted-foreground"
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

/**
 * An owner's way out of an empty profile section, typed to where it can go: profile edit, or new
 * portfolio work of one kind. Nothing when there is no CTA (a visitor's view).
 */
export function ProfileCta({ cta }: { cta?: ProfileEmptyCta | undefined }) {
  if (!cta) return null;
  return (
    <BtnLink
      {...(cta.to === "/portfolio/new/$kind"
        ? { to: cta.to, params: { kind: cta.kind } }
        : { to: cta.to })}
      variant="outline"
    >
      {cta.label}
    </BtnLink>
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

export function VerificationBadge({
  tier,
  compact,
}: {
  tier: VerificationTier;
  compact?: boolean;
}) {
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
        {Icon ? <Icon size={16} aria-hidden /> : null}
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
function isVerifiedTier(tier: TalentProfile["verification"]) {
  return tier === "Professional" || tier === "Industry Verified";
}

/**
 * The owner's photo and cover buttons. Picking a file uploads it to the person's own storage folder
 * and writes the URL to the profile, so the change is done here rather than on another screen.
 * The studio's amenity and equipment photos use the same button with their own kind.
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
    } catch (e) {
      // Callers show their own message; this catches one that let an error through, so a failed
      // upload is never silent.
      toast.error(e instanceof Error ? e.message : "That upload didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <label
      className={cn(
        // The input is visually hidden, so the ring shows on the label while the input has
        // keyboard focus.
        "state-layer hit-area flex cursor-pointer items-center justify-center rounded-full has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
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
/**
 * The cover before anyone has uploaded one.
 *
 * It was a flat near-black fill, which is what a new profile, band, collab and business page all
 * showed — and the first thing anyone opening a shared link saw. A void reads as broken rather
 * than as empty.
 *
 * So it draws the app's own waveform, the mark on the splash screen, at low contrast. The bar
 * heights come from a hash of the name, so two pages are not the same picture, and the same page
 * is the same picture every time. Ink only: the chrome stays monochrome and the media still
 * carries all the colour — there just is not any media yet.
 */
function CoverFallback({ name }: { name: string }) {
  const bars = useMemo(() => {
    // A small deterministic PRNG seeded from the name; nothing here is random at runtime.
    let seed = 2166136261;
    for (let i = 0; i < name.length; i += 1) seed = Math.imul(seed ^ name.charCodeAt(i), 16777619);
    const BARS = 56;
    return Array.from({ length: BARS }, (_, i) => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      // A waveform swells toward the middle instead of running flat from edge to edge.
      const envelope = Math.sin((i / (BARS - 1)) * Math.PI) ** 0.7;
      return Math.round((0.12 + (seed / 0xffffffff) * 0.88 * envelope) * 100);
    });
  }, [name]);

  return (
    <div
      aria-hidden
      className="flex h-full w-full items-center justify-center gap-[3px] overflow-hidden bg-icon-chip px-4"
    >
      {bars.map((height, i) => (
        <span
          key={i}
          className="w-1 shrink-0 rounded-full bg-background/20"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

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
    /*
     * A div, not a header. `<header>` outside article/aside/main/nav/section is a `banner`
     * landmark, and a page may have one — but this is a shared hero used on the profile, band,
     * business, collab and booking screens, every one of which already has its own top bar. On the
     * owner's profile axe failed with "Document should not have more than one banner landmark".
     * Nothing is lost: the name inside is still an <h1>, which is what carries the meaning.
     */
    <div>
      <div
        className="relative overflow-hidden motion-reduce:!h-33"
        style={{ height: `${coverHeight}px` }}
      >
        {cover ? (
          <>
            <img
              src={sized(cover, { width: 412 })}
              alt={`${name} cover`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-ink/10" />
          </>
        ) : (
          <CoverFallback name={name} />
        )}
        {/* Below the status bar on an edge-to-edge phone: the top inset plus the old 20px. */}
        {back ? (
          <Link
            to={back}
            aria-label="Back"
            style={{ top: "calc(env(safe-area-inset-top) + 1.25rem)" }}
            className="hit-area absolute left-5 flex h-10 w-10 items-center justify-center rounded-full bg-card/90"
          >
            <ArrowLeft size={iconSize.md} aria-hidden />
          </Link>
        ) : null}
        {actions ? (
          <div
            style={{ top: "calc(env(safe-area-inset-top) + 1.25rem)" }}
            className="absolute right-5 flex gap-2"
          >
            {actions}
          </div>
        ) : null}
      </div>

      <div className="-mt-16 px-5">
        <div className="relative motion-reduce:!w-34" style={{ width: `${photoSize}px` }}>
          {photo ? (
            <img
              src={sized(photo, { width: imageWidth.avatarLg })}
              alt={name}
              className={cn(
                "aspect-square w-full border-4 border-background object-cover motion-reduce:!h-34",
                square ? "rounded-lg" : "rounded-full",
              )}
            />
          ) : (
            /*
             * Initials, not a generic person glyph. PersonAvatar has done this everywhere else in
             * the app for a while — the inbox, the chat header, the picker rows — and only the
             * hero, the biggest photo on the page, still drew the same grey silhouette for
             * everyone. An ink disc on the same icon-chip ground as those rows, so a page with no
             * photo still looks like somebody's, and only falls back to the glyph when there is
             * no name either. The type scales with the photo as the header shrinks.
             */
            <span
              aria-label={name}
              className={cn(
                "flex aspect-square w-full items-center justify-center border-4 border-background bg-icon-chip font-semibold text-ink-foreground",
                square ? "rounded-lg" : "rounded-full",
              )}
              style={{ fontSize: `${Math.round(photoSize * 0.3)}px` }}
            >
              {initialsOf(name) || <User size={iconSize.xl} aria-hidden />}
            </span>
          )}
          {photoPick}
          {badge}
        </div>
        {title ?? (name ? <h1 className="mt-3 text-3 leading-tight">{name}</h1> : null)}
        {children}
      </div>
    </div>
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
  p: TalentProfile;
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
            src={sized(track.artwork, { width: 56 })}
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
          {track.duration ? (
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
            className="hit-area flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-subtle active:scale-95 transition-transform"
          >
            <ChevronDown
              size={iconSize.sm}
              className={cn("transition-transform duration-200", isExpanded && "rotate-180")}
              aria-hidden
            />
          </button>
          {/* Opens the track's own player; no media, nothing to play, no button. */}
          {track.media ? (
            <button
              type="button"
              onClick={onToggle}
              aria-label={playing ? `Close player for ${track.title}` : `Play ${track.title}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-ink-foreground shadow-xs active:scale-95 transition-transform"
            >
              {playing ? (
                <Pause size={iconSize.sm} aria-hidden />
              ) : (
                <Play size={iconSize.sm} aria-hidden />
              )}
            </button>
          ) : null}
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
                onPlay={() => recordPlay(track.id)}
              />
            </div>
          ) : (
            <p className="text-1 text-muted-foreground">No audio added to this track yet.</p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-1 text-1 text-foreground border-t border-border/40">
            {track.role ? <span className="font-semibold">Role: {track.role}</span> : null}
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
      <LogoMark className="w-2/5 max-w-16 text-ink-foreground" />
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
  const toggle = v.media ? () => setOpen((o) => !o) : undefined;
  const player =
    open && v.media ? (
      <div className="mt-3 animate-in fade-in duration-200">
        <MediaEmbed
          url={v.media}
          title={v.title}
          onOpen={() => recordWorkEvent(v.id, "link_click")}
          onPlay={() => recordPlay(v.id)}
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
              <img
                src={sized(v.thumb, { width: 412 })}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
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
          <img
            src={sized(v.thumb, { width: 412 })}
            alt={v.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
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
              src={sized(src, { width: 412 })}
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
            <img
              src={sized(src, { width: 412 })}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
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
          src={sized(p.cover, { width: 80 })}
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

/** The owner's prompt to ask past clients for a review, in the Reviews section. */
export function ReviewInviteCard() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-icon-chip text-ink-foreground">
        <MessageSquareQuote size={iconSize.md} aria-hidden />
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
      className="hit-area min-h-control-sm shrink-0 px-5 text-sm active:scale-95"
      onClick={onBook}
    >
      Book
    </Btn>
  ) : real ? (
    <BtnLink
      to="/services/$id/enquiry"
      params={{ id: s.id }}
      className={cn(
        "hit-area min-h-control-sm shrink-0 px-5 text-sm active:scale-95",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      Book
    </BtnLink>
  ) : (
    // With nothing to open (a preview, a service not saved yet), Book is disabled, not dead.
    <Btn
      disabled={disabled || !onEnquire}
      className="hit-area min-h-control-sm shrink-0 px-5 text-sm active:scale-95"
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
              <Check size={10} aria-hidden />
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
              className="hit-area block text-3 font-bold leading-snug text-foreground underline-offset-4 hover:underline"
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
              className="hit-area inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-1 font-semibold text-foreground hover:bg-subtle active:scale-95 transition-all"
            >
              <span>{expanded ? "Less" : "Details"}</span>
              <ChevronDown
                size={iconSize.xs}
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
                <Check size={14} className="mt-0.5 shrink-0 text-foreground" aria-hidden />
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
            <Price from inline price={s.from} amountClassName="text-3 font-bold text-foreground" />
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
      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-ink" />
      <div className="min-w-0">
        <h3 className="text-2">{e.title}</h3>
        <p className="text-1 font-semibold text-muted-foreground">{joinParts(e.org, e.period)}</p>
        <p className="mt-1 text-1 leading-relaxed text-muted-foreground">{e.detail}</p>
      </div>
    </div>
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
            className="hit-area mt-1 inline-block text-1 font-semibold text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
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
        </div>
        {footer ? <div className="pt-2.5">{footer}</div> : null}
      </div>
    </article>
  );
}

/**
 * A rating at a glance, from stored reviews only. `inline` is the one line a profile shows above
 * its review rail (nothing at all while there are no reviews); `full` is the Reviews screen's
 * summary with the big average and a bar per star.
 */
export function RatingSummary({
  average,
  count,
  distribution,
  variant = "full",
}: {
  average: number;
  count: number;
  /** Reviews per star, 5 to 1; the full summary draws a bar for each. */
  distribution?: { stars: number; count: number }[] | undefined;
  variant?: "full" | "inline" | undefined;
}) {
  const reviews = `${count} ${count === 1 ? "review" : "reviews"}`;
  if (variant === "inline") {
    if (!count) return null;
    return (
      <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
        <Star size={iconSize.sm} className="fill-foreground" aria-hidden />
        {average.toFixed(1)}
        <span className="font-normal text-muted-foreground">· {reviews}</span>
      </p>
    );
  }
  return (
    <Card className="space-y-3">
      <div className="flex items-end gap-3">
        <p className="text-4 font-bold leading-none">{count ? average.toFixed(1) : "—"}</p>
        <div className="min-w-0 flex-1 pb-1">
          <Stars value={average} />
          <p className="mt-1 truncate text-1 text-muted-foreground">
            {count ? reviews : "No reviews yet"}
          </p>
        </div>
      </div>
      {count && distribution ? (
        <div className="space-y-1.5">
          {distribution.map((d) => (
            <Meter
              key={d.stars}
              label={`${d.stars} star`}
              value={d.count}
              max={count}
              hint={`${d.count}`}
            />
          ))}
        </div>
      ) : null}
    </Card>
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

const linkIcons: Record<string, typeof Globe> = {
  youtube: Youtube,
  instagram: Instagram,
  spotify: AudioLines,
  soundcloud: AudioLines,
  apple_music: AudioLines,
};

/**
 * Streaming and social links, everywhere they appear: one divided list, a platform icon, the
 * platform, the handle. Links store a handle and no address yet, so the rows are not tappable.
 */
export function SocialLinks({
  links,
}: {
  links: { platform?: string | undefined; label: string; handle: string }[];
}) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg bg-subtle">
      {links.map((l) => {
        const Icon = (l.platform ? linkIcons[l.platform] : undefined) ?? Globe;
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

export function ShareSheet({
  p,
  open,
  onClose,
}: {
  p: TalentProfile;
  open: boolean;
  onClose: () => void;
}) {
  // Only rendered in the browser once opened, so window and navigator are there when it shows.
  const url = profileUrl(p.username);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  return (
    <Sheet open={open} onClose={onClose} title="Share profile">
      <div className="ink-gradient overflow-hidden rounded-lg border border-border">
        <div className="flex items-center gap-3 p-4 text-background">
          {p.photo ? (
            <img
              src={sized(p.photo, { width: 56 })}
              alt=""
              aria-hidden
              className="h-14 w-14 rounded-sm object-cover"
            />
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
          <QrCode value={url} size={112} label={`QR code for ${p.name}'s profile`} />
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

/**
 * The profile's More menu. Only actions that do something: copy the link, save to the shortlist
 * (saved_items) and report (reports). Blocking and restricting have no backend yet, so they show
 * disabled with the reason rather than closing the sheet as if they had worked.
 */
export function MoreSheet({
  open,
  onClose,
  name,
  username,
  profileId,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  username?: string | undefined;
  profileId?: string | undefined;
}) {
  const { signedIn } = useAuth();
  const [reporting, setReporting] = useState(false);
  const saveProfile = useServerFn(saveTarget);
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: () => saveProfile({ data: { targetType: "talent", targetId: profileId! } }),
    onSuccess: async () => {
      toast.success("Saved to your shortlist");
      await queryClient.invalidateQueries({ queryKey: ["saved"] });
      onClose();
    },
    onError: () => toast.error("Couldn't save. Try again."),
  });

  const row =
    "flex min-h-12 w-full items-center justify-between px-4 py-4 text-left text-sm font-medium disabled:text-muted-foreground";
  const close = () => {
    setReporting(false);
    onClose();
  };

  if (reporting && profileId) {
    return (
      <ReportSheet
        open={open}
        onClose={close}
        title={`Report ${name}`}
        subject={{ type: "profile", id: profileId }}
      />
    );
  }

  return (
    <Sheet open={open} onClose={close} title="More">
      <div className="divide-y divide-border rounded-lg bg-subtle">
        {username ? (
          <button
            type="button"
            className={row}
            onClick={() => {
              const url = profileUrl(username);
              if (!navigator.clipboard) {
                toast.error("Couldn't copy the link");
                return;
              }
              navigator.clipboard
                .writeText(url)
                .then(() => {
                  toast.success("Link copied");
                  onClose();
                })
                .catch(() => toast.error("Couldn't copy the link"));
            }}
          >
            Copy profile link
            <ChevronRight size={iconSize.sm} className="text-muted-foreground" aria-hidden />
          </button>
        ) : null}
        {profileId ? (
          <button
            type="button"
            className={row}
            disabled={save.isPending}
            onClick={() => {
              if (!signedIn) {
                toast("Sign in to save this profile");
                return;
              }
              save.mutate();
            }}
          >
            Save to shortlist
            <ChevronRight size={iconSize.sm} className="text-muted-foreground" aria-hidden />
          </button>
        ) : null}
        <button type="button" className={row} disabled>
          <span>
            Restrict {name}
            <span className="block text-1 font-normal">Not available yet</span>
          </span>
        </button>
        <button type="button" className={row} disabled>
          <span>
            Block {name}
            <span className="block text-1 font-normal">Not available yet</span>
          </span>
        </button>
        {profileId ? (
          <button
            type="button"
            className={`${row} text-destructive`}
            onClick={() => {
              if (!signedIn) {
                toast("Sign in to report a profile");
                return;
              }
              setReporting(true);
            }}
          >
            Report profile
            <ChevronRight size={iconSize.sm} className="text-muted-foreground" aria-hidden />
          </button>
        ) : null}
      </div>
    </Sheet>
  );
}

/* ── Owner mode ────────────────────────────────────────────── */

/**
 * How complete a profile is, always from `profileGaps` (src/lib/profile-map.ts) — the same ten
 * checks on Home, profile edit and the end of onboarding, so the number never disagrees with
 * itself. The bar, then what is still missing, then (when `cta`) the way to fill it in.
 */
export function ProfileCompletion({
  gaps,
  title = "Finish your profile",
  cta = false,
}: {
  gaps: ProfileGaps;
  title?: string | undefined;
  /** A Complete Profile button to profile edit. */
  cta?: boolean | undefined;
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-xs">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-1 font-bold text-foreground">{title}</p>
        <span className="tabular-nums text-1 font-bold text-foreground">{gaps.percent}%</span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-subtle"
        role="progressbar"
        aria-valuenow={gaps.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profile completion"
      >
        <div className="h-full rounded-full bg-foreground" style={{ width: `${gaps.percent}%` }} />
      </div>
      {gaps.missing.length ? (
        <p className="mt-2 text-1 leading-relaxed text-muted-foreground">
          Still missing: {gaps.missing.map((m) => m.label).join(", ")}.
        </p>
      ) : null}
      {cta && gaps.missing.length ? (
        <BtnLink to="/profile/edit" variant="outline" className="mt-3 w-full">
          Complete Profile
        </BtnLink>
      ) : null}
    </div>
  );
}
