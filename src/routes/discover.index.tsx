import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Sparkles } from "lucide-react";
import { Screen, SearchBar, SectionHeader, VerifiedBadge } from "@/components/ml/ui";
import { Price } from "@/components/ml/kit";
import { TalentCard } from "@/components/ml/cards";
import { ViewerAvatar } from "@/components/ml/viewer";
import { SearchField, SearchIconButton } from "@/components/ml/tab-header";
import { useState } from "react";
import { quickCategories, talents, trending, studios } from "@/data/discover";
import { listStudios } from "@/lib/catalog.functions";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { discoverStudioFromRow } from "@/lib/studio-view";
import { SectionActionLink } from "@/components/ml/links";

export const Route = createFileRoute("/discover/")({
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
  // Database studios follow the seeded ones; without them the lists show seed data only.
  loader: async () => {
    const [rows, labels] = await Promise.all([
      listStudios().catch(() => []),
      getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
    ]);
    return { dbStudios: rows.map((row) => discoverStudioFromRow(row, labels)) };
  },
  component: Discover,
});

function Discover() {
  const { dbStudios } = Route.useLoaderData();
  const [searchOpen, setSearchOpen] = useState(false);
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
            <SearchIconButton open={searchOpen} onToggle={() => setSearchOpen((v) => !v)} />
            <ViewerAvatar />
          </div>
        </div>
        {searchOpen ? (
          <div className="mt-4">
            <SearchField
              to="/search"
              placeholder="Search talent, studios, bands, labels"
              onClose={() => setSearchOpen(false)}
            />
          </div>
        ) : null}
      </header>

      <div className="rail flex gap-2 overflow-x-auto px-5 pb-5 no-scrollbar">
        {quickCategories.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="flex w-[86px] shrink-0 flex-col items-center gap-2 rounded-lg border border-border bg-card px-2 py-3"
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-md text-lg"
              style={{ background: "var(--surface-subtle)" }}
            >
              {c.emoji}
            </span>
            <span className="text-[11px] font-semibold">{c.label}</span>
          </Link>
        ))}
      </div>

      <section className="pb-6">
        <SectionHeader
          title="Featured talent"
          action={<SectionActionLink to="/search">See All</SectionActionLink>}
        />
        <div className="rail flex gap-3 overflow-x-auto px-5 no-scrollbar">
          {talents.slice(0, 4).map((t) => (
            <TalentCard key={t.id} t={t} />
          ))}
        </div>
      </section>

      <section className="pb-6">
        <SectionHeader
          title="Trending this week"
          action={<SectionActionLink to="/discover/music">See All</SectionActionLink>}
        />
        <div className="rail flex gap-3 overflow-x-auto px-5 no-scrollbar">
          {trending.map((t) => (
            <article
              key={t.name}
              className="relative h-40 w-[260px] shrink-0 overflow-hidden rounded-lg border border-border"
            >
              <img src={t.photo} alt={t.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 to-transparent" />
              <span className="pill absolute left-3 top-3 pill-glass">{t.tag}</span>
              <div className="absolute bottom-3 left-3 right-3 text-background">
                <h3 className="text-[15px] text-background">{t.name}</h3>
                <p className="text-[11px] opacity-80">{t.meta}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="pb-6">
        <SectionHeader
          title="Recommended for you"
          action={
            <SectionActionLink to="/recommendations" icon={<Sparkles size={14} />}>
              For You
            </SectionActionLink>
          }
        />
        <div className="space-y-3 px-5">
          <Link
            to="/recommendations/swipe"
            className="flex items-center gap-4 rounded-lg border border-border bg-ink p-4 text-background"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-background/10 text-2xl">
              ✨
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] text-background">24 new matches</h3>
              <p className="text-[11px] opacity-75">
                Based on Hindi film, indie &amp; your Mumbai activity
              </p>
            </div>
            <span className="shrink-0 text-lg">→</span>
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/recommendations"
              className="min-w-0 rounded-lg border border-border bg-card p-4"
            >
              <p className="truncate text-[13px] font-semibold">Why you see this</p>
              <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                Explainable picks across people, spaces, gear and work
              </p>
            </Link>
            <Link to="/bands" className="min-w-0 rounded-lg border border-border bg-card p-4">
              <p className="truncate text-[13px] font-semibold">Bands near you</p>
              <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                Line-ups looking for members and shows
              </p>
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-8">
        <SectionHeader
          title="Nearby professionals"
          action={
            <SectionActionLink to="/discover/nearby" icon={<MapPin size={14} />}>
              Mumbai
            </SectionActionLink>
          }
        />
        <div className="space-y-3 px-5">
          {talents.slice(0, 2).map((t) => (
            <Link
              key={t.id}
              to="/profile/$username"
              params={{ username: t.id }}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <img src={t.photo} alt={t.name} className="h-14 w-14 rounded-md object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <h3 className="truncate text-[14px]">{t.name}</h3>
                  {t.verified ? <VerifiedBadge size={14} /> : null}
                </div>
                <p className="truncate text-[11px] text-muted-foreground">{t.role} · 2.4 km away</p>
              </div>
              <Price
                price={t.rate}
                align="end"
                className="shrink-0"
                amountClassName="text-[11px] font-semibold"
                unitClassName="text-[10px]"
              />
            </Link>
          ))}
          {studios.slice(0, 1).map((s) => (
            <Link
              key={s.name}
              to="/studio"
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <img src={s.photo} alt={s.name} className="h-14 w-14 rounded-md object-cover" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[14px]">{s.name}</h3>
                <p className="truncate text-[11px] text-muted-foreground">
                  {s.location} · {s.rating} ★
                </p>
              </div>
              <Price
                price={s.rate}
                align="end"
                className="shrink-0"
                amountClassName="text-[11px] font-semibold"
                unitClassName="text-[10px]"
              />
            </Link>
          ))}
          {dbStudios.map((s) => (
            <Link
              key={s.slug}
              to="/booking/$id"
              params={{ id: s.slug }}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              {s.photo ? (
                <img src={s.photo} alt={s.name} className="h-14 w-14 rounded-md object-cover" />
              ) : null}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[14px]">{s.name}</h3>
                <p className="truncate text-[11px] text-muted-foreground">
                  {[s.location, s.rating == null ? "" : `${s.rating} ★`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <Price
                price={s.rate}
                align="end"
                className="shrink-0"
                amountClassName="text-[11px] font-semibold"
                unitClassName="text-[10px]"
              />
            </Link>
          ))}
        </div>
      </section>
    </Screen>
  );
}
