import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Boxes,
  CalendarDays,
  ChevronDown,
  Disc3,
  Drum,
  MapPin,
  Mic2,
  SlidersVertical,
  Sparkles,
  Star,
  Store,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Screen, SearchBar, SectionHeader, VerifiedBadge } from "@/components/ml/ui";
import { Price, SoonBadge } from "@/components/ml/kit";
import { TalentCard } from "@/components/ml/cards";
import { ViewerAvatar } from "@/components/ml/viewer";
import { NotificationsBell, SearchField, SearchIconButton } from "@/components/ml/tab-header";
import { SectionActionLink } from "@/components/ml/links";
import { useState } from "react";
import { quickCategories, talents, trending, studios } from "@/data/discover";
import { listStudios } from "@/lib/catalog.functions";
import { listTrendingWork, type TrendingItem } from "@/lib/trending.functions";
import { recordPlay } from "@/lib/plays";
import { MediaEmbed } from "@/components/ml/media-embed";
import { NoCover } from "@/components/ml/profile";
import { joinParts } from "@/lib/utils";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { discoverStudioFromRow } from "@/lib/studio-view";

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
    const [rows, labels, trendingWork] = await Promise.all([
      listStudios().catch(() => []),
      getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
      listTrendingWork().catch((): TrendingItem[] => []),
    ]);
    return { dbStudios: rows.map((row) => discoverStudioFromRow(row, labels)), trendingWork };
  },
  component: Discover,
});

/** One line icon per quick category. No emoji: they render as empty boxes on real devices. */
function categoryIcon(label: string) {
  const icons: Record<string, LucideIcon> = {
    Talent: Mic2,
    Bands: Drum,
    Studios: SlidersVertical,
    Events: CalendarDays,
    Marketplace: Store,
    Rentals: Boxes,
    Labels: Disc3,
    Venues: Ticket,
    Communities: Users,
  };
  const Icon = icons[label] ?? Mic2;
  return <Icon size={20} strokeWidth={1.75} className="text-muted-foreground" aria-hidden />;
}

function Discover() {
  const { dbStudios, trendingWork } = Route.useLoaderData();
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <Screen>
      <header className="px-5 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-1 font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              MusicLinkd
            </p>
            <h1 className="text-4 leading-tight">Discover</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsBell />
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
        {quickCategories.map((c) => {
          const inner = (
            <>
              <span className="flex h-8 items-center justify-center">{categoryIcon(c.label)}</span>
              <span className="text-1 font-semibold">{c.label}</span>
            </>
          );
          const cls =
            "relative flex w-[86px] shrink-0 flex-col items-center gap-2 rounded-lg bg-subtle px-2 py-3";
          return c.soon ? (
            <div key={c.label} aria-disabled="true" className={cls}>
              {inner}
              <SoonBadge className="absolute -top-1.5 right-1" />
            </div>
          ) : (
            <Link key={c.label} to={c.to} className={cls}>
              {inner}
            </Link>
          );
        })}
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

      {trendingWork.length ? (
        <section className="pb-6">
          <SectionHeader title="Trending work" />
          <div className="space-y-2 px-5">
            {trendingWork.map((item) => (
              <TrendingWorkRow key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}

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
                <h3 className="text-sm text-background">{t.name}</h3>
                <p className="text-1 opacity-80">{t.meta}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="pb-6">
        <SectionHeader
          title="Recommended for you"
          action={
            <SectionActionLink to="/recommendations" icon={<Sparkles size={16} />}>
              For You
            </SectionActionLink>
          }
        />
        <div className="space-y-3 px-5">
          <Link
            to="/recommendations/swipe"
            className="flex items-center gap-4 rounded-lg border border-border bg-ink p-4 text-background"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-background/10">
              <Sparkles size={24} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm text-background">Swipe through matches</h3>
            </div>
            <ArrowRight size={20} className="shrink-0" aria-hidden />
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/recommendations" className="min-w-0 rounded-lg bg-subtle p-4">
              <p className="truncate text-1 font-semibold">Why you see this</p>
              <p className="mt-1 line-clamp-2 text-1 text-muted-foreground">
                Explainable picks across people, spaces, gear and work
              </p>
            </Link>
            <div aria-disabled="true" className="min-w-0 rounded-lg bg-subtle p-4">
              <p className="flex items-center gap-2 text-1 font-semibold">
                <span className="truncate">Bands near you</span>
                <SoonBadge />
              </p>
              <p className="mt-1 line-clamp-2 text-1 text-muted-foreground">
                Line-ups looking for members and shows
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-8">
        <SectionHeader
          title="Nearby professionals"
          action={
            <SectionActionLink to="/discover/nearby" icon={<MapPin size={16} />}>
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
              className="flex items-center gap-3 rounded-lg bg-subtle p-3"
            >
              <img src={t.photo} alt={t.name} className="h-14 w-14 rounded-sm object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <h3 className="truncate text-sm">{t.name}</h3>
                  {t.verified ? <VerifiedBadge size={16} /> : null}
                </div>
                <p className="truncate text-1 text-muted-foreground">
                  {t.role} · {t.location}
                </p>
              </div>
              <Price
                price={t.rate}
                align="end"
                className="shrink-0"
                amountClassName="text-1 font-semibold"
                unitClassName="text-1"
              />
            </Link>
          ))}
          {studios.slice(0, 1).map((s) => (
            <Link
              key={s.name}
              to="/studio"
              className="flex items-center gap-3 rounded-lg bg-subtle p-3"
            >
              <img src={s.photo} alt={s.name} className="h-14 w-14 rounded-sm object-cover" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm">{s.name}</h3>
                <p className="flex min-w-0 items-center gap-1 truncate text-1 text-muted-foreground">
                  <span className="truncate">{s.location}</span>
                  <span aria-hidden>·</span>
                  <span className="inline-flex shrink-0 items-center gap-0.5">
                    {s.rating}
                    <Star size={12} fill="currentColor" aria-hidden />
                  </span>
                </p>
              </div>
              <Price
                price={s.rate}
                align="end"
                className="shrink-0"
                amountClassName="text-1 font-semibold"
                unitClassName="text-1"
              />
            </Link>
          ))}
          {dbStudios.map((s) => (
            <Link
              key={s.slug}
              to="/booking/$id"
              params={{ id: s.slug }}
              className="flex items-center gap-3 rounded-lg bg-subtle p-3"
            >
              {s.photo ? (
                <img src={s.photo} alt={s.name} className="h-14 w-14 rounded-sm object-cover" />
              ) : null}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm">{s.name}</h3>
                <p className="truncate text-1 text-muted-foreground">
                  {joinParts(s.location, s.rating == null ? "" : `${s.rating} out of 5`)}
                </p>
              </div>
              <Price
                price={s.rate}
                align="end"
                className="shrink-0"
                amountClassName="text-1 font-semibold"
                unitClassName="text-1"
              />
            </Link>
          ))}
        </div>
      </section>
    </Screen>
  );
}

/** A trending work: tap to play it in place, which also counts toward Trending. */
function TrendingWorkRow({ item }: { item: TrendingItem }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="rounded-lg bg-subtle p-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          if (!open) recordPlay(item.id);
          setOpen((o) => !o);
        }}
        className="state-layer flex w-full items-center gap-3 rounded-lg text-left"
      >
        {item.cover_url ? (
          <img
            src={item.cover_url}
            alt=""
            loading="lazy"
            className="h-14 w-14 shrink-0 rounded-sm object-cover"
          />
        ) : (
          <NoCover className="h-14 w-14 shrink-0 rounded-sm" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-2 font-semibold">{item.title}</span>
          <span className="block truncate text-1 text-muted-foreground">
            {joinParts(
              item.display_name ?? "",
              `${item.plays} ${item.plays === 1 ? "play" : "plays"}`,
            )}
          </span>
        </span>
        <ChevronDown
          size={20}
          aria-hidden
          className={`shrink-0 text-muted-foreground transition-transform duration-200 ease-standard ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="mt-3 space-y-2 animate-in fade-in duration-200">
          {item.media_url ? <MediaEmbed url={item.media_url} title={item.title} /> : null}
          {item.username ? (
            <Link
              to="/profile/$username"
              params={{ username: item.username }}
              className="link-action block text-center text-1 font-semibold"
            >
              View Profile
            </Link>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
