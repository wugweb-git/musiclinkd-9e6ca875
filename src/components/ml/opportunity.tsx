/**
 * FLOW 05 — OPPORTUNITIES shared components.
 * Built on the existing Gestalt kit — no second design system.
 */
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback } from "react";
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
  Store,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { Price, StatusPill, Stars, type Tone } from "@/components/ml/kit";
import { Btn, BtnLink, IconBtn, VerifiedBadge } from "@/components/ml/ui";
import { PersonAvatar } from "./person-avatar";
import { joinParts } from "@/lib/utils";
import {
  categoryLabel,
  payParts,
  savedOpportunityKey,
  type Opportunity,
  type OpportunityStatus,
} from "@/data/opportunities";
import { iconSize } from "@/lib/tokens";
import { useAuth } from "@/hooks/use-auth";
import {
  listMySavedOpportunitySlugs,
  setOpportunitySaved,
  type ApplicantSummary,
  type ApplicationStatus,
  type MyApplication,
} from "@/lib/applications.functions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fitLine, type Fit } from "@/lib/fit";
import { sized } from "@/lib/image-url";

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

// eslint-disable-next-line react-refresh/only-export-components -- helper intentionally co-located with its component
export const categoryIcon = (key: string): LucideIcon => categoryIcons[key] ?? Music;

// eslint-disable-next-line react-refresh/only-export-components -- helper intentionally co-located with its component
export function statusTone(s: OpportunityStatus): Tone {
  if (s === "open") return "good";
  if (s === "reviewing") return "brand";
  if (s === "draft") return "neutral";
  if (s === "filled") return "warn";
  return "neutral";
}

/**
 * The signed-in account's saved opportunities (saved_items). A toggle shows at once and settles on
 * what the server did: a failed save rolls back and says so. Signed out, it asks to sign in rather
 * than keeping a device-only list that looks saved. A shortlist left on this device by the old
 * local-only version is moved to the account once, on the first signed-in load.
 */
// eslint-disable-next-line react-refresh/only-export-components -- hook intentionally co-located with its component
export function useSavedOpportunities() {
  const { signedIn } = useAuth();
  const queryClient = useQueryClient();
  const persist = useServerFn(setOpportunitySaved);
  const load = useServerFn(listMySavedOpportunitySlugs);
  const queryKey = ["saved", "opportunities"];
  const saved = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const raw = localStorage.getItem(savedOpportunityKey);
        const local = raw ? (JSON.parse(raw) as string[]) : [];
        if (local.length) {
          await Promise.allSettled(local.map((slug) => persist({ data: { slug, saved: true } })));
        }
        localStorage.removeItem(savedOpportunityKey);
      } catch {
        /* no storage: nothing to move */
      }
      return load();
    },
    enabled: signedIn,
  });
  const ids = saved.data ?? [];
  const toggle = useCallback(
    async (id: string) => {
      if (!signedIn) {
        toast("Sign in to save this");
        return;
      }
      const saving = !ids.includes(id);
      queryClient.setQueryData<string[]>(queryKey, (prev) =>
        saving ? [...(prev ?? []), id] : (prev ?? []).filter((x) => x !== id),
      );
      try {
        await persist({ data: { slug: id, saved: saving } });
      } catch {
        toast.error("Couldn't update saved. Try again.");
        await queryClient.invalidateQueries({ queryKey });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- queryKey is a constant
    [ids, signedIn, persist, queryClient],
  );
  return {
    ids,
    toggle: (id: string) => void toggle(id),
    has: (id: string) => ids.includes(id),
    isLoading: saved.isLoading,
    isError: saved.isError,
  };
}

/**
 * An applicant's fit to the opportunity (src/lib/fit.ts) and their review average, as two quiet
 * lines: "82% fit · Matches: Guitarist · Acoustic" and the stars with the count.
 */
export function ApplicantFit({
  fit,
  rating,
  reviews,
}: {
  /** Null while the opportunity or the taxonomy has not loaded. */
  fit: Fit | null;
  /** Leave both out to show the fit alone (the viewer's own fit to an opportunity). */
  rating?: number | string | null | undefined;
  reviews?: number | null | undefined;
}) {
  const withReviews = rating !== undefined || reviews !== undefined;
  const average = Number(rating ?? 0);
  const count = reviews ?? 0;
  return (
    <div className="space-y-0.5">
      {fit ? (
        <p className="text-1 text-muted-foreground">
          <span className="font-semibold text-foreground">{fit.score}% fit</span>
          {fit.reasons.length ? ` · ${fitLine(fit)}` : null}
        </p>
      ) : null}
      {!withReviews ? null : count > 0 && average > 0 ? (
        <p className="flex items-center gap-1.5 text-1 text-muted-foreground">
          <Stars value={average} size={12} />
          <span>
            {average.toFixed(1)} · {count} {count === 1 ? "review" : "reviews"}
          </span>
        </p>
      ) : (
        <p className="text-1 text-muted-foreground">No reviews yet</p>
      )}
    </div>
  );
}

/** A stored timestamp as "24 Sep"; a design-time string is shown as it is. */
const postedLine = (at: string) => (Number.isNaN(Date.parse(at)) ? at : shortDate(at));

export function OpportunityCard({
  o,
  saved,
  onSave,
  applicationLabel,
}: {
  o: Opportunity;
  saved?: boolean;
  onSave?: () => void;
  applicationLabel?: string | undefined;
}) {
  const pay = payParts(o);
  // Who and when first, then what, then the terms as one quiet line. At most one label: Featured.
  const terms = [categoryLabel(o.categoryKey), o.workMode, o.city].filter(Boolean).join(" · ");
  return (
    <article className="relative overflow-hidden rounded-lg border border-border bg-card">
      <Link to="/opportunities/$id" params={{ id: o.id }} className="block">
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3 pr-12">
          {o.poster.photo ? (
            <img
              src={sized(o.poster.photo, { width: 32 })}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
          ) : null}
          <p className="min-w-0 flex-1 truncate text-1 text-muted-foreground">
            <span className="font-semibold text-foreground">{o.poster.name}</span>
            {o.postedAt ? ` · ${postedLine(o.postedAt)}` : null}
          </p>
          {o.featured ? <span className="pill shrink-0 bg-background">Featured</span> : null}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 min-w-0 text-2 font-semibold leading-snug">{o.title}</h3>
            {applicationLabel ? (
              <StatusPill label={applicationLabel} tone="neutral" className="shrink-0" />
            ) : null}
          </div>
          {terms ? <p className="mt-1.5 text-1 text-muted-foreground">{terms}</p> : null}
          {/* Why it is here, on the For you tab: what matched the viewer's profile. */}
          {o.matchReasons.length ? (
            <p className="mt-1 truncate text-1 text-muted-foreground">
              {fitLine({ reasons: o.matchReasons })}
            </p>
          ) : null}

          <div className="mt-3 flex items-end justify-between gap-3 border-t border-border pt-3">
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

/** What the applicant sees for their own application's status. */
const MY_STATUS: Record<ApplicationStatus, { label: string; tone: Tone }> = {
  pending: { label: "Sent", tone: "neutral" },
  shortlisted: { label: "Shortlisted", tone: "brand" },
  accepted: { label: "Accepted", tone: "good" },
  rejected: { label: "Not selected", tone: "neutral" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
};

/** What the poster sees for an applicant's status (the board's column names). */
// eslint-disable-next-line react-refresh/only-export-components -- labels shared with the board
export const APPLICANT_STATUS: Record<ApplicationStatus, { label: string; tone: Tone }> = {
  pending: { label: "New", tone: "neutral" },
  shortlisted: { label: "Shortlisted", tone: "brand" },
  accepted: { label: "Accepted", tone: "good" },
  rejected: { label: "Declined", tone: "neutral" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
};

/** A stored timestamp as a date, "24 Sep" — never "3 weeks ago". */
const shortDate = (at: string) =>
  new Date(at).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/**
 * One of your own applications, from the database (opportunity_applications): the opportunity,
 * where it stands, the date you sent it, your message, then View and — while it is still open —
 * Withdraw. `withdrawing` is this card's own pending state, not the list's.
 */
export function ApplicationCard({
  a,
  onWithdraw,
  withdrawing = false,
}: {
  a: MyApplication;
  onWithdraw?: (() => void) | undefined;
  withdrawing?: boolean | undefined;
}) {
  const status = MY_STATUS[a.status];
  const open = a.status === "pending" || a.status === "shortlisted";
  return (
    <article className="rounded-lg bg-subtle p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-2 font-semibold">{a.opportunity?.title ?? "Opportunity"}</h3>
          <p className="mt-0.5 truncate text-1 text-muted-foreground">
            {joinParts(a.opportunity?.location, `Applied ${shortDate(a.created_at)}`)}
          </p>
        </div>
        <StatusPill label={status.label} tone={status.tone} className="shrink-0" />
      </div>
      {a.message ? (
        <p className="mt-2 line-clamp-2 text-1 text-muted-foreground">{a.message}</p>
      ) : null}
      <div className="mt-3 flex items-center gap-2">
        {a.opportunity?.slug ? (
          <BtnLink
            to="/opportunities/$id"
            params={{ id: a.opportunity.slug }}
            variant="outline"
            className="flex-1"
          >
            View
          </BtnLink>
        ) : null}
        {open && onWithdraw ? (
          <Btn variant="ghost" className="flex-1" loading={withdrawing} onClick={onWithdraw}>
            Withdraw
          </Btn>
        ) : null}
      </div>
    </article>
  );
}

/**
 * Someone who applied to your opportunity, from the database: who they are, their fit and
 * reviews, their message, then the next step for where they stand. `moving` is this card's own
 * pending state, so deciding on one applicant never locks the others.
 */
export function ApplicantCard({
  a,
  fit,
  onMove,
  moving = false,
}: {
  a: ApplicantSummary;
  fit: Fit | null;
  onMove: (status: "shortlisted" | "accepted" | "rejected") => void;
  moving?: boolean | undefined;
}) {
  const name = a.person?.display_name ?? a.person?.username ?? "Applicant";
  const status = APPLICANT_STATUS[a.status];
  return (
    <article className="rounded-lg bg-subtle p-4">
      <div className="flex items-center gap-3">
        <PersonAvatar
          name={name}
          photo={a.person?.avatar_url ? sized(a.person.avatar_url, { width: 48 }) : null}
          className="h-12 w-12 shrink-0 text-1"
        />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1">
            <span className="truncate text-sm font-semibold">{name}</span>
            {a.person?.is_verified ? <VerifiedBadge size={16} /> : null}
          </p>
          <p className="truncate text-1 text-muted-foreground">
            {joinParts(a.person?.headline, a.person?.city, `Applied ${shortDate(a.created_at)}`)}
          </p>
        </div>
        <StatusPill label={status.label} tone={status.tone} className="shrink-0" />
      </div>
      <div className="mt-2">
        <ApplicantFit fit={fit} rating={a.person?.rating} reviews={a.person?.review_count} />
      </div>
      {a.message ? (
        <p className="mt-2 line-clamp-3 text-1 text-muted-foreground">{a.message}</p>
      ) : null}
      <div className="mt-3 flex gap-2">
        {a.person?.username ? (
          <BtnLink
            to="/profile/$username"
            params={{ username: a.person.username }}
            variant="outline"
            className="flex-1"
          >
            Profile
          </BtnLink>
        ) : null}
        {a.status === "pending" ? (
          <Btn className="flex-1" disabled={moving} onClick={() => onMove("shortlisted")}>
            Shortlist
          </Btn>
        ) : null}
        {a.status === "shortlisted" ? (
          <Btn className="flex-1" disabled={moving} onClick={() => onMove("accepted")}>
            Accept
          </Btn>
        ) : null}
        {a.status === "pending" || a.status === "shortlisted" ? (
          <Btn
            variant="ghost"
            className="flex-1"
            disabled={moving}
            onClick={() => onMove("rejected")}
          >
            Decline
          </Btn>
        ) : null}
      </div>
    </article>
  );
}
