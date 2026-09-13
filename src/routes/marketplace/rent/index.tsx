import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, SlidersHorizontal, Plus } from "lucide-react";
import { Screen, SearchBar, Chip, Btn } from "@/components/ml/ui";
import { SectionRow } from "@/components/ml/market";
import {
  EquipmentCard,
  EquipmentTile,
  RentalFilterSheet,
  RentalSkeleton,
} from "@/components/ml/rental";
import { equipment, rentalCategories } from "@/data/rentals";

export const Route = createFileRoute("/marketplace/rent/")({
  head: () => ({
    meta: [
      { title: "Rent Equipment — Instruments, Audio & Live Gear | MusicLinkd" },
      {
        name: "description",
        content:
          "Rent professional music equipment in India — microphones, guitars, drums, DJ rigs, PA systems and studio gear from verified providers.",
      },
      { property: "og:title", content: "Rent Equipment | MusicLinkd Market" },
      {
        property: "og:description",
        content: "Professional music equipment when you need it, from verified Indian providers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RentHome,
});

function RentHome() {
  const [filters, setFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

  const recommended = equipment.filter((e) => e.reason);
  const nearby = [...equipment]
    .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
    .slice(0, 5);
  const popular = [...equipment].sort((a, b) => b.rentals - a.rentals).slice(0, 5);

  return (
    <Screen>
      <header className="sticky top-0 z-30 bg-background/90 px-5 pb-3 pt-4 backdrop-blur">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[24px] leading-tight">Rent Equipment</h1>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Professional music equipment when you need it.
            </p>
            <button className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
              <MapPin size={12} /> Mumbai, Maharashtra · change
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/marketplace/rent/list"
              className="inline-flex h-10 items-center gap-1 rounded-full bg-ink px-3.5 text-xs font-semibold text-background"
            >
              <Plus size={14} /> Rent out
            </Link>
            <button
              aria-label="Filters"
              onClick={() => setFilters(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>
        <Link to="/marketplace/rent/search" className="block">
          <div className="pointer-events-none">
            <SearchBar placeholder="Search microphones, guitars, mixers..." />
          </div>
        </Link>
      </header>

      <div className="rail flex gap-2 overflow-x-auto px-5 py-3 no-scrollbar">
        {["For You", "Available today", "Near me", "Delivery", "Under ₹1k/day"].map((c, i) => (
          <Chip key={c} active={i === 0}>
            {c}
          </Chip>
        ))}
      </div>

      <SectionRow title="Browse categories">
        <div className="rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
          {rentalCategories.map((c) => (
            <Link
              key={c.slug}
              to="/marketplace/rent/c/$slug"
              params={{ slug: c.slug }}
              className="flex w-[108px] shrink-0 flex-col gap-2 rounded-lg border border-border bg-card p-3"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-md text-lg"
                style={{ background: "var(--pink-container)" }}
              >
                {c.emoji}
              </span>
              <span className="text-[12px] font-semibold leading-tight">{c.label}</span>
              <span className="text-[10px] text-muted-foreground">{c.count}</span>
            </Link>
          ))}
        </div>
      </SectionRow>

      <SectionRow
        title="Recommended for you"
        hint="From your instruments, saves and location"
        to="/marketplace/rent/search"
      >
        <div className="space-y-3 px-5">
          {loading
            ? [0, 1].map((i) => <RentalSkeleton key={i} />)
            : recommended.map((e) => <EquipmentCard key={e.id} e={e} />)}
        </div>
      </SectionRow>

      <SectionRow title="Near you" hint="Within 10 km of Dadar" to="/marketplace/rent/nearby">
        <div className="rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
          {nearby.map((e) => (
            <EquipmentTile key={e.id} e={e} />
          ))}
        </div>
      </SectionRow>

      <SectionRow title="Popular rentals" hint="Most rented in Mumbai this month">
        <div className="rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
          {popular.map((e) => (
            <EquipmentTile key={e.id} e={e} />
          ))}
        </div>
      </SectionRow>

      <SectionRow title="Recently viewed" to="/marketplace/rent/saved">
        <div className="rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
          {equipment.slice(2, 6).map((e) => (
            <EquipmentTile key={e.id} e={e} />
          ))}
        </div>
      </SectionRow>

      <SectionRow title="Saved rentals" to="/marketplace/rent/saved">
        <div className="rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
          {equipment.slice(0, 3).map((e) => (
            <EquipmentTile key={e.id} e={e} />
          ))}
        </div>
      </SectionRow>

      <div className="space-y-3 px-5 pb-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-[16px]">Equipment sitting idle?</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Rent it out to 72,000+ verified music professionals. You set the dates, deposit and
            terms.
          </p>
          <Link to="/marketplace/rent/list" className="mt-4 block">
            <Btn className="w-full">Rent out equipment</Btn>
          </Link>
          <div className="mt-2 flex justify-center gap-4 text-xs font-semibold text-primary">
            <Link to="/marketplace/rent/mine">My rentals</Link>
            <Link to="/marketplace/rent/listings">My listings</Link>
          </div>
        </div>
      </div>

      <RentalFilterSheet
        open={filters}
        onClose={() => setFilters(false)}
        results={equipment.length}
      />
    </Screen>
  );
}
