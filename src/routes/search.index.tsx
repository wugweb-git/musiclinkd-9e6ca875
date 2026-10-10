import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowLeft, Bookmark, ChevronDown, Info, MapPin, X } from "lucide-react";
import { DrawerList, DrawerOptionRow, DrawerSearch, matching } from "@/components/ml/drawer-list";
import {
  Btn,
  Chip,
  IconBtn,
  IconBtnLink,
  Screen,
  SearchBar,
  Sheet,
  SectionHeader,
  VerifiedBadge,
} from "@/components/ml/ui";
import { PersonRow } from "@/components/ml/cards";
import { EMPTY_ART, EmptyState, LoadError, OfflineBanner, Segmented } from "@/components/ml/kit";
import { SectionActionLink } from "@/components/ml/links";
import { ListingGrid } from "@/components/ml/market";
import { OpportunityCard } from "@/components/ml/opportunity";
import { useWorkLikes, WorkLinkRow } from "@/components/ml/portfolio";
import { workMediaFilters } from "@/data/portfolio";

import { useAuth } from "@/hooks/use-auth";
import { peopleFacets, searchPeople } from "@/lib/profile-groups.functions";
import {
  listMySearchFeedback,
  searchEverything,
  searchFacets,
  SEARCH_GROUPS,
  type ResultKind,
  type SearchFacets,
  type SearchFilters,
  type SearchGroup,
  type SearchHit,
} from "@/lib/global-search.functions";
import { sameCity } from "@/lib/place";
import {
  listMySavedSearches,
  popularSearches,
  removeSavedSearch,
  saveSearch,
} from "@/lib/searches.functions";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { listingFromRow } from "@/lib/market-view";
import { opportunityFromRow } from "@/lib/opportunity-view";
import { useSearchRecorder } from "@/lib/search-events";
import {
  businessTypes,
  labelFor,
  talentTypes,
  useTaxonomy,
  type TaxonomyOption,
} from "@/lib/taxonomy";
import { iconSize } from "@/lib/tokens";
import { sized } from "@/lib/image-url";

/*
 * Search over everything public: people (the live profiles table, narrowed by a role from the
 * taxonomy), businesses, studios, collabs and bands, open opportunities, Market gear, services
 * and published music and video work.
 * Every count is the count the database returns — there is no estimate, and no filter that does
 * not narrow anything. With nothing typed it shows this device's recent searches, the account's
 * saved ones and what people search most, above what there is to browse.
 */

const TABS = [
  "all",
  "people",
  "businesses",
  "studios",
  "collabs",
  "opportunities",
  "gear",
  "services",
  "work",
] as const;
type Tab = (typeof TABS)[number];
type OneTab = Exclude<Tab, "all">;

const TAB_LABEL: Record<Tab, string> = {
  all: "All",
  people: "People",
  businesses: "Businesses",
  studios: "Studios",
  collabs: "Collabs",
  opportunities: "Opportunities",
  gear: "Gear",
  services: "Services",
  work: "Work",
};
const tabOf = (label: string) => TABS.find((t) => TAB_LABEL[t] === label) ?? "all";

/** Every filter a tab can have; each is "any of these", comma-separated in the address. */
const FILTER_KEYS = ["role", "genre", "type", "category", "media", "city"] as const;
type FilterKey = (typeof FILTER_KEYS)[number];
type FilterValues = Record<FilterKey, string[]>;

/*
 * Filters on every tab, not only People (owner, 10 Oct 2026). Each tab narrows by what its rows
 * actually store: a business by its type, an opportunity by the role it needs, Market gear by its
 * tool category, work by Music/Video and genre, and a city wherever there is one.
 */
const TAB_FILTERS: Record<OneTab, { key: FilterKey; title: string }[]> = {
  people: [
    { key: "role", title: "Role" },
    { key: "genre", title: "Genre" },
    { key: "city", title: "City" },
  ],
  businesses: [
    { key: "type", title: "Business type" },
    { key: "city", title: "City" },
  ],
  studios: [{ key: "city", title: "City" }],
  collabs: [{ key: "city", title: "City" }],
  opportunities: [
    { key: "role", title: "Role needed" },
    { key: "city", title: "City" },
  ],
  gear: [
    { key: "category", title: "Category" },
    { key: "city", title: "City" },
  ],
  services: [{ key: "city", title: "City" }],
  work: [
    { key: "media", title: "Music or video" },
    { key: "genre", title: "Genre" },
  ],
};

type SearchParams = { q?: string; tab?: Tab; verified?: true } & Partial<Record<FilterKey, string>>;

export const Route = createFileRoute("/search/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    const out: SearchParams = {};
    if (typeof search["q"] === "string" && search["q"]) out.q = search["q"];
    const tab = search["tab"];
    if (typeof tab === "string" && tab !== "all" && (TABS as readonly string[]).includes(tab))
      out.tab = tab as Tab;
    // Filters live in the address too, so Back and a shared link bring them back (plan §9).
    for (const key of FILTER_KEYS) {
      const v = search[key];
      if (typeof v === "string" && v) out[key] = v;
    }
    if (search["verified"] === true || search["verified"] === "true") out.verified = true;
    return out;
  },
  head: () => ({
    meta: [
      { title: "Search Results | MusicLinkd" },
      {
        name: "description",
        content:
          "Find people, businesses, studios, bands, opportunities, gear, services and work in India's music industry.",
      },
      { property: "og:title", content: "Search Results | MusicLinkd" },
      { property: "og:description", content: "Search everything on MusicLinkd." },
    ],
  }),
  component: SearchResults,
});

/** A keystroke should not be a query; this waits for the typing to stop. */
function useSettled(value: string, ms = 300) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return settled;
}

/** Whether the device has a connection, kept current (the offline banner, plan §9). */
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

/** Results the person said were not a good match go after the rest, in the same order. */
function lastIfFlagged<T>(items: T[], key: (t: T) => string, flagged: Set<string>) {
  if (!flagged.size) return items;
  return [
    ...items.filter((i) => !flagged.has(key(i))),
    ...items.filter((i) => flagged.has(key(i))),
  ];
}

type Taxonomy = ReturnType<typeof useTaxonomy>["options"];

/** A business type or tool category by the value rows store (app_key where set, else the slug). */
const asStored = (list: TaxonomyOption[]) =>
  list.map((o) => ({ ...o, slug: o.metadata?.app_key ?? o.slug }));

/** Market tools: instruments, hardware and software in one list, each value once. */
function toolOptions(options: Taxonomy): TaxonomyOption[] {
  const seen = new Set<string>();
  return asStored([
    ...(options?.instruments ?? []),
    ...(options?.equipment_categories ?? []),
    ...(options?.daw_tools ?? []),
  ]).filter((o) => !seen.has(o.slug) && Boolean(seen.add(o.slug)));
}

/** The options a filter offers on a tab. */
function optionsFor(tab: OneTab, key: FilterKey, options: Taxonomy): TaxonomyOption[] {
  switch (key) {
    case "role":
      // People are talent; an opportunity can ask for any person type.
      return tab === "people"
        ? talentTypes(options?.person_types ?? [])
        : (options?.person_types ?? []);
    case "genre":
      return options?.genres ?? [];
    case "type":
      return asStored(businessTypes(options?.person_types ?? []));
    case "category":
      return toolOptions(options);
    case "media":
      return workMediaFilters.map((m) => ({ ...m, metadata: null }));
    case "city":
      return options?.cities ?? [];
  }
}

/** The values a tab's server reads take: cities and opportunity roles as labels, the rest as stored. */
function serverFilters(tab: Tab, v: FilterValues, options: Taxonomy) {
  if (tab === "all") return {};
  const cities = v.city.map((c) => labelFor(options?.cities, c));
  if (tab === "people")
    return {
      ...(v.role.length ? { roles: v.role } : {}),
      ...(v.genre.length ? { genres: v.genre } : {}),
      ...(cities.length ? { cities } : {}),
    };
  const f: SearchFilters = {};
  if (cities.length) f.cities = cities;
  if (tab === "businesses" && v.type.length) f.types = v.type;
  if (tab === "opportunities" && v.role.length)
    f.roleLabels = v.role.map((r) => labelFor(options?.person_types, r));
  if (tab === "gear" && v.category.length) f.categories = v.category;
  if (tab === "work") {
    const media = v.media.filter((m): m is "music" | "video" => m === "music" || m === "video");
    if (media.length) f.media = media;
    if (v.genre.length) f.genres = v.genre;
  }
  return { filters: f };
}

function SearchResults() {
  const params = Route.useSearch();
  const tab: Tab = params.tab ?? "all";
  const navigate = useNavigate({ from: "/search/" });
  const [q, setQ] = useState(params.q ?? "");
  // Several of each, comma-separated in the address (?role=singer,composer).
  const values = Object.fromEntries(
    FILTER_KEYS.map((k) => [k, (params[k] ?? "").split(",").filter(Boolean)]),
  ) as FilterValues;
  const tabFilters = tab === "all" ? [] : TAB_FILTERS[tab];
  const [filtersOpen, setFiltersOpen] = useState(false);
  const verifiedOnly = params.verified === true;
  const term = useSettled(q).trim();
  const offline = useOffline();
  // The address follows the query once typing stops, and every filter as it changes.
  const setParams = (next: { [K in keyof SearchParams]?: SearchParams[K] | undefined }) =>
    void navigate({
      search: (prev) => {
        const merged = { ...prev, ...next };
        return Object.fromEntries(
          Object.entries(merged).filter(([, v]) => v !== undefined && v !== ""),
        ) as SearchParams;
      },
      replace: true,
    });
  const setVerifiedOnly = (fn: (v: boolean) => boolean) =>
    setParams({ verified: fn(verifiedOnly) ? true : undefined });
  useEffect(() => {
    if ((params.q ?? "") !== term) setParams({ q: term || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);
  const clearFilters = () => {
    setQ("");
    void navigate({ search: tab === "all" ? {} : { tab }, replace: true });
  };
  const { options } = useTaxonomy();
  const { signedIn } = useAuth();
  const queryClient = useQueryClient();

  // Filters only narrow their own tab, and cities and roles go to the server as labels, so a read
  // with either waits for the taxonomy rather than sending a slug.
  const active = tabFilters.flatMap(({ key }) => values[key].map((value) => ({ key, value })));
  const filterArgs = serverFilters(tab, values, options);
  const ready = options !== null || !active.some((a) => a.key === "city" || a.key === "role");

  const showPeople = tab === "all" || tab === "people";
  const groups: SearchGroup[] = tab === "all" ? [...SEARCH_GROUPS] : tab === "people" ? [] : [tab];
  const limit = tab === "all" ? 6 : 40;

  const find = useServerFn(searchPeople);
  const people = useQuery({
    queryKey: ["search", "people", term, filterArgs, verifiedOnly, limit],
    queryFn: () =>
      find({
        data: {
          ...(term ? { q: term } : {}),
          ...(tab === "people" ? filterArgs : {}),
          ...(verifiedOnly ? { verifiedOnly: true } : {}),
          talentOnly: true,
          limit,
        },
      }),
    enabled: showPeople && ready,
  });

  const findRest = useServerFn(searchEverything);
  const rest = useQuery({
    queryKey: ["search", "everything", term, verifiedOnly, groups.join(","), filterArgs, limit],
    queryFn: () =>
      findRest({
        data: {
          ...(term ? { q: term } : {}),
          ...(verifiedOnly ? { verifiedOnly: true } : {}),
          ...(tab === "people" ? {} : filterArgs),
          groups,
          limit,
        },
      }),
    enabled: groups.length > 0 && ready,
  });

  const labels = useQuery({
    queryKey: ["taxonomy-labels"],
    queryFn: () => getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
    staleTime: 5 * 60_000,
  });

  const fetchFeedback = useServerFn(listMySearchFeedback);
  const feedback = useQuery({
    queryKey: ["search", "feedback"],
    queryFn: () => fetchFeedback().catch((): string[] => []),
    enabled: signedIn,
  });
  const flagged = useMemo(() => new Set(feedback.data ?? []), [feedback.data]);

  const r = rest.data;
  const now = Date.now();
  const lists = {
    people: lastIfFlagged(people.data?.people ?? [], (p) => `person:${p.id}`, flagged),
    businesses: lastIfFlagged(r?.businesses.items ?? [], hitKey, flagged),
    studios: lastIfFlagged(r?.studios.items ?? [], hitKey, flagged),
    collabs: lastIfFlagged(r?.collabs.items ?? [], hitKey, flagged),
    opportunities: lastIfFlagged(
      r?.opportunities.items ?? [],
      (o) => `opportunity:${o.id}`,
      flagged,
    ),
    gear: lastIfFlagged(r?.gear.items ?? [], (l) => `listing:${l.id}`, flagged),
    serviceListings: lastIfFlagged(
      r?.serviceListings.items ?? [],
      (l) => `listing:${l.id}`,
      flagged,
    ),
    services: lastIfFlagged(r?.services.items ?? [], hitKey, flagged),
    work: r?.work.items ?? [],
  };
  const totals: Record<OneTab, number> = {
    people: people.data?.total ?? 0,
    businesses: r?.businesses.total ?? 0,
    studios: r?.studios.total ?? 0,
    collabs: r?.collabs.total ?? 0,
    opportunities: r?.opportunities.total ?? 0,
    gear: r?.gear.total ?? 0,
    services: (r?.services.total ?? 0) + (r?.serviceListings.total ?? 0),
    work: r?.work.total ?? 0,
  };
  const total = Object.values(totals).reduce((a, b) => a + b, 0);
  const workLikes = useWorkLikes(lists.work.map((w) => w.id));

  const loading =
    !ready || (showPeople && people.isLoading) || (groups.length > 0 && rest.isLoading);
  const failed = (showPeople && people.isError) || (groups.length > 0 && rest.isError);
  const settled = !loading && !failed && (people.isSuccess || rest.isSuccess);

  // A search is remembered on this device and counted toward popular searches once the typing
  // stops, with what it actually found.
  useSearchRecorder("global", settled ? term : "", total);

  const fetchPopular = useServerFn(popularSearches);
  const popular = useQuery({
    queryKey: ["searches", "popular", "global"],
    queryFn: () => fetchPopular({ data: { scope: "global" } }),
  });

  const fetchSaved = useServerFn(listMySavedSearches);
  const saved = useQuery({
    queryKey: ["searches", "saved", "global"],
    queryFn: () => fetchSaved({ data: { scope: "global" } }),
    enabled: signedIn,
  });
  const savedNow = saved.data?.find((s) => s.query.toLowerCase() === term.toLowerCase());
  const save = useServerFn(saveSearch);
  const unsave = useServerFn(removeSavedSearch);
  const toggleSaved = useMutation({
    mutationFn: () =>
      savedNow
        ? unsave({ data: { id: savedNow.id } })
        : save({ data: { scope: "global", query: term } }),
    onSuccess: () => {
      toast.success(savedNow ? "Search removed." : "Search saved.");
      void queryClient.invalidateQueries({ queryKey: ["searches", "saved", "global"] });
    },
    onError: () => toast.error("That didn't save. Try again."),
  });

  const toTab = (next: Tab) => {
    // Filters narrow one tab and mean something else on another, so changing tab drops them.
    void navigate({
      search: {
        ...(q.trim() ? { q: q.trim() } : {}),
        ...(next === "all" ? {} : { tab: next }),
        ...(verifiedOnly ? { verified: true as const } : {}),
      },
      replace: true,
    });
  };

  const L = labels.data ?? {};
  const opportunityCards = lists.opportunities.map((o) => ({
    row: o,
    card: opportunityFromRow({ ...o, creator: o.creator ?? null, genres: o.genres ?? [] }, L),
  }));
  const gear = lists.gear.map((l) => listingFromRow(l, L, now));
  const serviceListings = lists.serviceListings.map((l) => listingFromRow(l, L, now));

  const whyFor = (kind: ResultKind, id: string) => ({ kind, id, q: term });

  // `shown` is how many of a section's results are on screen: All shows a few of each.
  const sections: {
    tab: OneTab;
    count: number;
    shown: (all: boolean) => number;
    body: (all: boolean) => ReactNode;
  }[] = [
    {
      tab: "people",
      count: lists.people.length,
      shown: (all) => (all ? Math.min(3, lists.people.length) : lists.people.length),
      body: (all) => (
        <ul className="divide-y divide-border overflow-hidden rounded-lg bg-subtle">
          {(all ? lists.people.slice(0, 3) : lists.people).map((p) => (
            <WithWhy key={p.id} why={whyFor("person", p.id)} name={p.name}>
              <PersonRow person={p} roleLabels={options?.person_types} />
            </WithWhy>
          ))}
        </ul>
      ),
    },
    ...(["businesses", "studios", "collabs"] as const).map((key) => ({
      tab: key,
      count: lists[key].length,
      shown: (all: boolean) => (all ? Math.min(3, lists[key].length) : lists[key].length),
      body: (all: boolean) => <HitList hits={all ? lists[key].slice(0, 3) : lists[key]} q={term} />,
    })),
    {
      tab: "opportunities",
      count: opportunityCards.length,
      shown: (all) => (all ? Math.min(2, opportunityCards.length) : opportunityCards.length),
      body: (all) => (
        <div className="space-y-3">
          {(all ? opportunityCards.slice(0, 2) : opportunityCards).map(({ row, card }) => (
            <div key={row.id} className="relative">
              <OpportunityCard o={card} />
              <WhyLink why={whyFor("opportunity", row.id)} name={row.title} corner />
            </div>
          ))}
        </div>
      ),
    },
    {
      tab: "gear",
      count: gear.length,
      shown: (all) => (all ? Math.min(4, gear.length) : gear.length),
      body: (all) => <ListingGrid items={all ? gear.slice(0, 4) : gear} />,
    },
    {
      tab: "services",
      count: lists.services.length + serviceListings.length,
      shown: (all) =>
        all
          ? Math.min(3, lists.services.length) + Math.min(2, serviceListings.length)
          : lists.services.length + serviceListings.length,
      body: (all) => (
        <div className="space-y-3">
          {lists.services.length ? (
            <HitList hits={all ? lists.services.slice(0, 3) : lists.services} q={term} />
          ) : null}
          {serviceListings.length ? (
            <ListingGrid items={all ? serviceListings.slice(0, 2) : serviceListings} />
          ) : null}
        </div>
      ),
    },
    {
      tab: "work",
      count: lists.work.length,
      shown: (all) => (all ? Math.min(3, lists.work.length) : lists.work.length),
      // No "Why" link: search feedback does not take work yet (search_feedback.subject_kind).
      body: (all) => (
        <ul className="space-y-2">
          {(all ? lists.work.slice(0, 3) : lists.work).map((w) => (
            <li key={w.id}>
              <WorkLinkRow work={w} likes={workLikes} />
            </li>
          ))}
        </ul>
      ),
    },
  ];
  const shown = sections.filter((s) => (tab === "all" || s.tab === tab) && s.count > 0);
  const filtering = Boolean(term || active.length || verifiedOnly);
  const popularItems = popular.data?.items ?? [];
  // "N of M" (plan §9): N on screen, M every match the database counted.
  const onScreen = shown.reduce((n, s) => n + s.shown(tab === "all"), 0);
  const matched = tab === "all" ? total : totals[tab];
  const removeFilter = (key: FilterKey, value: string) =>
    setParams({ [key]: values[key].filter((x) => x !== value).join(",") || undefined });

  return (
    <Screen>
      {/* Outside the blurred sticky header: its backdrop-filter would trap the fixed sheet. */}
      {tab !== "all" ? (
        <SearchFiltersSheet
          key={tab}
          tab={tab}
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          term={term}
          verifiedOnly={verifiedOnly}
          values={values}
          options={options}
          onApply={(next) => {
            setParams(
              Object.fromEntries(
                TAB_FILTERS[tab].map(({ key }) => [key, next[key].join(",") || undefined]),
              ),
            );
            setFiltersOpen(false);
          }}
        />
      ) : null}
      <div className="pt-safe sticky top-0 z-bar bg-background/95 px-5 backdrop-blur">
        <div className="mb-3 flex items-center gap-3">
          <Link
            to="/discover"
            aria-label="Back to Discover"
            className="hit-area flex h-10 w-10 items-center justify-center"
          >
            <ArrowLeft size={iconSize.md} aria-hidden />
          </Link>
          <h1 className="text-3 leading-tight">Search</h1>
        </div>
        <SearchBar value={q} onChange={setQ} />
        <div className="rail mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          <Chip active={verifiedOnly} onClick={() => setVerifiedOnly((v) => !v)}>
            Verified
          </Chip>
          {tab !== "all" ? (
            <Chip active={active.length > 0} onClick={() => setFiltersOpen(true)}>
              {active.length ? `Filters · ${active.length}` : "Filters"}
            </Chip>
          ) : null}
        </div>
        {active.length ? (
          // Active filters as removable ink chips (plan §9).
          <div className="mt-2 flex flex-wrap gap-2">
            {active.map(({ key, value }) => (
              <ActiveFilterChip
                key={`${key}-${value}`}
                label={labelFor(optionsFor(tab as OneTab, key, options), value)}
                onRemove={() => removeFilter(key, value)}
              />
            ))}
          </div>
        ) : null}
        <div className="mt-1">
          <Segmented
            value={TAB_LABEL[tab]}
            options={TABS.map((t) => TAB_LABEL[t])}
            onChange={(label) => toTab(tabOf(label))}
          />
        </div>
      </div>

      {offline ? (
        <div className="px-5 pt-4">
          <OfflineBanner
            body="Results show again when you're back online."
            onRetry={() => {
              void people.refetch();
              void rest.refetch();
            }}
          />
        </div>
      ) : null}

      {!term && tab === "all" ? (
        <div className="space-y-5 px-5 pt-4">
          {saved.data?.length ? (
            <SearchChipGroup
              title="Saved searches"
              items={saved.data.map((s) => s.query)}
              onPick={setQ}
            />
          ) : null}
          {popularItems.length ? (
            <SearchChipGroup
              title={popular.data?.searched ? "Popular searches" : "Popular categories"}
              items={popularItems}
              onPick={setQ}
            />
          ) : null}
        </div>
      ) : null}

      <div className="py-4">
        {loading ? (
          <ul className="space-y-3 px-5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-20 animate-pulse rounded-lg bg-ink/5" />
            ))}
          </ul>
        ) : failed ? (
          <div className="px-5">
            <LoadError
              what="these results"
              action={
                <Btn
                  variant="outline"
                  onClick={() => {
                    void people.refetch();
                    void rest.refetch();
                  }}
                >
                  Try again
                </Btn>
              }
            />
          </div>
        ) : !shown.length ? (
          <div className="px-5">
            <EmptyState
              art={EMPTY_ART.search}
              title="Nothing matched"
              body={
                filtering
                  ? "Try fewer words, or drop a filter."
                  : "Type a name, a role or a city to start."
              }
            >
              {filtering ? (
                <Btn variant="outline" onClick={clearFilters}>
                  Clear filters
                </Btn>
              ) : null}
            </EmptyState>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 px-5 pb-3">
              <p className="text-1 text-muted-foreground">
                <strong className="text-foreground">{onScreen.toLocaleString("en-IN")}</strong>
                {` of ${matched.toLocaleString("en-IN")} ${matched === 1 ? "result" : "results"}`}
                {term ? ` for “${term}”` : ""}
              </p>
              {term ? (
                <IconBtn
                  label={savedNow ? "Remove saved search" : "Save search"}
                  variant="plain"
                  loading={toggleSaved.isPending}
                  onClick={() =>
                    signedIn ? toggleSaved.mutate() : toast.error("Sign in to save a search.")
                  }
                >
                  <Bookmark
                    size={iconSize.md}
                    fill={savedNow ? "currentColor" : "none"}
                    aria-hidden
                  />
                </IconBtn>
              ) : null}
            </div>
            <div className="space-y-6">
              {shown.map((s) => (
                <section key={s.tab}>
                  {tab === "all" ? (
                    <SectionHeader
                      title={`${TAB_LABEL[s.tab]} · ${totals[s.tab]}`}
                      action={
                        <SectionActionLink
                          to="/search"
                          search={{ ...(term ? { q: term } : {}), tab: s.tab }}
                          replace
                        >
                          See All
                        </SectionActionLink>
                      }
                    />
                  ) : null}
                  <div className="px-5">{s.body(tab === "all")}</div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </Screen>
  );
}

const hitKey = (h: SearchHit) => `${h.kind}:${h.id}`;

function SearchChipGroup({
  title,
  items,
  onPick,
}: {
  title: string;
  items: string[];
  onPick: (q: string) => void;
}) {
  return (
    <section>
      <h2 className="pill mb-2 bg-subtle text-muted-foreground">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((s) => (
          <Chip key={s} onClick={() => onPick(s)}>
            {s}
          </Chip>
        ))}
      </div>
    </section>
  );
}

type Why = { kind: ResultKind; id: string; q: string };

/** "Why am I seeing this" for one result: an icon-only link to /search/why/$id. */
function WhyLink({ why, name, corner = false }: { why: Why; name: string; corner?: boolean }) {
  return (
    <IconBtnLink
      to="/search/why/$id"
      params={{ id: why.id }}
      search={{ kind: why.kind, ...(why.q ? { q: why.q } : {}) }}
      label={`Why ${name} is here`}
      variant="plain"
      className={corner ? "absolute right-2 top-2 text-muted-foreground" : "text-muted-foreground"}
    >
      <Info size={iconSize.sm} aria-hidden />
    </IconBtnLink>
  );
}

/** A result row that is its own <li>, with the Why link beside it. */
function WithWhy({ why, name, children }: { why: Why; name: string; children: ReactNode }) {
  return (
    <li className="flex items-center pr-2">
      <ul className="min-w-0 flex-1">{children}</ul>
      <WhyLink why={why} name={name} />
    </li>
  );
}

function HitList({ hits, q }: { hits: SearchHit[]; q: string }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg bg-subtle">
      {hits.map((h) => (
        <li key={h.id} className="flex items-center gap-1 pr-2">
          <Link
            to={h.link.to}
            params={h.link.params as never}
            className="state-layer flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5"
          >
            {h.photo ? (
              <img
                src={sized(h.photo, { width: 44 })}
                alt=""
                loading="lazy"
                className={`h-11 w-11 shrink-0 object-cover ${h.kind === "person" ? "rounded-full" : "rounded-sm"}`}
              />
            ) : (
              <span className="h-11 w-11 shrink-0 rounded-sm bg-background" aria-hidden />
            )}
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1">
                <span className="truncate text-2 font-semibold">{h.title}</span>
                {h.verified ? <VerifiedBadge size={16} /> : null}
              </span>
              {h.subtitle ? (
                <span className="block truncate text-1 text-muted-foreground">{h.subtitle}</span>
              ) : null}
              {h.place ? (
                <span className="mt-0.5 flex items-center gap-1 text-1 text-muted-foreground">
                  <MapPin size={iconSize.xs} className="shrink-0" aria-hidden />
                  <span className="truncate">{h.place}</span>
                </span>
              ) : null}
            </span>
          </Link>
          <WhyLink why={{ kind: h.kind, id: h.id, q }} name={h.title} />
        </li>
      ))}
    </ul>
  );
}

function ActiveFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove filter: ${label}`}
      className="hit-area state-layer inline-flex h-8 items-center gap-1 rounded-full bg-ink pl-3 pr-2 text-1 font-semibold text-ink-foreground"
    >
      {label}
      <X size={iconSize.sm} aria-hidden />
    </button>
  );
}

const SHOWN_AT_FIRST = 8;
const toggle = (list: string[], v: string) =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

/**
 * A filter's counts keyed by option value. Cities are counted by the city each row shows and
 * matched with sameCity, so "Mumbai 400053" counts for Mumbai; opportunity roles are text, so they
 * match on the option's label.
 */
function countsFor(
  tab: OneTab,
  key: FilterKey,
  list: TaxonomyOption[],
  facets: SearchFacets | undefined,
): Record<string, number> | undefined {
  const raw = facets?.[key];
  if (!raw) return undefined;
  if (key === "city") {
    const places = Object.entries(raw);
    return Object.fromEntries(
      list.map((o) => [
        o.slug,
        places.reduce((n, [place, c]) => (sameCity(place, o.label) ? n + c : n), 0),
      ]),
    );
  }
  if (key === "role" && tab === "opportunities")
    return Object.fromEntries(list.map((o) => [o.slug, raw[o.label.toLowerCase()] ?? 0]));
  return raw;
}

/**
 * The Filters panel for one tab (plan §9): its groups, each searchable, a real count on every
 * option, "Show N more", and a footer with Clear all and a live "Show N results". Several picks
 * in a group match any of them; picks in different groups must all match.
 */
function SearchFiltersSheet({
  tab,
  open,
  onClose,
  term,
  verifiedOnly,
  values,
  options,
  onApply,
}: {
  tab: OneTab;
  open: boolean;
  onClose: () => void;
  term: string;
  verifiedOnly: boolean;
  values: FilterValues;
  options: Taxonomy;
  onApply: (next: FilterValues) => void;
}) {
  const groups = TAB_FILTERS[tab];
  const [draft, setDraft] = useState<FilterValues>(values);
  const [openGroup, setOpenGroup] = useState<string>(groups[0]?.title ?? "");
  const valuesKey = JSON.stringify(values);
  useEffect(() => {
    if (open) setDraft(JSON.parse(valuesKey) as FilterValues);
  }, [open, valuesKey]);

  const loadPeopleFacets = useServerFn(peopleFacets);
  const loadFacets = useServerFn(searchFacets);
  const facets = useQuery({
    queryKey: ["search", tab, "facets"],
    queryFn: async (): Promise<SearchFacets> => {
      if (tab !== "people") return loadFacets({ data: { group: tab } });
      const p = await loadPeopleFacets();
      return { role: p.roles, genre: p.genres, city: p.cities };
    },
    enabled: open,
    staleTime: 5 * 60_000,
  });

  const findPeople = useServerFn(searchPeople);
  const findRest = useServerFn(searchEverything);
  const args = serverFilters(tab, draft, options);
  const live = useQuery({
    queryKey: ["search", tab, "count", term, args, verifiedOnly],
    queryFn: async () => {
      const base = {
        ...(term ? { q: term } : {}),
        ...(verifiedOnly ? { verifiedOnly: true } : {}),
        limit: 1,
      };
      if (tab === "people")
        return (await findPeople({ data: { ...base, ...args, talentOnly: true, withTotal: true } }))
          .total;
      const r = await findRest({ data: { ...base, ...args, groups: [tab] } });
      return tab === "services" ? r.services.total + r.serviceListings.total : r[tab].total;
    },
    enabled: open,
  });
  const total = live.data;
  const empty = Object.fromEntries(FILTER_KEYS.map((k) => [k, []])) as unknown as FilterValues;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filters"
      titleAction={
        <button
          type="button"
          className="hit-area text-sm font-semibold underline-offset-4 hover:underline"
          onClick={() => setDraft(empty)}
        >
          Clear all
        </button>
      }
    >
      <div className="divide-y divide-border">
        {groups.map(({ key, title }) => {
          const list = optionsFor(tab, key, options);
          return (
            <FilterGroup
              key={key}
              title={title}
              open={openGroup === title}
              onToggle={() => setOpenGroup((g) => (g === title ? "" : title))}
              picked={draft[key].map((v) => labelFor(list, v)).join(", ")}
              options={list}
              counts={countsFor(tab, key, list, facets.data)}
              value={draft[key]}
              onPick={(v) => setDraft((d) => ({ ...d, [key]: toggle(d[key], v) }))}
            />
          );
        })}
      </div>
      <div className="sticky bottom-0 mt-4 bg-card pt-3 pb-safe">
        <Btn className="w-full" loading={live.isFetching} onClick={() => onApply(draft)}>
          {total === undefined ? "Show results" : `Show ${total.toLocaleString("en-IN")} results`}
        </Btn>
      </div>
    </Sheet>
  );
}

function FilterGroup({
  title,
  open,
  onToggle,
  picked,
  options,
  counts,
  value,
  onPick,
}: {
  title: string;
  /** Groups open in place, one at a time, so the panel stays short. */
  open: boolean;
  onToggle: () => void;
  picked: string;
  options: TaxonomyOption[];
  counts: Record<string, number> | undefined;
  value: string[];
  onPick: (slug: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [all, setAll] = useState(false);
  // Only options someone actually has, most common first; the picked one always stays visible.
  const withCounts = options
    .map((o) => ({ value: o.slug, label: o.label, count: counts?.[o.slug] ?? 0 }))
    .filter((o) => !counts || o.count > 0 || value.includes(o.value))
    .sort((a, b) => b.count - a.count);
  const found = matching(withCounts, query);
  const shown = all || query ? found : found.slice(0, SHOWN_AT_FIRST);
  const more = found.length - shown.length;
  return (
    <section className="py-1">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="state-layer flex min-h-touch w-full items-center gap-3 text-left"
      >
        <span className="flex-1 text-2 font-semibold">{title}</span>
        {picked ? <span className="truncate text-1 text-muted-foreground">{picked}</span> : null}
        <ChevronDown
          size={iconSize.md}
          aria-hidden
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="pb-3">
          <DrawerSearch
            value={query}
            onChange={setQuery}
            label={`Search ${title.toLowerCase()}`}
            placeholder={`Search ${title.toLowerCase()}`}
          />
          <DrawerList label={title} multiple empty="Nothing matches that.">
            {shown.map((o) => (
              <DrawerOptionRow
                key={o.value}
                option={counts ? o : { value: o.value, label: o.label }}
                selected={value.includes(o.value)}
                onClick={() => onPick(o.value)}
              />
            ))}
          </DrawerList>
          {more > 0 ? (
            <button
              type="button"
              className="hit-area mt-2 text-sm font-semibold underline-offset-4 hover:underline"
              onClick={() => setAll(true)}
            >
              Show {more} more
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
