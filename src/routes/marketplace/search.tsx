import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, SearchBar, TopBar, Chip, Btn } from "@/components/ml/ui";
import { EmptyState, ListingRow, MarketFilterSheet, SortSheet } from "@/components/ml/market";
import { listings, popularSearches, recentSearches } from "@/data/market";
import { loadCatalogListings } from "@/lib/market-view";

export const Route = createFileRoute("/marketplace/search")({
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search["q"] === "string" && search["q"] ? { q: search["q"] } : {},
  // Database listings are searched after the static ones.
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
  const [q, setQ] = useState(Route.useSearch().q ?? "condenser microphone");
  const [filters, setFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState(sorts[0]!);
  const catalog = Route.useLoaderData();

  const results = q.trim()
    ? [...listings, ...catalog].filter((l) =>
        `${l.title} ${l.subtitle} ${l.subcategory} ${l.brand ?? ""} ${l.location}`
          .toLowerCase()
          .includes(q.toLowerCase().split(" ")[0] ?? ""),
      )
    : [];

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
          <h2 className="pill mb-2 bg-subtle text-muted-foreground">Recent searches</h2>
          <div className="mb-6 flex flex-wrap gap-2">
            {recentSearches.map((s) => (
              <Chip key={s} onClick={() => setQ(s)}>
                {s}
              </Chip>
            ))}
          </div>
          <h2 className="pill mb-2 bg-subtle text-muted-foreground">Popular in Mumbai</h2>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((s) => (
              <Chip key={s} onClick={() => setQ(s)}>
                {s}
              </Chip>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-5">
            <p className="text-1 text-muted-foreground">{results.length} results · Mumbai</p>
            <div className="flex gap-2">
              <Chip onClick={() => setSortOpen(true)}>{sort}</Chip>
              <Chip active onClick={() => setFilters(true)}>
                Filters
              </Chip>
            </div>
          </div>
          <div className="space-y-3 px-5 py-4">
            {results.length ? (
              results.map((l) => <ListingRow key={l.id} l={l} />)
            ) : (
              <EmptyState
                emoji="🔍"
                title="No matches yet"
                body="Try a broader term, widen the distance, or save this search to get alerts."
                action={<Btn onClick={() => setQ("")}>Save this search</Btn>}
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
