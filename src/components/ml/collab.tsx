import type { ReactNode } from "react";
import { useState } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Pause,
  Pin,
  Play,
  RefreshCw,
  Upload,
  WifiOff,
  X,
} from "lucide-react";
import { Btn, VerifiedBadge } from "@/components/ml/ui";
import {
  fileKindMeta,
  milestoneMeta,
  statusMeta,
  type ActivityEntry,
  type CollabFile,
  type CollabStatus,
  type Milestone,
  type Participant,
  type Project,
  type Proposal,
} from "@/data/collab";

/* ------------------------------------------------------------------ */
/* Tone helpers                                                        */
/* ------------------------------------------------------------------ */

const toneStyle: Record<string, { bg: string; fg: string }> = {
  ok: { bg: "var(--success-container)", fg: "var(--success)" },
  warn: { bg: "var(--warn-container)", fg: "var(--warn)" },
  info: { bg: "var(--pink-container)", fg: "var(--primary)" },
  off: { bg: "var(--surface-subtle)", fg: "var(--muted-foreground)" },
  bad: { bg: "color-mix(in oklab, var(--destructive) 10%, transparent)", fg: "var(--destructive)" },
};

export function StatusPill({ status }: { status: CollabStatus }) {
  const meta = statusMeta[status];
  const c = toneStyle[meta.tone]!;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-1 font-bold uppercase tracking-wide"
      style={{ background: c.bg, color: c.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.fg }} aria-hidden />
      {meta.label}
    </span>
  );
}

export function Tag({ children, tone = "off" }: { children: ReactNode; tone?: string }) {
  const c = toneStyle[tone] ?? toneStyle["off"]!;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-1 font-bold uppercase tracking-wide"
      style={{ background: c.bg, color: c.fg }}
    >
      {children}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-border bg-card p-4 ${className}`}>{children}</div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 text-1 font-bold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

export function ParticipantStack({
  people,
  max = 4,
}: {
  people: { name: string; photo: string }[];
  max?: number;
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((p, i) => (
        <img
          key={p.name}
          src={p.photo}
          alt={p.name}
          className="h-7 w-7 rounded-full border-2 border-card object-cover"
          style={{ marginLeft: i === 0 ? 0 : -8 }}
        />
      ))}
      {rest > 0 ? (
        <span
          className="ml-[-8px] flex h-7 w-7 items-center justify-center rounded-full border-2 border-card text-1 font-bold"
          style={{ background: "var(--surface-subtle)", color: "var(--muted-foreground)" }}
        >
          +{rest}
        </span>
      ) : null}
    </div>
  );
}

export function ParticipantRow({
  p,
  projectId,
  canManage,
  onRemove,
}: {
  p: Participant;
  projectId: string;
  canManage?: boolean;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-start gap-3 py-4">
      <img src={p.photo} alt={p.name} className="h-11 w-11 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-2">{p.name}</h3>
          {p.verified ? <VerifiedBadge size={14} /> : null}
        </div>
        <p className="truncate text-1 text-muted-foreground">
          {p.role} · {p.responsibility}
        </p>
        <p className="mt-1 truncate text-1 text-muted-foreground">{p.contribution}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Tag
            tone={
              p.status === "invited"
                ? "warn"
                : p.status === "owner"
                  ? "info"
                  : p.status === "active"
                    ? "ok"
                    : "off"
            }
          >
            {p.status === "owner"
              ? "Owner"
              : p.status === "invited"
                ? "Invited"
                : p.status === "left"
                  ? "Left"
                  : p.status === "declined"
                    ? "Declined"
                    : "Active"}
          </Tag>
          <Link
            to="/profile/$username"
            params={{ username: p.username }}
            className="text-1 font-semibold text-pink-strong"
          >
            View profile
          </Link>
          <Link to="/messages" className="text-1 font-semibold text-pink-strong">
            Message
          </Link>
          {canManage && p.status !== "owner" ? (
            <button
              type="button"
              onClick={onRemove}
              className="text-1 font-semibold text-destructive"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
      <span className="shrink-0 text-1 text-muted-foreground">{projectId ? "" : ""}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Project card                                                        */
/* ------------------------------------------------------------------ */

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      to="/collab/$id"
      params={{ id: project.id }}
      className="mb-3 block overflow-hidden rounded-lg border border-border bg-card"
    >
      <div className="flex gap-3 p-3">
        <img
          src={project.artwork}
          alt=""
          className="h-20 w-20 shrink-0 rounded-lg object-cover"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 flex-1 truncate text-2">{project.name}</h3>
            <StatusPill status={project.status} />
          </div>
          <p className="mt-0.5 truncate text-1 text-muted-foreground">
            {project.type} · You are {project.myRole}
          </p>
          <div className="mt-2 flex items-center gap-2">
            {project.participants.length ? (
              <ParticipantStack people={project.participants} max={3} />
            ) : (
              <span className="text-1 text-muted-foreground">No collaborators yet</span>
            )}
          </div>
        </div>
      </div>
      <div className="px-3 pb-3">
        {project.status === "active" || project.status === "onHold" ? (
          <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-subtle">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        ) : null}
        <p className="truncate text-1 text-muted-foreground">{project.lastActivity}</p>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Files                                                               */
/* ------------------------------------------------------------------ */

export function FileRow({ file, projectId }: { file: CollabFile; projectId: string }) {
  const meta = fileKindMeta[file.kind];
  const body = (
    <>
      {file.cover ? (
        <img src={file.cover} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />
      ) : (
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-base"
          style={{ background: "var(--surface-subtle)", color: "var(--muted-foreground)" }}
        >
          {meta.icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h3
          className={`truncate text-2 ${file.available ? "" : "text-muted-foreground line-through"}`}
        >
          {file.name}
        </h3>
        <p className="truncate text-1 text-muted-foreground">
          {meta.label} · {file.size} · {file.uploadedBy} · {file.date}
        </p>
        <p className="truncate text-1 text-muted-foreground">{file.access}</p>
      </div>
      {file.available ? (
        <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
      ) : null}
    </>
  );

  if (!file.available) {
    return <div className="flex items-center gap-3 py-3 opacity-60">{body}</div>;
  }
  return (
    <Link
      to="/collab/$id/files/$fileId"
      params={{ id: projectId, fileId: file.id }}
      className="flex items-center gap-3 py-3"
    >
      {body}
    </Link>
  );
}

export function Waveform({ progress = 38 }: { progress?: number }) {
  const bars = Array.from({ length: 48 }, (_, i) => 20 + ((i * 37) % 60));
  return (
    <div className="flex h-14 items-end gap-[3px]">
      {bars.map((h, i) => (
        <span
          key={i}
          className="flex-1 rounded-full"
          style={{
            height: `${h}%`,
            background: (i / bars.length) * 100 < progress ? "var(--primary)" : "var(--border)",
          }}
        />
      ))}
    </div>
  );
}

export function AudioPlayer({ title, meta }: { title: string; meta: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <Card>
      <p className="text-2 font-semibold">{title}</p>
      <p className="mb-3 text-1 text-muted-foreground">{meta}</p>
      <Waveform progress={playing ? 62 : 24} />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPlaying((v) => !v)}
          aria-label={playing ? "Pause" : "Play"}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <span className="text-1 text-muted-foreground">
          {playing ? "1:28" : "0:00"} / {meta.split("·").pop()?.trim() ?? "—"}
        </span>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Milestones, activity, proposals                                     */
/* ------------------------------------------------------------------ */

export function MilestoneRow({
  m,
  projectId,
  onToggle,
}: {
  m: Milestone;
  projectId: string;
  onToggle?: () => void;
}) {
  const meta = milestoneMeta[m.status];
  return (
    <div className="flex items-start gap-3 py-4">
      <button
        type="button"
        onClick={onToggle}
        aria-label={`Toggle ${m.name}`}
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border"
        style={
          m.status === "done"
            ? { background: "var(--success)", borderColor: "transparent" }
            : undefined
        }
      >
        {m.status === "done" ? <Check size={14} className="text-background" /> : null}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 text-2">{m.name}</h3>
          <Tag tone={meta.tone}>{meta.label}</Tag>
        </div>
        <p className="mt-0.5 text-1 text-muted-foreground">{m.description}</p>
        <p className="mt-1 text-1 text-muted-foreground">
          {m.owner} · due {m.due}
        </p>
        {m.notes ? <p className="mt-1 text-1 text-muted-foreground">Note: {m.notes}</p> : null}
        <Link
          to="/collab/$id/milestones/$mid"
          params={{ id: projectId, mid: m.id }}
          className="mt-2 inline-block text-1 font-semibold text-pink-strong"
        >
          Open milestone
        </Link>
      </div>
    </div>
  );
}

const activityIcon: Record<ActivityEntry["kind"], string> = {
  joined: "＋",
  file: "▤",
  milestone: "✓",
  proposal: "✎",
  comment: "💬",
  status: "⚑",
};

export function ActivityItem({ a }: { a: ActivityEntry }) {
  return (
    <li className="flex gap-3 py-3">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-1"
        style={{ background: "var(--surface-subtle)", color: "var(--muted-foreground)" }}
      >
        {activityIcon[a.kind]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-1">
          <span className="font-semibold">{a.actor}</span> {a.text}
        </p>
        <p className="text-1 text-muted-foreground">{a.time}</p>
      </div>
    </li>
  );
}

export function ProposalSummary({ p }: { p: Proposal }) {
  return (
    <Card>
      <Label>Scope</Label>
      <p className="mb-4 text-1">{p.scope}</p>
      <Label>Deliverables</Label>
      <ul className="mb-4 space-y-1.5">
        {p.deliverables.map((d) => (
          <li key={d} className="flex items-start gap-2 text-1">
            <Check size={14} className="mt-0.5 shrink-0 text-primary" />
            {d}
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Timeline</Label>
          <p className="text-1">{p.timeline}</p>
        </div>
        <div>
          <Label>Compensation</Label>
          <p className="text-1">{p.compensation}</p>
        </div>
      </div>
      {p.notes ? (
        <>
          <div className="my-4 h-px bg-border" />
          <Label>Notes</Label>
          <p className="text-1 text-muted-foreground">{p.notes}</p>
        </>
      ) : null}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export function CollabSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg border border-border bg-card p-3">
          <div className="flex gap-3">
            <div className="h-20 w-20 shrink-0 rounded-lg bg-subtle" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3.5 w-2/3 rounded-full bg-subtle" />
              <div className="h-3 w-1/2 rounded-full bg-subtle" />
              <div className="h-6 w-24 rounded-full bg-subtle" />
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-subtle" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
      <span
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full text-xl"
        style={{ background: "var(--pink-container)", color: "var(--primary)" }}
      >
        ♫
      </span>
      <h3 className="text-2">{title}</h3>
      <p className="mt-1 mb-5 max-w-[260px] text-1 text-muted-foreground">{body}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "We couldn't load this collaboration.",
  body = "Check your connection and try again.",
  onRetry,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-card px-6 py-12 text-center">
      <AlertTriangle size={26} className="mb-3 text-destructive" />
      <h3 className="text-2">{title}</h3>
      <p className="mt-1 mb-5 text-1 text-muted-foreground">{body}</p>
      {onRetry ? (
        <Btn onClick={onRetry}>
          <RefreshCw size={15} className="mr-2" /> Retry
        </Btn>
      ) : null}
    </div>
  );
}

export function OfflineBanner({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      className="mb-3 flex items-center gap-3 rounded-lg px-4 py-3"
      style={{ background: "var(--warn-container)", color: "var(--warn)" }}
    >
      <WifiOff size={16} className="shrink-0" />
      <p className="flex-1 text-1 font-semibold">
        Offline — showing cached project data. 2 changes not yet synced.
      </p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="text-1 font-bold uppercase">
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function PermissionState() {
  return (
    <ErrorState
      title="You don't have access to this collaboration."
      body="Ask the project owner to invite you, or head back to your collaborations."
    />
  );
}

export function PinnedNote({ children }: { children: ReactNode }) {
  return (
    <div
      className="mb-3 flex items-start gap-2 rounded-lg px-4 py-3"
      style={{ background: "var(--pink-container)", color: "var(--primary)" }}
    >
      <Pin size={14} className="mt-0.5 shrink-0" />
      <p className="text-1 font-semibold">{children}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Upload sheet                                                        */
/* ------------------------------------------------------------------ */

export function UploadPanel({
  state,
  onStart,
  onCancel,
  onRetry,
}: {
  state: "idle" | "uploading" | "error" | "done";
  onStart: () => void;
  onCancel: () => void;
  onRetry: () => void;
}) {
  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={onStart}
        className="flex w-full flex-col items-center rounded-lg border border-dashed border-border bg-card px-6 py-8"
      >
        <Upload size={20} className="mb-2 text-primary" />
        <span className="text-1 font-semibold">Select a file to upload</span>
        <span className="mt-1 text-1 text-muted-foreground">
          Audio, video, images, documents, lyrics or contracts
        </span>
      </button>
    );
  }
  if (state === "uploading") {
    return (
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-1 font-semibold">Uploading Mix v4.wav</p>
          <button type="button" onClick={onCancel} aria-label="Cancel upload">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
          <div className="h-full w-[46%] rounded-full bg-primary" />
        </div>
        <p className="mt-2 text-1 text-muted-foreground">46% · 22.1 MB of 48.2 MB</p>
      </Card>
    );
  }
  if (state === "error") {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-destructive" />
          <div className="flex-1">
            <p className="text-1 font-semibold">Upload failed</p>
            <p className="text-1 text-muted-foreground">
              Mix v4.wav couldn't be uploaded. Your connection dropped at 46%.
            </p>
          </div>
        </div>
        <Btn className="mt-3 w-full" onClick={onRetry}>
          Retry upload
        </Btn>
      </Card>
    );
  }
  return (
    <Card>
      <div className="flex items-center gap-3">
        <Check size={18} className="text-[color:var(--success)]" />
        <p className="text-1 font-semibold">Mix v4.wav uploaded to the project</p>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Form primitives                                                     */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  hint,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-1 font-bold uppercase tracking-wide text-muted-foreground">{label}</h3>
        {optional ? <span className="text-1 text-muted-foreground">Optional</span> : null}
      </div>
      {children}
      {hint ? <p className="mt-1.5 text-1 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  multiline,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const cls =
    "w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary";
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className={`${cls} resize-none`}
      />
    );
  }
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cls}
    />
  );
}

export function StickyBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-30 mt-6 border-t border-border bg-background/95 px-5 py-4 backdrop-blur">
      {children}
    </div>
  );
}

export function RowLink({
  title,
  subtitle,
  to,
  params,
  onClick,
  danger,
}: {
  title: string;
  subtitle?: string;
  to?: LinkProps["to"];
  params?: LinkProps["params"];
  onClick?: () => void;
  danger?: boolean;
}) {
  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-2 font-medium ${danger ? "text-destructive" : ""}`}>{title}</p>
        {subtitle ? <p className="truncate text-1 text-muted-foreground">{subtitle}</p> : null}
      </div>
      <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
    </>
  );
  if (to) {
    return (
      <Link
        to={to}
        {...(params ? { params } : {})}
        className="flex items-center gap-3 px-4 py-4 text-left"
      >
        {inner}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-4 text-left"
    >
      {inner}
    </button>
  );
}

export function SwitchRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between px-4 py-4 text-left"
    >
      <span className="text-sm font-medium">{label}</span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${value ? "bg-primary" : "bg-border"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-card transition-all ${value ? "left-6" : "left-1"}`}
        />
      </span>
    </button>
  );
}
