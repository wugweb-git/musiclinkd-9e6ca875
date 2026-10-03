import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowLeft, Bookmark, Info, MapPin } from "lucide-react";
import {
  Chip,
  IconBtn,
  IconBtnLink,
  Screen,
  SearchBar,
  SectionHeader,
  VerifiedBadge,
} from "@/components/ml/ui";
import { PersonRow } from "@/components/ml/cards";
import { Segmented, StateCard } from "@/components/ml/kit";
import { SectionActionLink } from "@/components/ml/links";
import { ListingGrid } from "@/components/ml/market";
import { OpportunityCard } from "@/components/ml/opportunity";

import { useAuth } from "@/hooks/use-auth";
import { searchPeople } from "@/lib/profile-groups.functions";
import {
  listMySearchFeedback,
  searchEverything,
  SEARCH_GROUPS,
  type ResultKind,
  type SearchGroup,
  type SearchHit,
} from "@/lib/global-search.functions";
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
import { talentTypes, useTaxonomy } from "@/lib/taxonomy";
import { iconSize } from "@/lib/tokens";
import { sized } from "@/lib/image-url";

/*
 * Search over everything public: people (the live profiles table, narrowed by a role from the
 * taxonomy), businesses, studios, collabs and bands, open opportunities, Market gear and services.
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
] as const;
type Tab = (typeof TABS)[number];

const TAB_LABEL: Record<Tab, string> = {
  all: "All",
  people: "People",
  businesses: "Businesses",
  studios: "Studios",
  collabs: "Collabs",
  opportunities: "Opportunities",
  gear: "Gear",
  services: "Services",
};
const tabOf = (label: string) => TABS.find((t) => TAB_LABEL[t] === label) ?? "all";

type SearchParams = { q?: string; tab?: Tab };

export const Route = createFileRoute("/search/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    const out: SearchParams = {};
    if (typeof search["q"] === "string" && search["q"]) out.q = search["q"];
    const tab = search["tab"];
    if (typeof tab === "string" && tab !== "all" && (TABS as readonly string[]).includes(tab))
      out.tab = tab as Tab;
    return out;
  },
  head: () => ({
    meta: [
      { title: "Search Results | MusicLinkd" },
      {
        name: "description",
        content:
          "Find people, businesses, studios, bands, opportunities, gear and services in India's music industry.",
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

/** Results the person said were not a good match go after the rest, in the same order. */
function lastIfFlagged<T>(items: T[], key: (t: T) => string, flagged: Set<string>) {
  if (!flagged.size) return items;
  return [
    ...items.filter((i) => !flagged.has(key(i))),
    ...items.filter((i) => flagged.has(key(i))),
  ];
}

function SearchResults() {
  const params = Route.useSearch();
  const tab: Tab = params.tab ?? "all";
  const navigate = useNavigate({ from: "/search/" });
  const [q, setQ] = useState(params.q ?? "");
  const [role, setRole] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const term = useSettled(q).trim();
  const { options } = useTaxonomy();
  const { signedIn } = useAuth();
  const queryClient = useQueryClient();

  const showPeople = tab === "all" || tab === "people";
  const groups: SearchGroup[] = tab === "all" ? [...SEARCH_GROUPS] : tab === "people" ? [] : [tab];
  const limit = tab === "all" ? 6 : 40;

  const find = useServerFn(searchPeople);
  const people = useQuery({
    queryKey: ["search", "people", term, role, verifiedOnly, limit],
    queryFn: () =>
      find({
        data: {
          ...(term ? { q: term } : {}),
          ...(role ? { role } : {}),
          ...(verifiedOnly ? { verifiedOnly: true } : {}),
          limit,
        },
      }),
    enabled: showPeople,
  });

  const findRest = useServerFn(searchEverything);
  const rest = useQuery({
    queryKey: ["search", "everything", term, verifiedOnly, groups.join(","), limit],
    queryFn: () =>
      findRest({
        data: {
          ...(term ? { q: term } : {}),
          ...(verifiedOnly ? { verifiedOnly: true } : {}),
          groups,
          limit,
        },
      }),
    enabled: groups.length > 0,
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
  };
  const totals: Record<Exclude<Tab, "all">, number> = {
    people: people.data?.total ?? 0,
    businesses: r?.businesses.total ?? 0,
    studios: r?.studios.total ?? 0,
    collabs: r?.collabs.total ?? 0,
    opportunities: r?.opportunities.total ?? 0,
    gear: r?.gear.total ?? 0,
    services: (r?.services.total ?? 0) + (r?.serviceListings.total ?? 0),
  };
  const total = Object.values(totals).reduce((a, b) => a + b, 0);

  const loading = (showPeople && people.isLoading) || (groups.length > 0 && rest.isLoading);
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

  // A handful of roles to narrow people by; the full list is the categories screen.
  const roles = talentTypes(options?.person_types ?? []).slice(0, 8);
  const toTab = (next: Tab) => {
    // Roles narrow people only, and only show on People; leaving it drops the role.
    if (next !== "people") setRole("");
    void navigate({
      search: { ...(q.trim() ? { q: q.trim() } : {}), ...(next === "all" ? {} : { tab: next }) },
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

  const sections: { tab: Exclude<Tab, "all">; count: number; body: (all: boolean) => ReactNode }[] =
    [
      {
        tab: "people",
        count: lists.people.length,
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
        body: (all: boolean) => (
          <HitList hits={all ? lists[key].slice(0, 3) : lists[key]} q={term} />
        ),
      })),
      {
        tab: "opportunities",
        count: opportunityCards.length,
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
        body: (all) => <ListingGrid items={all ? gear.slice(0, 4) : gear} />,
      },
      {
        tab: "services",
        count: lists.services.length + serviceListings.length,
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
    ];
  const shown = sections.filter((s) => (tab === "all" || s.tab === tab) && s.count > 0);
  const filtering = Boolean(term || role || verifiedOnly);
  const popularItems = popular.data?.items ?? [];

  return (
    <Screen>
      <div className="pt-safe sticky top-0 z-bar bg-background/95 px-5 backdrop-blur">
        <div className="mb-3 flex items-center gap-3">
          <Link
            to="/discover"
            aria-label="Back to Discover"
            className="flex h-10 w-10 items-center justify-center"
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
          {tab === "people"
            ? roles.map((o) => (
                <Chip
                  key={o.slug}
                  active={role === o.slug}
                  onClick={() => setRole(role === o.slug ? "" : o.slug)}
                >
                  {o.label}
                </Chip>
              ))
            : null}
        </div>
        <div className="mt-1">
          <Segmented
            value={TAB_LABEL[tab]}
            options={TABS.map((t) => TAB_LABEL[t])}
            onChange={(label) => toTab(tabOf(label))}
          />
        </div>
      </div>

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
              <li key={i} className="h-20 animate-pulse rounded-lg bg-subtle" />
            ))}
          </ul>
        ) : failed ? (
          <div className="px-5">
            <StateCard
              title="We couldn't run that search"
              body="Check your connection, then try again."
            />
          </div>
        ) : !shown.length ? (
          <div className="px-5">
            <StateCard
              title="Nothing matched"
              body={
                filtering
                  ? "Try fewer words, or drop a filter."
                  : "Type a name, a role or a city to start."
              }
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 px-5 pb-3">
              <p className="text-1 text-muted-foreground">
                <strong className="text-foreground">
                  {tab === "all" ? total : totals[tab]}{" "}
                  {(tab === "all" ? total : totals[tab]) === 1 ? "result" : "results"}
                </strong>
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
              {shown.map((s) => {
                const count = totals[s.tab];
                return (
                  <section key={s.tab}>
                    {tab === "all" ? (
                      <SectionHeader
                        title={`${TAB_LABEL[s.tab]} · ${count}`}
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
                    ) : count > s.count ? (
                      <p className="px-5 pb-3 text-1 text-muted-foreground">
                        Showing the first {s.count}
                      </p>
                    ) : null}
                    <div className="px-5">{s.body(tab === "all")}</div>
                  </section>
                );
              })}
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
