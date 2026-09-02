import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, SearchBar, SectionHeader, VerifiedBadge } from "@/components/ml/ui";
import { TalentCard } from "@/components/ml/cards";
import { quickCategories, talents, trending, studios } from "@/data/discover";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Discover Talent | MusicLinkd" },
      {
        name: "description",
        content:
          "Discover singers, session musicians, DJs, producers, studios, labels and venues across India on MusicLinkd.",
      },
      { property: "og:title", content: "Discover Talent | MusicLinkd" },
      {
        property: "og:description",
        content:
          "India's professional network for the music industry — find talent, studios and venues fast.",
      },
    ],
  }),
  component: Discover,
});

function Discover() {
  return (
    <Screen>
      <header className="px-5 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              MusicLinkd
            </p>
            <h1 className="text-[30px] leading-tight">Discover</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card">
              🔔
            </button>
            <img
              src={talents[1]!.photo}
              alt="Your profile"
              className="h-11 w-11 rounded-full border border-border object-cover"
            />
          </div>
        </div>
        <div className="mt-4">
          <Link to="/search">
            <SearchBar />
          </Link>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto px-5 pb-5 no-scrollbar">
        {quickCategories.map((c) => (
          <Link
            key={c.label}
            to="/categories"
            className="flex w-[86px] shrink-0 flex-col items-center gap-2 rounded-3xl border border-border bg-card px-2 py-3"
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg"
              style={{ background: "var(--pink-container)" }}
            >
              {c.emoji}
            </span>
            <span className="text-[11px] font-semibold">{c.label}</span>
          </Link>
        ))}
      </div>

      <section className="pb-6">
        <SectionHeader title="Featured talent" action={<Link to="/search">See all</Link>} />
        <div className="flex gap-3 overflow-x-auto px-5 no-scrollbar">
          {talents.slice(0, 4).map((t) => (
            <TalentCard key={t.id} t={t} />
          ))}
        </div>
      </section>

      <section className="pb-6">
        <SectionHeader title="Trending this week" action={<Link to="/search">See all</Link>} />
        <div className="flex gap-3 overflow-x-auto px-5 no-scrollbar">
          {trending.map((t) => (
            <article
              key={t.name}
              className="relative h-40 w-[260px] shrink-0 overflow-hidden rounded-3xl border border-border"
            >
              <img src={t.photo} alt={t.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/85 to-transparent" />
              <span
                className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase text-primary-foreground"
                style={{ background: "var(--primary)" }}
              >
                {t.tag}
              </span>
              <div className="absolute bottom-3 left-3 right-3 text-background">
                <h3 className="text-[15px] text-background">{t.name}</h3>
                <p className="text-[11px] opacity-80">{t.meta}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="pb-6">
        <SectionHeader title="Recommended for you" action="Swipe" />
        <div className="px-5">
          <Link
            to="/recommended"
            className="flex items-center gap-4 rounded-3xl border border-border bg-navy p-4 text-background"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/10 text-2xl">
              ✨
            </span>
            <div className="flex-1">
              <h3 className="text-[15px] text-background">24 new matches</h3>
              <p className="text-[11px] opacity-75">
                Based on Hindi film, indie & your Mumbai activity
              </p>
            </div>
            <span className="text-lg">→</span>
          </Link>
        </div>
      </section>

      <section className="pb-8">
        <SectionHeader title="Nearby professionals" action="Mumbai" />
        <div className="space-y-3 px-5">
          {talents.slice(0, 2).map((t) => (
            <Link
              key={t.id}
              to="/profile/$username"
              params={{ username: t.id }}
              className="flex items-center gap-3 rounded-3xl border border-border bg-card p-3"
            >
              <img
                src={t.photo}
                alt={t.name}
                className="h-14 w-14 rounded-2xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <h3 className="truncate text-[14px]">{t.name}</h3>
                  {t.verified ? <VerifiedBadge size={14} /> : null}
                </div>
                <p className="truncate text-[11px] text-muted-foreground">
                  {t.role} · 2.4 km away
                </p>
              </div>
              <span className="text-[11px] font-semibold text-primary">{t.rate}</span>
            </Link>
          ))}
          {studios.slice(0, 1).map((s) => (
            <Link
              key={s.name}
              to="/studio"
              className="flex items-center gap-3 rounded-3xl border border-border bg-card p-3"
            >
              <img
                src={s.photo}
                alt={s.name}
                className="h-14 w-14 rounded-2xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[14px]">{s.name}</h3>
                <p className="truncate text-[11px] text-muted-foreground">
                  {s.location} · {s.rating} ★
                </p>
              </div>
              <span className="text-[11px] font-semibold text-primary">{s.rate}</span>
            </Link>
          ))}
        </div>
      </section>
    </Screen>
  );
}
