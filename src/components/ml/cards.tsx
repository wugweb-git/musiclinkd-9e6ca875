import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Heart,
  MapPin,
  Star,
  Play,
  Pause,
  Building2,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { availabilityTone, type Talent } from "@/data/discover";
import { Price, StatusPill } from "./kit";
import type { PriceParts } from "@/lib/price";
import { Btn, BtnLink, VerifiedBadge } from "./ui";
import { SavedToggle } from "./saved-toggle";
import type { DirectoryPerson } from "@/lib/profile-groups.functions";
import { labelFor, type TaxonomyOption } from "@/lib/taxonomy";
import { iconSize } from "@/lib/tokens";
import { shownPlace } from "@/lib/place";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

// Canonical re-exports for cards recycling across the whole application:
export {
  ServiceCard,
  ServiceCardSkeleton,
  ReviewCard,
  ReviewCardSkeleton,
  ReviewRail,
} from "./profile";

/* ------------------------------------------------------------------ */
/* Talent User Card & Row Components (Flagship Recycled Blocks)        */
/* ------------------------------------------------------------------ */

export type TalentCardProps = {
  t: Talent;
  onPreview?: ((t: Talent) => void) | undefined;
  onMessage?: ((t: Talent) => void) | undefined;
  onSave?: ((t: Talent) => void) | undefined;
  onBook?: (() => void) | undefined;
  selected?: boolean | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
};

/**
 * Flagship Talent User Card:
 * Recycled across discover rails, search results, recommendations, and booking collaborator pickers.
 * Features tactile mobile states (default, hover, active:scale, selected, skeleton, audio preview snippet).
 */
export function TalentUserCard({
  t,
  onPreview,
  onMessage,
  onSave,
  onBook,
  selected = false,
  disabled = false,
  className,
}: TalentCardProps) {
  const [playing, setPlaying] = useState(false);

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    haptic("select");
    setPlaying(!playing);
  };

  return (
    <article
      aria-current={selected || undefined}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-lg border bg-card p-4 shadow-xs transition-all duration-150 ease-standard active:scale-[0.985]",
        selected
          ? "border-foreground ring-2 ring-foreground/15 shadow-sm"
          : "border-border/80 hover:border-muted-foreground/40 hover:shadow-sm",
        disabled && "opacity-60 pointer-events-none",
        className,
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => onPreview?.(t)}
            className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-hidden"
          >
            <div className="relative shrink-0">
              <img
                src={t.photo}
                alt={`${t.name}, ${t.role}`}
                loading="lazy"
                className="h-16 w-16 rounded-full border border-border/60 object-cover"
              />
              {/* Active availability pip */}
              <span
                className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-card bg-emerald-500 shadow-xs"
                aria-label="Available"
              />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-2 font-semibold text-foreground transition-colors group-hover:text-primary">
                  {t.name}
                </h3>
                {t.verified ? <VerifiedBadge size={14} /> : null}
              </div>
              <p className="truncate text-1 font-medium text-muted-foreground">{t.role}</p>
              <p className="mt-1 flex min-w-0 items-center gap-1 text-1 text-muted-foreground">
                <MapPin size={iconSize.xs} className="shrink-0" aria-hidden />
                <span className="truncate">{t.location}</span>
              </p>
            </div>
          </button>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <StatusPill label={t.availability} tone={availabilityTone(t.availability)} />
            {/* Audio demo preview snippet trigger */}
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? `Pause ${t.name}'s demo clip` : `Preview ${t.name}'s sound`}
              className={cn(
                "hit-area flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-0 font-semibold transition-all active:scale-95",
                playing
                  ? "border-foreground bg-foreground text-background"
                  : "border-border/80 bg-subtle/60 text-foreground hover:border-foreground/40 hover:bg-card",
              )}
            >
              {playing ? (
                <>
                  <Pause size={10} className="fill-background" aria-hidden />
                  <span className="flex items-center gap-0.5">
                    <span className="h-2.5 w-0.5 animate-pulse bg-background" />
                    <span className="h-3.5 w-0.5 animate-pulse bg-background delay-75" />
                    <span className="h-2 w-0.5 animate-pulse bg-background delay-150" />
                  </span>
                </>
              ) : (
                <>
                  <Play size={10} className="ml-0.5 fill-foreground" aria-hidden />
                  <span>Preview</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {t.genres.slice(0, 3).map((g) => (
            <span
              key={g}
              className="rounded-full border border-border/60 bg-subtle/50 px-2.5 py-0.5 text-0 font-medium text-muted-foreground"
            >
              {g}
            </span>
          ))}
          {t.languages?.length ? (
            <span className="rounded-full bg-status-category-bg px-2.5 py-0.5 text-0 font-semibold text-status-category-text">
              {t.languages.slice(0, 2).join(" · ")}
            </span>
          ) : null}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
        <Price
          price={t.rate}
          amountClassName="text-2 font-bold"
          unitClassName="text-0 text-muted-foreground"
        />
        <div className="flex items-center gap-2">
          <Link
            to="/profile/$username"
            params={{ username: t.id }}
            className="hit-area inline-flex min-h-touch items-center justify-center rounded-full bg-foreground px-4 text-1 font-semibold text-background transition-opacity hover:opacity-90 active:scale-95"
          >
            View profile
          </Link>
          {onBook ? (
            <Btn
              className="min-h-touch px-4 text-1 font-semibold active:scale-95"
              onClick={onBook}
            >
              Book
            </Btn>
          ) : onMessage ? (
            <Btn
              variant="outline"
              className="min-h-touch px-3 text-1 font-medium active:scale-95"
              onClick={() => onMessage(t)}
            >
              Message
            </Btn>
          ) : null}
          <button
            type="button"
            aria-label={onSave ? `Save ${t.name}` : "Saving isn't open yet"}
            disabled={!onSave}
            {...(onSave
              ? {
                  onClick: () => {
                    haptic("select");
                    onSave(t);
                  },
                }
              : {})}
            className="hit-area flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-card transition-colors hover:bg-subtle active:scale-95 disabled:opacity-40"
          >
            <Heart size={iconSize.md} aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}

export function TalentCardSkeleton({ className }: { className?: string | undefined }) {
  return (
    <article
      className={cn(
        "flex flex-col justify-between overflow-hidden rounded-lg border border-border/60 bg-card p-4",
        className,
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 animate-pulse rounded-full bg-subtle" />
            <div className="space-y-1.5">
              <div className="h-4 w-32 animate-pulse rounded bg-subtle" />
              <div className="h-3 w-20 animate-pulse rounded bg-subtle" />
              <div className="h-3 w-24 animate-pulse rounded bg-subtle" />
            </div>
          </div>
          <div className="h-6 w-16 animate-pulse rounded-full bg-subtle" />
        </div>
        <div className="mt-3 flex gap-2">
          <div className="h-5 w-14 animate-pulse rounded-full bg-subtle" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-subtle" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
        <div className="h-5 w-20 animate-pulse rounded bg-subtle" />
        <div className="h-9 w-24 animate-pulse rounded-full bg-subtle" />
      </div>
    </article>
  );
}

/*
 * Modernized TalentRow:
 * Used in search lists and directory. Carries full touch targets, active state layers,
 * and high-contrast Gestalt tokens.
 */
export function TalentRow({
  t,
  onPreview,
  onMessage,
  onSave,
}: {
  t: Talent;
  onPreview?: ((t: Talent) => void) | undefined;
  onMessage?: ((t: Talent) => void) | undefined;
  onSave?: ((t: Talent) => void) | undefined;
}) {
  return (
    <article className="group rounded-lg border border-border/80 bg-card p-4 shadow-xs transition-all duration-150 ease-standard hover:border-muted-foreground/40 hover:shadow-sm active:scale-[0.985]">
      <button
        type="button"
        onClick={() => onPreview?.(t)}
        className="flex w-full items-start gap-3 text-left focus-visible:outline-hidden"
      >
        <div className="relative shrink-0">
          <img
            src={t.photo}
            alt={`${t.name}, ${t.role}`}
            loading="lazy"
            className="h-16 w-16 rounded-lg border border-border/60 object-cover"
          />
          <span
            className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500 shadow-xs"
            aria-label="Available"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-2 font-semibold text-foreground group-hover:text-primary transition-colors">
              {t.name}
            </h3>
            {t.verified ? <VerifiedBadge /> : null}
          </div>
          <p className="truncate text-1 font-medium text-muted-foreground">{t.role}</p>
          <p className="mt-0.5 flex min-w-0 items-center gap-1 text-1 text-muted-foreground">
            <MapPin size={iconSize.xs} className="shrink-0" aria-hidden />
            <span className="truncate">{t.location}</span>
          </p>
        </div>
        <StatusPill label={t.availability} tone={availabilityTone(t.availability)} />
      </button>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {t.genres.slice(0, 3).map((g) => (
          <span
            key={g}
            className="rounded-full border border-border/60 bg-subtle/50 px-2.5 py-1 text-1 font-medium text-muted-foreground"
          >
            {g}
          </span>
        ))}
        <span className="rounded-full bg-status-category-bg px-2.5 py-1 text-1 font-semibold text-status-category-text">
          {t.languages.join(" · ")}
        </span>
      </div>

      <div className="mt-3.5 flex items-center gap-2 pt-1">
        <Link
          to="/profile/$username"
          params={{ username: t.id }}
          className="hit-area inline-flex min-h-touch flex-1 items-center justify-center rounded-full bg-foreground text-1 font-semibold text-background transition-opacity hover:opacity-90 active:scale-95"
        >
          View profile
        </Link>
        <Btn
          variant="outline"
          className="min-h-touch flex-1 text-1 active:scale-95"
          disabled={!onMessage}
          {...(onMessage ? { onClick: () => onMessage(t) } : {})}
        >
          Message
        </Btn>
        <button
          type="button"
          aria-label={onSave ? `Save ${t.name}` : "Saving isn't open yet"}
          disabled={!onSave}
          {...(onSave
            ? {
                onClick: () => {
                  haptic("select");
                  onSave(t);
                },
              }
            : {})}
          className="hit-area flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-card transition-colors hover:bg-subtle active:scale-95 disabled:opacity-40"
        >
          <Heart size={iconSize.md} aria-hidden />
        </button>
      </div>
    </article>
  );
}

export function TalentGridCard({ t }: { t: Talent }) {
  return (
    <Link
      to="/profile/$username"
      params={{ username: t.id }}
      className="group overflow-hidden rounded-lg border border-border/80 bg-card shadow-xs transition-all duration-150 ease-standard hover:border-muted-foreground/40 hover:shadow-sm active:scale-[0.985]"
    >
      <div className="relative">
        <img
          src={t.photo}
          alt={`${t.name}, ${t.role}`}
          loading="lazy"
          className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute right-2 top-2">
          <StatusPill label={t.availability} tone={availabilityTone(t.availability)} />
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1">
          <h3 className="truncate text-1 font-semibold text-foreground group-hover:text-primary transition-colors">
            {t.name}
          </h3>
          {t.verified ? <VerifiedBadge size={12} /> : null}
        </div>
        <p className="truncate text-1 text-muted-foreground">{t.location}</p>
        <Price price={t.rate} className="mt-1.5" amountClassName="text-1 font-bold" />
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Business User Card & Studio Components (Flagship Recycled Blocks)   */
/* ------------------------------------------------------------------ */

export type BusinessUserCardProps = {
  business: {
    id: string;
    name: string;
    username?: string | null | undefined;
    type?: string | undefined;
    photo?: string | null | undefined;
    coverUrl?: string | null | undefined;
    location: string;
    rating?: number | null | undefined;
    reviewCount?: number | null | undefined;
    rate?: PriceParts | null | undefined;
    amenities?: string[] | undefined;
    verified?: boolean | undefined;
  };
  onBook?: (() => void) | undefined;
  onInquire?: (() => void) | undefined;
  selected?: boolean | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
};

/**
 * Flagship Business User Card:
 * Recycled across Discover, Search, Studio Directory, Booking and Onboarding previews.
 * Features tactile mobile states (default, hover, active:scale, selected, skeleton, category badge).
 */
export function BusinessUserCard({
  business,
  onBook,
  onInquire,
  selected = false,
  disabled = false,
  className,
}: BusinessUserCardProps) {
  const targetLink = business.username
    ? { to: "/profile/$username" as const, params: { username: business.username } }
    : { to: "/booking/$id" as const, params: { id: business.id } };

  return (
    <article
      aria-current={selected || undefined}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-lg border bg-card shadow-xs transition-all duration-150 ease-standard active:scale-[0.985]",
        selected
          ? "border-foreground ring-2 ring-foreground/15 shadow-sm"
          : "border-border/80 hover:border-muted-foreground/40 hover:shadow-sm",
        disabled && "opacity-60 pointer-events-none",
        className,
      )}
    >
      <div>
        {/* Cover image with Category badge */}
        <Link {...targetLink} className="relative block h-36 w-full overflow-hidden bg-subtle">
          {business.photo || business.coverUrl ? (
            <img
              src={business.photo || business.coverUrl!}
              alt={business.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-subtle text-muted-foreground">
              <Building2 size={32} strokeWidth={1.5} />
            </div>
          )}
          {business.type ? (
            <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-0 font-semibold text-background backdrop-blur-md">
              {business.type}
            </span>
          ) : null}
          <div className="absolute right-3 top-3">
            <SavedToggle targetType="business" targetId={business.id} size={32} />
          </div>
        </Link>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link
                {...targetLink}
                className="flex items-center gap-1.5 focus-visible:outline-hidden"
              >
                <h3 className="truncate text-2 font-bold text-foreground transition-colors group-hover:text-primary">
                  {business.name}
                </h3>
                {business.verified ? <VerifiedBadge size={15} /> : null}
              </Link>
              <p className="mt-0.5 flex min-w-0 items-center gap-1 text-1 text-muted-foreground">
                <MapPin size={iconSize.xs} className="shrink-0" aria-hidden />
                <span className="truncate">{shownPlace(business.location)}</span>
              </p>
            </div>

            {business.rating != null ? (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-warn/10 px-2 py-0.5 text-0 font-bold text-warn">
                <Star size={11} fill="currentColor" aria-hidden />
                {business.rating.toFixed(1)}
                {business.reviewCount != null ? (
                  <span className="font-normal text-muted-foreground">
                    ({business.reviewCount})
                  </span>
                ) : null}
              </span>
            ) : null}
          </div>

          {/* Amenities / Equipment highlights */}
          {business.amenities?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {business.amenities.slice(0, 3).map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-subtle px-2 py-0.5 text-0 font-medium text-muted-foreground"
                >
                  {a}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Footer action bar */}
      <div className="mt-auto flex items-center justify-between border-t border-border/60 bg-subtle/30 px-4 py-3">
        <div>
          {business.rate ? (
            <Price
              price={business.rate}
              amountClassName="text-2 font-bold"
              unitClassName="text-0 text-muted-foreground"
            />
          ) : (
            <span className="text-1 font-semibold text-muted-foreground">Contact for rates</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onInquire ? (
            <Btn
              variant="outline"
              className="min-h-control-sm px-3.5 text-1 active:scale-95"
              onClick={onInquire}
            >
              Inquire
            </Btn>
          ) : null}
          {onBook ? (
            <Btn
              className="min-h-control-sm px-4 text-1 font-semibold active:scale-95"
              onClick={onBook}
            >
              Book
            </Btn>
          ) : (
            <Link
              {...targetLink}
              className="hit-area inline-flex min-h-control-sm items-center justify-center rounded-full bg-foreground px-4 text-1 font-semibold text-background transition-opacity hover:opacity-90 active:scale-95"
            >
              View Studio
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function BusinessCardSkeleton({ className }: { className?: string | undefined }) {
  return (
    <article
      className={cn(
        "flex flex-col justify-between overflow-hidden rounded-lg border border-border/60 bg-card shadow-xs",
        className,
      )}
    >
      <div>
        <div className="h-36 w-full animate-pulse bg-subtle" />
        <div className="space-y-2 p-4">
          <div className="h-4 w-36 animate-pulse rounded bg-subtle" />
          <div className="h-3 w-24 animate-pulse rounded bg-subtle" />
          <div className="mt-2 flex gap-1.5">
            <div className="h-4 w-16 animate-pulse rounded-full bg-subtle" />
            <div className="h-4 w-14 animate-pulse rounded-full bg-subtle" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border/60 bg-subtle/30 px-4 py-3">
        <div className="h-4 w-20 animate-pulse rounded bg-subtle" />
        <div className="h-8 w-24 animate-pulse rounded-full bg-subtle" />
      </div>
    </article>
  );
}

/** One studio as a card, for discover rails. */
export function StudioCard({
  studio,
}: {
  studio: {
    slug: string;
    username: string | null;
    name: string;
    photo: string;
    location: string;
    rating: number | null;
    rate: PriceParts | null;
  };
}) {
  return (
    <Link
      to={studio.username ? "/profile/$username" : "/booking/$id"}
      params={studio.username ? { username: studio.username } : { id: studio.slug }}
      className="state-layer group w-[200px] shrink-0 overflow-hidden rounded-lg border border-border/80 bg-card shadow-xs transition-all duration-150 ease-standard hover:border-muted-foreground/40 hover:shadow-sm active:scale-[0.985]"
    >
      {studio.photo ? (
        <div className="overflow-hidden">
          <img
            src={studio.photo}
            alt=""
            loading="lazy"
            className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <span className="block h-28 w-full bg-subtle" aria-hidden />
      )}
      <span className="block p-3">
        <span className="block truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {studio.name}
        </span>
        <span className="mt-0.5 block truncate text-1 text-muted-foreground">
          {[
            shownPlace(studio.location),
            studio.rating == null ? "" : `${studio.rating.toFixed(1)} out of 5`,
          ]
            .filter(Boolean)
            .join(" · ")}
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

/* ------------------------------------------------------------------ */
/* Directory Person Rows & Rail Cards                                 */
/* ------------------------------------------------------------------ */

/** The city only; the PIN code stays internal. */
function personPlace(person: DirectoryPerson) {
  return person.city ?? "";
}

/** The stored rating and review count; nothing while there are no reviews. */
function PersonRating({ person }: { person: DirectoryPerson }) {
  if (person.rating == null) return null;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-warn"
      aria-label={`${person.rating.toFixed(1)} out of 5 from ${person.reviewCount} reviews`}
    >
      <Star size={iconSize.xs} fill="currentColor" aria-hidden />
      {person.rating.toFixed(1)}
      <span className="font-normal text-muted-foreground">({person.reviewCount})</span>
    </span>
  );
}

/*
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
            src={person.avatarUrl}
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
            {person.headline ??
              person.roles
                .slice(0, 2)
                .map((r) => labelFor(roleLabels, r))
                .join(" · ")}
          </span>
          {person.city || person.rating != null ? (
            <span className="mt-0.5 flex items-center gap-1 text-1 text-muted-foreground">
              {person.city ? (
                <>
                  <MapPin size={iconSize.xs} className="shrink-0" aria-hidden />
                  <span className="truncate">{personPlace(person)}</span>
                </>
              ) : null}
              <PersonRating person={person} />
            </span>
          ) : null}
        </span>
      </Link>
      <SavedToggle targetType="talent" targetId={person.id} size={36} />
    </li>
  );
}

/*
 * One person as a card, for a rail. Discover uses it and recommendations rails.
 */
export function PersonCard({
  person,
  roleLabels,
}: {
  person: DirectoryPerson;
  roleLabels?: TaxonomyOption[] | undefined;
}) {
  const detail =
    person.headline ??
    person.roles
      .slice(0, 2)
      .map((r) => labelFor(roleLabels, r))
      .join(" · ");
  return (
    <Link
      to="/profile/$username"
      params={{ username: person.username }}
      className="state-layer group w-[160px] shrink-0 rounded-lg border border-border/80 bg-card p-4 shadow-xs transition-all duration-150 ease-standard hover:border-muted-foreground/40 hover:shadow-sm active:scale-[0.985]"
    >
      {person.avatarUrl ? (
        <img
          src={person.avatarUrl}
          alt=""
          loading="lazy"
          className="h-14 w-14 rounded-full border border-border/60 object-cover"
        />
      ) : (
        <span className="block h-14 w-14 rounded-full bg-subtle" aria-hidden />
      )}
      <span className="mt-3 flex items-center gap-1">
        <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {person.name}
        </span>
        {person.verified ? <VerifiedBadge size={14} /> : null}
      </span>
      {detail ? (
        <span className="mt-0.5 line-clamp-2 block text-1 text-muted-foreground">{detail}</span>
      ) : null}
      {person.city ? (
        <span className="mt-1 flex items-center gap-1 text-1 text-muted-foreground">
          <MapPin size={iconSize.xs} className="shrink-0" aria-hidden />
          <span className="truncate">{personPlace(person)}</span>
        </span>
      ) : null}
      {person.rating != null ? (
        <span className="mt-1 flex items-center text-1">
          <PersonRating person={person} />
        </span>
      ) : null}
    </Link>
  );
}
