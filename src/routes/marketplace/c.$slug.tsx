import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpDown, X } from "lucide-react";
import { Screen, TopBar, Chip, IconBtn } from "@/components/ml/ui";
import {
  ActiveFilters,
  EmptyState,
  FilterButton,
  ListingGrid,
  MarketFilterSheet,
  SortSheet,
} from "@/components/ml/market";
import type { Listing } from "@/data/market";
import { iconSize } from "@/lib/tokens";
import { loadGearTaxonomy } from "@/lib/listing-category";
import { loadCatalogListings } from "@/lib/market-view";
import {
  applyMarketFilter,
  emptyMarketFilter,
  filterCount,
  type MarketFilter,
} from "@/lib/market-filter";

export const Route = createFileRoute("/marketplace/c/$slug")({
  // Database listings in their mapped category.
  loader: async () => {
    const [catalog, gear] = await Promise.all([loadCatalogListings(), loadGearTaxonomy()]);
    return { catalog, gear };
  },
  head: ({ params, loaderData }) => {
    const c = loaderData?.gear.categories.find((m) => m.slug === params.slug);
    const title = `${c?.label ?? "Category"} | MusicLinkd Market`;
    const desc = `Browse ${c?.label ?? "listings"} from verified music professionals across India.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: CategoryScreen,
});

const sorts = ["Recommended", "Newest", "Price: Low to High", "Price: High to Low"];

const rupees = (l: Listing) => Number((l.price.amount ?? "").replace(/[^0-9]/g, "")) || 0;

/** The catalog comes newest first, which is also Recommended's order here. */
function sorted(items: Listing[], sort: string) {
  if (sort === "Price: Low to High") return [...items].sort((a, b) => rupees(a) - rupees(b));
  if (sort === "Price: High to Low") return [...items].sort((a, b) => rupees(b) - rupees(a));
  return items;
}

function CategoryScreen() {
  const { slug } = Route.useParams();
  const { catalog, gear } = Route.useLoaderData();
  const cat = gear.categories.find((m) => m.slug === slug);
  const [filters, setFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState(sorts[0]!);
  const [filter, setFilter] = useState<MarketFilter>(emptyMarketFilter);

  const inCategory = catalog.filter((l) => l.gear === slug);
  const items = sorted(applyMarketFilter(inCategory, filter), sort);

  return (
    <Screen>
      <TopBar
        title={cat?.label ?? "Market"}
        back="/marketplace"
        right={
          <div className="flex items-center gap-2">
            <IconBtn label={`Sort: ${sort}`} onClick={() => setSortOpen(true)}>
              <ArrowUpDown size={iconSize.sm} aria-hidden />
            </IconBtn>
            <FilterButton count={filterCount(filter)} onClick={() => setFilters(true)} />
          </div>
        }
      />
      {/* Results, the filters in force and the sort when it isn't the default. */}
      <div className="pt-4">
        <ActiveFilters
          value={filter}
          onChange={setFilter}
          before={
            <span className="shrink-0 pr-1 text-1 font-semibold text-foreground">
              {items.length} result{items.length === 1 ? "" : "s"}
            </span>
          }
          after={
            sort !== sorts[0] ? (
              <Chip active onClick={() => setSort(sorts[0]!)}>
                {sort}
                <X size={iconSize.xs} aria-label="Remove" />
              </Chip>
            ) : null
          }
        />
      </div>
      <div className="space-y-3 px-5 py-4">
        {items.length ? (
          <ListingGrid items={items} />
        ) : (
          <EmptyState
            emoji="🎚"
            title="Nothing here yet"
            body="No live listings in this subcategory near Mumbai. Widen the distance or save a search."
          />
        )}
      </div>
      <MarketFilterSheet
        open={filters}
        onClose={() => setFilters(false)}
        items={inCategory}
        value={filter}
        onApply={setFilter}
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
