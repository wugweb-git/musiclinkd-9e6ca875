import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, SearchBar, TopBar, Chip, Btn } from "@/components/ml/ui";
import {
  EmptyState,
  ListingGrid,
  MarketFilterSheet,
  SortSheet,
  useMarketCity,
} from "@/components/ml/market";
import { loadCatalogListings } from "@/lib/market-view";
import { readRecentSearches } from "@/lib/device-history";
import { useSearchRecorder } from "@/lib/search-events";
import { popularSearches, saveSearch } from "@/lib/searches.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/marketplace/search")({
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search["q"] === "string" && search["q"] ? { q: search["q"] } : {},
  // Database listings are searched.
  loader: () => loadCatalogListings(),
  head: () => ({
    meta: [
      { title: "Search the Market | MusicLinkd" },
      {
        name: "description",
        content: "Search instruments, audio gear, rentals, studios and music services near you.",
      },
      { property: "og:title", content: "Search the Market | MusicLinkd" },
      {
        property: "og:description",
        content: "Find gear, rentals, studios and services from verified sellers.",
      },
    ],
  }),
  component: MarketSearch,
});

const sorts = [
  "Recommended",
  "Newest",
  "Price: Low to High",
  "Price: High to Low",
  "Nearest",
  "Most Saved",
];

function MarketSearch() {
  const typed = Route.useSearch().q;
  const [q, setQ] = useState(typed ?? "");
  const [filters, setFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState(sorts[0]!);
  const catalog = Route.useLoaderData();

  const results = q.trim()
    ? catalog.filter((l) =>
        `${l.title} ${l.subtitle} ${l.subcategory} ${l.brand ?? ""} ${l.location}`
          .toLowerCase()
          .includes(q.toLowerCase().split(" ")[0] ?? ""),
      )
    : [];

  // Recent searches are this device's own (src/lib/device-history.ts); popular ones are the
  // searches most run in the Market city over the last 30 days (search_events). A search counts
  // once the typing stops, not on every keystroke.
  const [city] = useMarketCity();
  useSearchRecorder("market", q, results.length, city);
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    setRecent(readRecentSearches("market").map((s) => s.query));
  }, [q]);
  const fetchPopular = useServerFn(popularSearches);
  const popularQuery = useQuery({
    queryKey: ["searches", "popular", "market", city],
    queryFn: () => fetchPopular({ data: { scope: "market", city } }),
  });
  const popular = popularQuery.data ?? [];

  const { signedIn } = useAuth();
  const save = useServerFn(saveSearch);
  const keep = useMutation({
    mutationFn: () => save({ data: { scope: "market", query: q.trim() } }),
    onSuccess: () => toast.success("Search saved."),
    onError: () => toast.error("That didn't save. Try again."),
  });

  return (
    <Screen>
      <TopBar title="Search" back="/marketplace" />
      <div className="px-5 py-4">
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Search instruments, equipment, services..."
        />
      </div>

      {!q.trim() ? (
        <div className="px-5">
          {recent.length ? (
            <>
              <h2 className="pill mb-2 bg-subtle text-muted-foreground">Recent searches</h2>
              <div className="mb-6 flex flex-wrap gap-2">
                {recent.map((s) => (
                  <Chip key={s} onClick={() => setQ(s)}>
                    {s}
                  </Chip>
                ))}
              </div>
            </>
          ) : null}
          {popular.length ? (
            <>
              <h2 className="pill mb-2 bg-subtle text-muted-foreground">Popular in {city}</h2>
              <div className="flex flex-wrap gap-2">
                {popular.map((s) => (
                  <Chip key={s} onClick={() => setQ(s)}>
                    {s}
                  </Chip>
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-5">
            <p className="text-1 text-muted-foreground">
              {results.length} results · {city}
            </p>
            <div className="flex gap-2">
              <Chip onClick={() => setSortOpen(true)}>{sort}</Chip>
              <Chip active onClick={() => setFilters(true)}>
                Filters
              </Chip>
            </div>
          </div>
          <div className="space-y-3 px-5 py-4">
            {results.length ? (
              <ListingGrid items={results} />
            ) : (
              <EmptyState
                emoji="🔍"
                title="No matches yet"
                body="Try a broader term, widen the distance, or save this search to get alerts."
                action={
                  <Btn
                    loading={keep.isPending}
                    onClick={() =>
                      signedIn ? keep.mutate() : toast.error("Sign in to save a search.")
                    }
                  >
                    Save this search
                  </Btn>
                }
              />
            )}
          </div>
        </>
      )}

      <MarketFilterSheet
        open={filters}
        onClose={() => setFilters(false)}
        results={results.length}
      />
      <SortSheet
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        value={sort}
        onChange={setSort}
        options={sorts}
      />
    </Screen>
  );
}
