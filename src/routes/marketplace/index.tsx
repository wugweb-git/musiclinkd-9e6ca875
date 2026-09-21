import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { rankBy, useRecommendations } from "@/hooks/use-recommendations";
import { useEffect, useState } from "react";
import { MapPin, SlidersHorizontal, Plus } from "lucide-react";
import { Screen, IconBtn } from "@/components/ml/ui";
import { Segmented } from "@/components/ml/kit";
import { SearchField, SearchIconButton } from "@/components/ml/tab-header";
import {
  CategoryTile,
  EmptyState,
  ListingGrid,
  ListingTile,
  CategorySheet,
  LocationSheet,
  MarketFilterSheet,
  SectionRow,
  useMarketCity,
} from "@/components/ml/market";
import { type Listing } from "@/data/market";
import { rentalCategories } from "@/data/rentals";
import { GearCta } from "@/components/ml/gear-cta";
import { iconSize } from "@/lib/tokens";
import { loadCatalogListings } from "@/lib/market-view";
import { readListingVisits } from "@/lib/device-history";
import { applyMarketFilter, emptyMarketFilter, type MarketFilter } from "@/lib/market-filter";

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

// Explore, Buy and Rent change what this screen lists; Nearby and Saved are their own screens.
const views = [
  { label: "Explore", to: null },
  { label: "Buy", to: null },
  { label: "Rent", to: null },
  { label: "Nearby", to: "/marketplace/nearby" },
  { label: "Saved", to: "/marketplace/saved" },
] as const;

function MarketHome() {
  const [filters, setFilters] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [city, setCity] = useMarketCity();
  const [view, setView] = useState<(typeof views)[number]["label"]>("Explore");
  const navigate = useNavigate();
  const catalog = Route.useLoaderData();
  // The catalogue comes newest first; services are Discover's and never reach it. Signed in, For
  // You puts the listings matched to the viewer's instruments, saves, rentals and city first.
  const recs = useRecommendations();
  const ranked = rankBy(catalog, recs?.listings, (l) => l.dbId ?? l.id);
  const [filter, setFilter] = useState<MarketFilter>(emptyMarketFilter);
  const shown = applyMarketFilter(ranked, filter);
  const allForSale = shown.filter((l) => l.type === "product");
  const allForRent = shown.filter((l) => l.type === "rental");
  const forSale = allForSale.slice(0, 8);
  const forRent = allForRent.slice(0, 8);
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
      <header className="sticky top-0 z-bar mb-5 bg-background/90 pt-6 backdrop-blur">
        <div className="mb-3 flex items-center justify-between px-5">
          <h1 className="text-4 leading-tight">Market</h1>
          <div className="flex items-center gap-2">
            <Link
              to="/marketplace/mine"
              className="inline-flex h-10 items-center gap-1 rounded-full bg-ink px-4 text-1 font-semibold text-background"
            >
              <Plus size={iconSize.sm} /> List
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
          <div className="px-5 pt-2">
            <SearchField
              to="/marketplace/search"
              placeholder="Search instruments, equipment, services"
              onClose={() => setSearchOpen(false)}
            />
          </div>
        ) : null}
        {/* Views as tabs, and where you are at the end of the row (it opens the city sheet). */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-1">
          <div className="min-w-0 flex-1">
            <Segmented
              className=""
              value={view}
              options={views.map((v) => v.label)}
              onChange={(label) => {
                setView(label);
                const to = views.find((v) => v.label === label)?.to;
                if (to) void navigate({ to });
              }}
            />
          </div>
          <IconBtn label={`Location: ${city}`} onClick={() => setLocationOpen(true)}>
            <MapPin size={iconSize.md} />
          </IconBtn>
        </div>
      </header>

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
          {rentalCategories.map((c) => (
            <CategoryTile
              key={c.slug}
              slug={c.slug}
              label={c.label}
              onOpen={() => setCategoriesOpen(true)}
            />
          ))}
        </div>
      </SectionRow>

      {view === "Buy" || view === "Rent" ? (
        <section className="px-5 pb-6">
          {(view === "Buy" ? allForSale : allForRent).length ? (
            <ListingGrid items={view === "Buy" ? allForSale : allForRent} />
          ) : (
            <EmptyState
              emoji="🎸"
              title="Nothing listed yet"
              body="New listings show up here as soon as they're published."
            />
          )}
        </section>
      ) : null}

      {/* What's listed, newest first, on the product card. Each rail shows once it has something. */}
      {view === "Explore" && forSale.length ? (
        <SectionRow title="For sale" to="/marketplace/search">
          <div className="rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
            {forSale.map((l) => (
              <ListingTile key={l.id} l={l} />
            ))}
          </div>
        </SectionRow>
      ) : null}

      {view === "Explore" && forRent.length ? (
        <SectionRow title="For rent" to="/marketplace/rent">
          <div className="rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
            {forRent.map((l) => (
              <ListingTile key={l.id} l={l} />
            ))}
          </div>
        </SectionRow>
      ) : null}

      {view === "Explore" && viewed.length ? (
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

      <MarketFilterSheet
        open={filters}
        onClose={() => setFilters(false)}
        items={ranked}
        value={filter}
        onApply={setFilter}
      />
      <LocationSheet
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        city={city}
        onChoose={setCity}
      />
      <CategorySheet
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        categories={rentalCategories}
      />
    </Screen>
  );
}
