import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, SlidersHorizontal, Plus } from "lucide-react";
import { Screen, SearchBar, Chip, BtnLink } from "@/components/ml/ui";
import { SearchField, SearchIconButton } from "@/components/ml/tab-header";
import {
  CategoryTile,
  ListingCard,
  ListingTile,
  MarketFilterSheet,
  SectionRow,
} from "@/components/ml/market";
import { listings, marketCategories } from "@/data/market";

export const Route = createFileRoute("/marketplace/")({
  head: () => ({
    meta: [
      { title: "Market — Gear, Rentals & Studios | MusicLinkd" },
      {
        name: "description",
        content:
          "Buy, sell and rent instruments, audio gear, studio time and music services from verified professionals across India.",
      },
      { property: "og:title", content: "MusicLinkd Market" },
      {
        property: "og:description",
        content:
          "India's music industry marketplace — instruments, gear, rentals, services and studios.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MarketHome,
});

function MarketHome() {
  const [filters, setFilters] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const recommended = listings.filter((l) => l.reason);
  const nearby = listings.slice(0, 4);
  const trending = [...listings].sort((a, b) => b.saves - a.saves).slice(0, 5);

  return (
    <Screen>
      <header className="sticky top-0 z-30 bg-background/90 px-5 pb-3 pt-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-[24px] leading-tight">Market</h1>
            <button className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <MapPin size={12} /> Mumbai, Maharashtra · change
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/marketplace/sell"
              className="inline-flex h-10 items-center gap-1 rounded-full bg-ink px-4 text-xs font-semibold text-background"
            >
              <Plus size={14} /> Sell
            </Link>
            <button
              aria-label="Filters"
              onClick={() => setFilters(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
            >
              <SlidersHorizontal size={16} />
            </button>
            <SearchIconButton open={searchOpen} onToggle={() => setSearchOpen((v) => !v)} />
          </div>
        </div>
        {searchOpen ? (
          <SearchField
            to="/marketplace/search"
            placeholder="Search instruments, equipment, services"
            onClose={() => setSearchOpen(false)}
          />
        ) : null}
      </header>

      <div className="rail flex gap-2 overflow-x-auto px-5 py-3 no-scrollbar">
        {["For You", "Nearby", "Rentals", "Services", "Studios", "Saved"].map((c, i) => (
          <Chip key={c} active={i === 0}>
            {c}
          </Chip>
        ))}
      </div>

      <SectionRow title="Browse categories">
        <div className="rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
          {marketCategories.map((c) => (
            <CategoryTile key={c.slug} {...c} />
          ))}
        </div>
      </SectionRow>

      <SectionRow
        title="Recommended for you"
        hint="Based on your instruments and recent projects"
        to="/marketplace/search"
      >
        <div className="space-y-3 px-5">
          {recommended.map((l) => (
            <ListingCard key={l.id} l={l} />
          ))}
        </div>
      </SectionRow>

      <SectionRow title="Near you" hint="Within 10 km of Dadar" to="/marketplace/nearby">
        <div className="rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
          {nearby.map((l) => (
            <ListingTile key={l.id} l={l} />
          ))}
        </div>
      </SectionRow>

      <SectionRow title="Trending in Mumbai" hint="Most saved this week">
        <div className="rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
          {trending.map((l) => (
            <ListingTile key={l.id} l={l} />
          ))}
        </div>
      </SectionRow>

      <SectionRow title="Recently viewed" to="/recently-viewed">
        <div className="rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
          {listings.slice(2, 6).map((l) => (
            <ListingTile key={l.id} l={l} />
          ))}
        </div>
      </SectionRow>

      <div className="px-5 pb-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-[16px]">Have gear sitting idle?</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            List it to 72,000+ verified music professionals. Free while Market is in Beta.
          </p>
          <BtnLink to="/marketplace/sell" className="mt-4 w-full">
            Create a listing
          </BtnLink>
          <Link
            to="/marketplace/mine"
            className="mt-2 block text-center text-xs font-semibold text-foreground"
          >
            My Marketplace
          </Link>
        </div>
      </div>

      <MarketFilterSheet open={filters} onClose={() => setFilters(false)} />
    </Screen>
  );
}
