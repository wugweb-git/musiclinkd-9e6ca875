import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, SlidersHorizontal, Plus } from "lucide-react";
import { Screen, SearchBar, Chip } from "@/components/ml/ui";
import { SearchField, SearchIconButton } from "@/components/ml/tab-header";
import {
  CategoryTile,
  ListingTile,
  CategorySheet,
  LocationSheet,
  MarketFilterSheet,
  SectionRow,
  useMarketCity,
} from "@/components/ml/market";
import { marketCategories, type Listing } from "@/data/market";
import { GearCta } from "@/components/ml/gear-cta";
import { iconSize } from "@/lib/tokens";
import { loadCatalogListings } from "@/lib/market-view";
import { readListingVisits } from "@/lib/device-history";

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
  loader: () => loadCatalogListings(),
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
  const catalog = Route.useLoaderData();
  // The catalogue comes newest first; services are Discover's and never reach it.
  const forSale = catalog.filter((l) => l.type === "product").slice(0, 8);
  const forRent = catalog.filter((l) => l.type === "rental").slice(0, 8);
  // Listings opened on this device, most recent first, read live from the catalog. Goods only:
  // services never sit in this rail.
  const [viewed, setViewed] = useState<Listing[]>([]);
  useEffect(() => {
    const byId = new Map(catalog.map((l) => [l.id, l]));
    setViewed(
      readListingVisits()
        .map((v) => byId.get(v.id))
        .filter((l): l is Listing => !!l && (l.type === "product" || l.type === "rental")),
    );
  }, [catalog]);

  return (
    <Screen>
      <header className="sticky top-0 z-bar bg-background/90 px-5 pb-3 pt-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-3 leading-tight">Market</h1>
            <button
              type="button"
              onClick={() => setLocationOpen(true)}
              className="mt-0.5 inline-flex items-center gap-1 text-1 font-semibold text-muted-foreground"
            >
              <MapPin size={iconSize.xs} /> {city} · change
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/marketplace/sell"
              className="inline-flex h-10 items-center gap-1 rounded-full bg-ink px-4 text-1 font-semibold text-background"
            >
              <Plus size={iconSize.sm} /> Sell
            </Link>
            <button
              aria-label="Filters"
              onClick={() => setFilters(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
            >
              <SlidersHorizontal size={iconSize.sm} />
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
            <CategoryTile
              key={c.slug}
              slug={c.slug}
              label={c.label}
              onOpen={() => setCategoriesOpen(true)}
            />
          ))}
        </div>
      </SectionRow>

      {/* What's listed, newest first, on the product card. Each rail shows once it has something. */}
      {forSale.length ? (
        <SectionRow title="For sale" to="/marketplace/search">
          <div className="rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
            {forSale.map((l) => (
              <ListingTile key={l.id} l={l} />
            ))}
          </div>
        </SectionRow>
      ) : null}

      {forRent.length ? (
        <SectionRow title="For rent" to="/marketplace/rent">
          <div className="rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
            {forRent.map((l) => (
              <ListingTile key={l.id} l={l} />
            ))}
          </div>
        </SectionRow>
      ) : null}

      {viewed.length ? (
        <SectionRow title="Recently viewed" to="/recently-viewed">
          <div className="rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
            {viewed.map((l) => (
              <ListingTile key={l.id} l={l} />
            ))}
          </div>
        </SectionRow>
      ) : null}

      <div className="px-5 pb-6 pt-2">
        <GearCta />
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
