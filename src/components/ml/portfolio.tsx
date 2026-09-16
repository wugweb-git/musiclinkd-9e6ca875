import { Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
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
  Star,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { WavePlayer } from "@/components/waves-cn/wave-player";
import { Btn, BtnLink, Chip } from "@/components/ml/ui";
import {
  analyticsFor,
  contributorDirectory,
  FEATURED_LIMIT,
  mediaStateCopy,
  workType,
  type MediaState,
  type PortfolioItem,
  type WorkAnalyticsFigures,
} from "@/data/portfolio";
import { showDemoControls } from "@/lib/dev";

export { analyticsFor };

/* ---------------- Work type icon ---------------------------------------- */

const workIcons: Record<string, LucideIcon> = {
  track: Music2,
  album: Disc3,
  video: Clapperboard,
  performance: Mic,
  project: FolderOpen,
  client: BriefcaseBusiness,
  "case-study": FileText,
  writing: PenLine,
  image: ImageIcon,
  link: Link2,
};

/** A work type's line icon in a grey tile, in place of the emoji in `workTypes`. */
export function WorkTypeIcon({ kind, size = "md" }: { kind: string; size?: "md" | "lg" }) {
  const Icon = workIcons[kind] ?? Music2;
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center bg-background text-foreground ${
        size === "lg" ? "h-16 w-16 rounded-lg" : "h-12 w-12 rounded-sm"
      }`}
    >
      <Icon size={size === "lg" ? 24 : 20} strokeWidth={1.75} />
    </span>
  );
}

/* ---------------- Work card (WHAT · WHO · ROLE · MEDIA · CONTEXT) ------- */

export function WorkCard({ item }: { item: PortfolioItem }) {
  const t = workType(item.kind);
  return (
    <Link
      to="/portfolio/$id"
      params={{ id: item.id }}
      className="state-layer block rounded-lg bg-subtle p-4 transition-transform duration-125 ease-standard active:scale-97"
    >
      <div className="flex gap-3">
        <WorkTypeIcon kind={item.kind} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-2 font-semibold">{item.title}</h3>
            <StatusPill published={item.published} />
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
      </div>
    </Link>
  );
}

export function StatusPill({ published }: { published: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full pill ${
        published
          ? "bg-success-container text-success-strong"
          : "bg-warn-container text-warn-strong"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

/* ---------------- States ------------------------------------------------ */

export function PortfolioSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading portfolio">
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
  return (
    <div
      className={`rounded-lg border bg-card p-6 text-center ${tone === "error" ? "border-destructive" : "border-border"}`}
      role={tone === "error" ? "alert" : undefined}
    >
      <h3 className="text-2">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-[280px] text-sm text-muted-foreground">{body}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
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
  const tone =
    c.tone === "good"
      ? "bg-success-container text-success-strong"
      : c.tone === "warn"
        ? "bg-warn-container text-warn-strong"
        : c.tone === "bad"
          ? "bg-danger-container text-destructive"
          : "bg-background text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full pill ${tone}`}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {c.label}
    </span>
  );
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
            <Headphones size={24} />
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
  const embeddable = /youtube|youtu\.be|vimeo/.test(src);
  if (embeddable) {
    return (
      <a href={src} target="_blank" rel="noreferrer" className="block rounded-lg bg-subtle p-4">
        <p className="pill bg-background text-muted-foreground">Video</p>
        <p className="mt-1 truncate text-sm font-semibold">{title}</p>
        <p className="mt-1 truncate text-1 text-foreground">{src}</p>
      </a>
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
              {n} <X size={12} aria-hidden />
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

/* ---------------- Featured toggle & reorder ----------------------------- */

export function FeaturedToggle({
  on,
  disabled,
  onToggle,
}: {
  on: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled && !on}
      onClick={onToggle}
      className={`rounded-full border px-4 py-2 text-1 font-semibold ${
        on ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-card"
      } ${disabled && !on ? "opacity-50" : ""}`}
    >
      <span className="inline-flex items-center gap-1">
        <Star size={12} fill={on ? "currentColor" : "none"} aria-hidden />
        {on ? "Featured" : "Feature this"}
      </span>
    </button>
  );
}

export function ReorderList({
  items,
  onMove,
  featured,
  onFeature,
}: {
  items: PortfolioItem[];
  onMove: (index: number, dir: -1 | 1) => void;
  featured?: string[];
  onFeature?: (id: string) => void;
}) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={item.id} className="rounded-lg bg-subtle p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{item.title}</p>
              <p className="text-1 text-muted-foreground">
                {workType(item.kind).label} · position {i + 1}
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={() => onMove(i, -1)}
                disabled={i === 0}
                aria-label={`Move ${item.title} up`}
                className="hit-area flex h-10 w-10 items-center justify-center rounded-full border border-border disabled:opacity-40"
              >
                <ArrowUp size={16} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onMove(i, 1)}
                disabled={i === items.length - 1}
                aria-label={`Move ${item.title} down`}
                className="hit-area flex h-10 w-10 items-center justify-center rounded-full border border-border disabled:opacity-40"
              >
                <ArrowDown size={16} aria-hidden />
              </button>
            </div>
          </div>
          {onFeature ? (
            <div className="mt-3">
              <FeaturedToggle
                on={(featured ?? []).includes(item.id)}
                disabled={(featured ?? []).length >= FEATURED_LIMIT}
                onToggle={() => onFeature(item.id)}
              />
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

/* ---------------- Analytics --------------------------------------------- */

export function WorkAnalytics({ figures }: { figures: WorkAnalyticsFigures }) {
  const rows: [string, number][] = [
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
          <p className="text-3 leading-none tabular-nums">{n.toLocaleString("en-IN")}</p>
          <p className="mt-1 text-1 text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}
