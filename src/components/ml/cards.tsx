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
  connectionWith,
  requestConnection,
  setFollowing,
  type ConnectionState,
} from "@/lib/connections.functions";
import type { SavedTargetType } from "@/lib/saved.functions";
import { Btn, BtnLink, IconBtn, IconBtnLink, VerifiedBadge } from "./ui";
import { Rating } from "./kit";
import { SavedToggle } from "./saved-toggle";
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
import { StateIcon } from "./tab-icon";

/*
 * Talent card and business card (owner, 22 Sep 2026: "redo the cards, all states, types" — one
 * design for each, used everywhere, real data only). Both share the same shape: a name row with
 * the verified badge, one line of place and a rating when there is one. No price: a profile card
 * never shows one (owner, 4 Oct 2026, §3); prices live on Service Cards. Two sizes each: a Row for lists
 * (Search, Directory) and a Card for horizontal rails (Discover, Home, business search).
 */

/* ------------------------------------------------------------------ */
/* Card actions — Connect / Follow and Save, beside the card link       */
/* ------------------------------------------------------------------ */

/*
 * The action band every profile card shares (owner, 5 Oct: cards get Connect / Follow). It sits
 * next to the card's link, never inside it: a button inside a link is invalid HTML. A person gets
 * Connect, a business gets Follow (item 11); neither is needed before Message. Signed out, the
 * action goes to Welcome, as on the profile pages. Your own card shows no action. The state is
 * the profile page's own query (["connection", id]), so a card and the profile agree.
 */
function CardActions({
  profileId,
  relation,
  save,
  compact = false,
  className,
}: {
  profileId: string | null | undefined;
  relation: "connect" | "follow";
  save: { targetType: SavedTargetType; targetId: string } | null;
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
        className={actionBtn}
        icon={<Glyph size={iconSize.sm} aria-hidden />}
      >
        {label}
      </BtnLink>
    );
  if (!action && !save) return null;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {action}
      {save ? (
        <SavedToggle targetType={save.targetType} targetId={save.targetId} size={36} />
      ) : null}
    </div>
  );
}

/** Looks 36px, takes a 48dp tap (hit-area). */
const actionBtn = "hit-area min-h-9 h-9 px-3 text-1";

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
    return (
      <Btn
        variant={on ? "outline" : "primary"}
        className={actionBtn}
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
      className={actionBtn}
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
};

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
 * detail, city and rating. The row's end holds the save heart unless the screen passes its own
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
  /** The row's end. Defaults to the save heart; `null` for nothing. */
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
        save={{ targetType: person.isBusiness ? "business" : "talent", targetId: person.id }}
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
      <span className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-subtle" />
      <span className="min-w-0 flex-1 space-y-1.5">
        <span className="block h-3.5 w-28 animate-pulse rounded bg-subtle" />
        <span className="block h-3 w-40 animate-pulse rounded bg-subtle" />
        <span className="block h-3 w-20 animate-pulse rounded bg-subtle" />
      </span>
      <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-subtle" />
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
}: {
  person: PersonLike;
  roleLabels?: TaxonomyOption[] | undefined;
  featured?: boolean | undefined;
  /** A preview, not a real profile to open — renders the same card with no link. */
  disabled?: boolean | undefined;
}) {
  const detail = personDetail(person, roleLabels);
  const rating = person.rating ?? null;
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
        <span className="flex h-full w-full items-center justify-center bg-subtle">
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
        {person.city || rating != null ? (
          <span className="mt-0.5 flex min-w-0 items-center gap-1 text-1 text-background/80">
            {person.city ? <span className="truncate">{person.city}</span> : null}
            {person.city && rating != null ? <span aria-hidden>·</span> : null}
            {rating != null ? (
              <span className="flex shrink-0 items-center gap-0.5">
                <Star size={iconSize.xs} fill="currentColor" aria-hidden />
                {rating.toFixed(1)}
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
    </>
  ) : (
    <>
      <PersonAvatar
        name={person.name}
        photo={person.avatarUrl ? sized(person.avatarUrl, { width: 56 }) : null}
        className="h-14 w-14 border border-border/60 text-sm"
      />
      <span className="mt-3 flex min-w-0 items-center gap-1">
        <span className="truncate text-2 font-semibold text-foreground transition-colors group-hover:text-ink">
          {person.name}
        </span>
        {person.verified ? <VerifiedBadge size={14} /> : null}
      </span>
      {detail ? (
        <span className="mt-0.5 line-clamp-3 block min-w-0 text-1 leading-snug text-muted-foreground">
          {detail}
        </span>
      ) : null}
      {person.city ? (
        <span className="mt-1.5 flex min-w-0 items-center gap-1 text-1 text-muted-foreground">
          <MapPin size={iconSize.xs} className="shrink-0" aria-hidden />
          <span className="truncate">{person.city}</span>
        </span>
      ) : null}
      {rating != null ? (
        <span className="mt-1 flex items-center text-1">
          <Rating value={rating} count={person.reviewCount ?? 0} />
        </span>
      ) : null}
    </>
  );
  const shape = featured
    ? "relative block h-56 w-rail-sm shrink-0 overflow-hidden rounded-lg text-left"
    : "block w-rail-sm shrink-0 rounded-lg border border-border/80 bg-card p-4 shadow-xs";
  const live = featured
    ? "state-layer transition-transform duration-150 ease-standard active:scale-[0.985]"
    : "state-layer group transition-all duration-150 ease-standard hover:border-muted-foreground/40 hover:shadow-sm active:scale-[0.985]";
  // A preview, or a person with no username, is the same card with nothing to open.
  if (disabled || !person.username) return <div className={shape}>{body}</div>;
  // The footer sits beside the link, not inside it (no button inside a link).
  return (
    <div className="flex w-rail-sm shrink-0 flex-col gap-2">
      <Link
        to="/profile/$username"
        params={{ username: person.username }}
        className={cn(shape, live)}
      >
        {body}
      </Link>
      <CardActions
        profileId={person.id}
        relation={person.isBusiness ? "follow" : "connect"}
        save={{ targetType: person.isBusiness ? "business" : "talent", targetId: person.id }}
      />
    </div>
  );
}

export function PersonCardSkeleton() {
  return (
    <div className="w-rail-sm shrink-0 rounded-lg border border-border/60 bg-card p-4">
      <div className="h-14 w-14 animate-pulse rounded-full bg-subtle" />
      <div className="mt-3 h-3.5 w-24 animate-pulse rounded bg-subtle" />
      <div className="mt-1.5 h-3 w-full animate-pulse rounded bg-subtle" />
      <div className="mt-1 h-3 w-3/4 animate-pulse rounded bg-subtle" />
      <div className="mt-2 h-3 w-16 animate-pulse rounded bg-subtle" />
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
        <span className="flex h-full w-full items-center justify-center bg-subtle text-muted-foreground">
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
          className="flex h-28 w-full items-center justify-center bg-subtle text-muted-foreground"
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
    : "block w-rail-md shrink-0 overflow-hidden rounded-lg border border-border/80 bg-card shadow-xs";
  if (!link) return <div className={shape}>{body}</div>;
  // The footer sits beside the link, not inside it (no button inside a link).
  return (
    <div className="flex w-rail-md shrink-0 flex-col gap-2">
      <Link
        {...link}
        className={cn(
          shape,
          featured
            ? "state-layer"
            : "state-layer group transition-all duration-150 ease-standard hover:border-muted-foreground/40 hover:shadow-sm active:scale-[0.985]",
        )}
      >
        {body}
      </Link>
      <CardActions
        profileId={studio.ownerId}
        relation="follow"
        save={{ targetType: "studio", targetId: studio.id }}
      />
    </div>
  );
}

export function BookableCardSkeleton() {
  return (
    <div className="w-rail-md shrink-0 overflow-hidden rounded-lg border border-border/60 bg-card shadow-xs">
      <div className="h-28 w-full animate-pulse bg-subtle" />
      <div className="space-y-1.5 p-3">
        <div className="h-3.5 w-28 animate-pulse rounded bg-subtle" />
        <div className="h-3 w-20 animate-pulse rounded bg-subtle" />
        <div className="mt-1.5 h-3.5 w-16 animate-pulse rounded bg-subtle" />
      </div>
    </div>
  );
}

/**
 * A business row for a list (search results, directory). Same fields as BookableCard, laid out
 * horizontally, with the same save control PersonRow uses.
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
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-subtle text-muted-foreground">
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
      <CardActions
        profileId={studio.ownerId}
        relation="follow"
        save={{ targetType: "studio", targetId: studio.id }}
        compact
        className="shrink-0"
      />
    </li>
  );
}
