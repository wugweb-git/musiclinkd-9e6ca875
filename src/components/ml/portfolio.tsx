import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Btn } from "@/components/ml/ui";
import { type PortfolioItem, workType } from "@/data/portfolio";

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
        <Link to="/auth">
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
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
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
