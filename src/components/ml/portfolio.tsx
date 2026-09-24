import { Link, useNavigate } from "@tanstack/react-router";
import {
  BriefcaseBusiness,
  Clapperboard,
  Disc3,
  FileText,
  FolderOpen,
  Headphones,
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
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { WavePlayer } from "@/components/waves-cn/wave-player";
import { Btn, BtnLink, Chip, IconBtn, IconBtnLink, Sheet } from "@/components/ml/ui";
import { StateCard as BaseStateCard, StatusPill as BaseStatusPill } from "@/components/ml/kit";
import { embedFor } from "@/lib/embed";
import { MediaEmbed } from "./media-embed";
import { cn } from "@/lib/utils";
import {
  analyticsFor,
  contributorDirectory,
  FEATURED_LIMIT,
  mediaStateCopy,
  workType,
  workTypes,
  type MediaState,
  type PortfolioItem,
  type WorkAnalyticsFigures,
} from "@/data/portfolio";
import { showDemoControls } from "@/lib/dev";
import { iconSize } from "@/lib/tokens";
import { DrawerList, DrawerOptionRow } from "./drawer-list";

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
      <Icon size={size === "lg" ? 24 : 20} strokeWidth={1.75} />
    </span>
  );
}

/** Add work: the type list in a bottom drawer, one shared option row per type. */
export function WorkTypeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
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
              void navigate({ to: "/portfolio/new/$kind", params: { kind: t.kind } });
            }}
          />
        ))}
      </DrawerList>
    </Sheet>
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
    <div className="rounded-lg bg-subtle">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="state-layer block w-full rounded-lg p-4 text-left transition-transform duration-125 ease-standard active:scale-97"
      >
        <div className="flex gap-3">
          {item.cover_url ? (
            <img
              src={item.cover_url}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-16 w-16 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <WorkTypeIcon kind={item.kind} size="lg" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-2 font-semibold">{item.title}</h3>
              <span className="flex shrink-0 items-center gap-1.5">
                {item.featured ? (
                  <span className="pill bg-background text-muted-foreground">Featured</span>
                ) : null}
                <StatusPill published={item.published} />
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

/**
 * Exact same colors as kit.tsx's "good"/"warn" tones. icon={<></>} suppresses the dot kit's
 * version shows by default — this one was always text-only.
 */
export function StatusPill({ published }: { published: boolean }) {
  return (
    <BaseStatusPill
      label={published ? "Published" : "Draft"}
      tone={published ? "good" : "warn"}
      icon={<></>}
      className="shrink-0"
    />
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

export function StateCard({
  title,
  body,
  action,
  tone = "neutral",
}: {
  title: string;
  body: string;
  action?: ReactNode;
  tone?: "neutral" | "error";
}) {
  return <BaseStateCard title={title} body={body} tone={tone} action={action} />;
}

/* ---------------- Simple audio preview ---------------------------------- */

export function AudioPreview({ src, title }: { src: string; title: string }) {
  return (
    <div className="rounded-lg bg-subtle p-4">
      <p className="pill bg-background text-muted-foreground">Audio preview</p>
      <p className="mt-1 truncate text-sm font-semibold">{title}</p>
      {/*
       * The waveform player (waves-cn, wavesurfer): a bare <audio> element told you nothing about
       * a take. Colours come from the app's own tokens, so it is ink on grey like everything else.
       */}
      <WavePlayer
        src={src}
        waveColor="var(--color-muted-foreground)"
        progressColor="var(--color-ink)"
        waveHeight={56}
        className="mt-3 border-0 bg-transparent p-0 shadow-none"
      />
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
  visibility = "Public",
}: {
  total: number;
  published: number;
  drafts: number;
  featured: number;
  visibility?: string;
}) {
  const stat = (n: number, label: string) => (
    <div key={label} className="min-w-0">
      <p className="text-3 leading-none tabular-nums">{n}</p>
      <p className="mt-1 truncate text-1 text-muted-foreground">{label}</p>
    </div>
  );
  return (
    <section className="rounded-lg bg-subtle p-5">
      <div className="grid grid-cols-4 gap-3">
        {stat(total, "Works")}
        {stat(published, "Published")}
        {stat(drafts, "Drafts")}
        {stat(featured, "Featured")}
      </div>
      <p className="mt-4 text-1 text-muted-foreground">
        Portfolio visibility: <span className="font-semibold text-foreground">{visibility}</span>
      </p>
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
  return <BaseStatusPill label={c.label} tone={tone} />;
}

/**
 * MediaUploader — designed state machine over a local preview.
 * No storage infrastructure: it simulates transfer so every state is reviewable.
 */
export function MediaUploader({
  type,
  url,
  onUrl,
}: {
  type: "audio" | "video" | "image" | "link";
  url: string;
  onUrl: (v: string) => void;
}) {
  const [state, setState] = useState<MediaState>(url ? "ready" : "not-uploaded");
  const [progress, setProgress] = useState(0);
  const copy = mediaStateCopy[state];

  function simulate(fail = false) {
    setState("uploading");
    setProgress(0);
    let p = 0;
    const timer = setInterval(() => {
      p += 20;
      setProgress(p);
      if (p >= 100) {
        clearInterval(timer);
        if (fail) setState("failed");
        else {
          setState("processing");
          setTimeout(() => setState("ready"), 900);
        }
      }
    }, 260);
  }

  return (
    <div className="rounded-lg bg-subtle p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">
          {type === "link" ? "Link" : `${type[0]!.toUpperCase()}${type.slice(1)}`}
        </p>
        <MediaStatePill state={state} />
      </div>
      <p className="mt-2 text-1 text-muted-foreground">{copy.hint}</p>

      {state === "uploading" ? (
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-background"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Upload progress"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      ) : null}

      <input
        value={url}
        onChange={(e) => {
          onUrl(e.target.value);
          setState(e.target.value ? "ready" : "not-uploaded");
        }}
        placeholder="https:// link to the file, YouTube, Spotify…"
        aria-label={`${type} link`}
        inputMode="url"
        autoCapitalize="none"
        spellCheck={false}
        className={`mt-3 ${fieldBox}`}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <Btn variant="outline" onClick={() => simulate(false)}>
          {state === "failed" ? "Retry upload" : "Upload file"}
        </Btn>
        {url || state === "ready" ? (
          <Btn
            variant="ghost"
            onClick={() => {
              onUrl("");
              setState("not-uploaded");
            }}
          >
            Replace
          </Btn>
        ) : null}
        {showDemoControls ? (
          <Btn variant="ghost" onClick={() => simulate(true)}>
            Preview failure state
          </Btn>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------- Players ----------------------------------------------- */

export function AudioPlayer({
  src,
  title,
  artwork,
}: {
  src: string | null;
  title: string;
  artwork?: string | null;
}) {
  if (!src) {
    return (
      <div className="rounded-lg bg-subtle p-4">
        <MediaStatePill state="not-uploaded" />
        <p className="mt-2 text-1 text-muted-foreground">{mediaStateCopy["not-uploaded"].hint}</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg bg-subtle p-4">
      <div className="flex items-center gap-3">
        {artwork ? (
          <img
            src={artwork}
            alt={`Artwork for ${title}`}
            className="h-14 w-14 rounded-sm object-cover"
          />
        ) : (
          <div
            className="flex h-14 w-14 items-center justify-center rounded-sm bg-background text-muted-foreground"
            aria-hidden
          >
            <Headphones size={iconSize.lg} />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="text-1 text-muted-foreground">Audio</p>
        </div>
      </div>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- user-supplied external link (YouTube/Spotify/SoundCloud); no caption track exists to attach, and an empty <track> would assert captions that are not there */}
      <audio controls src={src} className="mt-3 w-full" aria-label={`Play ${title}`} />
    </div>
  );
}

export function VideoPlayer({ src, title }: { src: string; title: string }) {
  const embed = embedFor(src);
  if (embed?.mode === "iframe") {
    return (
      <iframe
        src={embed.src}
        title={title}
        height={embed.height}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
        className="w-full rounded-lg border-0 bg-subtle"
      />
    );
  }
  if (embed?.mode === "in-app") {
    return (
      <div className="block rounded-lg border border-border bg-subtle p-4">
        <p className="pill bg-background text-foreground font-semibold">Video preview</p>
        <p className="mt-1 truncate text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 truncate text-1 text-muted-foreground">{src}</p>
      </div>
    );
  }
  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption -- user-supplied external link (YouTube/Spotify/SoundCloud); no caption track exists to attach, and an empty <track> would assert captions that are not there
    <video
      controls
      src={src}
      className="w-full rounded-lg border border-border"
      aria-label={title}
    />
  );
}

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
  const matches = contributorDirectory.filter((c) =>
    c.name.toLowerCase().includes(q.trim().toLowerCase()),
  );
  const add = (name: string) => {
    if (!value.includes(name)) onChange([...value, name]);
    setQ("");
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
              className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-1 font-semibold text-primary-foreground"
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
              <span className="text-1 text-muted-foreground">{c.role}</span>
            </button>
          ))}
          {matches.length === 0 ? (
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

export function WorkAnalytics({ figures }: { figures: WorkAnalyticsFigures }) {
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
            src={item.cover_url}
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
        <p className="truncate text-0 text-muted-foreground">
          {t.label}
          {item.release_year ? ` · ${item.release_year}` : ""}
        </p>
      </div>
    </article>
  );
}
