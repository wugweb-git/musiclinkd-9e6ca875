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
import { BetaBadge, Price, Row, SoonBadge } from "@/components/ml/kit";
import { stageOf } from "@/lib/release";
import { ViewerAvatar } from "@/components/ml/viewer";
import { NotificationsBell, SearchField, SearchIconButton } from "@/components/ml/tab-header";
import { SectionActionLink } from "@/components/ml/links";
import { useEffect, useState } from "react";
import { quickCategories } from "@/data/discover";
import { listStudios } from "@/lib/catalog.functions";
import {
  listTrendingPages,
  listTrendingWork,
  type TrendingItem,
  type TrendingPage,
} from "@/lib/trending.functions";
import { useAuth } from "@/hooks/use-auth";
import { searchPeople, type DirectoryPerson } from "@/lib/profile-groups.functions";
import { PersonCard, PersonRow, StudioCard } from "@/components/ml/cards";
import { useTaxonomy } from "@/lib/taxonomy";
import { recordPlay } from "@/lib/plays";
import { recordWorkEvent } from "@/lib/work-events";
import { MediaEmbed } from "@/components/ml/media-embed";
import { NoCover } from "@/components/ml/profile";
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
  const { signedIn } = useAuth();
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
  const suggested = recs?.people.length ? recs.people : people;
  // Around you is the viewer's own stored city, never someone else's.
  const myCity = recs?.city ?? "";
  const nearby = myCity
    ? [...suggested, ...people].filter(
        (p, i, all) =>
          p.city?.trim().toLowerCase() === myCity.toLowerCase() &&
          all.findIndex((q) => q.id === p.id) === i,
      )
    : [];
  const studios = rankBy(dbStudios, recs?.studios, (s) => s.id);
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

      {suggested.length ? (
        <section className="pb-6">
          <SectionHeader
            title="People to work with"
            action={<SectionActionLink to="/search">See All</SectionActionLink>}
          />
          <div className="rail flex gap-3 overflow-x-auto px-5 no-scrollbar">
            {suggested.slice(0, 8).map((p) => (
              <PersonCard key={p.id} person={p} roleLabels={options?.person_types} />
            ))}
          </div>
          {signedIn ? (
            <div className="px-5 pt-3">
              <Row
                icon={<Sparkles size={iconSize.md} aria-hidden />}
                title="Swipe through matches"
                subtitle="Save or skip people recommended for you"
                to="/recommendations/swipe"
              />
            </div>
          ) : null}
        </section>
      ) : null}

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

      {trendingNow.length ? (
        <section className="pb-6">
          <SectionHeader title="Trending this week" />
          <div className="rail flex gap-3 overflow-x-auto px-5 no-scrollbar">
            {trendingNow.map((t) =>
              "person" in t ? (
                <PersonCard key={t.key} person={t.person} roleLabels={options?.person_types} />
              ) : (
                <StudioCard key={t.key} studio={t.studio} />
              ),
            )}
          </div>
        </section>
      ) : null}

      {nearby.length > 1 ? (
        <section className="pb-8">
          <SectionHeader
            title="Around you"
            action={
              <SectionActionLink to="/discover/nearby" icon={<MapPin size={iconSize.sm} />}>
                {myCity}
              </SectionActionLink>
            }
          />
          <div className="rail flex gap-3 overflow-x-auto px-5 no-scrollbar">
            {nearby.slice(0, 8).map((p) => (
              <PersonCard key={p.id} person={p} roleLabels={options?.person_types} />
            ))}
          </div>
        </section>
      ) : null}

      {studios.length ? (
        <section className="pb-8">
          <SectionHeader
            title="Studios"
            action={<SectionActionLink to="/studio">See All</SectionActionLink>}
          />
          <div className="rail flex gap-3 overflow-x-auto px-5 no-scrollbar">
            {studios.map((s) => (
              <StudioCard key={s.slug} studio={s} />
            ))}
          </div>
        </section>
      ) : null}
    </Screen>
  );
}

/** A trending work: tap to play it in place, which also counts toward Trending. */
function TrendingWorkRow({ item }: { item: TrendingItem }) {
  const [open, setOpen] = useState(false);
  // Shown in Trending counts as a view of the work, for its owner's Performance figures.
  useEffect(() => recordWorkEvent(item.id, "view"), [item.id]);
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
          size={iconSize.md}
          aria-hidden
          className={`shrink-0 text-muted-foreground transition-transform duration-200 ease-standard ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="mt-3 space-y-2 animate-in fade-in duration-200">
          {item.media_url ? (
            <MediaEmbed
              url={item.media_url}
              title={item.title}
              onOpen={() => recordWorkEvent(item.id, "link_click")}
            />
          ) : null}
          {item.username ? (
            <Link
              to="/profile/$username"
              params={{ username: item.username }}
              onClick={() => recordWorkEvent(item.id, "profile_click")}
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
