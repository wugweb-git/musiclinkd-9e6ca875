import { Link } from "@tanstack/react-router";
import type { Talent } from "@/data/discover";
import { AvailabilityBadge, Btn, VerifiedBadge } from "./ui";

export function TalentRow({ t, onPreview }: { t: Talent; onPreview?: (t: Talent) => void }) {
  return (
    <article className="rounded-3xl border border-border bg-card p-4">
      <button
        type="button"
        onClick={() => onPreview?.(t)}
        className="flex w-full items-start gap-3 text-left"
      >
        <img
          src={t.photo}
          alt={`${t.name}, ${t.role}`}
          loading="lazy"
          className="h-16 w-16 rounded-2xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[15px]">{t.name}</h3>
            {t.verified ? <VerifiedBadge /> : null}
          </div>
          <p className="truncate text-xs text-muted-foreground">{t.role}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">📍 {t.location}</p>
        </div>
        <AvailabilityBadge status={t.availability} />
      </button>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {t.genres.slice(0, 3).map((g) => (
          <span
            key={g}
            className="rounded-full bg-subtle px-2.5 py-1 text-[10px] font-semibold text-text2"
          >
            {g}
          </span>
        ))}
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
          style={{ background: "var(--purple-container)", color: "var(--purple)" }}
        >
          {t.languages.join(" · ")}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Link
          to="/profile/$username"
          params={{ username: t.id }}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-navy text-xs font-semibold text-background"
        >
          View profile
        </Link>
        <Btn variant="outline" className="min-h-11 flex-1 text-xs">
          Message
        </Btn>
        <button
          type="button"
          aria-label="Save"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-sm"
        >
          ♡
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
      className="block w-[172px] shrink-0 overflow-hidden rounded-3xl border border-border bg-card"
    >
      <div className="relative h-[150px]">
        <img
          src={t.photo}
          alt={`${t.name}, ${t.role}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute left-2 top-2">
          <AvailabilityBadge status={t.availability} />
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1">
          <h3 className="truncate text-[13px]">{t.name}</h3>
          {t.verified ? <VerifiedBadge size={13} /> : null}
        </div>
        <p className="truncate text-[11px] text-muted-foreground">{t.role}</p>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-warn">{t.rating} ★</span>
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
      className="overflow-hidden rounded-3xl border border-border bg-card"
    >
      <img
        src={t.photo}
        alt={`${t.name}, ${t.role}`}
        loading="lazy"
        className="h-32 w-full object-cover"
      />
      <div className="p-3">
        <div className="flex items-center gap-1">
          <h3 className="truncate text-[13px]">{t.name}</h3>
          {t.verified ? <VerifiedBadge size={13} /> : null}
        </div>
        <p className="truncate text-[11px] text-muted-foreground">{t.location}</p>
        <p className="mt-1 text-[11px] font-semibold text-primary">{t.rate}</p>
      </div>
    </Link>
  );
}
