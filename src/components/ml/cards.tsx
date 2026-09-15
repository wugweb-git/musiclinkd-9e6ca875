import { Link } from "@tanstack/react-router";
import { Heart, MapPin, Star } from "lucide-react";
import { availabilityTone, type Talent } from "@/data/discover";
import { Price, StatusPill } from "./kit";
import { Btn, VerifiedBadge } from "./ui";

export function TalentRow({ t, onPreview }: { t: Talent; onPreview?: (t: Talent) => void }) {
  return (
    <article className="rounded-lg border border-border bg-card p-4">
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
          <p className="truncate text-xs text-muted-foreground">{t.role}</p>
          <p className="mt-0.5 flex min-w-0 items-center gap-1 text-1 text-muted-foreground">
            <MapPin size={12} className="shrink-0" aria-hidden />
            <span className="truncate">{t.location}</span>
          </p>
        </div>
        <StatusPill label={t.availability} tone={availabilityTone(t.availability)} />
      </button>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {t.genres.slice(0, 3).map((g) => (
          <span
            key={g}
            className="rounded-full bg-subtle px-2.5 py-1 text-1 font-semibold text-muted-foreground"
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
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-ink text-xs font-semibold text-background"
        >
          View profile
        </Link>
        <Btn variant="outline" className="min-h-11 flex-1 text-xs">
          Message
        </Btn>
        <button
          type="button"
          aria-label="Save"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card"
        >
          <Heart size={18} aria-hidden />
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
      className="state-layer block w-[172px] shrink-0 overflow-hidden rounded-lg border border-border bg-card transition-transform duration-125 ease-standard active:scale-98"
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
          {t.verified ? <VerifiedBadge size={13} /> : null}
        </div>
        <p className="truncate text-1 text-muted-foreground">{t.role}</p>
        <div className="mt-2 flex items-center justify-between text-1">
          <span className="inline-flex items-center gap-0.5 font-semibold text-warn">
            {t.rating} <Star size={11} fill="currentColor" aria-hidden />
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
      className="overflow-hidden rounded-lg border border-border bg-card"
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
          {t.verified ? <VerifiedBadge size={13} /> : null}
        </div>
        <p className="truncate text-1 text-muted-foreground">{t.location}</p>
        <Price price={t.rate} className="mt-1" amountClassName="text-1 font-semibold" />
      </div>
    </Link>
  );
}
