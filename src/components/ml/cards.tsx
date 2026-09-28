import { Link } from "@tanstack/react-router";
import { MapPin, Star, Building2, ChevronRight } from "lucide-react";
import { Price } from "./kit";
import type { PriceParts } from "@/lib/price";
import { VerifiedBadge } from "./ui";
import { SavedToggle } from "./saved-toggle";
import type { DirectoryPerson } from "@/lib/profile-groups.functions";
import type { DiscoverStudio } from "@/lib/studio-view";
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

/*
 * Talent card and business card (owner, 22 Sep 2026: "redo the cards, all states, types" — one
 * design for each, used everywhere, real data only). Both share the same shape: a name row with
 * the verified badge, one line of place, a rating when there is one, and a rate in the shared
 * `Price` component (amount pink, unit small and grey, one line). Two sizes each: a Row for lists
 * (Search, Directory) and a Card for horizontal rails (Discover, Home, business search).
 */

/** The stored rating and review count; nothing while there are no reviews. */
function RatingLine({ rating, reviewCount }: { rating: number | null; reviewCount: number }) {
  if (rating == null) return null;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-warn-strong"
      aria-label={`${rating.toFixed(1)} out of 5 from ${reviewCount} reviews`}
    >
      <Star size={iconSize.xs} fill="currentColor" aria-hidden />
      {rating.toFixed(1)}
      <span className="font-normal text-muted-foreground">({reviewCount})</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Talent card — a person from the directory                           */
/* ------------------------------------------------------------------ */

function personDetail(person: DirectoryPerson, roleLabels?: TaxonomyOption[]) {
  return (
    person.headline ??
    person.roles
      .slice(0, 2)
      .map((r) => labelFor(roleLabels, r))
      .join(" · ")
  );
}

/**
 * One person from the profiles table, as a row. The directory, search and anywhere else that
 * lists real people share this — the same name, headline, city and save control in every list.
 */
export function PersonRow({
  person,
  roleLabels,
}: {
  person: DirectoryPerson;
  roleLabels?: TaxonomyOption[] | undefined;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-card/50">
      <Link
        to="/profile/$username"
        params={{ username: person.username }}
        className="state-layer flex min-w-0 flex-1 items-center gap-3 active:scale-[0.99]"
      >
        {person.avatarUrl ? (
          <img
            src={sized(person.avatarUrl, { width: 44 })}
            alt=""
            loading="lazy"
            className="h-11 w-11 shrink-0 rounded-full border border-border/60 object-cover"
          />
        ) : (
          <span className="h-11 w-11 shrink-0 rounded-full bg-subtle" aria-hidden />
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1">
            <span className="truncate text-2 font-semibold text-foreground">{person.name}</span>
            {person.verified ? <VerifiedBadge size={16} /> : null}
          </span>
          <span className="block truncate text-1 text-muted-foreground">
            {personDetail(person, roleLabels)}
          </span>
          {person.city || person.rating != null ? (
            <span className="mt-0.5 flex items-center gap-1 text-1 text-muted-foreground">
              {person.city ? (
                <>
                  <MapPin size={iconSize.xs} className="shrink-0" aria-hidden />
                  <span className="truncate">{person.city}</span>
                </>
              ) : null}
              <RatingLine rating={person.rating} reviewCount={person.reviewCount} />
            </span>
          ) : null}
        </span>
      </Link>
      <SavedToggle targetType="talent" targetId={person.id} size={36} />
    </li>
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
 * The headline wraps up to three lines rather than truncating — a card this narrow reads better
 * with a full short bio than a single clipped line.
 */
export function PersonCard({
  person,
  roleLabels,
  disabled = false,
}: {
  person: DirectoryPerson;
  roleLabels?: TaxonomyOption[] | undefined;
  /** A preview, not a real profile to open — renders the same card with no link. */
  disabled?: boolean;
}) {
  const detail = personDetail(person, roleLabels);
  return (
    <Link
      to="/profile/$username"
      params={{ username: person.username }}
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      onClick={disabled ? (e) => e.preventDefault() : undefined}
      className={cn(
        "block w-rail-sm shrink-0 rounded-lg border border-border/80 bg-card p-4 shadow-xs",
        disabled
          ? "cursor-default"
          : "state-layer group transition-all duration-150 ease-standard hover:border-muted-foreground/40 hover:shadow-sm active:scale-[0.985]",
      )}
    >
      {person.avatarUrl ? (
        <img
          src={sized(person.avatarUrl, { width: 56 })}
          alt=""
          loading="lazy"
          className="h-14 w-14 rounded-full border border-border/60 object-cover"
        />
      ) : (
        <span className="block h-14 w-14 rounded-full bg-subtle" aria-hidden />
      )}
      <span className="mt-3 flex min-w-0 items-center gap-1">
        <span className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
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
      {person.rating != null ? (
        <span className="mt-1 flex items-center text-1">
          <RatingLine rating={person.rating} reviewCount={person.reviewCount} />
        </span>
      ) : null}
    </Link>
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

/**
 * Talent as a full-bleed card — the Profile Hero idiom (guide/system) brought to a rail tile: the
 * photo carries the card, name and meta sit on the scrim. An alternate to PersonCard's white-card
 * shape for a photo-led rail like Discover's.
 */
export function PersonHeroCard({
  person,
  roleLabels,
  disabled = false,
}: {
  person: DirectoryPerson;
  roleLabels?: TaxonomyOption[] | undefined;
  disabled?: boolean;
}) {
  const detail = personDetail(person, roleLabels);
  return (
    <Link
      to="/profile/$username"
      params={{ username: person.username }}
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      onClick={disabled ? (e) => e.preventDefault() : undefined}
      className={cn(
        "relative block h-56 w-rail-sm shrink-0 overflow-hidden rounded-lg text-left",
        disabled
          ? "cursor-default"
          : "state-layer transition-transform duration-150 ease-standard active:scale-[0.985]",
      )}
    >
      {person.avatarUrl ? (
        <img
          src={sized(person.avatarUrl, { width: 412 })}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-subtle text-muted-foreground">
          <Building2 size={28} strokeWidth={1.5} aria-hidden />
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
        {person.city || person.rating != null ? (
          <span className="mt-0.5 flex min-w-0 items-center gap-1 text-1 text-background/80">
            {person.city ? <span className="truncate">{person.city}</span> : null}
            {person.city && person.rating != null ? <span aria-hidden>·</span> : null}
            {person.rating != null ? (
              <span className="flex shrink-0 items-center gap-0.5">
                <Star size={iconSize.xs} fill="currentColor" aria-hidden />
                {person.rating.toFixed(1)}
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Business / studio card — a business account, real bookable spaces   */
/* ------------------------------------------------------------------ */

/**
 * One business or studio as a card, for a rail (Discover, Home "Studios to book", business
 * search). The same shape as PersonCard — verified name, one line of place, rating, then the
 * rate on its own line — so a talent card and a business card read as one family.
 */
export function StudioCard({
  studio,
  disabled = false,
}: {
  studio: DiscoverStudio;
  /** A preview, not a real business to open — renders the same card with no link. */
  disabled?: boolean;
}) {
  const bookable = Boolean(studio.username || studio.slug);
  return (
    <Link
      to={studio.username ? "/profile/$username" : "/booking/$id"}
      params={studio.username ? { username: studio.username } : { id: studio.slug }}
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      onClick={disabled || !bookable ? (e) => e.preventDefault() : undefined}
      className={cn(
        "block w-rail-md shrink-0 overflow-hidden rounded-lg border border-border/80 bg-card shadow-xs",
        disabled
          ? "cursor-default"
          : "state-layer group transition-all duration-150 ease-standard hover:border-muted-foreground/40 hover:shadow-sm active:scale-[0.985]",
      )}
    >
      {studio.photo ? (
        <div className="overflow-hidden">
          <img
            src={sized(studio.photo, { width: 112 })}
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
          <Building2 size={28} strokeWidth={1.5} />
        </span>
      )}
      <span className="block p-3">
        <span className="flex min-w-0 items-center gap-1">
          <span className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
            {studio.name}
          </span>
          {studio.verified ? <VerifiedBadge size={13} /> : null}
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1 text-1 text-muted-foreground">
          <MapPin size={iconSize.xs} className="shrink-0" aria-hidden />
          <span className="truncate">{shownPlace(studio.location)}</span>
          {studio.rating != null ? (
            <>
              <span aria-hidden>·</span>
              <RatingLine rating={studio.rating} reviewCount={studio.reviewCount} />
            </>
          ) : null}
        </span>
        {studio.rate ? (
          <Price
            price={studio.rate}
            className="mt-2"
            amountClassName="text-1 font-semibold"
            unitClassName="text-1"
          />
        ) : null}
      </span>
    </Link>
  );
}

export function StudioCardSkeleton() {
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
 * A business/studio as a full-bleed card — the Media Card idiom (guide/system): the photo carries
 * the card, name/place/rate sit on the scrim. An alternate to StudioCard's white-card shape for a
 * photo-led rail like Discover's.
 */
export function StudioMediaCard({ studio }: { studio: DiscoverStudio }) {
  const bookable = Boolean(studio.username || studio.slug);
  return (
    <Link
      to={studio.username ? "/profile/$username" : "/booking/$id"}
      params={studio.username ? { username: studio.username } : { id: studio.slug }}
      onClick={!bookable ? (e) => e.preventDefault() : undefined}
      className="state-layer relative block aspect-[4/3] w-rail-md shrink-0 overflow-hidden rounded-lg text-left"
    >
      {studio.photo ? (
        <img
          src={sized(studio.photo, { width: 412 })}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-subtle text-muted-foreground">
          <Building2 size={28} strokeWidth={1.5} aria-hidden />
        </span>
      )}
      <div className="media-scrim" />
      <span className="absolute inset-x-3 bottom-3 text-background">
        <span className="flex min-w-0 items-center gap-1">
          <span className="truncate text-2 font-bold">{studio.name}</span>
          {studio.verified ? <VerifiedBadge size={14} /> : null}
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1 text-1 text-background/80">
          <span className="truncate">{shownPlace(studio.location)}</span>
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
        {studio.rate ? (
          <Price price={studio.rate} className="mt-1" amountClassName="text-1 font-semibold" />
        ) : null}
      </span>
    </Link>
  );
}

/**
 * A business row for a list (search results, directory). Same fields as StudioCard, laid out
 * horizontally, with the same save control PersonRow uses.
 */
export function StudioRow({ studio }: { studio: DiscoverStudio }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-card/50">
      <Link
        to={studio.username ? "/profile/$username" : "/booking/$id"}
        params={studio.username ? { username: studio.username } : { id: studio.slug }}
        className="state-layer flex min-w-0 flex-1 items-center gap-3 active:scale-[0.99]"
      >
        {studio.photo ? (
          <img
            src={sized(studio.photo, { width: 56 })}
            alt=""
            loading="lazy"
            className="h-14 w-14 shrink-0 rounded-lg border border-border/60 object-cover"
          />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-subtle text-muted-foreground">
            <Building2 size={20} strokeWidth={1.5} aria-hidden />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1">
            <span className="truncate text-2 font-semibold text-foreground">{studio.name}</span>
            {studio.verified ? <VerifiedBadge size={16} /> : null}
          </span>
          <span className="mt-0.5 flex min-w-0 items-center gap-1 text-1 text-muted-foreground">
            <MapPin size={iconSize.xs} className="shrink-0" aria-hidden />
            <span className="truncate">{shownPlace(studio.location)}</span>
            {studio.rating != null ? (
              <>
                <span aria-hidden>·</span>
                <RatingLine rating={studio.rating} reviewCount={studio.reviewCount} />
              </>
            ) : null}
          </span>
        </span>
        {studio.rate ? (
          <Price
            price={studio.rate}
            align="end"
            className="shrink-0"
            amountClassName="text-1 font-semibold"
            unitClassName="text-1"
          />
        ) : (
          <ChevronRight size={iconSize.sm} className="shrink-0 text-muted-foreground" aria-hidden />
        )}
      </Link>
    </li>
  );
}
