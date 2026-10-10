import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Music2,
  Sparkles,
  Store,
  UsersRound,
} from "lucide-react";

import { BookableCard, BookableCardSkeleton, PersonCard } from "@/components/ml/cards";
import { OpportunityCard, useSavedOpportunities } from "@/components/ml/opportunity";
import { NotificationsBell, SearchIconButton } from "@/components/ml/tab-header";
import { Btn, BtnLink, Chip, Screen, SearchBar, SectionHeader } from "@/components/ml/ui";
import { EmptyState, LoadError, OfflineBanner } from "@/components/ml/kit";
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
import { discoverBookableFromBusiness, discoverBookableFromRow } from "@/lib/bookable-view";
import { iconSize } from "@/lib/tokens";
import { opportunityFromRow } from "@/lib/opportunity-view";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import {
  listPublicBusinesses,
  searchPeople,
  type DirectoryPerson,
} from "@/lib/profile-groups.functions";
import { rankBy, useRecommendations } from "@/hooks/use-recommendations";
import { useMyBusinessIdentity } from "@/hooks/use-my-business-identity";
import { businessTypes, labelFor, useTaxonomy } from "@/lib/taxonomy";

const MODES = ["for_you", "people", "opportunities", "businesses"] as const;
type Mode = (typeof MODES)[number];
const WORK_FILTERS = ["all", "trending", "new", "music", "video"] as const;
type WorkFilter = (typeof WORK_FILTERS)[number];
const WORK_LABELS: Record<WorkFilter, string> = {
  all: "All",
  trending: "Trending",
  new: "New",
  music: "Music",
  video: "Video",
};

/** One page of the Businesses grid and the Work feed (owner, 10 Oct 2026). */
const PAGE = 24;

type DiscoverSearch = { mode?: Mode; type?: string; work?: WorkFilter };

const isOneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (list as readonly string[]).includes(value);

export const Route = createFileRoute("/discover/")({
  // The tab, the business type and the work filter live in the address, so Back brings them back
  // (owner, 10 Oct 2026).
  validateSearch: (search: Record<string, unknown>): DiscoverSearch => ({
    ...(isOneOf(MODES, search["mode"]) && search["mode"] !== "for_you"
      ? { mode: search["mode"] }
      : {}),
    ...(typeof search["type"] === "string" && /^[a-z0-9_]{2,40}$/.test(search["type"])
      ? { type: search["type"] }
      : {}),
    ...(isOneOf(WORK_FILTERS, search["work"]) && search["work"] !== "all"
      ? { work: search["work"] }
      : {}),
  }),
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
    const [studioRows, opportunityRows, labels, people, trendingPages, bands] = await Promise.all([
      listBookables().catch(() => []),
      listOpportunities().catch(() => []),
      getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
      searchPeople({ data: { limit: 20, withTotal: false } })
        .then((result) => result.people)
        .catch((): DirectoryPerson[] => []),
      listTrendingPages().catch((): TrendingPage[] => []),
      listBands().catch((): BandRow[] => []),
    ]);
    return {
      studios: studioRows.map((row) => discoverBookableFromRow(row, labels)),
      opportunities: opportunityRows.map((row) => opportunityFromRow(row, labels)),
      people,
      trendingPages,
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

/** navigator.onLine, kept current; false on the server. */
function useOffline() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const online = () => setOffline(false);
    const offlineNow = () => setOffline(true);
    setOffline(navigator.onLine === false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offlineNow);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offlineNow);
    };
  }, []);
  return offline;
}

function DiscoverScreen() {
  const loaded = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const business = useMyBusinessIdentity();
  const recommendations = useRecommendations();
  const saved = useSavedOpportunities();
  const { options } = useTaxonomy();
  const offline = useOffline();
  const mode: Mode = search.mode ?? "for_you";
  const modeLabels: Record<Mode, string> = {
    for_you: "For you",
    people: business.hasBusiness ? "Talent" : "People",
    opportunities: "Opportunities",
    businesses: "Businesses",
  };
  const modes: readonly Mode[] = business.hasBusiness
    ? ["for_you", "people", "businesses", "opportunities"]
    : ["for_you", "people", "opportunities", "businesses"];
  // undefined clears a param, so the address only carries what differs from the default.
  const setSearch = (next: { [K in keyof DiscoverSearch]?: DiscoverSearch[K] | undefined }) =>
    void navigate({
      search: (prev) =>
        Object.fromEntries(
          Object.entries({ ...prev, ...next }).filter(([, value]) => value !== undefined),
        ) as DiscoverSearch,
      replace: true,
      resetScroll: false,
    });
  // People means talent: business pages never show here (owner, 5 Oct); they have Businesses.
  const people = (recommendations?.people.length ? recommendations.people : loaded.people).filter(
    (p) => !p.isBusiness,
  );
  const opportunities = rankBy(
    loaded.opportunities,
    recommendations?.opportunities,
    (opportunity) => opportunity.id,
  );
  // On For you the trending rails (below) carry people and businesses; these lists are their tabs'.
  const showPeople = mode === "people";
  const showOpportunities = mode === "for_you" || mode === "opportunities";

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
  const trendingOpportunities = [...loaded.opportunities].sort(
    (a, b) => b.applicants - a.applicants,
  );

  const retryAll = () => void router.invalidate();

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
            <Chip
              key={item}
              active={mode === item}
              onClick={() => setSearch({ mode: item === "for_you" ? undefined : item })}
            >
              {modeLabels[item]}
            </Chip>
          ))}
        </div>
      </header>

      <main className="space-y-9 py-6">
        {offline ? (
          <div className="px-5">
            <OfflineBanner
              body="Discover shows what was loaded last. New results come in once you're back online."
              onRetry={retryAll}
            />
          </div>
        ) : null}
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
        {mode === "for_you" ? (
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
              {opportunities.slice(0, mode === "opportunities" ? 8 : 3).map((opportunity) => (
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

        {mode === "businesses" ? (
          <BusinessesSection
            type={search.type}
            onType={(type) => setSearch({ type })}
            canCreate={!business.hasBusiness}
          />
        ) : null}

        {mode === "for_you" ? (
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
                <SectionHeader
                  title="Trending businesses"
                  action={
                    <Link
                      to="/discover"
                      search={(prev) => ({ ...prev, mode: "businesses" as const })}
                      className="link-action text-sm font-semibold"
                    >
                      See all
                    </Link>
                  }
                />
                <div className="rail no-scrollbar flex gap-3 overflow-x-auto px-5">
                  {trendingBusinessesShown.slice(0, 8).map((studio) => (
                    <BookableCard key={studio.id} studio={studio} featured />
                  ))}
                </div>
              </section>
            ) : null}
            <WorkSection
              filter={search.work ?? "all"}
              onFilter={(work) => setSearch({ work: work === "all" ? undefined : work })}
            />
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

/** "Showing 24 of 61" and Show more — the same footer under both paged lists. */
function PageFooter({
  shown,
  total,
  onMore,
}: {
  shown: number;
  total: number;
  onMore: () => void;
}) {
  return (
    <div className="mt-4 space-y-3 px-5">
      <p className="text-center text-1 text-muted-foreground" aria-live="polite">
        Showing {shown.toLocaleString("en-IN")} of {total.toLocaleString("en-IN")}
      </p>
      {shown < total ? (
        <Btn variant="outline" className="w-full" onClick={onMore}>
          Show more
        </Btn>
      ) : null}
    </div>
  );
}

/*
 * Businesses (owner, 10 Oct 2026): every business page, not only ones with a booking calendar,
 * on the same business card with Follow and no price. The type chips count real pages; a type
 * with none is left out rather than shown at 0.
 */
function BusinessesSection({
  type,
  onType,
  canCreate,
}: {
  type: string | undefined;
  onType: (type: string | undefined) => void;
  canCreate: boolean;
}) {
  const { options } = useTaxonomy();
  const load = useServerFn(listPublicBusinesses);
  const q = useQuery({ queryKey: ["discover", "businesses"], queryFn: () => load() });
  const [pages, setPages] = useState(1);
  const types = useMemo(() => businessTypes(options?.person_types ?? []), [options]);
  const typeOf = useMemo(() => {
    const slugs = new Set(types.map((t) => t.metadata?.app_key ?? t.slug));
    return (roles: string[]) => roles.find((r) => slugs.has(r));
  }, [types]);
  const all = q.data ?? [];
  const counts = new Map<string, number>();
  for (const b of all) {
    const t = typeOf(b.roles);
    if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const typeChips = types
    .map((t) => ({ key: t.metadata?.app_key ?? t.slug, label: t.label }))
    .filter((t) => counts.has(t.key));
  // A type from an old link that has no pages now falls back to All.
  const active = type && counts.has(type) ? type : undefined;
  const matching = active ? all.filter((b) => typeOf(b.roles) === active) : all;
  const shown = matching.slice(0, pages * PAGE);
  const pick = (next: string | undefined) => {
    setPages(1);
    onType(next);
  };

  return (
    <section aria-busy={q.isPending || undefined}>
      <SectionHeader title="Businesses" />
      {q.isError ? (
        <div className="px-5">
          <LoadError
            what="businesses"
            action={
              <Btn variant="outline" onClick={() => void q.refetch()} loading={q.isFetching}>
                Try again
              </Btn>
            }
          />
        </div>
      ) : q.isPending ? (
        <div role="status" aria-label="Loading businesses" className="grid grid-cols-2 gap-3 px-5">
          {[0, 1, 2, 3].map((i) => (
            <BookableCardSkeleton key={i} fill />
          ))}
        </div>
      ) : !all.length ? (
        <div className="px-5">
          <EmptyState
            icon={<Building2 size={iconSize.lg} aria-hidden />}
            title="No business pages yet"
            body="Labels, venues, studios and schools show here once they make a page."
          >
            {canCreate ? (
              <BtnLink to="/business/new" search={{ step: "type" }} className="w-full">
                Create a business page
              </BtnLink>
            ) : (
              <BtnLink to="/search" variant="outline" className="w-full">
                Search MusicLinkd
              </BtnLink>
            )}
          </EmptyState>
        </div>
      ) : (
        <>
          <div
            role="group"
            aria-label="Business type"
            className="rail no-scrollbar mb-4 flex gap-2 overflow-x-auto px-5 pb-1"
          >
            <Chip active={!active} onClick={() => pick(undefined)} count={all.length}>
              All
            </Chip>
            {typeChips.map((t) => (
              <Chip
                key={t.key}
                active={active === t.key}
                onClick={() => pick(t.key)}
                count={counts.get(t.key)}
              >
                {t.label}
              </Chip>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 px-5">
            {shown.map((b) => (
              <BookableCard key={b.id} studio={discoverBookableFromBusiness(b)} fill />
            ))}
          </div>
          <PageFooter
            shown={shown.length}
            total={matching.length}
            onMore={() => setPages((p) => p + 1)}
          />
        </>
      )}
    </section>
  );
}

/*
 * Work (owner, 10 Oct 2026): one feed in place of the separate Trending audio and Trending video
 * rails. Trending is real plays from the last 7 days, New the newest published work; All is
 * trending first, then new. The portrait tiles are the profile Portfolio's own, with its Like and
 * Share; a playing tile widens across the grid.
 */
function WorkSection({
  filter,
  onFilter,
}: {
  filter: WorkFilter;
  onFilter: (filter: WorkFilter) => void;
}) {
  const loadTrending = useServerFn(listTrendingWork);
  const loadNew = useServerFn(listNewWork);
  const q = useQuery({
    queryKey: ["discover", "work"],
    queryFn: async () => {
      // Trending is a ranking on top of the feed: if plays can't be read, the feed still shows
      // the newest work rather than an error (and Trending says nothing is trending).
      const [trending, fresh] = await Promise.all([
        loadTrending().catch((): TrendingItem[] => []),
        loadNew(),
      ]);
      return { trending, fresh };
    },
  });
  const [pages, setPages] = useState(1);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const playable = (w: NewWorkItem) => {
    const media = workType(w.kind).media;
    return media === "audio" || media === "video";
  };
  const trending = (q.data?.trending ?? []).filter(playable);
  const fresh = (q.data?.fresh ?? []).filter(playable);
  const trendingIds = new Set(trending.map((w) => w.id));
  const all: NewWorkItem[] = [...trending, ...fresh.filter((w) => !trendingIds.has(w.id))];
  const items =
    filter === "trending"
      ? trending
      : filter === "new"
        ? fresh
        : filter === "music"
          ? all.filter((w) => workType(w.kind).media === "audio")
          : filter === "video"
            ? all.filter((w) => workType(w.kind).media === "video")
            : all;
  const shown = items.slice(0, pages * PAGE);
  const pick = (next: WorkFilter) => {
    setPages(1);
    setPlayingId(null);
    onFilter(next);
  };

  return (
    <section aria-busy={q.isPending || undefined}>
      <SectionHeader title="Work" />
      <div
        role="group"
        aria-label="Filter work"
        className="rail no-scrollbar mb-4 flex gap-2 overflow-x-auto px-5 pb-1"
      >
        {WORK_FILTERS.map((f) => (
          <Chip key={f} active={filter === f} onClick={() => pick(f)}>
            {WORK_LABELS[f]}
          </Chip>
        ))}
      </div>
      {q.isError ? (
        <div className="px-5">
          <LoadError
            what="work"
            action={
              <Btn variant="outline" onClick={() => void q.refetch()} loading={q.isFetching}>
                Try again
              </Btn>
            }
          />
        </div>
      ) : q.isPending ? (
        <div role="status" aria-label="Loading work" className="grid grid-cols-2 gap-3 px-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-square w-full animate-pulse rounded-md bg-ink/5" />
          ))}
        </div>
      ) : !items.length ? (
        <div className="px-5">
          <EmptyState
            kind={filter === "all" ? "default" : "filtered"}
            icon={<Music2 size={iconSize.lg} aria-hidden />}
            title={filter === "trending" ? "Nothing trending this week" : "No work here yet"}
            body={
              filter === "all"
                ? "Published music and video from the community shows here."
                : "Try another filter, or see everything published."
            }
          >
            {filter === "all" ? (
              <BtnLink to="/portfolio/new" className="w-full">
                Add your work
              </BtnLink>
            ) : (
              <Btn variant="outline" className="w-full" onClick={() => pick("all")}>
                Show all work
              </Btn>
            )}
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 items-start gap-3 px-5">
            {shown.map((work) =>
              workType(work.kind).media === "audio" ? (
                <AudioTrackCard
                  key={work.id}
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
              ) : (
                <VideoCard
                  key={work.id}
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
              ),
            )}
          </div>
          <PageFooter
            shown={shown.length}
            total={items.length}
            onMore={() => setPages((p) => p + 1)}
          />
        </>
      )}
    </section>
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
