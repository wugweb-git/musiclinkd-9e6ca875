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
import { quickCategories, talents, studios } from "@/data/discover";
import { listStudios } from "@/lib/catalog.functions";
import { listTrendingWork, type TrendingItem } from "@/lib/trending.functions";
import { searchPeople, type DirectoryPerson } from "@/lib/profile-groups.functions";
import { PersonCard, PersonRow, StudioCard } from "@/components/ml/cards";
import { useTaxonomy } from "@/lib/taxonomy";
import { recordPlay } from "@/lib/plays";
import { MediaEmbed } from "@/components/ml/media-embed";
import { NoCover } from "@/components/ml/profile";
import { joinParts } from "@/lib/utils";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { discoverStudioFromRow } from "@/lib/studio-view";
import { iconSize } from "@/lib/tokens";

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
    const [rows, labels, trendingWork, people] = await Promise.all([
      listStudios().catch(() => []),
      getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
      listTrendingWork().catch((): TrendingItem[] => []),
      searchPeople({ data: { limit: 12 } })
        .then((r) => r.people)
        .catch((): DirectoryPerson[] => []),
    ]);
    return {
      dbStudios: rows.map((row) => discoverStudioFromRow(row, labels)),
      trendingWork,
      people,
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
  const { dbStudios, trendingWork, people } = Route.useLoaderData();
  const [searchOpen, setSearchOpen] = useState(false);
  const { options } = useTaxonomy();
  // Recommendations used to be three screens of invented reasons (owner, 18 Sep). They are a
  // section here instead: the people on MusicLinkd, and the ones near the viewer.
  const myCity = people[0]?.city ?? "";
  const nearby = myCity ? people.filter((p) => p.city === myCity) : [];
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

      {people.length ? (
        <section className="pb-6">
          <SectionHeader
            title="People to work with"
            action={<SectionActionLink to="/search">See All</SectionActionLink>}
          />
          <div className="rail flex gap-3 overflow-x-auto px-5 no-scrollbar">
            {people.slice(0, 8).map((p) => (
              <PersonCard key={p.id} person={p} roleLabels={options?.person_types} />
            ))}
          </div>
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

      {dbStudios.length ? (
        <section className="pb-8">
          <SectionHeader
            title="Studios"
            action={<SectionActionLink to="/studio">See All</SectionActionLink>}
          />
          <div className="rail flex gap-3 overflow-x-auto px-5 no-scrollbar">
            {dbStudios.map((s) => (
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
