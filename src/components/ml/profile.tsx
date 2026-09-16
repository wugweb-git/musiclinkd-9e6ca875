import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
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
import { Price } from "./kit";
import type { PriceParts } from "@/lib/price";
import { cn, joinParts } from "@/lib/utils";
import { LogoMark } from "./logo";
import { roleIcon } from "@/lib/role-icons";
import { useTaxonomy } from "@/lib/taxonomy";
import { useServerFn } from "@tanstack/react-start";
import { saveMyProfile } from "@/lib/portfolio.functions";
import {
  PROFILE_IMAGE_ACCEPT,
  uploadProfileImage,
  type ProfileImageKind,
} from "@/lib/profile-images";

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

/**
 * A stacked profile section: full-bleed block, thick divider under it, the title with the owner's
 * edit pencil on the same row, and an optional collapse for the sections people skip past.
 */
export function StackSection({
  title,
  editTo,
  collapsible = false,
  defaultOpen = true,
  showAll,
  onShowAll,
  children,
}: {
  title: string;
  /** Owner only: where editing this section happens. Visitors pass nothing. */
  editTo?: "/profile/edit" | undefined;
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** Footer link label, e.g. "Show all tracks". */
  showAll?: string | undefined;
  onShowAll?: (() => void) | undefined;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = `${title.replace(/\s+/g, "-").toLowerCase()}-body`;
  return (
    <section className="-mx-5 border-b-8 border-subtle bg-card px-5 py-5">
      <div className="flex items-center gap-1">
        <h2 className="min-w-0 flex-1 text-2.5 font-bold">{title}</h2>
        {editTo ? (
          <IconBtnLink to={editTo} label={`Edit ${title}`} variant="ghost" className="h-10 w-10">
            <Pencil size={17} aria-hidden />
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
              size={18}
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
        <button
          type="button"
          onClick={onShowAll}
          className="link-action mt-4 flex w-full items-center justify-center gap-1 border-t border-border pt-3 text-sm font-semibold text-pink-strong"
        >
          {showAll}
          <ChevronRight size={15} aria-hidden />
        </button>
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
          className="mt-3 min-h-11 text-1"
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
    <div className="animate-pulse" aria-busy="true" aria-label="Loading profile">
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
      <BadgeCheck size={12} aria-hidden />
      {compact ? "Verified" : tier}
    </span>
  );
}

/** Busy and Touring mean the person is not taking work; everything else is open. */
export function isOpenForWork(status?: string | undefined) {
  return Boolean(status) && status !== "Busy" && status !== "Touring";
}

/** Said, in so many words, that they are not taking work. An unset status is not a no. */
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
  Busy: "Busy",
  Touring: "Touring",
};

export function StatusBadge({ status }: { status: string }) {
  const open = isOpenForWork(status);
  const Icon = open ? CircleCheck : CircleSlash;
  return (
    <span
      className={`pill shrink-0 gap-1 ${
        open ? "bg-success-container text-success-strong" : "bg-subtle text-muted-foreground"
      }`}
      title={status}
    >
      <Icon size={12} aria-hidden />
      {availabilityWord[status] ?? status}
    </span>
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
    subtle: "bg-subtle text-foreground",
    pink: "bg-subtle text-foreground",
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
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
      {children}
    </div>
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
      <span className="pill bg-subtle text-muted-foreground">{label}</span>
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
 */
function ImagePickButton({
  kind,
  label,
  className,
  children,
  onChanged,
}: {
  kind: ProfileImageKind;
  label: string;
  className?: string;
  children: ReactNode;
  onChanged: (url: string) => void;
}) {
  const save = useServerFn(saveMyProfile);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadProfileImage(kind, file);
      await save({ data: kind === "avatar" ? { avatar_url: url } : { cover_url: url } });
      onChanged(url);
      toast.success(kind === "avatar" ? "Profile photo updated" : "Cover updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "That upload didn't work. Try again.");
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
        className="sr-only"
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {busy ? <Loader2 size={15} className="animate-spin" aria-hidden /> : children}
    </label>
  );
}

/** The roles someone picked, each with the icon its taxonomy entry carries. */
function RoleLine({ p }: { p: PersonProfile }) {
  const { options } = useTaxonomy();
  const roles = [p.primaryRole, ...p.secondaryRoles].filter(Boolean);
  const slugs = p.roleSlugs ?? [];
  if (!roles.length) return null;
  return (
    <ul className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold">
      {roles.map((role, i) => {
        const slug = slugs[i];
        const option = slug ? options?.["person_types"]?.find((o) => o.slug === slug) : undefined;
        const Icon = slug ? roleIcon(option ?? { slug, metadata: null }) : null;
        return (
          <li key={role} className="flex items-center gap-1.5">
            {Icon ? <Icon size={14} strokeWidth={1.75} aria-hidden /> : null}
            {role}
          </li>
        );
      })}
    </ul>
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

export function ProfileHero({
  p,
  owner,
  onShare,
  onMore,
  back,
  onImageChanged,
}: {
  p: PersonProfile;
  owner?: boolean;
  /** Owner only: called with the new URL after a photo or cover upload. */
  onImageChanged?: ((kind: ProfileImageKind, url: string) => void) | undefined;
  /** Left out when there is no username to share. */
  onShare?: (() => void) | undefined;
  onMore?: (() => void) | undefined;
  back?: string | undefined;
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
        {p.cover ? (
          <>
            <img src={p.cover} alt={`${p.name} cover`} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-ink/10" />
          </>
        ) : (
          <div className="h-full w-full bg-subtle" />
        )}
        {back ? (
          <Link
            to={back}
            aria-label="Back"
            className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-card/90"
          >
            <ArrowLeft size={18} aria-hidden />
          </Link>
        ) : null}
        <div className="absolute right-5 top-5 flex gap-2">
          {/* The owner edits the cover from the cover itself, the way people expect. */}
          {owner && onImageChanged ? (
            <ImagePickButton
              kind="cover"
              label="Change cover photo"
              className="h-11 w-11 bg-card/90 text-foreground"
              onChanged={(url) => onImageChanged("cover", url)}
            >
              <Pencil size={16} aria-hidden />
            </ImagePickButton>
          ) : null}
          {/* The owner shares from the actions row, so the hero has no second Share. */}
          {onShare && !owner ? (
            <IconBtn label="Share Profile" variant="plain" className="bg-card/90" onClick={onShare}>
              <Share2 size={16} aria-hidden />
            </IconBtn>
          ) : null}
          {onMore ? (
            <IconBtn label="More Options" variant="plain" className="bg-card/90" onClick={onMore}>
              <MoreHorizontal size={18} aria-hidden />
            </IconBtn>
          ) : null}
        </div>
      </div>

      <div className="-mt-16 px-5">
        <div className="relative motion-reduce:!w-34" style={{ width: `${photoSize}px` }}>
          {p.photo ? (
            <img
              src={p.photo}
              alt={p.name}
              className="aspect-square w-full rounded-full border-4 border-background object-cover motion-reduce:!h-34"
            />
          ) : (
            <span className="flex aspect-square w-full items-center justify-center rounded-full border-4 border-background bg-card text-muted-foreground">
              <User size={36} aria-label={p.name} />
            </span>
          )}
          {owner && onImageChanged ? (
            <ImagePickButton
              kind="avatar"
              label="Change profile photo"
              className="absolute -bottom-1 -left-1 h-9 w-9 border border-border bg-card text-foreground"
              onChanged={(url) => onImageChanged("avatar", url)}
            >
              <Camera size={15} aria-hidden />
            </ImagePickButton>
          ) : null}
          {isVerifiedTier(p.verification) ? (
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground">
              <BadgeCheck size={13} aria-label="Verified" />
            </span>
          ) : null}
        </div>

        {p.name || isVerifiedTier(p.verification) || p.availability ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            {p.name ? <h1 className="text-3 leading-tight">{p.name}</h1> : null}
            {isVerifiedTier(p.verification) ? <VerificationBadge tier={p.verification} /> : null}
            {/* Availability sits with the name, where people look first. */}
            {p.availability ? <StatusBadge status={p.availability} /> : null}
          </div>
        ) : null}
        {p.username ? <p className="mt-0.5 text-sm text-muted-foreground">@{p.username}</p> : null}
        <RoleLine p={p} />
        {/* The headline is the one line someone writes about themselves; About carries the rest. */}
        {p.headline && p.headline !== p.primaryRole ? (
          <p className="mt-1.5 text-sm leading-snug text-foreground">{p.headline}</p>
        ) : null}
        {p.location || p.yearsActive ? (
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-1 text-muted-foreground">
            {p.location ? (
              <span className="flex items-center gap-1">
                <MapPin size={13} className="shrink-0" aria-hidden />
                {p.location}
              </span>
            ) : null}
            {p.yearsActive ? (
              <span className="flex items-center gap-1">
                <CalendarDays size={13} className="shrink-0" aria-hidden />
                {p.yearsActive} active
              </span>
            ) : null}
          </p>
        ) : null}
        {owner && p.privacy !== "Public" ? (
          <p className="mt-2 text-1 font-semibold text-warn">Visibility: {p.privacy}</p>
        ) : null}
      </div>
    </header>
  );
}

export function StatRow({ p }: { p: PersonProfile }) {
  const stats = [
    { label: "Connections", value: p.stats.connections },
    { label: "Followers", value: p.stats.followers },
    { label: "Plays", value: p.stats.plays },
    // No credits reads "—", like the other empty stats, not "0".
    { label: "Credits", value: p.stats.credits ? String(p.stats.credits) : "—" },
  ];
  return (
    <div className="mt-4 grid grid-cols-4 gap-2 rounded-lg border border-border bg-card p-3">
      {stats.map((s) => (
        <div key={s.label} className="text-center">
          <p className="text-2 font-bold leading-tight">{s.value}</p>
          <p className="mt-0.5 text-1 text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Portfolio pieces ──────────────────────────────────────── */

export function FeaturedCard({ featured }: { featured: NonNullable<PersonProfile["featured"]> }) {
  return (
    <article className="relative overflow-hidden rounded-lg border border-border">
      <img
        src={featured.image}
        alt={featured.title}
        className="h-44 w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
      <div className="absolute inset-x-4 bottom-4 text-background">
        <span className="rounded-full bg-primary pill text-primary-foreground">
          Featured {featured.kind}
        </span>
        <h3 className="mt-2 text-2 text-background">{featured.title}</h3>
        <p className="text-1 opacity-85">{featured.meta}</p>
      </div>
    </article>
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
  return (
    <article className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      {track.artwork ? (
        <img
          src={track.artwork}
          alt=""
          aria-hidden
          loading="lazy"
          className="h-14 w-14 rounded-md object-cover"
        />
      ) : (
        <NoCover className="h-14 w-14 shrink-0 rounded-md" />
      )}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-2">{track.title}</h3>
        <p className="truncate text-1 text-muted-foreground">
          {joinParts(track.role, track.project)}
        </p>
        {track.duration ? (
          <p className="mt-0.5 text-1 text-muted-foreground">{track.duration}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
      >
        {playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
      </button>
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
  if (layout === "row") {
    return (
      <article className="flex gap-3">
        <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-md bg-subtle">
          {v.thumb ? (
            <img src={v.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <NoCover className="h-full w-full" />
          )}
          {v.duration ? (
            <span className="absolute bottom-1 left-1 rounded-sm bg-ink/80 px-1.5 py-0.5 text-0 font-semibold text-background">
              {v.duration}
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <h3 className="line-clamp-2 text-2 font-semibold leading-snug">{v.title}</h3>
          <p className="mt-1 truncate text-1 text-muted-foreground">{v.context}</p>
        </div>
      </article>
    );
  }
  return (
    <article
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card",
        layout === "grid" ? "w-full" : "w-[220px] shrink-0",
      )}
    >
      <div className="relative h-32">
        {v.thumb ? (
          <img src={v.thumb} alt={v.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <NoCover className="h-full w-full" />
        )}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-card/90">
            <Play size={16} aria-hidden />
          </span>
        </span>
        {v.duration ? (
          <span className="absolute bottom-2 right-2 rounded-full bg-ink/80 px-2 py-0.5 text-1 font-semibold text-background">
            {v.duration}
          </span>
        ) : null}
      </div>
      <div className="p-3">
        <h3 className="truncate text-1">{v.title}</h3>
        <p className="truncate text-1 text-muted-foreground">{v.context}</p>
      </div>
    </article>
  );
}

export function GalleryGrid({ images }: { images: string[] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`Portfolio work ${i + 1}`}
          loading="lazy"
          className={`w-full rounded-lg object-cover ${i === 0 ? "col-span-2 row-span-2 h-full min-h-[168px]" : "h-20"}`}
        />
      ))}
    </div>
  );
}

export function ProjectCard({ p }: { p: ProjectItem }) {
  return (
    <article className="flex gap-3 rounded-lg border border-border bg-card p-3">
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

export function ServiceCard({ s, onEnquire }: { s: ServiceItem; onEnquire: () => void }) {
  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-2">{s.name}</h3>
        {s.from ? (
          <Price
            price={s.from}
            align="end"
            className="shrink-0"
            amountClassName="text-1 font-bold"
          />
        ) : (
          <span className="shrink-0 text-1 font-semibold text-muted-foreground">On enquiry</span>
        )}
      </div>
      {s.description ? (
        <p className="mt-1 text-1 leading-relaxed text-muted-foreground">{s.description}</p>
      ) : null}
      {s.mode || s.turnaround || s.availability ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {s.mode ? <TagChip>{s.mode}</TagChip> : null}
          {s.turnaround ? <TagChip>{s.turnaround}</TagChip> : null}
          {s.availability ? <TagChip tone="pink">{s.availability}</TagChip> : null}
        </div>
      ) : null}
      <Btn variant="outline" className="mt-3 w-full min-h-11 text-1" onClick={onEnquire}>
        Enquire
      </Btn>
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

export function ReviewCard({ r }: { r: ReviewItem }) {
  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-2">{r.by}</h3>
          <p className="truncate text-1 text-muted-foreground">{r.org}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-1 font-semibold text-warn">
          <Star size={12} fill="currentColor" aria-hidden />
          {r.stars.toFixed(1)}
        </span>
      </div>
      {r.context ? (
        <p className="pill mt-1.5 bg-subtle text-muted-foreground">{r.context}</p>
      ) : null}
      <p className="mt-2 text-1 leading-relaxed text-muted-foreground">{r.text}</p>
      {r.response ? (
        <div className="mt-3 rounded-lg bg-subtle p-3">
          <p className="pill bg-subtle text-muted-foreground">Response</p>
          <p className="mt-1 text-1 text-muted-foreground">{r.response}</p>
        </div>
      ) : null}
    </article>
  );
}

export function OpportunityCard({ o }: { o: OpportunityItem }) {
  return (
    <article
      className={`rounded-lg border border-border p-4 ${o.tone === "seeking" ? "bg-subtle" : "bg-card"}`}
    >
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
  return (
    <Link
      to={m.to}
      {...(m.params ? { params: m.params } : {})}
      className="flex w-[210px] shrink-0 items-center gap-3 rounded-lg border border-border bg-card p-3"
    >
      {m.image ? (
        <img
          src={m.image}
          alt=""
          aria-hidden
          loading="lazy"
          className="h-12 w-12 rounded-md object-cover"
        />
      ) : (
        <div aria-hidden className="h-12 w-12 shrink-0 rounded-md bg-subtle" />
      )}
      <div className="min-w-0">
        <h3 className="truncate text-1">{m.title}</h3>
        {m.meta ? <p className="truncate text-1 text-muted-foreground">{m.meta}</p> : null}
        <Price price={m.price} amountClassName="text-1 font-semibold" />
      </div>
    </Link>
  );
}

export function SocialLinks({ links }: { links: { label: string; handle: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => (
        <button
          key={l.label}
          type="button"
          disabled
          title="Linking out is not wired up yet"
          className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-1 font-semibold disabled:opacity-64"
        >
          {l.label}
          <span className="text-muted-foreground">{l.handle}</span>
        </button>
      ))}
    </div>
  );
}

/* ── Share / QR ────────────────────────────────────────────── */

function QrBlock({ seed }: { seed: string }) {
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
            <img src={p.photo} alt="" aria-hidden className="h-14 w-14 rounded-md object-cover" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-md bg-background/15">
              <User size={22} aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-2 text-background">{p.name}</h3>
              {isVerifiedTier(p.verification) ? (
                <BadgeCheck size={14} aria-label="Verified" />
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
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
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
              <ChevronRight size={16} className="text-muted-foreground" aria-hidden />
            </button>
          );
        })}
      </div>
      <p className="mt-3 flex items-center gap-2 px-1 text-1 text-muted-foreground">
        <ShieldCheck size={13} aria-hidden />
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
    <div className="rounded-lg border border-border bg-subtle p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-2">Your profile is {percent}% complete</h3>
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
              className="state-layer flex min-h-10 items-center gap-2 rounded-md text-1 text-muted-foreground transition-transform duration-125 ease-standard active:scale-98"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {m.label}
              <ChevronRight size={14} className="ml-auto shrink-0" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <BtnLink to="/profile/edit" className="mt-3 min-h-11 w-full text-1">
        Complete Profile
      </BtnLink>
    </div>
  );
}
