import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Screen, TopBar, SearchBar, Chip, BtnLink } from "@/components/ml/ui";
import { EmptyState, SortSheet } from "@/components/ml/market";
import {
  EquipmentRow,
  RentalFilterSheet,
  RentalSkeleton,
  rentalSortOptions,
} from "@/components/ml/rental";
import {
  equipment,
  popularRentalSearches,
  recentRentalSearches,
  rentalCategories,
} from "@/data/rentals";

export const Route = createFileRoute("/marketplace/rent/search")({
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
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState(rentalSortOptions[0]!);
  const [loading] = useState(false);

  const results = q
    ? equipment.filter((e) =>
        `${e.name} ${e.brand} ${e.model} ${e.subcategory} ${e.location}`
          .toLowerCase()
          .includes(q.toLowerCase()),
      )
    : [];

  return (
    <Screen>
      <TopBar title="Search rentals" subtitle="Mumbai, Maharashtra" back="/marketplace/rent" />
      <div className="px-5 py-4">
        <SearchBar value={q} onChange={setQ} placeholder="Shure SM7B, drum kit, PA system..." />
      </div>

      {!q ? (
        <div className="space-y-6 px-5 pb-6">
          <section>
            <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
              Recent searches
            </h2>
            <div className="flex flex-wrap gap-2">
              {recentRentalSearches.map((s) => (
                <Chip key={s} onClick={() => setQ(s)}>
                  {s}
                </Chip>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
              Popular equipment
            </h2>
            <div className="flex flex-wrap gap-2">
              {popularRentalSearches.map((s) => (
                <Chip key={s} onClick={() => setQ(s)}>
                  {s}
                </Chip>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
              Suggested categories
            </h2>
            <div className="flex flex-wrap gap-2">
              {rentalCategories.map((c) => (
                <Link key={c.slug} to="/marketplace/rent/c/$slug" params={{ slug: c.slug }}>
                  <Chip>
                    {c.emoji} {c.label}
                  </Chip>
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
              Available nearby
            </h2>
            <div className="space-y-3">
              {equipment.slice(0, 3).map((e) => (
                <EquipmentRow key={e.id} e={e} />
              ))}
            </div>
          </section>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 px-5 pb-3">
            <p className="text-xs font-semibold text-muted-foreground">
              {results.length} available · {sort}
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
            {loading ? (
              <RentalSkeleton />
            ) : results.length ? (
              results.map((e) => <EquipmentRow key={e.id} e={e} />)
            ) : (
              <EmptyState
                emoji="🔍"
                title="No rentals matched"
                body="Try a broader search, widen the distance, or set an alert and we'll tell you when it's listed."
                action={<BtnLink to="/marketplace/rent">Browse all equipment</BtnLink>}
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
