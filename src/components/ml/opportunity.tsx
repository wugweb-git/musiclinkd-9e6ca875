/**
 * FLOW 05 — OPPORTUNITIES shared components.
 * Built on the existing Gestalt kit — no second design system.
 */
import { Link } from "@tanstack/react-router";
import { Fragment, useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Bookmark,
  CalendarDays,
  Clapperboard,
  Disc3,
  Drum,
  Guitar,
  Handshake,
  Headphones,
  Mic,
  MicVocal,
  Music,
  PenLine,
  Piano,
  Podcast,
  SlidersHorizontal,
  Sparkles,
  Speaker,
  Star,
  Store,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { Card, Price, StatusPill, ReasonChip, type Tone } from "@/components/ml/kit";
import { IconBtn, VerifiedBadge } from "@/components/ml/ui";
import {
  categoryLabel,
  payParts,
  savedOpportunityKey,
  type Application,
  type Applicant,
  type Opportunity,
  type OpportunityStatus,
} from "@/data/opportunities";
import { iconSize } from "@/lib/tokens";

/** One icon per requirement type, in place of the emoji the categories carried. */
const categoryIcons: Record<string, LucideIcon> = {
  singer: MicVocal,
  guitarist: Guitar,
  producer: SlidersHorizontal,
  composer: Music,
  lyricist: PenLine,
  mixing: SlidersHorizontal,
  mastering: Disc3,
  session: Drum,
  dj: Headphones,
  sound: Speaker,
  studio: Store,
  venue: Ticket,
  equipment: Piano,
  bandmember: Handshake,
  collab: Sparkles,
  gig: Ticket,
  recording: Mic,
  film: Clapperboard,
  podcast: Podcast,
  event: CalendarDays,
};

export const categoryIcon = (key: string): LucideIcon => categoryIcons[key] ?? Music;

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
  // Stored opportunities have no poster kind, rating or hires; only what exists is shown.
  const meta: ReactNode[] = [];
  if (o.poster.kindLabel) meta.push(o.poster.kindLabel);
  if (o.poster.rating)
    meta.push(
      <>
        <Star size={iconSize.xs} fill="currentColor" className="inline" aria-hidden /> {o.poster.rating}
      </>,
    );
  if (o.poster.hires) meta.push(`${o.poster.hires} hires`);
  const className = "flex items-center gap-3 rounded-lg bg-subtle p-3";
  const body = (
    <>
      {o.poster.photo ? (
        <img src={o.poster.photo} alt="" className="h-11 w-11 rounded-full object-cover" />
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold">{o.poster.name}</span>
          {o.poster.verified ? <VerifiedBadge size={16} /> : null}
        </span>
        {meta.length ? (
          <span className="block truncate text-1 text-muted-foreground">
            {meta.map((m, i) => (
              <Fragment key={i}>
                {i ? " · " : null}
                {m}
              </Fragment>
            ))}
          </span>
        ) : null}
      </span>
    </>
  );
  if (!o.poster.username) return <div className={className}>{body}</div>;
  return (
    <Link to="/profile/$username" params={{ username: o.poster.username }} className={className}>
      {body}
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
  const pay = payParts(o);
  // Who and when first, then what, then the terms as one quiet line. At most one label: Featured.
  const terms = [categoryLabel(o.categoryKey), o.workMode, o.city].filter(Boolean).join(" · ");
  return (
    <article className="relative rounded-lg bg-subtle p-4">
      <Link to="/opportunities/$id" params={{ id: o.id }} className="block">
        <div className="flex items-center gap-2.5 pr-10">
          {o.poster.photo ? (
            <img
              src={o.poster.photo}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
          ) : null}
          <p className="min-w-0 flex-1 truncate text-1 text-muted-foreground">
            <span className="font-semibold text-foreground">{o.poster.name}</span>
            {o.postedAt ? ` · ${o.postedAt}` : null}
          </p>
          {o.featured ? <span className="pill shrink-0 bg-background">Featured</span> : null}
        </div>

        <h3 className="mt-3 line-clamp-2 text-2 font-semibold leading-snug">{o.title}</h3>
        {terms ? <p className="mt-1 truncate text-1 text-muted-foreground">{terms}</p> : null}

        <div className="mt-4 flex items-end justify-between gap-3">
          {pay ? (
            <Price price={pay} amountClassName="text-sm font-semibold" />
          ) : (
            <span className="text-1 text-muted-foreground">Pay on enquiry</span>
          )}
          <p className="shrink-0 text-right text-1 text-muted-foreground">
            {o.matchScore ? (
              <span className="block text-sm font-semibold text-foreground">
                {o.matchScore}% match
              </span>
            ) : null}
            {o.applicants} applied
          </p>
        </div>
      </Link>
      {onSave ? (
        <IconBtn
          label={saved ? "Remove from saved" : "Save opportunity"}
          variant="plain"
          className="absolute right-2 top-2"
          onClick={onSave}
        >
          <Bookmark size={iconSize.md} fill={saved ? "currentColor" : "none"} aria-hidden />
        </IconBtn>
      ) : null}
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
              {a.verified ? <VerifiedBadge size={16} /> : null}
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
