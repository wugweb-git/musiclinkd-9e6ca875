import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Btn } from "@/components/ml/ui";
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

export { analyticsFor };

/* ---------------- Work card (WHAT · WHO · ROLE · MEDIA · CONTEXT) ------- */

export function WorkCard({ item }: { item: PortfolioItem }) {
  const t = workType(item.kind);
  return (
    <Link
      to="/portfolio/$id"
      params={{ id: item.id }}
      className="block rounded-3xl border border-border bg-card p-4"
    >
      <div className="flex gap-3">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl"
          style={{ background: "var(--surface-subtle)" }}
          aria-hidden
        >
          {t.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[16px] font-semibold">{item.title}</h3>
            <StatusPill published={item.published} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t.label}
            {item.release_year ? ` · ${item.release_year}` : ""}
          </p>
          {item.role ? (
            <p className="mt-1 truncate text-xs font-semibold text-primary">{item.role}</p>
          ) : null}
          {item.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
          ) : null}
          {item.collaborators.length ? (
            <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
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
      className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
      style={
        published
          ? { background: "var(--success-container)", color: "var(--success)" }
          : { background: "var(--warn-container)", color: "var(--warn)" }
      }
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
        <div key={i} className="h-28 animate-pulse rounded-3xl border border-border bg-subtle" />
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
      className="rounded-3xl border border-border bg-card p-6 text-center"
      style={tone === "error" ? { borderColor: "var(--danger, #DC2626)" } : undefined}
      role={tone === "error" ? "alert" : undefined}
    >
      <h3 className="text-[17px]">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-[280px] text-sm text-muted-foreground">{body}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function SignedOutCard({ what = "your portfolio" }: { what?: string }) {
  return (
    <StateCard
      title="Sign in to manage your work"
      body={`Create a free MusicLinkd account to publish and edit ${what}. You're seeing demo work below.`}
      action={
        <Link to="/auth" search={{ mode: "signin" }}>
          <Btn>Sign in or sign up</Btn>
        </Link>
      }
    />
  );
}

/* ---------------- Simple audio preview ---------------------------------- */

export function AudioPreview({ src, title }: { src: string; title: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        Audio preview
      </p>
      <p className="mt-1 truncate text-sm font-semibold">{title}</p>
      <audio controls src={src} className="mt-3 w-full" aria-label={`Play ${title}`} />
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
      {options.map((o) => {
        const active = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(o)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold ${
              active
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground"
            }`}
          >
            {o}
          </button>
        );
      })}
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
      <p className="text-[20px] leading-none tabular-nums">{n}</p>
      <p className="mt-1 truncate text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
  return (
    <section className="rounded-3xl border border-border bg-card p-5">
      <div className="grid grid-cols-4 gap-3">
        {stat(total, "Works")}
        {stat(published, "Published")}
        {stat(drafts, "Drafts")}
        {stat(featured, "Featured")}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Portfolio visibility: <span className="font-semibold text-foreground">{visibility}</span>
      </p>
    </section>
  );
}

/* ---------------- Media state pill + uploader --------------------------- */

export function MediaStatePill({ state }: { state: MediaState }) {
  const c = mediaStateCopy[state];
  const style: Record<string, string> =
    c.tone === "good"
      ? { background: "var(--success-container)", color: "var(--success)" }
      : c.tone === "warn"
        ? { background: "var(--warn-container)", color: "var(--warn)" }
        : c.tone === "bad"
          ? {
              background: "var(--danger-container, var(--warn-container))",
              color: "var(--danger, #DC2626)",
            }
          : { background: "var(--surface-subtle)", color: "var(--muted-foreground)" };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
      style={style}
    >
      <span aria-hidden>●</span>
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
    <div className="rounded-3xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          {type} media
        </p>
        <MediaStatePill state={state} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{copy.hint}</p>

      {state === "uploading" ? (
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-subtle"
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
        className="mt-3 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
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
        <Btn variant="ghost" onClick={() => simulate(true)}>
          Preview failure state
        </Btn>
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
      <div className="rounded-3xl border border-border bg-card p-4">
        <MediaStatePill state="not-uploaded" />
        <p className="mt-2 text-xs text-muted-foreground">{mediaStateCopy["not-uploaded"].hint}</p>
      </div>
    );
  }
  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        {artwork ? (
          <img
            src={artwork}
            alt={`Artwork for ${title}`}
            className="h-14 w-14 rounded-2xl object-cover"
          />
        ) : (
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl"
            style={{ background: "var(--surface-subtle)" }}
            aria-hidden
          >
            🎧
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="text-[11px] text-muted-foreground">Audio</p>
        </div>
      </div>
      <audio controls src={src} className="mt-3 w-full" aria-label={`Play ${title}`} />
    </div>
  );
}

export function VideoPlayer({ src, title }: { src: string; title: string }) {
  const embeddable = /youtube|youtu\.be|vimeo/.test(src);
  if (embeddable) {
    return (
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className="block rounded-3xl border border-border bg-card p-4"
      >
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Video</p>
        <p className="mt-1 truncate text-sm font-semibold">{title}</p>
        <p className="mt-1 truncate text-xs text-primary">{src}</p>
      </a>
    );
  }
  return (
    <video
      controls
      src={src}
      className="w-full rounded-3xl border border-border"
      aria-label={title}
    />
  );
}

/* ---------------- Credits & contributors -------------------------------- */

export function CreditRow({ name, role }: { name: string; role?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
      <span className="min-w-0 truncate text-sm font-semibold">{name}</span>
      {role ? <span className="shrink-0 text-xs text-muted-foreground">{role}</span> : null}
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
        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
      />
      {value.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(value.filter((v) => v !== n))}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              aria-label={`Remove ${n}`}
            >
              {n} ✕
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
              className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left"
            >
              <span className="text-sm font-semibold">{c.name}</span>
              <span className="text-xs text-muted-foreground">{c.role}</span>
            </button>
          ))}
          {matches.length === 0 ? (
            <button
              type="button"
              onClick={() => add(q.trim())}
              className="w-full rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-left"
            >
              <span className="text-sm font-semibold">Add “{q.trim()}”</span>
              <span className="block text-xs text-muted-foreground">
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
      className={`rounded-full border px-4 py-2 text-xs font-semibold ${
        on ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-card"
      } ${disabled && !on ? "opacity-50" : ""}`}
    >
      {on ? "★ Featured" : "☆ Feature this"}
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
        <li key={item.id} className="rounded-3xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {workType(item.kind).label} · position {i + 1}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => onMove(i, -1)}
                disabled={i === 0}
                aria-label={`Move ${item.title} up`}
                className="h-10 w-10 rounded-full border border-border disabled:opacity-40"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => onMove(i, 1)}
                disabled={i === items.length - 1}
                aria-label={`Move ${item.title} down`}
                className="h-10 w-10 rounded-full border border-border disabled:opacity-40"
              >
                ↓
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
        <div key={label} className="rounded-3xl border border-border bg-card p-4">
          <p className="text-[22px] leading-none tabular-nums">{n.toLocaleString("en-IN")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}
