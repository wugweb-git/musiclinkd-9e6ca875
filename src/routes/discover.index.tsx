import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Search,
  Sparkles,
  Store,
  UsersRound,
} from "lucide-react";

import { BookableCard, PersonCard, PersonRow } from "@/components/ml/cards";
import { OpportunityCard, useSavedOpportunities } from "@/components/ml/opportunity";
import { NotificationsBell, SearchIconButton } from "@/components/ml/tab-header";
import { Chip, Screen, SearchBar, SectionHeader } from "@/components/ml/ui";
import { listBookables, listOpportunities } from "@/lib/catalog.functions";
import {
  listTrendingPages,
  listNewWork,
  listTrendingWork,
  type NewWorkItem,
  type TrendingItem,
  type TrendingPage,
} from "@/lib/trending.functions";
import { workType } from "@/data/portfolio";
import { listBands, type BandRow } from "@/lib/bands.functions";
import { joinParts } from "@/lib/utils";
import { sized } from "@/lib/image-url";
import { AudioTrackCard, VideoCard } from "@/components/ml/profile";
import { discoverBookableFromRow } from "@/lib/bookable-view";
import { iconSize } from "@/lib/tokens";
import { opportunityFromRow } from "@/lib/opportunity-view";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { searchPeople, type DirectoryPerson } from "@/lib/profile-groups.functions";
import { rankBy, useRecommendations } from "@/hooks/use-recommendations";
import { useMyBusinessIdentity } from "@/hooks/use-my-business-identity";
import { labelFor, useTaxonomy } from "@/lib/taxonomy";

export const Route = createFileRoute("/discover/")({
  head: () => ({
    meta: [
      { title: "Discover Music Professionals | MusicLinkd" },
      {
        name: "description",
        content:
          "Search talent, businesses, studios and opportunities across India's music industry.",
      },
      { property: "og:title", content: "Discover Music Professionals | MusicLinkd" },
      {
        property: "og:description",
        content: "Find the people, places and work for your next music project.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => {
    const [
      studioRows,
      opportunityRows,
      labels,
      people,
      trendingWork,
      trendingPages,
      bands,
      newWork,
    ] = await Promise.all([
      listBookables().catch(() => []),
      listOpportunities().catch(() => []),
      getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
      searchPeople({ data: { limit: 20, withTotal: false } })
        .then((result) => result.people)
        .catch((): DirectoryPerson[] => []),
      listTrendingWork().catch((): TrendingItem[] => []),
      listTrendingPages().catch((): TrendingPage[] => []),
      listBands().catch((): BandRow[] => []),
      listNewWork().catch((): NewWorkItem[] => []),
    ]);
    return {
      studios: studioRows.map((row) => discoverBookableFromRow(row, labels)),
      opportunities: opportunityRows.map((row) => opportunityFromRow(row, labels)),
      people,
      trendingWork,
      trendingPages,
      newWork,
      // Collabs, newest first (owner, 5 Oct: no ranking, new to old).
      collabs: [...bands]
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
        .slice(0, 8),
    };
  },
  // Coming back to Discover within a minute reuses what was read instead of waiting again.
  staleTime: 60_000,
  component: DiscoverScreen,
});

const TALENT_MODES = ["For you", "People", "Opportunities", "Studios"] as const;
const BUSINESS_MODES = ["For you", "Talent", "Studios", "Opportunities"] as const;
type Mode = (typeof TALENT_MODES)[number] | (typeof BUSINESS_MODES)[number];

function DiscoverScreen() {
  const loaded = Route.useLoaderData();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const business = useMyBusinessIdentity();
  const recommendations = useRecommendations();
  const saved = useSavedOpportunities();
  const { options } = useTaxonomy();
  const modes = business.hasBusiness ? BUSINESS_MODES : TALENT_MODES;
  const [mode, setMode] = useState<Mode>("For you");
  // People means talent: business pages never show here (owner, 5 Oct); they have Studios.
  const people = (recommendations?.people.length ? recommendations.people : loaded.people).filter(
    (p) => !p.isBusiness,
  );
  const studios = rankBy(loaded.studios, recommendations?.studios, (studio) => studio.id);
  const opportunities = rankBy(
    loaded.opportunities,
    recommendations?.opportunities,
    (opportunity) => opportunity.id,
  );
  // On For you the trending rails (below) carry people and businesses; these lists are their tabs'.
  const showPeople = mode === "People" || mode === "Talent";
  const showStudios = mode === "Studios";
  const showOpportunities = mode === "For you" || mode === "Opportunities";

  // Trending (owner, 5 Oct): each section is real activity from the last 7 days, and a section
  // with nothing in it is left out rather than shown empty. Collabs have no trending signal yet.
  const rankedTalent = loaded.trendingPages.flatMap((page) =>
    page.kind === "person" && !page.person.isBusiness ? [page.person] : [],
  );
  // No activity this week: the talent the directory already loaded, so the rail still shows people.
  const trendingTalent = rankedTalent.length ? rankedTalent : people;
  const studioById = new Map(loaded.studios.map((studio) => [studio.id, studio]));
  const trendingBusinesses = loaded.trendingPages.flatMap((page) => {
    const studio = page.kind === "studio" ? studioById.get(page.studioId) : undefined;
    return studio ? [studio] : [];
  });
  const trendingBusinessesShown = trendingBusinesses.length ? trendingBusinesses : loaded.studios;
  // A quiet week falls back to the newest work of that kind, so a section is never empty.
  const workPool = loaded.trendingWork.length ? loaded.trendingWork : loaded.newWork;
  const trendingAudio = workPool.filter((w) => workType(w.kind).media === "audio");
  const trendingVideo = workPool.filter((w) => workType(w.kind).media === "video");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const trendingOpportunities = [...loaded.opportunities].sort(
    (a, b) => b.applicants - a.applicants,
  );

  return (
    <Screen className="pb-nav-clear">
      <header className="bg-card px-5 pb-5 pt-safe">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3">Discover</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* One order on every screen (owner, 5 Oct): page action · Search · Bell · Settings. */}
            <SearchIconButton open={searchOpen} onToggle={() => setSearchOpen((v) => !v)} />
            <NotificationsBell />
          </div>
        </div>
        {searchOpen ? (
          <div className="mt-4">
            <SearchBar
              to="/search"
              placeholder="Search people, studios, services and work"
              onClose={() => setSearchOpen(false)}
            />
          </div>
        ) : null}
        <div className="rail no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
          {modes.map((item) => (
            <Chip key={item} active={mode === item} onClick={() => setMode(item)}>
              {item}
            </Chip>
          ))}
        </div>
      </header>

      <main className="space-y-9 py-6">
        <section className="px-5">
          <Link
            to="/discover/match"
            className="state-layer flex items-center gap-3 rounded-lg bg-ink p-4 text-ink-foreground"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Describe who you need</span>
              <span className="mt-0.5 block text-1 opacity-80">
                AI matches you with real profiles and open opportunities.
              </span>
            </span>
            <ArrowRight size={iconSize.sm} aria-hidden />
          </Link>
        </section>
        {mode === "For you" ? (
          <section className="px-5">
            <Link
              to="/search/why/$id"
              params={{ id: "recommendations" }}
              search={{ kind: "person" }}
              className="state-layer flex items-center gap-3 rounded-lg border border-border bg-card p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-pink-container">
                <Sparkles size={iconSize.md} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">Made relevant to your work</span>
                <span className="mt-0.5 block text-1 text-muted-foreground">
                  See the profile and activity signals behind recommendations.
                </span>
              </span>
              <ArrowRight size={iconSize.sm} aria-hidden />
            </Link>
          </section>
        ) : null}

        {showPeople && people.length ? (
          <section>
            <SectionHeader
              title={business.hasBusiness ? "Talent for your next project" : "People worth meeting"}
              action={
                <Link to="/search" className="link-action text-sm font-semibold">
                  See all
                </Link>
              }
            />
            {mode === "People" || mode === "Talent" ? (
              <div className="mx-5 grid grid-cols-2 gap-3">
                {people.slice(0, 10).map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    roleLabels={options?.person_types}
                    fill
                  />
                ))}
              </div>
            ) : (
              <div className="rail no-scrollbar flex gap-3 overflow-x-auto px-5">
                {people.slice(0, 8).map((person) => (
                  <PersonCard key={person.id} person={person} roleLabels={options?.person_types} />
                ))}
              </div>
            )}
          </section>
        ) : null}

        {showOpportunities && opportunities.length ? (
          <section>
            <SectionHeader
              title={
                business.hasBusiness
                  ? "Open industry opportunities"
                  : "Opportunities matched to you"
              }
              action={
                <Link to="/opportunities" className="link-action text-sm font-semibold">
                  See all
                </Link>
              }
            />
            <div className="space-y-3 px-5">
              {opportunities.slice(0, mode === "Opportunities" ? 8 : 3).map((opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  o={opportunity}
                  saved={saved.has(opportunity.id)}
                  onSave={() => saved.toggle(opportunity.id)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {showStudios && studios.length ? (
          <section>
            <SectionHeader
              title="Studios and spaces"
              action={
                <Link
                  to="/discover/$slug"
                  params={{ slug: "studios" }}
                  className="link-action text-sm font-semibold"
                >
                  See all
                </Link>
              }
            />
            <div className="rail no-scrollbar flex gap-3 overflow-x-auto px-5">
              {studios.slice(0, 8).map((studio) => (
                <BookableCard key={studio.id} studio={studio} featured />
              ))}
            </div>
          </section>
        ) : null}

        {mode === "For you" ? (
          <>
            {trendingTalent.length ? (
              <section>
                <SectionHeader title="Trending talent" />
                <div className="rail no-scrollbar flex gap-3 overflow-x-auto px-5">
                  {trendingTalent.slice(0, 8).map((person) => (
                    <PersonCard
                      key={person.id}
                      person={person}
                      roleLabels={options?.person_types}
                    />
                  ))}
                </div>
              </section>
            ) : null}
            {trendingBusinessesShown.length ? (
              <section>
                <SectionHeader title="Trending businesses" />
                <div className="rail no-scrollbar flex gap-3 overflow-x-auto px-5">
                  {trendingBusinessesShown.slice(0, 8).map((studio) => (
                    <BookableCard key={studio.id} studio={studio} featured />
                  ))}
                </div>
              </section>
            ) : null}
            {trendingAudio.length ? (
              <section>
                <SectionHeader title="Trending audio" />
                {/* Side-scrolling portrait tiles (owner, 5 Oct); a playing tile widens to the
                    full row, the same selected state as a profile's Portfolio. */}
                <div className="rail no-scrollbar flex items-start gap-3 overflow-x-auto px-5">
                  {trendingAudio.slice(0, 8).map((work) => (
                    <div
                      key={work.id}
                      className="w-rail-sm shrink-0 has-[.col-span-full]:w-[calc(min(100vw,var(--container-app))-2.5rem)]"
                    >
                      <AudioTrackCard
                        track={{
                          id: work.id,
                          title: work.title,
                          role: work.display_name ?? "",
                          project: "",
                          duration: "",
                          artwork: work.cover_url ?? "",
                          ...(work.media_url ? { media: work.media_url } : {}),
                        }}
                        layout="portrait"
                        playing={playingId === work.id}
                        onToggle={() => setPlayingId((id) => (id === work.id ? null : work.id))}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
            {trendingVideo.length ? (
              <section>
                <SectionHeader title="Trending videos" />
                <div className="rail no-scrollbar flex items-start gap-3 overflow-x-auto px-5">
                  {trendingVideo.slice(0, 8).map((work) => (
                    <div
                      key={work.id}
                      className="w-rail-sm shrink-0 has-[.col-span-full]:w-[calc(min(100vw,var(--container-app))-2.5rem)]"
                    >
                      <VideoCard
                        layout="grid"
                        v={{
                          id: work.id,
                          title: work.title,
                          context: work.display_name ?? "",
                          duration: "",
                          thumb: work.cover_url ?? "",
                          ...(work.media_url ? { media: work.media_url } : {}),
                        }}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
            {loaded.collabs.length ? (
              <section>
                <SectionHeader
                  title="Collabs"
                  action={
                    <Link to="/bands" className="link-action text-sm font-semibold">
                      See all
                    </Link>
                  }
                />
                <div className="rail no-scrollbar flex gap-3 overflow-x-auto px-5">
                  {loaded.collabs.map((band) => {
                    const photo = band.cover_url ?? band.avatar_url;
                    return (
                      <Link
                        key={band.id}
                        to="/bands/$id"
                        params={{ id: band.slug }}
                        className="state-layer block w-rail-md shrink-0 overflow-hidden rounded-lg border border-border/80 bg-card active:scale-[0.985]"
                      >
                        {photo ? (
                          <img
                            src={sized(photo, { width: 412 })}
                            alt=""
                            loading="lazy"
                            className="h-28 w-full object-cover"
                          />
                        ) : (
                          <span aria-hidden className="block h-28 w-full bg-ink/5" />
                        )}
                        <span className="block p-3">
                          <span className="block truncate text-sm font-bold">{band.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {joinParts(
                              (band.genres ?? [])
                                .slice(0, 2)
                                .map((g) => labelFor(options?.genres, g))
                                .join(" · "),
                              band.city,
                            )}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null}
            {trendingOpportunities.length ? (
              <section>
                <SectionHeader title="Trending opportunities" />
                <div className="space-y-3 px-5">
                  {trendingOpportunities.slice(0, 3).map((opportunity) => (
                    <OpportunityCard
                      key={opportunity.id}
                      o={opportunity}
                      saved={saved.has(opportunity.id)}
                      onSave={() => saved.toggle(opportunity.id)}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        <section className="px-5">
          <h2 className="text-2 font-semibold">Explore by intent</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <IntentLink
              to="/search"
              icon={<UsersRound size={iconSize.lg} />}
              title={business.hasBusiness ? "Source talent" : "Find collaborators"}
            />
            <IntentLink
              to="/services"
              icon={<BriefcaseBusiness size={iconSize.lg} />}
              title="Book services"
            />
            <StudioIntentLink />
            <IntentLink
              to="/marketplace"
              icon={<Store size={iconSize.lg} />}
              title="Browse Market"
            />
          </div>
        </section>
      </main>
    </Screen>
  );
}

function IntentLink({
  to,
  icon,
  title,
}: {
  to: "/search" | "/services" | "/marketplace";
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <Link
      to={to}
      className="state-layer flex min-h-28 flex-col justify-between rounded-lg border border-border bg-card p-4"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-subtle">
        {icon}
      </span>
      <span className="mt-4 flex items-center justify-between gap-2 text-sm font-semibold">
        {title}
        <ArrowRight size={iconSize.sm} aria-hidden />
      </span>
    </Link>
  );
}

function StudioIntentLink() {
  return (
    <Link
      to="/discover/$slug"
      params={{ slug: "studios" }}
      className="state-layer flex min-h-28 flex-col justify-between rounded-lg border border-border bg-card p-4"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-subtle">
        <Building2 size={iconSize.lg} />
      </span>
      <span className="mt-4 flex items-center justify-between gap-2 text-sm font-semibold">
        Find a studio
        <ArrowRight size={iconSize.sm} aria-hidden />
      </span>
    </Link>
  );
}
