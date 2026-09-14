/**
 * FLOW 05 — OPPORTUNITIES shared components.
 * Built on the existing Gestalt kit — no second design system.
 */
import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Bookmark, MapPin, Clock, Users, Wallet, Star } from "lucide-react";
import { Card, StatusPill, ReasonChip, type Tone } from "@/components/ml/kit";
import { VerifiedBadge } from "@/components/ml/ui";
import {
  categoryLabel,
  payLabel,
  savedOpportunityKey,
  type Application,
  type Applicant,
  type Opportunity,
  type OpportunityStatus,
} from "@/data/opportunities";

export function statusTone(s: OpportunityStatus): Tone {
  if (s === "open") return "good";
  if (s === "reviewing") return "brand";
  if (s === "draft") return "neutral";
  if (s === "filled") return "warn";
  return "neutral";
}

/** Local-only shortlist of opportunities (design-only, no backend). */
export function useSavedOpportunities() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(savedOpportunityKey);
      if (raw) setIds(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);
  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(savedOpportunityKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);
  return { ids, toggle, has: (id: string) => ids.includes(id) };
}

export function MatchBar({ score, reasons }: { score: number; reasons: string[] }) {
  return (
    <div className="rounded-lg bg-subtle p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-1 font-semibold">Fit for you</span>
        <span className="text-1 font-bold text-foreground">{score}%</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-card">
        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${score}%` }} />
      </div>
      {reasons.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {reasons.map((r) => (
            <ReasonChip key={r}>{r}</ReasonChip>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PosterRow({ o }: { o: Opportunity }) {
  return (
    <Link
      to="/profile/$username"
      params={{ username: o.poster.username }}
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
    >
      <img src={o.poster.photo} alt="" className="h-11 w-11 rounded-full object-cover" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold">{o.poster.name}</span>
          {o.poster.verified ? <VerifiedBadge size={14} /> : null}
        </span>
        <span className="block truncate text-1 text-muted-foreground">
          {o.poster.kindLabel} ·{" "}
          <Star size={10} fill="currentColor" className="inline" aria-hidden /> {o.poster.rating} ·{" "}
          {o.poster.hires} hires
        </span>
      </span>
    </Link>
  );
}

export function OpportunityCard({
  o,
  saved,
  onSave,
}: {
  o: Opportunity;
  saved?: boolean;
  onSave?: () => void;
}) {
  return (
    <article className="relative rounded-lg border border-border bg-card p-4">
      {onSave ? (
        <button
          type="button"
          onClick={onSave}
          aria-label={saved ? "Remove from saved" : "Save opportunity"}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background"
        >
          <Bookmark
            size={16}
            className={saved ? "text-primary" : "text-muted-foreground"}
            fill={saved ? "currentColor" : "none"}
          />
        </button>
      ) : null}
      <Link to="/opportunities/$id" params={{ id: o.id }} className="block pr-10">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label={categoryLabel(o.categoryKey)} tone="brand" />
          <StatusPill label={o.workMode} />
          {o.featured ? <StatusPill label="Featured" tone="warn" /> : null}
        </div>
        <h3 className="mt-2 text-2 leading-snug">{o.title}</h3>
        <p className="mt-1 line-clamp-2 text-1 text-muted-foreground">{o.summary}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-1 text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Wallet size={13} /> {payLabel(o)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin size={13} /> {o.city}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={13} /> {o.postedAt}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={13} /> {o.applicants} applied
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <img src={o.poster.photo} alt="" className="h-7 w-7 rounded-full object-cover" />
          <span className="min-w-0 flex-1 truncate text-1 text-muted-foreground">
            {o.poster.name}
          </span>
          <span className="shrink-0 text-1 font-bold text-foreground">{o.matchScore}% fit</span>
        </div>
      </Link>
    </article>
  );
}

export function ApplicationCard({ a, o }: { a: Application; o?: Opportunity }) {
  return (
    <Link to="/opportunities/applications/$aid" params={{ aid: a.id }} className="block">
      <Card className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 text-2 leading-snug">{o?.title ?? "Opportunity"}</h3>
          <StatusPill
            label={a.status}
            tone={
              a.status === "shortlisted"
                ? "brand"
                : a.status === "accepted"
                  ? "good"
                  : a.status === "rejected"
                    ? "bad"
                    : "neutral"
            }
          />
        </div>
        <p className="truncate text-1 text-muted-foreground">
          {o?.poster.name ?? "—"} · applied {a.submittedAt}
        </p>
        <p className="line-clamp-2 text-1 text-muted-foreground">{a.message}</p>
      </Card>
    </Link>
  );
}

export function ApplicantCard({ a }: { a: Applicant }) {
  return (
    <Link
      to="/opportunities/$id/applicants/$aid"
      params={{ id: a.opportunityId, aid: a.id }}
      className="block"
    >
      <Card className="space-y-3">
        <div className="flex items-center gap-3">
          <img src={a.photo} alt="" className="h-12 w-12 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold">{a.name}</span>
              {a.verified ? <VerifiedBadge size={14} /> : null}
            </div>
            <p className="truncate text-1 text-muted-foreground">
              {a.headline} · {a.city}
            </p>
          </div>
          <span className="shrink-0 text-1 font-bold text-foreground">{a.matchScore}%</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {a.matchReasons.slice(0, 2).map((r) => (
            <ReasonChip key={r}>{r}</ReasonChip>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <StatusPill
            label={a.status}
            tone={
              a.status === "shortlisted" ? "brand" : a.status === "rejected" ? "bad" : "neutral"
            }
          />
          <span className="text-1 text-muted-foreground">{a.appliedAt}</span>
        </div>
      </Card>
    </Link>
  );
}
