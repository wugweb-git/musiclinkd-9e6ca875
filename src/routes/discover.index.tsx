import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Boxes,
  CalendarDays,
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
import { BetaBadge, Price, Row, Segmented, SoonBadge } from "@/components/ml/kit";
import { stageOf } from "@/lib/release";
import { sameCity } from "@/lib/place";
import { NotificationsBell, SearchField, SearchIconButton } from "@/components/ml/tab-header";
import { SectionActionLink } from "@/components/ml/links";
import { useState } from "react";
import { categories, quickCategories } from "@/data/discover";
import { listStudios } from "@/lib/catalog.functions";
import {
  listTrendingPages,
  listTrendingWork,
  type TrendingItem,
  type TrendingPage,
} from "@/lib/trending.functions";
import { useAuth } from "@/hooks/use-auth";
import { searchPeople, type DirectoryPerson } from "@/lib/profile-groups.functions";
import { PersonCard, PersonRow, StudioMediaCard } from "@/components/ml/cards";
import { useTaxonomy } from "@/lib/taxonomy";
import { VideoCard } from "@/components/ml/profile";
import { workType } from "@/data/portfolio";
import { joinParts } from "@/lib/utils";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { discoverStudioFromRow } from "@/lib/studio-view";
import { iconSize } from "@/lib/tokens";
import { rankBy, useRecommendations } from "@/hooks/use-recommendations";

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
  // The people and studios here are the stored ones; an unreachable database leaves them empty.
  loader: async () => {
    const [rows, labels, trendingWork, people, trendingPages] = await Promise.all([
      listStudios().catch(() => []),
      getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
      listTrendingWork().catch((): TrendingItem[] => []),
      searchPeople({ data: { limit: 12 } })
        .then((r) => r.people)
        .catch((): DirectoryPerson[] => []),
      listTrendingPages().catch((): TrendingPage[] => []),
    ]);
    return {
      dbStudios: rows.map((row) => discoverStudioFromRow(row, labels)),
      trendingWork,
      people,
      trendingPages,
    };
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
  const { dbStudios, trendingWork, people, trendingPages } = Route.useLoaderData();
  const [searchOpen, setSearchOpen] = useState(false);
  // A persona type is a filter here, not a screen of its own (owner, 28 Sep 2026).
  const [personaFilter, setPersonaFilter] = useState<string>("All");
  const personaOptions = ["All", ...categories.map((c) => c.label)];
  const { signedIn } = useAuth();
  const audioWork = trendingWork.filter((w) => workType(w.kind).media === "audio");
  const videoWork = trendingWork.filter((w) => w.kind === "video");
  const reelWork = trendingWork.filter((w) => w.kind === "reel");
  // Trending this week: people and studios by the last 7 days' views, follows, saves, enquiries,
  // bookings and reviews (listTrendingPages). A studio shows with the same card as Studios below.
  const studioById = new Map(dbStudios.map((s) => [s.id, s]));
  type TrendingCard =
    { key: string; person: DirectoryPerson } | { key: string; studio: (typeof dbStudios)[number] };
  const trendingNow = trendingPages.flatMap((t): TrendingCard[] => {
    if (t.kind === "person") return [{ key: `p-${t.person.id}`, person: t.person }];
    const studio = studioById.get(t.studioId);
    return studio ? [{ key: `s-${studio.id}`, studio }] : [];
  });
  const { options } = useTaxonomy();
  // Recommendations used to be three screens of invented reasons (owner, 18 Sep). They are a
  // section here instead: signed in, the people ranked from the viewer's own roles, genres,
  // instruments, city, follows and saves (recommendations.functions.ts); signed out, the directory.
  const recs = useRecommendations();
  const allSuggested = recs?.people.length ? recs.people : people;
  const filterRole = categories.find((c) => c.label === personaFilter)?.role;
  const suggested = filterRole
    ? allSuggested.filter((p) => p.roles.includes(filterRole))
    : allSuggested;
  // Around you is the viewer's own stored city, never someone else's.
  const myCity = recs?.city ?? "";
  const nearby = myCity
    ? [...suggested, ...people].filter(
        (p, i, all) => sameCity(p.city, myCity) && all.findIndex((q) => q.id === p.id) === i,
      )
    : [];
  const studios = rankBy(dbStudios, recs?.studios, (s) => s.id);
  return (
    <Screen>
      <header className="px-5 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3 leading-tight">Discover</h1>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <SearchIconButton open={searchOpen} onToggle={() => setSearchOpen((v) => !v)} />
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
          const stage = stageOf(c.to);
          return stage === "soon" ? (
            <div key={c.label} aria-disabled="true" className={cls}>
              {inner}
              <SoonBadge className="absolute -top-1.5 right-1" />
            </div>
          ) : (
            <Link key={c.label} to={c.to} className={cls}>
              {inner}
              {stage === "beta" ? <BetaBadge className="absolute -top-1.5 right-1" /> : null}
            </Link>
          );
        })}
      </div>

      {allSuggested.length ? (
        <section className="pb-6">
          <SectionHeader
            title="People to work with"
            action={<SectionActionLink to="/search">See All</SectionActionLink>}
          />
          <div className="px-5">
            <Segmented
              value={personaFilter}
              options={personaOptions}
              onChange={setPersonaFilter}
              className=""
            />
          </div>
          {suggested.length ? (
            <div className="rail flex gap-3 overflow-x-auto px-5 no-scrollbar">
              {suggested.slice(0, 8).map((p) => (
                <PersonCard key={p.id} person={p} roleLabels={options?.person_types} featured />
              ))}
            </div>
          ) : (
            <p className="px-5 py-6 text-1 text-muted-foreground">
              Nobody here yet. Try another filter.
            </p>
          )}
        </section>
      ) : null}

      {audioWork.length ? (
        <section className="pb-6">
          <SectionHeader title="Trending audio" />
          <div className="rail flex gap-3 overflow-x-auto px-5 no-scrollbar">
            {audioWork.map((item) => (
              <VideoCard
                key={item.id}
                v={{
                  id: item.id,
                  title: item.title,
                  context: joinParts(
                    item.display_name ?? "",
                    `${item.plays} ${item.plays === 1 ? "play" : "plays"}`,
                  ),
                  duration: "",
                  thumb: item.cover_url ?? "",
                  ...(item.media_url ? { media: item.media_url } : {}),
                }}
              />
            ))}
          </div>
        </section>
      ) : null}

      {videoWork.length ? (
        <section className="pb-6">
          <SectionHeader title="Trending video" />
          <div className="rail flex gap-3 overflow-x-auto px-5 no-scrollbar">
            {videoWork.map((item) => (
              <VideoCard
                key={item.id}
                v={{
                  id: item.id,
                  title: item.title,
                  context: joinParts(
                    item.display_name ?? "",
                    `${item.plays} ${item.plays === 1 ? "play" : "plays"}`,
                  ),
                  duration: "",
                  thumb: item.cover_url ?? "",
                  ...(item.media_url ? { media: item.media_url } : {}),
                }}
              />
            ))}
          </div>
        </section>
      ) : null}

      {reelWork.length ? (
        <section className="pb-6">
          <SectionHeader title="Trending reels" />
          <div className="rail flex gap-3 overflow-x-auto px-5 no-scrollbar">
            {reelWork.map((item) => (
              <VideoCard
                key={item.id}
                v={{
                  id: item.id,
                  title: item.title,
                  context: joinParts(
                    item.display_name ?? "",
                    `${item.plays} ${item.plays === 1 ? "play" : "plays"}`,
                  ),
                  duration: "",
                  thumb: item.cover_url ?? "",
                  format: "reel",
                  ...(item.media_url ? { media: item.media_url } : {}),
                }}
              />
            ))}
          </div>
        </section>
      ) : null}

      {trendingNow.length ? (
        <section className="pb-6">
          <SectionHeader title="Trending this week" />
          <div className="rail flex gap-3 overflow-x-auto px-5 no-scrollbar">
            {trendingNow.map((t) =>
              "person" in t ? (
                <PersonCard
                  key={t.key}
                  person={t.person}
                  roleLabels={options?.person_types}
                  featured
                />
              ) : (
                <StudioMediaCard key={t.key} studio={t.studio} />
              ),
            )}
          </div>
        </section>
      ) : null}

      {nearby.length > 1 ? (
        <section className="pb-8">
          <SectionHeader title="Around you" />
          <div className="rail flex gap-3 overflow-x-auto px-5 no-scrollbar">
            {nearby.slice(0, 8).map((p) => (
              <PersonCard key={p.id} person={p} roleLabels={options?.person_types} featured />
            ))}
          </div>
        </section>
      ) : null}

      {studios.length ? (
        <section className="pb-8">
          <SectionHeader
            title="Studios"
            action={
              <SectionActionLink to="/discover/$slug" params={{ slug: "studios" }}>
                See All
              </SectionActionLink>
            }
          />
          <div className="rail flex gap-3 overflow-x-auto px-5 no-scrollbar">
            {studios.map((s) => (
              <StudioMediaCard key={s.slug} studio={s} />
            ))}
          </div>
        </section>
      ) : null}
    </Screen>
  );
}
