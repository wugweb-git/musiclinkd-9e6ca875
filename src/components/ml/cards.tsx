import { Link } from "@tanstack/react-router";
import { Heart, MapPin, Star } from "lucide-react";
import { availabilityTone, type Talent } from "@/data/discover";
import { Price, StatusPill } from "./kit";
import type { PriceParts } from "@/lib/price";
import { Btn, VerifiedBadge } from "./ui";
import { SavedToggle } from "./saved-toggle";
import type { DirectoryPerson } from "@/lib/profile-groups.functions";
import { labelFor, type TaxonomyOption } from "@/lib/taxonomy";
import { iconSize } from "@/lib/tokens";

/*
 * Message and Save are disabled until there is somewhere for them to go: there is no thread to
 * open and no saved-talent table yet. A control that takes the tap and does nothing is worse
 * than one that says it isn't ready, so both carry a reason instead of a silent handler.
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
    <article className="rounded-lg bg-subtle p-4">
      <button
        type="button"
        onClick={() => onPreview?.(t)}
        className="flex w-full items-start gap-3 text-left"
      >
        <img
          src={t.photo}
          alt={`${t.name}, ${t.role}`}
          loading="lazy"
          className="h-16 w-16 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-2">{t.name}</h3>
            {t.verified ? <VerifiedBadge /> : null}
          </div>
          <p className="truncate text-1 text-muted-foreground">{t.role}</p>
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
            className="rounded-full bg-background px-2.5 py-1 text-1 font-semibold text-muted-foreground"
          >
            {g}
          </span>
        ))}
        <span className="rounded-full bg-status-category-bg px-2.5 py-1 text-1 font-semibold text-status-category-text">
          {t.languages.join(" · ")}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Link
          to="/profile/$username"
          params={{ username: t.id }}
          className="hit-area inline-flex min-h-touch flex-1 items-center justify-center rounded-full bg-ink text-1 font-semibold text-background"
        >
          View profile
        </Link>
        <Btn
          variant="outline"
          className="min-h-touch flex-1 text-1"
          disabled={!onMessage}
          {...(onMessage ? { onClick: () => onMessage(t) } : {})}
        >
          Message
        </Btn>
        <button
          type="button"
          aria-label={onSave ? `Save ${t.name}` : "Saving isn't open yet"}
          disabled={!onSave}
          {...(onSave ? { onClick: () => onSave(t) } : {})}
          className="hit-area flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card disabled:opacity-40"
        >
          <Heart size={iconSize.md} aria-hidden />
        </button>
      </div>
    </article>
  );
}

export function TalentCard({ t }: { t: Talent }) {
  return (
    <Link
      to="/profile/$username"
      params={{ username: t.id }}
      className="state-layer block w-[172px] shrink-0 overflow-hidden rounded-lg bg-subtle transition-transform duration-125 ease-standard active:scale-97"
    >
      <div className="relative h-[150px]">
        <img
          src={t.photo}
          alt={`${t.name}, ${t.role}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute left-2 top-2">
          <StatusPill label={t.availability} tone={availabilityTone(t.availability)} onMedia />
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1">
          <h3 className="truncate text-1">{t.name}</h3>
          {t.verified ? <VerifiedBadge size={12} /> : null}
        </div>
        <p className="truncate text-1 text-muted-foreground">{t.role}</p>
        <div className="mt-2 flex items-center justify-between text-1">
          <span className="inline-flex items-center gap-0.5 font-semibold text-warn">
            {t.rating} <Star size={iconSize.xs} fill="currentColor" aria-hidden />
          </span>
          <span className="text-muted-foreground">{t.followers}</span>
        </div>
      </div>
    </Link>
  );
}

export function TalentGridCard({ t }: { t: Talent }) {
  return (
    <Link
      to="/profile/$username"
      params={{ username: t.id }}
      className="overflow-hidden rounded-lg bg-subtle"
    >
      <img
        src={t.photo}
        alt={`${t.name}, ${t.role}`}
        loading="lazy"
        className="h-32 w-full object-cover"
      />
      <div className="p-3">
        <div className="flex items-center gap-1">
          <h3 className="truncate text-1">{t.name}</h3>
          {t.verified ? <VerifiedBadge size={12} /> : null}
        </div>
        <p className="truncate text-1 text-muted-foreground">{t.location}</p>
        <Price price={t.rate} className="mt-1" amountClassName="text-1 font-semibold" />
      </div>
    </Link>
  );
}

/** Neighbourhood and city, "Indiranagar, Bengaluru". */
function personPlace(person: DirectoryPerson) {
  return [person.area, person.city].filter(Boolean).join(", ");
}

/** The stored rating and review count; nothing while there are no reviews. */
function PersonRating({ person }: { person: DirectoryPerson }) {
  if (person.rating == null) return null;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-warn"
      aria-label={`${person.rating} out of 5 from ${person.reviewCount} reviews`}
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
  /** person_types taxonomy options, so a role shows its label instead of its slug. */
  roleLabels?: TaxonomyOption[] | undefined;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3.5">
      <Link
        to="/profile/$username"
        params={{ username: person.username }}
        className="state-layer flex min-w-0 flex-1 items-center gap-3"
      >
        {person.avatarUrl ? (
          <img
            src={person.avatarUrl}
            alt=""
            loading="lazy"
            className="h-11 w-11 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="h-11 w-11 shrink-0 rounded-full bg-background" aria-hidden />
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1">
            <span className="truncate text-2 font-semibold">{person.name}</span>
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
 * One person as a card, for a rail. The same data as PersonRow, laid out for sideways scrolling:
 * Discover uses it, and anywhere else that shows a few people beside each other.
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
      className="state-layer w-[160px] shrink-0 rounded-lg bg-subtle p-4"
    >
      {person.avatarUrl ? (
        <img
          src={person.avatarUrl}
          alt=""
          loading="lazy"
          className="h-14 w-14 rounded-full object-cover"
        />
      ) : (
        <span className="block h-14 w-14 rounded-full bg-background" aria-hidden />
      )}
      <span className="mt-3 flex items-center gap-1">
        <span className="truncate text-sm font-semibold">{person.name}</span>
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

/** One studio as a card, for the same kind of rail. */
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
      className="state-layer w-[200px] shrink-0 overflow-hidden rounded-lg bg-subtle"
    >
      {studio.photo ? (
        <img src={studio.photo} alt="" loading="lazy" className="h-28 w-full object-cover" />
      ) : (
        <span className="block h-28 w-full bg-background" aria-hidden />
      )}
      <span className="block p-3">
        <span className="block truncate text-sm font-semibold">{studio.name}</span>
        <span className="mt-0.5 block truncate text-1 text-muted-foreground">
          {[studio.location, studio.rating == null ? "" : `${studio.rating} out of 5`]
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
