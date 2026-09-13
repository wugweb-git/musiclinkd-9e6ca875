import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Screen, TopBar, Chip, BtnLink } from "@/components/ml/ui";
import { EmptyState, SortSheet } from "@/components/ml/market";
import { EquipmentRow, RentalFilterSheet, rentalSortOptions } from "@/components/ml/rental";
import { equipmentByCategory, rentalCategories } from "@/data/rentals";

export const Route = createFileRoute("/marketplace/rent/c/$slug")({
  head: ({ params }) => {
    const c = rentalCategories.find((x) => x.slug === params.slug);
    const title = `${c?.label ?? "Equipment"} for Rent | MusicLinkd`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: `Rent ${c?.label.toLowerCase() ?? "music"} equipment from verified providers near you, with clear pricing, deposits and availability.`,
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: "Browse rental equipment by category on MusicLinkd.",
        },
      ],
    };
  },
  component: RentCategory,
});

function RentCategory() {
  const { slug } = Route.useParams();
  const cat = rentalCategories.find((c) => c.slug === slug);
  const items = equipmentByCategory(slug);
  const [sub, setSub] = useState("All");
  const [filters, setFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState(rentalSortOptions[0]!);

  const shown = sub === "All" ? items : items.filter((e) => e.subcategory === sub);

  return (
    <Screen>
      <TopBar
        title={cat?.label ?? "Equipment"}
        subtitle={`${items.length} available · Mumbai`}
        back="/marketplace/rent"
      />
      <div className="rail flex gap-2 overflow-x-auto px-5 py-3 no-scrollbar">
        {["All", ...(cat?.subs ?? [])].map((s) => (
          <Chip key={s} active={sub === s} onClick={() => setSub(s)}>
            {s}
          </Chip>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 px-5 pb-3">
        <p className="text-xs font-semibold text-muted-foreground">
          {shown.length} results · {sort}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setSortOpen(true)}
            className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-card px-3 text-[11px] font-semibold"
          >
            <ArrowUpDown size={13} /> Sort
          </button>
          <button
            onClick={() => setFilters(true)}
            className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-card px-3 text-[11px] font-semibold"
          >
            <SlidersHorizontal size={13} /> Filter
          </button>
        </div>
      </div>
      <div className="space-y-3 px-5 pb-6">
        {shown.length ? (
          shown.map((e) => <EquipmentRow key={e.id} e={e} />)
        ) : (
          <EmptyState
            emoji="📦"
            title="Nothing listed here yet"
            body="No providers have listed this sub-category in Mumbai. Try a wider area or set an alert."
            action={<BtnLink to="/marketplace/rent/search">Search all rentals</BtnLink>}
          />
        )}
      </div>
      <RentalFilterSheet open={filters} onClose={() => setFilters(false)} results={shown.length} />
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
