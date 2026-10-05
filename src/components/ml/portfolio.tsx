import { Link, useNavigate } from "@tanstack/react-router";
import {
  BriefcaseBusiness,
  Clapperboard,
  Disc3,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Link2,
  Mic,
  Music2,
  PenLine,
  EyeOff,
  Eye,
  Share2,
  Star,
  Trash2,
  X,
  type LucideIcon,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Play,
  Pause,
  Smartphone,
  Heart,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { myPortfolioLikes, portfolioLikeCounts, toggleLike } from "@/lib/portfolio.functions";
import { Btn, BtnLink, Chip, IconBtn, IconBtnLink, Sheet } from "@/components/ml/ui";
import { Card, StatusPill } from "@/components/ml/kit";
import { MediaEmbed } from "./media-embed";
import { playsCountedFromLabel } from "@/lib/plays-cutoff";
import { cn, joinParts } from "@/lib/utils";
import {
  analyticsFor,
  FEATURED_LIMIT,
  mediaStateCopy,
  workType,
  workTypes,
  type MediaState,
  type PortfolioItem,
  type WorkAnalyticsFigures,
} from "@/data/portfolio";
import { showDemoControls } from "@/lib/dev";
import { searchPeople } from "@/lib/profile-groups.functions";
import { iconSize } from "@/lib/tokens";
import { DrawerList, DrawerOptionRow } from "./drawer-list";
import { imageWidth, sized } from "@/lib/image-url";

// eslint-disable-next-line react-refresh/only-export-components -- helper intentionally co-located with its component
export { analyticsFor };

/* ---------------- Work type icon ---------------------------------------- */

const workIcons: Record<string, LucideIcon> = {
  track: Music2,
  album: Disc3,
  video: Clapperboard,
  reel: Smartphone,
  performance: Mic,
  project: FolderOpen,
  client: BriefcaseBusiness,
  "case-study": FileText,
  writing: PenLine,
  image: ImageIcon,
  link: Link2,
};

/** A work type's line icon on its own, for inline use (a chip, a line of text). */
// eslint-disable-next-line react-refresh/only-export-components -- helper intentionally co-located with its component
export function workIconFor(kind: string): LucideIcon {
  return workIcons[kind] ?? Music2;
}

/** A work type's line icon in a grey tile, in place of the emoji in `workTypes`. */
export function WorkTypeIcon({
  kind,
  size = "md",
  tone = "light",
}: {
  kind: string;
  size?: "md" | "lg";
  /** "dark" sits full-bleed on a photo-style card ground; "light" is the boxed default. */
  tone?: "light" | "dark";
}) {
  const Icon = workIcons[kind] ?? Music2;
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center",
        tone === "dark" ? "bg-ink text-background" : "bg-background text-foreground",
        size === "lg" ? "h-16 w-16 rounded-lg" : "h-12 w-12 rounded-sm",
      )}
    >
      <Icon size={size === "lg" ? 24 : 20} />
    </span>
  );
}

/** Add work: the type list in a bottom drawer, one shared option row per type. */
export function WorkTypeSheet({
  open,
  onClose,
  from,
}: {
  open: boolean;
  onClose: () => void;
  /** Passed straight through so the onboarding hand-off survives the drawer. */
  from?: "onboarding";
}) {
  const navigate = useNavigate();
  return (
    <Sheet open={open} onClose={onClose} title="Add work">
      <DrawerList label="Work types">
        {workTypes.map((t) => (
          <DrawerOptionRow
            key={t.kind}
            option={{ value: t.kind, label: t.label, icon: workIcons[t.kind] ?? Music2 }}
            onClick={() => {
              onClose();
              void navigate({
                to: "/portfolio/new/$kind",
                params: { kind: t.kind },
                ...(from ? { search: { from } } : {}),
              });
            }}
          />
        ))}
      </DrawerList>
    </Sheet>
  );
}

/**
 * Someone else's work as a public card (phone plan 5.3): square cover (the type icon when there is
 * none), type, title and whose it is. The body opens the work; Like and Share sit in a footer
 * beside the link, never inside it. Used where community work is listed (Discover, Discover → Music).
 */
export function WorkLinkRow({
  work,
  likes,
}: {
  work: {
    id: string;
    title: string;
    kind: string;
    display_name: string | null;
    cover_url?: string | null | undefined;
  };
  /** The list's like data (`useWorkLikes`); omitted, no Like shows. */
  likes?: WorkLikes | undefined;
}) {
  const t = workType(work.kind);
  return (
    <div className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-xs">
      <Link
        to="/portfolio/$id"
        params={{ id: work.id }}
        className="state-layer flex items-center gap-3 p-3 active:scale-[0.99]"
      >
        {work.cover_url ? (
          <img
            src={sized(work.cover_url, { width: 112 })}
            alt=""
            loading="lazy"
            decoding="async"
            className="aspect-square h-14 w-14 shrink-0 rounded-sm object-cover"
          />
        ) : (
          <WorkTypeIcon kind={work.kind} size="lg" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs uppercase text-muted-foreground">{t.label}</span>
          <span className="block truncate text-sm font-semibold">{work.title}</span>
          {work.display_name ? (
            <span className="block truncate text-1 text-muted-foreground">{work.display_name}</span>
          ) : null}
        </span>
      </Link>
      <div className="flex items-center gap-1 border-t border-border/60 px-2 py-1">
        {likes?.available ? <LikeButton id={work.id} likes={likes} /> : null}
        <ShareWorkButton id={work.id} title={work.title} />
      </div>
    </div>
  );
}

export type WorkLikes = {
  available: boolean;
  counts: Record<string, number>;
  mine: Set<string>;
  toggle: (id: string, liked: boolean) => void;
};

/**
 * Like data for a list of works, in one read: whether likes exist yet, each work's count, and
 * which ones you liked. Optimistic toggle with rollback.
 */
export function useWorkLikes(ids: string[]): WorkLikes {
  const { signedIn } = useAuth();
  const queryClient = useQueryClient();
  const loadCounts = useServerFn(portfolioLikeCounts);
  const loadMine = useServerFn(myPortfolioLikes);
  const save = useServerFn(toggleLike);
  const key = ids.join(",");
  const counts = useQuery({
    queryKey: ["likes", "counts", key],
    queryFn: () => loadCounts({ data: { ids } }),
    enabled: ids.length > 0,
  });
  const mine = useQuery({
    queryKey: ["likes", "mine", key],
    queryFn: () => loadMine({ data: { ids } }),
    enabled: signedIn && ids.length > 0 && counts.data?.available === true,
  });
  const act = useMutation({
    mutationFn: (v: { id: string; liked: boolean }) => save({ data: v }),
    onMutate: ({ id, liked }) => {
      queryClient.setQueryData<string[]>(["likes", "mine", key], (prev = []) =>
        liked ? [...prev, id] : prev.filter((x) => x !== id),
      );
      queryClient.setQueryData<{ available: boolean; counts: Record<string, number> }>(
        ["likes", "counts", key],
        (prev) =>
          prev && {
            ...prev,
            counts: {
              ...prev.counts,
              [id]: Math.max(0, (prev.counts[id] ?? 0) + (liked ? 1 : -1)),
            },
          },
      );
    },
    onError: () => toast.error("That didn't save. Try again."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["likes"] }),
  });
  return {
    available: counts.data?.available ?? false,
    counts: counts.data?.counts ?? {},
    mine: new Set(mine.data ?? []),
    toggle: (id, liked) => {
      if (!act.isPending) act.mutate({ id, liked });
    },
  };
}

/** Heart outline ⇄ filled in brand pink; the total shows once you have liked it (owner, 5 Oct). */
function LikeButton({ id, likes }: { id: string; likes: WorkLikes }) {
  const { signedIn } = useAuth();
  const liked = likes.mine.has(id);
  const count = likes.counts[id] ?? 0;
  if (!signedIn)
    return (
      <IconBtnLink to="/welcome" label="Like" variant="plain">
        <Heart size={iconSize.sm} aria-hidden />
      </IconBtnLink>
    );
  return (
    <span className="flex items-center">
      <IconBtn
        label={liked ? "Unlike" : "Like"}
        variant="plain"
        onClick={() => likes.toggle(id, !liked)}
      >
        <Heart
          size={iconSize.sm}
          className={liked ? "text-brand" : undefined}
          fill={liked ? "currentColor" : "none"}
          aria-hidden
        />
      </IconBtn>
      {liked && count > 0 ? (
        <span className="pr-1 text-xs text-muted-foreground">{count.toLocaleString("en-IN")}</span>
      ) : null}
    </span>
  );
}

/** The phone's share sheet where there is one; otherwise the link is copied. */
function ShareWorkButton({ id, title }: { id: string; title: string }) {
  return (
    <IconBtn
      label="Share"
      variant="plain"
      onClick={() => {
        const url = `${window.location.origin}/portfolio/${id}`;
        if (typeof navigator.share === "function") {
          navigator.share({ title, url }).catch(() => undefined);
          return;
        }
        navigator.clipboard
          .writeText(url)
          .then(() => toast.success("Link copied"))
          .catch(() => toast.error("Couldn't copy the link"));
      }}
    >
      <Share2 size={iconSize.sm} aria-hidden />
    </IconBtn>
  );
}

/* ---------------- Work card (WHAT · WHO · ROLE · MEDIA · CONTEXT) ------- */

/*
 * Two states. Resting: cover (or type icon), title, type. Tapped: expands in place with the player
 * when the link's source embeds, or an Open link to a new tab when it doesn't.
 */
/**
 * One work, with everything you can do to it. Featuring happens here on the list — it is a
 * property of the work, and it saves as it is tapped.
 */
export function WorkCard({
  item,
  actions,
}: {
  item: PortfolioItem;
  /** Omitted for a read-only list (the signed-out demo, or somebody else's work). */
  actions?: {
    onFeature: () => void;
    onTogglePublished: () => void;
    onShare: () => void;
    onDelete: () => void;
    /** False when three works already lead and this one is not one of them. */
    canFeature: boolean;
    busy: boolean;
    /** Move one place up or down the list; omitted at the top or bottom. */
    onMoveUp?: (() => void) | undefined;
    onMoveDown?: (() => void) | undefined;
  };
}) {
  const t = workType(item.kind);
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-elevation-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="state-layer block w-full p-3 text-left transition-transform duration-125 ease-standard active:scale-97"
      >
        <div className="flex min-w-0 gap-3">
          {item.cover_url ? (
            <img
              src={sized(item.cover_url, { width: 64 })}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-16 w-16 shrink-0 rounded-sm object-cover"
            />
          ) : (
            <WorkTypeIcon kind={item.kind} size="lg" />
          )}
          <div className="min-w-0 flex-1">
            <div className="min-w-0">
              <h3 className="truncate text-2 font-semibold">{item.title}</h3>
              <span className="mt-1 flex flex-wrap items-center gap-1.5">
                {item.featured ? (
                  <span className="pill bg-background text-muted-foreground">Featured</span>
                ) : null}
                <StatusPill
                  label={item.published ? "Published" : "Draft"}
                  tone={item.published ? "good" : "warn"}
                  icon={<></>}
                  className="shrink-0"
                />
              </span>
            </div>
            <p className="mt-0.5 text-1 text-muted-foreground">
              {t.label}
              {item.release_year ? ` · ${item.release_year}` : ""}
            </p>
            {item.role ? (
              <p className="mt-1 truncate text-1 font-semibold text-foreground">{item.role}</p>
            ) : null}
            {item.description ? (
              <p className="mt-1 line-clamp-2 text-1 text-muted-foreground">{item.description}</p>
            ) : null}
            {item.collaborators.length ? (
              <p className="mt-1.5 truncate text-1 text-muted-foreground">
                with {item.collaborators.join(", ")}
              </p>
            ) : null}
          </div>
          <ChevronDown
            size={iconSize.md}
            aria-hidden
            className={`mt-0.5 shrink-0 text-muted-foreground transition-transform duration-200 ease-standard ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {open ? (
        <div className="animate-in fade-in space-y-3 px-4 pb-4 duration-200">
          {item.media_url ? <MediaEmbed url={item.media_url} title={item.title} /> : null}
          <div className="flex items-center gap-2">
            <BtnLink
              to="/portfolio/$id"
              params={{ id: item.id }}
              variant="outline"
              className="min-h-control-sm flex-1"
            >
              Details
            </BtnLink>
            {actions ? (
              <>
                <IconBtnLink
                  label="Edit"
                  to="/portfolio/$id/edit"
                  params={{ id: item.id }}
                  variant="outline"
                >
                  <PenLine size={iconSize.sm} aria-hidden />
                </IconBtnLink>
                <IconBtn
                  label={item.featured ? "Remove from featured" : "Feature this"}
                  variant={item.featured ? "ink" : "outline"}
                  disabled={actions.busy || (!item.featured && !actions.canFeature)}
                  onClick={actions.onFeature}
                >
                  <Star
                    size={iconSize.sm}
                    fill={item.featured ? "currentColor" : "none"}
                    aria-hidden
                  />
                </IconBtn>
                <IconBtn
                  label={item.published ? "Hide from your profile" : "Publish to your profile"}
                  variant="outline"
                  disabled={actions.busy}
                  onClick={actions.onTogglePublished}
                >
                  {item.published ? (
                    <EyeOff size={iconSize.sm} aria-hidden />
                  ) : (
                    <Eye size={iconSize.sm} aria-hidden />
                  )}
                </IconBtn>
                <IconBtn label="Share this work" variant="outline" onClick={actions.onShare}>
                  <Share2 size={iconSize.sm} aria-hidden />
                </IconBtn>
                <IconBtn
                  label="Delete this work"
                  variant="outline"
                  disabled={actions.busy}
                  onClick={actions.onDelete}
                >
                  <Trash2 size={iconSize.sm} aria-hidden />
                </IconBtn>
              </>
            ) : null}
          </div>
          {actions && (actions.onMoveUp || actions.onMoveDown) ? (
            <div className="flex items-center justify-end gap-2">
              <IconBtn
                label="Move up"
                variant="outline"
                disabled={actions.busy || !actions.onMoveUp}
                onClick={() => actions.onMoveUp?.()}
              >
                <ArrowUp size={iconSize.sm} aria-hidden />
              </IconBtn>
              <IconBtn
                label="Move down"
                variant="outline"
                disabled={actions.busy || !actions.onMoveDown}
                onClick={() => actions.onMoveDown?.()}
              >
                <ArrowDown size={iconSize.sm} aria-hidden />
              </IconBtn>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- States ------------------------------------------------ */

export function PortfolioSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-busy="true" aria-label="Loading portfolio">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-lg border border-border bg-subtle" />
      ))}
    </div>
  );
}

export function SelectableChips({
  options,
  value,
  onToggle,
  multi = true,
}: {
  options: string[];
  value: string[];
  onToggle: (v: string) => void;
  multi?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2" role={multi ? "group" : "radiogroup"}>
      {options.map((o) => (
        <Chip key={o} active={value.includes(o)} onClick={() => onToggle(o)}>
          {o}
        </Chip>
      ))}
    </div>
  );
}

/* ---------------- Portfolio header -------------------------------------- */

export function PortfolioHeader({
  total,
  published,
  drafts,
  featured,
  visibility,
}: {
  total: number;
  published: number;
  drafts: number;
  featured: number;
  /** The stored visibility, when the screen has it. Never assumed: no value, no line. */
  visibility?: string | undefined;
}) {
  const stat = (n: number, label: string) => (
    <div key={label} className="min-w-0">
      <p className="text-3 leading-none tabular-nums">{n}</p>
      <p className="mt-1 truncate text-1 text-muted-foreground">{label}</p>
    </div>
  );
  return (
    <section className="border-y border-border bg-card py-4">
      <div className="grid grid-cols-4 gap-2">
        {stat(total, "Works")}
        {stat(published, "Published")}
        {stat(drafts, "Drafts")}
        {stat(featured, "Featured")}
      </div>
      {visibility ? (
        <p className="mt-4 text-1 text-muted-foreground">
          Portfolio visibility: <span className="font-semibold text-foreground">{visibility}</span>
        </p>
      ) : null}
    </section>
  );
}

/* ---------------- Media state pill + uploader --------------------------- */

/** The input box of the shared fields (TextField, InlineField), for inputs inside portfolio controls. */
const fieldBox =
  "h-12 w-full rounded-sm bg-subtle px-3.5 text-2 outline-none transition-[border-color,box-shadow] duration-125 ease-standard placeholder:text-muted-foreground/60 focus:border-foreground focus:ring-1 focus:ring-foreground [@media(hover:hover)]:hover:border-muted-foreground";

export function MediaStatePill({ state }: { state: MediaState }) {
  const c = mediaStateCopy[state];
  // mediaStateCopy's tone names ("good"/"warn"/"bad", else neutral) are StatusPill's Tone names.
  const tone = c.tone === "good" || c.tone === "warn" || c.tone === "bad" ? c.tone : "neutral";
  return <StatusPill label={c.label} tone={tone} />;
}

/* ---------------- Players ----------------------------------------------- */

/* ---------------- Credits & contributors -------------------------------- */

export function CreditRow({ name, role }: { name: string; role?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-subtle px-4 py-3">
      <span className="min-w-0 truncate text-sm font-semibold">{name}</span>
      {role ? <span className="shrink-0 text-1 text-muted-foreground">{role}</span> : null}
    </div>
  );
}

export function ContributorPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const findPeople = useServerFn(searchPeople);
  // The box says it searches MusicLinkd, so it searches MusicLinkd. It used to filter six names
  // written into the app, most of whom are not on it, so crediting a real collaborator was
  // impossible — every one of them fell through to "not on MusicLinkd yet".
  useEffect(() => {
    const t = window.setTimeout(() => setTerm(q.trim()), 250);
    return () => window.clearTimeout(t);
  }, [q]);
  const people = useQuery({
    queryKey: ["people-search", term],
    queryFn: () => findPeople({ data: { q: term, limit: 8 } }),
    enabled: term.length >= 2,
  });
  const matches = (people.data?.people ?? []).filter((p) => !value.includes(p.name));
  const add = (name: string) => {
    if (!value.includes(name)) onChange([...value, name]);
    setQ("");
    setTerm("");
  };
  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search people and studios on MusicLinkd"
        aria-label="Search contributors"
        className={fieldBox}
      />
      {value.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(value.filter((v) => v !== n))}
              className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-1 font-semibold text-ink-foreground"
              aria-label={`Remove ${n}`}
            >
              {n} <X size={iconSize.xs} aria-hidden />
            </button>
          ))}
        </div>
      ) : null}
      {q.trim() ? (
        <div className="mt-3 space-y-2">
          {matches.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => add(c.name)}
              className="state-layer flex w-full items-center justify-between rounded-lg bg-subtle px-4 py-3 text-left transition-transform duration-125 ease-standard active:scale-97"
            >
              <span className="text-sm font-semibold">{c.name}</span>
              <span className="text-1 text-muted-foreground">@{c.username}</span>
            </button>
          ))}
          {people.isFetching ? (
            <p className="px-4 py-3 text-1 text-muted-foreground">Searching…</p>
          ) : people.isError ? (
            // A failed search says nothing about whether they're on MusicLinkd.
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <p className="text-1 text-muted-foreground">Search didn't work.</p>
              <Btn variant="outline" onClick={() => void people.refetch()}>
                Try Again
              </Btn>
            </div>
          ) : matches.length === 0 ? (
            <button
              type="button"
              onClick={() => add(q.trim())}
              className="state-layer w-full rounded-lg border border-dashed border-border bg-card px-4 py-3 text-left transition-transform duration-125 ease-standard active:scale-97"
            >
              <span className="text-sm font-semibold">Add “{q.trim()}”</span>
              <span className="block text-1 text-muted-foreground">
                Not on MusicLinkd yet — they'll be credited by name and can claim it later.
              </span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- Analytics --------------------------------------------- */

export function WorkAnalytics({
  figures,
  playsNote = false,
}: {
  figures: WorkAnalyticsFigures;
  /** Real figures: say from when plays are counted (see src/lib/plays-cutoff.ts). */
  playsNote?: boolean | undefined;
}) {
  // A figure nothing counts yet is null, and shows an em-dash rather than a zero it cannot mean.
  const rows: [string, number | null][] = [
    ["Views", figures.views],
    ["Plays", figures.plays],
    ["Saves", figures.saves],
    ["Shares", figures.shares],
    ["Profile clicks", figures.profileClicks],
    ["Link clicks", figures.linkClicks],
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {rows.map(([label, n]) => (
        <div key={label} className="rounded-lg bg-subtle p-4">
          <p className="text-3 leading-none tabular-nums">
            {n === null ? "—" : n.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-1 text-muted-foreground">{label}</p>
        </div>
      ))}
      {playsNote ? (
        <p className="col-span-2 text-1 text-muted-foreground">
          <span className="font-semibold text-foreground">
            Plays counted from {playsCountedFromLabel}.
          </span>{" "}
          Plays before then were counted when a player was opened, so they may be higher than real
          listens.
        </p>
      ) : null}
    </div>
  );
}

/* ---------------- Bento media grid (public profile) ---------------------- */

/**
 * A public profile's portfolio as tappable media tiles rather than the owner's editable list
 * (WorkCard, above). Featured work runs wide; audio tiles expand into a waveform in place,
 * video tiles play inline muted — nothing here opens a separate player.
 */
export function PortfolioMediaGrid({ items }: { items: PortfolioItem[] }) {
  if (!items.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <PortfolioMediaTile key={item.id} item={item} wide={item.featured === true} />
      ))}
    </div>
  );
}

export function PortfolioMediaTile({
  item,
  wide = false,
}: {
  item: PortfolioItem;
  wide?: boolean;
}) {
  const t = workType(item.kind);
  const [playing, setPlaying] = useState(false);
  const isAudio = t.media === "audio";
  const isVideo = t.media === "video";
  const canPlay = (isAudio || isVideo) && !!item.media_url;

  return (
    <article className={cn("overflow-hidden rounded-lg bg-subtle", wide && "col-span-2")}>
      <div className="relative aspect-square">
        {isVideo && playing && item.media_url ? (
          <>
            <video
              src={item.media_url}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-1 bg-ink/20">
              <div className="h-full w-1/3 bg-background" />
            </div>
          </>
        ) : item.cover_url ? (
          <img
            src={sized(item.cover_url, { width: imageWidth.wide })}
            alt=""
            loading="lazy"
            decoding="async"
            className={cn("h-full w-full object-cover", isAudio && playing && "opacity-70")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-background text-muted-foreground">
            <WorkTypeIcon kind={item.kind} size="lg" />
          </div>
        )}

        {isAudio && playing && item.media_url ? (
          <>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption -- inline preview of the artist's own track; no separate caption track exists */}
            <audio src={item.media_url} autoPlay onEnded={() => setPlaying(false)} />
            <div
              aria-hidden
              className="absolute inset-x-3 bottom-3 flex h-5 items-end justify-center gap-1 rounded-full bg-ink/70 px-3 py-2 backdrop-blur-sm"
            >
              <span className="h-[10px] w-0.5 origin-bottom rounded-full bg-background animate-eq-1" />
              <span className="h-3 w-0.5 origin-bottom rounded-full bg-background animate-eq-2" />
              <span className="h-[13px] w-0.5 origin-bottom rounded-full bg-background animate-eq-3" />
              <span className="h-3 w-0.5 origin-bottom rounded-full bg-background animate-eq-2" />
              <span className="h-[10px] w-0.5 origin-bottom rounded-full bg-background animate-eq-1" />
            </div>
          </>
        ) : null}

        {canPlay ? (
          <button
            type="button"
            onClick={() => setPlaying((v) => !v)}
            aria-label={playing ? `Pause ${item.title}` : `Play ${item.title}`}
            className="hit-area absolute inset-0 flex items-center justify-center"
          >
            {!(isVideo && playing) ? (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-background shadow-md">
                {isAudio && playing ? (
                  <Pause size={iconSize.md} />
                ) : (
                  <Play size={iconSize.md} className="ml-0.5" />
                )}
              </span>
            ) : null}
          </button>
        ) : null}
      </div>
      <div className="p-2.5">
        <p className="truncate text-1 font-semibold">{item.title}</p>
        <p className="truncate text-1 text-muted-foreground">
          {t.label}
          {item.release_year ? ` · ${item.release_year}` : ""}
        </p>
      </div>
    </article>
  );
}
