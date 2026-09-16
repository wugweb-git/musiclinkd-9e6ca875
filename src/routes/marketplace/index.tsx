import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, SlidersHorizontal, Plus } from "lucide-react";
import { Screen, SearchBar, Chip, BtnLink } from "@/components/ml/ui";
import { SearchField, SearchIconButton } from "@/components/ml/tab-header";
import {
  CategoryTile,
  ListingCard,
  ListingTile,
  CategorySheet,
  LocationSheet,
  MarketFilterSheet,
  SectionRow,
  useMarketCity,
} from "@/components/ml/market";
import { listings, marketCategories } from "@/data/market";
import { TextLink } from "@/components/ml/links";

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

const views = [
  { label: "For You", to: null },
  { label: "Nearby", to: "/marketplace/nearby" },
  { label: "Rentals", to: "/marketplace/rent" },
  { label: "Services", to: "/marketplace/search" },
  { label: "Studios", to: "/studio" },
  { label: "Saved", to: "/marketplace/saved" },
] as const;

function MarketHome() {
  const [filters, setFilters] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [city, setCity] = useMarketCity();
  const [view, setView] = useState<(typeof views)[number]["label"]>("For You");
  const navigate = useNavigate();
  const recommended = listings.filter((l) => l.reason);
  const nearby = listings.slice(0, 4);
  const trending = [...listings].sort((a, b) => b.saves - a.saves).slice(0, 5);

  return (
    <Screen>
      <header className="sticky top-0 z-30 bg-background/90 px-5 pb-3 pt-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-3 leading-tight">Market</h1>
            <button
              type="button"
              onClick={() => setLocationOpen(true)}
              className="mt-0.5 inline-flex items-center gap-1 text-1 font-semibold text-muted-foreground"
            >
              <MapPin size={12} /> {city} · change
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/marketplace/sell"
              className="inline-flex h-10 items-center gap-1 rounded-full bg-ink px-4 text-1 font-semibold text-background"
            >
              <Plus size={16} /> Sell
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
        {views.map((v) => (
          <Chip
            key={v.label}
            active={view === v.label}
            onClick={() => {
              setView(v.label);
              if (v.to) void navigate({ to: v.to });
            }}
          >
            {v.label}
          </Chip>
        ))}
      </div>

      <SectionRow
        title="Browse categories"
        action={
          <button
            type="button"
            onClick={() => setCategoriesOpen(true)}
            className="link-action text-1 font-semibold text-foreground"
          >
            See All
          </button>
        }
      >
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
        <div className="rounded-lg bg-subtle p-5">
          <h2 className="text-2">Have gear sitting idle?</h2>
          <p className="mt-1 text-1 text-muted-foreground">
            List it to 72,000+ verified music professionals. Free while Market is in Beta.
          </p>
          <BtnLink to="/marketplace/sell" className="mt-4 w-full">
            Create a Listing
          </BtnLink>
          <TextLink to="/marketplace/mine" className="mt-2 block text-center text-1">
            My Marketplace
          </TextLink>
        </div>
      </div>

      <MarketFilterSheet open={filters} onClose={() => setFilters(false)} />
      <LocationSheet
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        city={city}
        onChoose={setCity}
      />
      <CategorySheet
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        categories={marketCategories}
      />
    </Screen>
  );
}
