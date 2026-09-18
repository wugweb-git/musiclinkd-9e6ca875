import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Screen, TopBar, SearchBar, Chip, BtnLink } from "@/components/ml/ui";
import { EmptyState, EquipmentGrid, SortSheet, useMarketCity } from "@/components/ml/market";
import { TextButton } from "@/components/ml/links";
import { RentalFilterSheet, RentalSkeleton, rentalSortOptions } from "@/components/ml/rental";
import { rentalCategories } from "@/data/rentals";
import { loadCatalogRentals } from "@/lib/market-view";
import { readRecentSearches } from "@/lib/device-history";
import { useSearchRecorder } from "@/lib/search-events";
import { popularSearches, saveSearch } from "@/lib/searches.functions";
import { inCity } from "@/lib/market-view";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";
import { MarketCategoryIcon } from "@/components/ml/market";

export const Route = createFileRoute("/marketplace/rent/search")({
  // `q` opens the screen on a search, as a saved search does.
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search["q"] === "string" && search["q"] ? { q: search["q"] } : {},
  // Live rentals, searched by name, brand, model, sub-category and location.
  loader: () => loadCatalogRentals(),
  head: () => ({
    meta: [
      { title: "Search Rental Equipment | MusicLinkd" },
      {
        name: "description",
        content:
          "Search music equipment for rent by name, brand, model, category, provider or city.",
      },
      { property: "og:title", content: "Search Rental Equipment | MusicLinkd" },
      {
        property: "og:description",
        content: "Find available gear near you and check dates instantly.",
      },
    ],
  }),
  component: RentSearch,
});

function RentSearch() {
  const [q, setQ] = useState(Route.useSearch().q ?? "");
  const [filters, setFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState(rentalSortOptions[0]!);
  const [loading] = useState(false);
  const catalog = Route.useLoaderData();

  const results = q
    ? catalog.filter((e) =>
        `${e.name} ${e.brand ?? ""} ${e.model ?? ""} ${e.subcategory ?? ""} ${e.location ?? ""}`
          .toLowerCase()
          .includes(q.toLowerCase()),
      )
    : [];

  // Recent searches are this device's own; popular ones are the rental searches run most over the
  // last 30 days (search_events). A search counts once the typing stops.
  const [city] = useMarketCity();
  useSearchRecorder("rent", q, results.length, city);
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    setRecent(readRecentSearches("rent").map((s) => s.query));
  }, [q]);
  const fetchPopular = useServerFn(popularSearches);
  const popularQuery = useQuery({
    queryKey: ["searches", "popular", "rent"],
    queryFn: () => fetchPopular({ data: { scope: "rent" } }),
  });
  const popular = popularQuery.data?.items ?? [];
  const nearby = inCity(catalog, city).slice(0, 3);

  const { signedIn } = useAuth();
  const save = useServerFn(saveSearch);
  const keep = useMutation({
    mutationFn: () => save({ data: { scope: "rent", query: q.trim() } }),
    onSuccess: () => toast.success("Search saved."),
    onError: () => toast.error("That didn't save. Try again."),
  });

  return (
    <Screen>
      <TopBar title="Search rentals" subtitle="Mumbai, Maharashtra" back="/marketplace/rent" />
      <div className="px-5 py-4">
        <SearchBar value={q} onChange={setQ} placeholder="Shure SM7B, drum kit, PA system..." />
      </div>

      {!q ? (
        <div className="space-y-6 px-5 pb-6">
          {/* Each list shows once it has something in it — no placeholder lines. */}
          {recent.length ? (
            <section>
              <h2 className="pill mb-2 bg-subtle text-muted-foreground">Recent searches</h2>
              <div className="flex flex-wrap gap-2">
                {recent.map((s) => (
                  <Chip key={s} onClick={() => setQ(s)}>
                    {s}
                  </Chip>
                ))}
              </div>
            </section>
          ) : null}
          {popular.length ? (
            <section>
              <h2 className="pill mb-2 bg-subtle text-muted-foreground">Popular equipment</h2>
              <div className="flex flex-wrap gap-2">
                {popular.map((s) => (
                  <Chip key={s} onClick={() => setQ(s)}>
                    {s}
                  </Chip>
                ))}
              </div>
            </section>
          ) : null}
          <section>
            <h2 className="pill mb-2 bg-subtle text-muted-foreground">Suggested categories</h2>
            <div className="flex flex-wrap gap-2">
              {rentalCategories.map((c) => (
                <Link key={c.slug} to="/marketplace/rent/c/$slug" params={{ slug: c.slug }}>
                  <Chip media={<MarketCategoryIcon slug={c.slug} size={iconSize.sm} />}>
                    {c.label}
                  </Chip>
                </Link>
              ))}
            </div>
          </section>
          {nearby.length ? (
            <section>
              <h2 className="pill mb-3 bg-subtle text-muted-foreground">Available nearby</h2>
              <EquipmentGrid items={nearby} />
            </section>
          ) : null}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 px-5 pb-3">
            <p className="min-w-0 truncate text-1 font-semibold text-muted-foreground">
              {results.length} available · {sort}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <TextButton
                disabled={keep.isPending}
                onClick={() =>
                  signedIn ? keep.mutate() : toast.error("Sign in to save a search.")
                }
              >
                Save search
              </TextButton>
              <button
                onClick={() => setSortOpen(true)}
                className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-card px-3 text-1 font-semibold"
              >
                <ArrowUpDown size={iconSize.xs} /> Sort
              </button>
              <button
                onClick={() => setFilters(true)}
                className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-card px-3 text-1 font-semibold"
              >
                <SlidersHorizontal size={iconSize.xs} /> Filter
              </button>
            </div>
          </div>
          <div className="space-y-3 px-5 pb-6">
            {loading ? (
              <RentalSkeleton />
            ) : results.length ? (
              <EquipmentGrid items={results} />
            ) : (
              <EmptyState
                emoji="🔍"
                title="No rentals matched"
                body="Try a broader search, widen the distance, or set an alert and we'll tell you when it's listed."
                action={<BtnLink to="/marketplace/rent">Browse All Equipment</BtnLink>}
              />
            )}
          </div>
        </>
      )}

      <RentalFilterSheet
        open={filters}
        onClose={() => setFilters(false)}
        results={results.length}
      />
      <SortSheet
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        value={sort}
        onChange={setSort}
        options={rentalSortOptions}
      />
    </Screen>
  );
}
