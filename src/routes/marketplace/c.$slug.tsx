import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Chip } from "@/components/ml/ui";
import { EmptyState, ListingGrid, MarketFilterSheet, SortSheet } from "@/components/ml/market";
import { loadGearTaxonomy } from "@/lib/listing-category";
import { loadCatalogListings } from "@/lib/market-view";
import { applyMarketFilter, emptyMarketFilter, type MarketFilter } from "@/lib/market-filter";

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

const sorts = ["Recommended", "Newest", "Price: Low to High", "Price: High to Low", "Nearest"];

function CategoryScreen() {
  const { slug } = Route.useParams();
  // A taxonomy category: an instrument family (its instruments are the chips) or an equipment
  // category (no chips; it is one product type).
  const { catalog, gear } = Route.useLoaderData();
  const cat = gear.categories.find((m) => m.slug === slug);
  const subs = cat?.kind === "instrument" ? gear.types.filter((t) => t.category === slug) : [];
  const [sub, setSub] = useState("All");
  const [filters, setFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState(sorts[0]!);

  const inCategory = catalog.filter((l) => l.gear === slug);
  const [filter, setFilter] = useState<MarketFilter>(emptyMarketFilter);
  const items = applyMarketFilter(
    inCategory.filter((l) => sub === "All" || l.itemCategory === sub),
    filter,
  );

  return (
    <Screen>
      <TopBar
        title={cat?.label ?? "Market"}
        subtitle={`${inCategory.length} listings in India`}
        back="/marketplace"
      />
      <div className="rail flex gap-2 overflow-x-auto px-5 py-4 no-scrollbar">
        {[{ slug: "All", label: "All" }, ...subs].map((s) => (
          <Chip key={s.slug} active={sub === s.slug} onClick={() => setSub(s.slug)}>
            {s.label}
          </Chip>
        ))}
      </div>
      <div className="flex items-center justify-between px-5">
        <p className="text-1 text-muted-foreground">{items.length} results · Mumbai</p>
        <div className="flex gap-2">
          <Chip onClick={() => setSortOpen(true)}>{sort}</Chip>
          <Chip active onClick={() => setFilters(true)}>
            Filters
          </Chip>
        </div>
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
