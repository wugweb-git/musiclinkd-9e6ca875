import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { BadgeCheck, Pause, Play, Share2, ShieldCheck, Star } from "lucide-react";
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
import { Btn, Sheet } from "./ui";

/* ── Section shell ─────────────────────────────────────────── */

export function ProfileSection({
  title,
  action,
  onAction,
  children,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-2">{title}</h2>
        {action ? (
          <button type="button" onClick={onAction} className="text-xs font-semibold text-primary">
            {action}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function ProfileEmpty({
  title,
  body,
  cta,
  onCta,
}: {
  title: string;
  body: string;
  cta?: string | undefined;
  onCta?: (() => void) | undefined;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-5 text-center">
      <h3 className="text-2">{title}</h3>
      <p className="mx-auto mt-1 max-w-[260px] text-xs leading-relaxed text-muted-foreground">
        {body}
      </p>
      {cta ? (
        <Btn variant="outline" className="mt-3 min-h-11 text-xs" onClick={() => onCta?.()}>
          {cta}
        </Btn>
      ) : null}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="animate-pulse px-5 py-6" aria-busy="true" aria-label="Loading profile">
      <div className="h-40 w-full rounded-lg bg-subtle" />
      <div className="mt-4 flex items-center gap-3">
        <div className="h-20 w-20 rounded-lg bg-subtle" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded-full bg-subtle" />
          <div className="h-3 w-1/2 rounded-full bg-subtle" />
        </div>
      </div>
      <div className="mt-4 h-12 rounded-full bg-subtle" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="mt-4 h-24 rounded-lg bg-subtle" />
      ))}
    </div>
  );
}

/* ── Badges & chips ────────────────────────────────────────── */

export function VerificationBadge({ tier, compact }: { tier: string; compact?: boolean }) {
  const industry = tier === "Industry Verified" || tier === "Professional";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-1 font-bold uppercase tracking-wide"
      style={{
        background: industry ? "var(--pink-container)" : "var(--surface-subtle)",
        color: industry ? "var(--primary)" : "var(--muted-foreground)",
      }}
      title={tier}
    >
      <BadgeCheck size={12} aria-hidden />
      {compact ? "Verified" : tier}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const busy = status === "Busy" || status === "Touring";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-1 font-bold uppercase tracking-wide"
      style={{
        background: busy ? "var(--surface-subtle)" : "var(--success-container)",
        color: busy ? "var(--muted-foreground)" : "var(--success)",
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: busy ? "var(--muted-foreground)" : "var(--success)" }}
      />
      {status}
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
  const styles: Record<string, { background: string; color: string }> = {
    subtle: { background: "var(--surface-subtle)", color: "var(--muted-foreground)" },
    pink: { background: "var(--pink-container)", color: "var(--primary)" },
    purple: { background: "var(--status-category-bg)", color: "var(--status-category-text)" },
  };
  return (
    <span className="rounded-full px-3 py-1.5 text-1 font-semibold" style={styles[tone]}>
      {children}
    </span>
  );
}

export function ChipGroup({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone?: "subtle" | "pink" | "purple";
}) {
  if (!items.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="mb-2.5 text-1 font-bold uppercase tracking-wide text-muted-foreground">
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

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3.5">
      <span className="text-1 font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="max-w-[58%] text-right text-xs font-semibold">{value}</span>
    </div>
  );
}

/* ── Hero ──────────────────────────────────────────────────── */

export function ProfileHero({
  p,
  owner,
  onShare,
  onMore,
  back,
}: {
  p: PersonProfile;
  owner?: boolean;
  onShare: () => void;
  onMore?: (() => void) | undefined;
  back?: string | undefined;
}) {
  return (
    <header>
      <div className="relative h-44">
        <img src={p.cover} alt={`${p.name} cover`} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-ink/10" />
        {back ? (
          <Link
            to={back}
            aria-label="Back"
            className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-lg"
          >
            ←
          </Link>
        ) : null}
        <div className="absolute right-5 top-5 flex gap-2">
          <button
            type="button"
            onClick={onShare}
            aria-label="Share profile"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card/90"
          >
            <Share2 size={16} aria-hidden />
          </button>
          {onMore ? (
            <button
              type="button"
              onClick={onMore}
              aria-label="More options"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-lg leading-none"
            >
              ⋯
            </button>
          ) : null}
        </div>
      </div>

      <div className="-mt-10 px-5">
        <div className="relative w-20">
          <img
            src={p.photo}
            alt={p.name}
            className="h-20 w-20 rounded-lg border-2 border-background object-cover"
          />
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground">
            <BadgeCheck size={13} aria-label="Verified" />
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="text-3 leading-tight">{p.name}</h1>
          <VerificationBadge tier={p.verification} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          @{p.username} · {p.yearsActive}
        </p>
        <p className="mt-2 text-sm font-semibold">
          {[p.primaryRole, ...p.secondaryRoles].join(" · ")}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">📍 {p.location}</p>
        <div className="mt-2.5">
          <StatusBadge status={p.availability} />
        </div>
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
    { label: "Credits", value: String(p.stats.credits) },
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
        <span
          className="rounded-full px-2.5 py-1 text-1 font-bold uppercase tracking-wide"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
        >
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
      <img
        src={track.artwork}
        alt=""
        aria-hidden
        loading="lazy"
        className="h-14 w-14 rounded-md object-cover"
      />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-2">{track.title}</h3>
        <p className="truncate text-1 text-muted-foreground">
          {track.role} · {track.project}
        </p>
        <p className="mt-0.5 text-1 text-muted-foreground">{track.duration}</p>
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

export function MiniPlayer({
  track,
  playing,
  onToggle,
  onClose,
}: {
  track: AudioTrack;
  playing: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-16 z-40 mx-auto w-full max-w-app px-3 pb-2">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5">
        <img src={track.artwork} alt="" aria-hidden className="h-11 w-11 rounded-md object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-1 font-semibold">{track.title}</p>
          <div className="mt-1.5 flex h-5 items-end gap-[2px]" aria-hidden>
            {Array.from({ length: 34 }).map((_, i) => (
              <span
                key={i}
                className="flex-1 rounded-full"
                style={{
                  height: `${25 + Math.abs(Math.sin(i * 0.8)) * 75}%`,
                  background: i < 12 ? "var(--primary)" : "var(--border)",
                }}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={playing ? "Pause" : "Play"}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          {playing ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close player"
          className="flex h-10 w-9 items-center justify-center rounded-full text-muted-foreground"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function VideoCard({ v }: { v: VideoItem }) {
  return (
    <article className="w-[220px] shrink-0 overflow-hidden rounded-lg border border-border bg-card">
      <div className="relative h-32">
        <img src={v.thumb} alt={v.title} loading="lazy" className="h-full w-full object-cover" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-card/90">
            <Play size={16} aria-hidden />
          </span>
        </span>
        <span className="absolute bottom-2 right-2 rounded-full bg-ink/80 px-2 py-0.5 text-1 font-semibold text-background">
          {v.duration}
        </span>
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
      <img
        src={p.cover}
        alt=""
        aria-hidden
        loading="lazy"
        className="h-20 w-20 rounded-lg object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 truncate text-2">{p.name}</h3>
          <TagChip tone={p.status === "Released" ? "subtle" : "pink"}>{p.status}</TagChip>
        </div>
        <p className="truncate text-1 text-muted-foreground">{p.role}</p>
        <p className="truncate text-1 text-muted-foreground">with {p.collaborators}</p>
        <p className="mt-1 text-1 font-semibold text-primary">
          {p.genre} · {p.year}
        </p>
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
          <span className="shrink-0 text-1 font-bold text-primary">{s.from}</span>
        ) : (
          <span className="shrink-0 text-1 font-semibold text-muted-foreground">On enquiry</span>
        )}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <TagChip>{s.mode}</TagChip>
        <TagChip>{s.turnaround}</TagChip>
        <TagChip tone="pink">{s.availability}</TagChip>
      </div>
      <Btn variant="outline" className="mt-3 w-full min-h-11 text-xs" onClick={onEnquire}>
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
        <p className="text-1 font-semibold text-muted-foreground">
          {e.org} · {e.period}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{e.detail}</p>
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
      params={c.link.params as never}
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
        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-warn">
          <Star size={12} fill="currentColor" aria-hidden />
          {r.stars}.0
        </span>
      </div>
      <p className="mt-1.5 text-1 font-bold uppercase tracking-wide text-muted-foreground">
        {r.context}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{r.text}</p>
      {r.response ? (
        <div className="mt-3 rounded-lg bg-subtle p-3">
          <p className="text-1 font-bold uppercase tracking-wide text-muted-foreground">Response</p>
          <p className="mt-1 text-xs text-muted-foreground">{r.response}</p>
        </div>
      ) : null}
    </article>
  );
}

export function OpportunityCard({ o }: { o: OpportunityItem }) {
  return (
    <article
      className="rounded-lg border border-border p-4"
      style={{
        background: o.tone === "seeking" ? "var(--pink-container)" : "var(--card)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-2">{o.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{o.detail}</p>
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
      params={m.params as never}
      className="flex w-[210px] shrink-0 items-center gap-3 rounded-lg border border-border bg-card p-3"
    >
      <img
        src={m.image}
        alt=""
        aria-hidden
        loading="lazy"
        className="h-12 w-12 rounded-md object-cover"
      />
      <div className="min-w-0">
        <h3 className="truncate text-1">{m.title}</h3>
        <p className="truncate text-1 text-muted-foreground">{m.meta}</p>
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
      className="grid gap-[2px] rounded-lg bg-card p-3"
      style={{ gridTemplateColumns: "repeat(13, 1fr)" }}
      aria-label="Profile QR code"
      role="img"
    >
      {cells.map((on, i) => (
        <span
          key={i}
          className="aspect-square rounded-xs"
          style={{ background: on ? "var(--ink)" : "transparent" }}
        />
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
  const [copied, setCopied] = useState(false);
  const url = `musiclinkd.com/${p.username}`;
  return (
    <Sheet open={open} onClose={onClose} title="Share profile">
      <div
        className="overflow-hidden rounded-lg border border-border"
        style={{ background: "var(--gradient-ink)" }}
      >
        <div className="flex items-center gap-3 p-4 text-background">
          <img src={p.photo} alt="" aria-hidden className="h-14 w-14 rounded-md object-cover" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-2 text-background">{p.name}</h3>
              <BadgeCheck size={14} aria-label="Verified" />
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
            <p className="text-1 font-bold uppercase tracking-wide opacity-70">
              MusicLinkd identity
            </p>
            <p className="mt-1 truncate text-1 font-semibold">{url}</p>
            <p className="mt-1 text-1 opacity-75">Scan to open this profile in MusicLinkd.</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Btn
          onClick={() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          }}
        >
          {copied ? "Link copied" : "Copy link"}
        </Btn>
        <Btn variant="ink">Share card</Btn>
        <Btn variant="outline">Save contact</Btn>
        <Btn variant="ghost">Download QR</Btn>
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
              <span className="text-xs text-muted-foreground">→</span>
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
  missing: { id: string; label: string }[];
}) {
  return (
    <div
      className="rounded-lg border border-border p-4"
      style={{ background: "var(--pink-container)" }}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-2">Your profile is {percent}% complete</h3>
        <span className="text-1 font-semibold text-primary">{missing.length} left</span>
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
      <ul className="mt-3 space-y-1.5">
        {missing.map((m) => (
          <li key={m.id} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {m.label}
          </li>
        ))}
      </ul>
      <Link
        to="/profile/edit"
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
      >
        Complete profile
      </Link>
    </div>
  );
}
