import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Chip } from "@/components/ml/ui";
import { EmptyState, ListingCard, MarketFilterSheet, SortSheet } from "@/components/ml/market";
import { listings, marketCategories, subcategories } from "@/data/market";

export const Route = createFileRoute("/marketplace/c/$slug")({
  head: ({ params }) => {
    const c = marketCategories.find((m) => m.slug === params.slug);
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
  const cat = marketCategories.find((m) => m.slug === slug);
  const subs = subcategories[slug] ?? [];
  const [sub, setSub] = useState("All");
  const [filters, setFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState(sorts[0]!);

  const items = listings.filter(
    (l) => l.category === slug && (sub === "All" || l.subcategory === sub),
  );

  return (
    <Screen>
      <TopBar title={cat?.label ?? "Market"} subtitle={`${cat?.count ?? 0} listings in India`} back="/marketplace" />
      <div className="flex gap-2 overflow-x-auto px-5 py-4 no-scrollbar">
        {["All", ...subs].map((s) => (
          <Chip key={s} active={sub === s} onClick={() => setSub(s)}>{s}</Chip>
        ))}
      </div>
      <div className="flex items-center justify-between px-5">
        <p className="text-xs text-muted-foreground">{items.length} results · Mumbai</p>
        <div className="flex gap-2">
          <Chip onClick={() => setSortOpen(true)}>{sort}</Chip>
          <Chip active onClick={() => setFilters(true)}>Filters</Chip>
        </div>
      </div>
      <div className="space-y-3 px-5 py-4">
        {items.length ? (
          items.map((l) => <ListingCard key={l.id} l={l} />)
        ) : (
          <EmptyState
            emoji="🎚"
            title="Nothing here yet"
            body="No live listings in this subcategory near Mumbai. Widen the distance or save a search."
          />
        )}
      </div>
      <MarketFilterSheet open={filters} onClose={() => setFilters(false)} results={items.length} />
      <SortSheet open={sortOpen} onClose={() => setSortOpen(false)} value={sort} onChange={setSort} options={sorts} />
    </Screen>
  );
}
