import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { sized } from "@/lib/image-url";

/*
 * Marketing blocks: the surfaces that talk to people who are not signed in yet, plus the reading
 * surfaces (guides, stories) that look like a publication rather than a tool.
 *
 * These are the one place brand pink is allowed to fill a button. Inside the app the rule holds —
 * primary is ink, pink is an accent — but a marketing CTA is the brand introducing itself, and the
 * owner asked for it filled. Nothing here is used by a signed-in screen.
 *
 * Counts are always props. There is no default "12.4k+ artists": a marketing figure has to come
 * from somewhere real, and until it does the caller leaves it out.
 */

type CtaLink = { label: string; to: string };

/** A link that may go inside or outside the app — marketing copy links to both. */
function CtaAction({ action, className }: { action: CtaLink; className: string }) {
  const external = action.to.startsWith("http");
  if (external) {
    return (
      <a href={action.to} className={className} target="_blank" rel="noreferrer">
        {action.label}
      </a>
    );
  }
  return (
    <Link to={action.to} className={className}>
      {action.label}
    </Link>
  );
}

/**
 * The closing call to action: an ink block with the pitch, two buttons and an optional line of
 * figures under them. The primary button is the one filled pink in the whole product.
 */
export function BottomCta({
  title,
  body,
  primary,
  secondary,
  facts,
  className,
}: {
  title: string;
  body: string;
  primary: CtaLink;
  secondary?: CtaLink | undefined;
  /** Short figures, e.g. ["12.4k+ artists", "42 cities"]. Only pass numbers you can stand behind. */
  facts?: string[] | undefined;
  className?: string | undefined;
}) {
  return (
    <section className={cn("rounded-3xl bg-ink px-6 py-10 text-center text-background", className)}>
      <h2 className="mx-auto max-w-[18ch] text-4 font-extrabold leading-[1.05]">{title}</h2>
      <p className="mx-auto mt-3 max-w-[38ch] text-sm leading-relaxed text-background/70">{body}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <CtaAction
          action={primary}
          className="state-layer inline-flex min-h-control items-center justify-center rounded-full bg-brand-button px-7 text-sm font-semibold text-background transition-transform duration-200 ease-standard active:scale-97"
        />
        {secondary ? (
          <CtaAction
            action={secondary}
            className="state-layer inline-flex min-h-control items-center justify-center rounded-full border border-background/35 px-7 text-sm font-semibold text-background transition-transform duration-200 ease-standard active:scale-97"
          />
        ) : null}
      </div>
      {facts?.length ? (
        <p className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-background/50">
          {facts.map((fact, i) => (
            <span key={fact} className="flex items-center gap-3">
              {i > 0 ? <span aria-hidden>·</span> : null}
              {fact}
            </span>
          ))}
        </p>
      ) : null}
    </section>
  );
}

/**
 * The app-store block: paper ground, one line of promise, and the two stores side by side. Both
 * buttons are ink — outside the app there is no "primary and secondary" here, they are the same
 * decision on two platforms.
 */
export function DownloadCta({
  title,
  body,
  ios,
  android,
  className,
}: {
  title: string;
  body: string;
  ios: CtaLink;
  android: CtaLink;
  className?: string | undefined;
}) {
  return (
    // The screenshot's ground is a warm cream; ours is the app's own grey, so the block belongs to
    // this product rather than to a template.
    <section className={cn("bg-subtle px-6 py-14 text-center", className)}>
      <h2 className="mx-auto max-w-[22ch] text-4 font-extrabold leading-[1.08] tracking-tight">
        {title}
      </h2>
      <p className="mx-auto mt-5 max-w-[40ch] text-2 leading-relaxed">{body}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <CtaAction
          action={ios}
          className="state-layer inline-flex min-h-control items-center justify-center rounded-full bg-ink px-8 text-2 font-bold text-background transition-transform duration-200 ease-standard active:scale-97"
        />
        <CtaAction
          action={android}
          className="state-layer inline-flex min-h-control items-center justify-center rounded-full bg-ink px-8 text-2 font-bold text-background transition-transform duration-200 ease-standard active:scale-97"
        />
      </div>
    </section>
  );
}

/**
 * The filter row above a list of articles. One choice at a time; the chosen one carries a tint
 * rather than a fill, because this is a reading surface and nothing here is a commitment.
 */
export function TopicFilter<T extends string>({
  topics,
  value,
  onChange,
  className,
}: {
  topics: readonly T[];
  value: T;
  onChange: (topic: T) => void;
  className?: string | undefined;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Filter by topic"
      className={cn("rail flex gap-3 overflow-x-auto no-scrollbar", className)}
    >
      {topics.map((topic) => {
        const active = topic === value;
        return (
          <button
            key={topic}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(topic)}
            className={cn(
              "state-layer hit-area shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-2 font-semibold transition-colors duration-200 ease-standard",
              active ? "bg-pink-container text-foreground" : "bg-subtle text-foreground",
            )}
          >
            {topic}
          </button>
        );
      })}
    </div>
  );
}

export type Article = {
  id: string;
  title: string;
  /** The date as it should read, e.g. "15 June 2026". Never "3 weeks ago". */
  date: string;
  topic: string;
  /** Left out when the piece has no picture: the tile stays, grey, carrying only the badge. */
  image?: string | undefined;
  to: string;
  /** A face or a mark that sits on the image — the author, or the subject of the piece. */
  badge?: { kind: "avatar"; src: string; alt: string } | { kind: "icon"; icon: ReactNode };
};

/** One article: the picture, what it is called, when it ran and what it is about. */
export function ArticleCard({ article: a }: { article: Article }) {
  const external = a.to.startsWith("http");
  const body = (
    <>
      <div className="relative overflow-hidden rounded-3xl">
        {a.image ? (
          <img
            src={sized(a.image, { width: 412 })}
            alt=""
            loading="lazy"
            className="aspect-video w-full object-cover transition-transform duration-320 ease-standard group-hover:scale-[1.02] motion-reduce:transition-none"
          />
        ) : (
          <div className="aspect-video w-full bg-subtle" />
        )}
        {a.badge ? (
          <span className="absolute bottom-4 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center overflow-hidden rounded-3xl bg-card text-foreground shadow-elevation-2">
            {a.badge.kind === "avatar" ? (
              <img
                src={sized(a.badge.src, { width: 412 })}
                alt={a.badge.alt}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              a.badge.icon
            )}
          </span>
        ) : null}
      </div>
      <h3 className="mt-5 text-3 font-extrabold leading-tight tracking-tight">{a.title}</h3>
      <p className="mt-4 flex flex-wrap items-center gap-3 text-2">
        <span className="text-muted-foreground">{a.date}</span>
        <span className="rounded-full bg-subtle px-3 py-1 text-1 font-semibold">{a.topic}</span>
      </p>
    </>
  );

  return external ? (
    <a href={a.to} target="_blank" rel="noreferrer" className="group block">
      {body}
    </a>
  ) : (
    <Link to={a.to} className="group block">
      {body}
    </Link>
  );
}

/** Articles two to a row where there is room, one to a row on a phone. */
export function ArticleGrid({ articles }: { articles: Article[] }) {
  return (
    <div className="grid gap-10 sm:grid-cols-2">
      {articles.map((a) => (
        <ArticleCard key={a.id} article={a} />
      ))}
    </div>
  );
}
