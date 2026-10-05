import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PersonAvatar } from "./person-avatar";
import { MapPin, Star, Building2, Plus, UserPlus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import {
  answerConnection,
  followerFaces,
  connectionWith,
  requestConnection,
  setFollowing,
  type ConnectionState,
} from "@/lib/connections.functions";
import { listMySavedIds } from "@/lib/saved.functions";
import { Btn, BtnLink, IconBtn, IconBtnLink, VerifiedBadge } from "./ui";
import { Rating, StatusPill } from "./kit";
import type { DirectoryPerson } from "@/lib/profile-groups.functions";
import type { DiscoverBookable } from "@/lib/bookable-view";
import { labelFor, type TaxonomyOption } from "@/lib/taxonomy";
import { iconSize } from "@/lib/tokens";
import { shownPlace } from "@/lib/place";
import { cn } from "@/lib/utils";

// Canonical re-exports for cards recycling across the whole application:
export {
  ServiceCard,
  ServiceCardSkeleton,
  ReviewCard,
  ReviewCardSkeleton,
  ReviewRail,
} from "./profile";
import { sized } from "@/lib/image-url";
import { LogoMark } from "./logo";
import { StateIcon } from "./tab-icon";

/*
 * Talent card and business card (owner, 22 Sep 2026: "redo the cards, all states, types" — one
 * design for each, used everywhere, real data only). Both share the same shape: a name row with
 * the verified badge, one line of place and a rating when there is one. No price: a profile card
 * never shows one (owner, 4 Oct 2026, §3); prices live on Service Cards. Two sizes each: a Row for lists
 * (Search, Directory) and a Card for horizontal rails (Discover, Home, business search).
 */

/* ------------------------------------------------------------------ */
/* Card actions — Connect / Follow, beside the card link                 */
/* ------------------------------------------------------------------ */

/*
 * The action every profile card shares (owner, 5 Oct: cards get Connect / Follow). It sits
 * next to the card's link, never inside it: a button inside a link is invalid HTML. A person gets
 * Connect, a business gets Follow (item 11); neither is needed before Message. Signed out, the
 * action goes to Welcome, as on the profile pages. Your own card shows no action. The state is
 * the profile page's own query (["connection", id]), so a card and the profile agree.
 */
function CardActions({
  profileId,
  relation,
  compact = false,
  className,
}: {
  profileId: string | null | undefined;
  relation: "connect" | "follow";
  /** A list row: the action is an icon button (named for screen readers) so the name keeps its room. */
  compact?: boolean | undefined;
  className?: string | undefined;
}) {
  const { signedIn, user } = useAuth();
  const own = Boolean(profileId && user?.id === profileId);
  const label = relation === "connect" ? "Connect" : "Follow";
  const Glyph = relation === "connect" ? UserPlus : Plus;
  const action =
    !profileId || own ? null : signedIn ? (
      <RelationButton profileId={profileId} relation={relation} compact={compact} />
    ) : compact ? (
      <IconBtnLink to="/welcome" label={label}>
        <Glyph size={iconSize.md} aria-hidden />
      </IconBtnLink>
    ) : (
      <BtnLink
        to="/welcome"
        variant="outline"
        className={compact ? actionBtn : cardFooterBtn}
        icon={<Glyph size={iconSize.sm} aria-hidden />}
      >
        {label}
      </BtnLink>
    );
  if (!action) return null;
  return <div className={cn("flex items-center gap-2", className)}>{action}</div>;
}

/** Overlapping faces of a profile's latest followers and the real count; nothing without any. */
function FollowerFaces({ profileId }: { profileId: string }) {
  const load = useServerFn(followerFaces);
  const q = useQuery({
    queryKey: ["followers", "faces", profileId],
    queryFn: () => load({ data: { profileId } }),
  });
  const faces = q.data?.faces ?? [];
  if (!faces.length) return null;
  const total = q.data?.total ?? faces.length;
  return (
    <span className="flex min-h-8 items-center gap-2" aria-label={`Following · ${total} followers`}>
      <span className="flex -space-x-2" aria-hidden>
        {faces.map((f) => (
          <PersonAvatar
            key={f.id}
            name={f.name}
            photo={f.avatarUrl ? sized(f.avatarUrl, { width: 32 }) : null}
            className="h-7 w-7 border-2 border-card text-xs"
          />
        ))}
      </span>
      <span className="text-xs text-muted-foreground" aria-hidden>
        {total.toLocaleString("en-IN")}
      </span>
    </span>
  );
}

/** Looks 36px, takes a 48dp tap (hit-area). */
const actionBtn = "hit-area min-h-9 h-9 px-3 text-1";
/** On a card: a compact pill at the card's bottom, sized to its label (looks 32px, taps at 48dp). */
const cardFooterBtn = "hit-area !min-h-8 !h-8 !gap-1 !px-3 !text-1";

function RelationButton({
  profileId,
  relation,
  compact,
}: {
  profileId: string;
  relation: "connect" | "follow";
  compact: boolean;
}) {
  const queryClient = useQueryClient();
  const read = useServerFn(connectionWith);
  const ask = useServerFn(requestConnection);
  const answer = useServerFn(answerConnection);
  const follow = useServerFn(setFollowing);
  const key = ["connection", profileId] as const;
  const q = useQuery({ queryKey: key, queryFn: () => read({ data: { profileId } }) });
  const state: ConnectionState = q.data?.state ?? "none";
  const following = q.data?.following ?? false;

  const act = useMutation({
    mutationFn: async (what: "ask" | "accept" | "follow" | "unfollow") => {
      // Without the current state a tap could send a second request; say so instead.
      if (q.isError) throw new Error("We couldn't load this connection. Try again.");
      if (what === "ask") await ask({ data: { profileId } });
      else if (what === "accept") {
        const id = q.data?.connectionId;
        if (id) await answer({ data: { id, accept: true } });
      } else await follow({ data: { profileId, following: what === "follow" } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
    // Optimistic below; a failure reverts it and says so.
    onError: (e) => {
      void q.refetch();
      toast.error(e instanceof Error && e.message ? e.message : "That didn't save. Try again.");
    },
  });
  const pending = act.isPending ? act.variables : undefined;

  if (relation === "follow") {
    const on = pending === "follow" ? true : pending === "unfollow" ? false : following;
    const toggle = () => {
      if (!act.isPending) act.mutate(on ? "unfollow" : "follow");
    };
    if (compact)
      return (
        <IconBtn
          label={on ? "Following" : "Follow"}
          variant={on ? "ghost" : "outline"}
          disabled={q.isPending}
          onClick={toggle}
        >
          <StateIcon outline={Plus} solid="check" active={on} size={iconSize.md} move="stamp" />
        </IconBtn>
      );
    // On a card you already follow, the button gives way to who else follows (owner, 5 Oct).
    // Unfollow stays on the profile page.
    if (on && !pending) return <FollowerFaces profileId={profileId} />;
    return (
      <Btn
        variant={on ? "outline" : "primary"}
        className={compact ? actionBtn : cardFooterBtn}
        icon={<Plus size={iconSize.sm} aria-hidden />}
        disabled={q.isPending}
        onClick={toggle}
      >
        {on ? "Following" : "Follow"}
      </Btn>
    );
  }

  const shown: ConnectionState =
    pending === "ask" ? "sent" : pending === "accept" ? "connected" : state;
  // Connected and Requested are states, not actions: removing a connection stays on the profile.
  const done = shown === "connected" || shown === "sent";
  const label =
    shown === "connected"
      ? "Connected"
      : shown === "sent"
        ? "Requested"
        : shown === "received"
          ? "Accept"
          : "Connect";
  const onConnect = () => {
    if (act.isPending) return;
    if (state === "received") act.mutate("accept");
    else if (state === "none" || state === "declined") act.mutate("ask");
  };
  if (compact)
    return (
      <IconBtn
        label={label}
        variant={done ? "ghost" : "outline"}
        disabled={q.isPending || done}
        onClick={onConnect}
      >
        <StateIcon outline={UserPlus} solid="check" active={done} size={iconSize.md} move="stamp" />
      </IconBtn>
    );
  return (
    <Btn
      variant={done ? "outline" : "primary"}
      className={compact ? actionBtn : cardFooterBtn}
      icon={<UserPlus size={iconSize.sm} aria-hidden />}
      disabled={q.isPending || done}
      onClick={onConnect}
    >
      {label}
    </Btn>
  );
}

/* ------------------------------------------------------------------ */
/* Talent card — a person from the directory                           */
/* ------------------------------------------------------------------ */

/**
 * A person as the cards need them. The directory's `DirectoryPerson` fits as-is; other lists
 * (connections, an opportunity's poster) pass what they have. No username, no link.
 */
export type PersonLike = Pick<DirectoryPerson, "id" | "name" | "headline" | "city" | "verified"> & {
  username: string | null;
  avatarUrl: string | null;
  roles?: string[] | undefined;
  rating?: number | null | undefined;
  reviewCount?: number | undefined;
  /** A business account: Follow instead of Connect (owner, 5 Oct). */
  isBusiness?: boolean | undefined;
  joinedAt?: string | null | undefined;
};

const NEW_FOR_MS = 14 * 24 * 60 * 60 * 1000;
function joinedRecently(at: string | null | undefined) {
  if (!at) return false;
  const t = Date.parse(at);
  return Number.isFinite(t) && Date.now() - t < NEW_FOR_MS;
}

function personDetail(person: PersonLike, roleLabels?: TaxonomyOption[]) {
  return (
    person.headline ??
    (person.roles ?? [])
      .slice(0, 2)
      .map((r) => labelFor(roleLabels, r))
      .join(" · ")
  );
}

/**
 * One person as a row. The directory, search, connections, an opportunity's poster and anywhere
 * else that lists real people share this: photo (initials when there is none), name, one line of
 * detail, city and rating. The row's end holds Connect / Follow unless the screen passes its own
 * `action` (Accept / Ignore, "Requested"); `null` leaves it empty.
 */
export function PersonRow({
  person,
  roleLabels,
  detail,
  action,
  as: Tag = "li",
  className,
}: {
  person: PersonLike;
  roleLabels?: TaxonomyOption[] | undefined;
  /** Replaces the headline line, e.g. an opportunity poster's kind and hires. */
  detail?: ReactNode | undefined;
  /** The row's end. Defaults to Connect / Follow; `null` for nothing. */
  action?: ReactNode | undefined;
  as?: "li" | "div" | undefined;
  className?: string | undefined;
}) {
  const line = detail ?? personDetail(person, roleLabels);
  const rating = person.rating ?? null;
  const body = (
    <>
      <PersonAvatar
        name={person.name}
        photo={person.avatarUrl ? sized(person.avatarUrl, { width: 44 }) : null}
        className="h-11 w-11 shrink-0 border border-border/60 text-1"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1">
          <span className="truncate text-sm font-semibold text-foreground">{person.name}</span>
          {person.verified ? <VerifiedBadge size={16} /> : null}
        </span>
        {line ? <span className="block truncate text-1 text-muted-foreground">{line}</span> : null}
        {person.city || rating != null ? (
          <span className="mt-0.5 flex items-center gap-1 text-1 text-muted-foreground">
            {person.city ? (
              <>
                <MapPin size={iconSize.xs} className="shrink-0" aria-hidden />
                <span className="truncate">{person.city}</span>
              </>
            ) : null}
            <Rating value={rating} count={person.reviewCount ?? 0} />
          </span>
        ) : null}
      </span>
    </>
  );
  const end =
    action === undefined ? (
      <CardActions
        profileId={person.id}
        relation={person.isBusiness ? "follow" : "connect"}
        compact
        className="shrink-0"
      />
    ) : (
      action
    );
  return (
    <Tag
      className={cn(
        "flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-card/50",
        className,
      )}
    >
      {person.username ? (
        <Link
          to="/profile/$username"
          params={{ username: person.username }}
          className="state-layer flex min-h-touch min-w-0 flex-1 items-center gap-3 active:scale-[0.99]"
        >
          {body}
        </Link>
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-3">{body}</span>
      )}
      {end}
    </Tag>
  );
}

export function PersonRowSkeleton() {
  return (
    <li className="flex items-center gap-3 px-4 py-3.5">
      <span className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-ink/5" />
      <span className="min-w-0 flex-1 space-y-1.5">
        <span className="block h-3.5 w-28 animate-pulse rounded bg-ink/5" />
        <span className="block h-3 w-40 animate-pulse rounded bg-ink/5" />
        <span className="block h-3 w-20 animate-pulse rounded bg-ink/5" />
      </span>
      <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-ink/5" />
    </li>
  );
}

/**
 * One person as a card, for a rail (Discover, recommendations, booking collaborator pickers).
 * `featured` is the photo-led state: the photo carries the card and the name sits on the scrim
 * (it replaces PersonHeroCard). Otherwise the headline wraps up to three lines rather than
 * truncating — a card this narrow reads better with a full short bio than a clipped line.
 */
export function PersonCard({
  person,
  roleLabels,
  featured = false,
  disabled = false,
  fill = false,
}: {
  person: PersonLike;
  roleLabels?: TaxonomyOption[] | undefined;
  featured?: boolean | undefined;
  /** Fill a grid cell (the 2-column People grid) instead of a fixed rail width. */
  fill?: boolean | undefined;
  /** A preview, not a real profile to open — renders the same card with no link. */
  disabled?: boolean | undefined;
}) {
  const detail = personDetail(person, roleLabels);
  const roleLine = (person.roles ?? [])
    .slice(0, 2)
    .map((r) => labelFor(roleLabels, r))
    .join(" · ");
  const rating = person.rating ?? null;
  const { signedIn } = useAuth();
  const loadSaved = useServerFn(listMySavedIds);
  const saved = useQuery({
    queryKey: ["saved", "ids", "talent"],
    queryFn: () => loadSaved({ data: { targetType: "talent" } }),
    enabled: signedIn && !disabled,
  });
  const favourite = saved.data?.includes(person.id) ?? false;
  const isNew = joinedRecently(person.joinedAt);
  const body = featured ? (
    <>
      {person.avatarUrl ? (
        <img
          src={sized(person.avatarUrl, { width: 412 })}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-ink/5">
          <PersonAvatar name={person.name} photo={null} className="h-20 w-20 text-3" />
        </span>
      )}
      <div className="media-scrim" />
      <span className="absolute inset-x-3 bottom-3 text-background">
        <span className="flex min-w-0 items-center gap-1">
          <span className="truncate text-2 font-bold">{person.name}</span>
          {person.verified ? <VerifiedBadge size={14} /> : null}
        </span>
        {detail ? (
          <span className="mt-0.5 block truncate text-1 text-background/80">{detail}</span>
        ) : null}
        {rating != null ? (
          <span className="mt-0.5 flex items-center gap-0.5 text-1 text-background/80">
            <Star size={iconSize.xs} fill="currentColor" aria-hidden />
            {rating.toFixed(1)}
          </span>
        ) : null}
      </span>
    </>
  ) : (
    // Reference 16: photo inset in the card, name, role · specialty. No city on a talent card (owner, 5 Oct).
    // No photo: the brand mark on a quiet tile, never initials.
    <>
      <span className="relative block">
        {person.avatarUrl ? (
          <img
            src={sized(person.avatarUrl, { width: 412 })}
            alt=""
            loading="lazy"
            className="aspect-square w-full rounded-md object-cover"
          />
        ) : (
          <span className="flex aspect-square w-full items-center justify-center rounded-md bg-ink/5">
            <LogoMark className="h-auto w-1/4" />
          </span>
        )}
        {/* Glass labels from real data only: New (joined in the last 14 days), Favourite (you saved them). */}
        {isNew || favourite ? (
          <span className="absolute left-1.5 top-1.5 flex gap-1">
            {isNew ? <StatusPill label="New" tone="brand" onMedia /> : null}
            {favourite ? <StatusPill label="Favourite" tone="good" onMedia /> : null}
          </span>
        ) : null}
      </span>
      <span className="mt-2 flex min-w-0 items-center gap-1">
        <span className="truncate text-sm font-bold text-foreground">{person.name}</span>
        {person.verified ? <VerifiedBadge size={14} /> : null}
      </span>
      {roleLine ? (
        <span className="block truncate text-xs text-muted-foreground">{roleLine}</span>
      ) : null}
    </>
  );
  const shape = featured
    ? "relative block h-56 w-rail-sm shrink-0 overflow-hidden rounded-lg text-left"
    : "block w-full rounded-lg border border-border/80 bg-card p-2";
  const live = featured
    ? "state-layer transition-transform duration-150 ease-standard active:scale-[0.985]"
    : "state-layer group transition-all duration-150 ease-standard hover:border-muted-foreground/40 active:scale-[0.985]";
  // A preview, or a person with no username, is the same card with nothing to open.
  const width = fill ? "w-full min-w-0" : "w-rail-sm shrink-0";
  if (disabled || !person.username)
    return <div className={cn(shape, !featured && width)}>{body}</div>;
  // The card frame holds the link and, at its bottom, the action — beside the link, never inside
  // it (no button inside a link).
  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border border-border/80 bg-card",
        featured ? "overflow-hidden" : "gap-2 p-2",
        width,
      )}
    >
      <Link
        to="/profile/$username"
        params={{ username: person.username }}
        className={cn(
          featured ? "relative block h-56 overflow-hidden text-left" : "group block rounded-md",
          "state-layer transition-transform duration-150 ease-standard active:scale-[0.985]",
        )}
      >
        {body}
      </Link>
      <CardActions
        profileId={person.id}
        relation={person.isBusiness ? "follow" : "connect"}
        className={featured ? "p-2" : undefined}
      />
    </div>
  );
}

export function PersonCardSkeleton() {
  return (
    <div className="w-rail-sm shrink-0 rounded-lg border border-border/60 bg-card p-4">
      <div className="h-14 w-14 animate-pulse rounded-full bg-ink/5" />
      <div className="mt-3 h-3.5 w-24 animate-pulse rounded bg-ink/5" />
      <div className="mt-1.5 h-3 w-full animate-pulse rounded bg-ink/5" />
      <div className="mt-1 h-3 w-3/4 animate-pulse rounded bg-ink/5" />
      <div className="mt-2 h-3 w-16 animate-pulse rounded bg-ink/5" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Business / studio card — a business account, real bookable spaces   */
/* ------------------------------------------------------------------ */

/** Where a business opens: its profile, else its booking page, else nowhere. */
function studioLink(studio: DiscoverBookable) {
  if (studio.username)
    return { to: "/profile/$username" as const, params: { username: studio.username } };
  if (studio.slug) return { to: "/booking/$id" as const, params: { id: studio.slug } };
  return null;
}

/**
 * One business or studio as a card, for a rail (Discover, Home "Studios to book", business
 * search). The same shape as PersonCard — verified name, one line of place, rating — so a talent
 * card and a business card read as one family. `featured` is the photo-led state (name and place
 * on the scrim) that replaces StudioMediaCard. A
 * business with nowhere to open, or a preview, is the same card with no link: nothing to focus.
 */
export function BookableCard({
  studio,
  featured = false,
  disabled = false,
}: {
  studio: DiscoverBookable;
  featured?: boolean | undefined;
  /** A preview, not a real business to open — renders the same card with no link. */
  disabled?: boolean | undefined;
}) {
  const link = disabled ? null : studioLink(studio);
  const place = shownPlace(studio.location);
  const body = featured ? (
    <>
      {studio.photo ? (
        <img
          src={sized(studio.photo, { width: 412 })}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-ink/5 text-muted-foreground">
          <Building2 size={28} aria-hidden />
        </span>
      )}
      <div className="media-scrim" />
      <span className="absolute inset-x-3 bottom-3 text-background">
        <span className="flex min-w-0 items-center gap-1">
          <span className="truncate text-2 font-bold">{studio.name}</span>
          {studio.verified ? <VerifiedBadge size={14} /> : null}
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1 text-1 text-background/80">
          <span className="truncate">{place}</span>
          {studio.rating != null ? (
            <>
              <span aria-hidden>·</span>
              <span className="flex shrink-0 items-center gap-0.5">
                <Star size={iconSize.xs} fill="currentColor" aria-hidden />
                {studio.rating.toFixed(1)}
              </span>
            </>
          ) : null}
        </span>
      </span>
    </>
  ) : (
    <>
      {studio.photo ? (
        <div className="overflow-hidden">
          <img
            src={sized(studio.photo, { width: 412 })}
            alt=""
            loading="lazy"
            className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <span
          className="flex h-28 w-full items-center justify-center bg-ink/5 text-muted-foreground"
          aria-hidden
        >
          <Building2 size={28} />
        </span>
      )}
      <span className="block p-3">
        <span className="flex min-w-0 items-center gap-1">
          <span className="truncate text-2 font-semibold text-foreground transition-colors group-hover:text-ink">
            {studio.name}
          </span>
          {studio.verified ? <VerifiedBadge size={14} /> : null}
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1 text-1 text-muted-foreground">
          <MapPin size={iconSize.xs} className="shrink-0" aria-hidden />
          <span className="truncate">{place}</span>
          {studio.rating != null ? (
            <>
              <span aria-hidden>·</span>
              <Rating value={studio.rating} count={studio.reviewCount} />
            </>
          ) : null}
        </span>
      </span>
    </>
  );
  const shape = featured
    ? "relative block aspect-[4/3] w-rail-md shrink-0 overflow-hidden rounded-lg text-left"
    : "block w-rail-md shrink-0 overflow-hidden rounded-lg border border-border/80 bg-card";
  if (!link) return <div className={shape}>{body}</div>;
  // The card frame holds the link and, at its bottom, the action — beside the link, never inside
  // it (no button inside a link).
  return (
    <div className="flex w-rail-md shrink-0 flex-col overflow-hidden rounded-lg border border-border/80 bg-card">
      <Link
        {...link}
        className={cn(
          featured ? "relative block aspect-[4/3] overflow-hidden text-left" : "group block",
          "state-layer transition-transform duration-150 ease-standard active:scale-[0.985]",
        )}
      >
        {body}
      </Link>
      <CardActions
        profileId={studio.ownerId}
        relation="follow"
        className={featured ? "p-2" : "px-3 pb-3"}
      />
    </div>
  );
}

export function BookableCardSkeleton() {
  return (
    <div className="w-rail-md shrink-0 overflow-hidden rounded-lg border border-border/60 bg-card">
      <div className="h-28 w-full animate-pulse bg-ink/5" />
      <div className="space-y-1.5 p-3">
        <div className="h-3.5 w-28 animate-pulse rounded bg-ink/5" />
        <div className="h-3 w-20 animate-pulse rounded bg-ink/5" />
        <div className="mt-1.5 h-3.5 w-16 animate-pulse rounded bg-ink/5" />
      </div>
    </div>
  );
}

/**
 * A business row for a list (search results, directory). Same fields as BookableCard, laid out
 * horizontally, with Follow at its end.
 */
export function BookableRow({ studio }: { studio: DiscoverBookable }) {
  const link = studioLink(studio);
  const inner = "flex min-w-0 flex-1 items-center gap-3";
  const content = (
    <>
      {studio.photo ? (
        <img
          src={sized(studio.photo, { width: 56 })}
          alt=""
          loading="lazy"
          className="h-14 w-14 shrink-0 rounded-lg border border-border/60 object-cover"
        />
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-muted-foreground">
          <Building2 size={20} aria-hidden />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1">
          <span className="truncate text-sm font-semibold text-foreground">{studio.name}</span>
          {studio.verified ? <VerifiedBadge size={16} /> : null}
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1 text-1 text-muted-foreground">
          <MapPin size={iconSize.xs} className="shrink-0" aria-hidden />
          <span className="truncate">{shownPlace(studio.location)}</span>
          {studio.rating != null ? (
            <>
              <span aria-hidden>·</span>
              <Rating value={studio.rating} count={studio.reviewCount} />
            </>
          ) : null}
        </span>
      </span>
      {/* No price on a profile card (owner, 4 Oct 2026, §3): prices live on Service Cards. */}
    </>
  );
  return (
    <li className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-card/50">
      {link ? (
        <Link {...link} className={cn(inner, "state-layer active:scale-[0.99]")}>
          {content}
        </Link>
      ) : (
        // Nowhere to open: the same row, not a link that goes nowhere.
        <span className={inner}>{content}</span>
      )}
      <CardActions profileId={studio.ownerId} relation="follow" compact className="shrink-0" />
    </li>
  );
}
