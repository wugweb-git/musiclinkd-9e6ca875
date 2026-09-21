import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { rankBy, useRecommendations } from "@/hooks/use-recommendations";
import { useEffect, useState } from "react";
import { ArrowRight, MapPin, SlidersHorizontal, Plus } from "lucide-react";
import { Screen, IconBtn } from "@/components/ml/ui";
import { Segmented } from "@/components/ml/kit";
import { SearchField, SearchIconButton } from "@/components/ml/tab-header";
import {
  ActiveFilters,
  FilterButton,
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
import { popularCategories, useGearTaxonomy } from "@/lib/listing-category";
import { GearCta } from "@/components/ml/gear-cta";
import { iconSize } from "@/lib/tokens";
import { inCity, loadCatalogListings, nearFirst } from "@/lib/market-view";
import { samePinArea } from "@/lib/place";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile } from "@/lib/portfolio.functions";
import { readListingVisits } from "@/lib/device-history";
import {
  applyMarketFilter,
  emptyMarketFilter,
  filterCount,
  type MarketFilter,
} from "@/lib/market-filter";

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
  // ?view=Buy|Rent|Nearby opens the hub on that view (the old rent pages forward here).
  validateSearch: (search: Record<string, unknown>): { view?: "Buy" | "Rent" | "Nearby" } =>
    search["view"] === "Buy" || search["view"] === "Rent" || search["view"] === "Nearby"
      ? { view: search["view"] }
      : {},
  loader: () => loadCatalogListings(),
  component: MarketHome,
});

// Explore, Buy, Rent and Nearby narrow this screen's list; Saved is its own screen. Nearby is
// your PIN code's postal district (never shown), else the Market city.
const views = [
  { label: "Explore", to: null },
  { label: "Buy", to: null },
  { label: "Rent", to: null },
  { label: "Nearby", to: null },
  { label: "Saved", to: "/marketplace/saved" },
] as const;

function MarketHome() {
  const [filters, setFilters] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [city, setCity] = useMarketCity();
  const [view, setView] = useState<(typeof views)[number]["label"]>(
    Route.useSearch().view ?? "Explore",
  );
  const navigate = useNavigate();
  const catalog = Route.useLoaderData();
  const taxonomy = useGearTaxonomy();
  // The catalogue comes newest first; services are Discover's and never reach it. Signed in, For
  // You puts the listings matched to the viewer's instruments, saves, rentals and city first.
  const recs = useRecommendations();
  const ranked = rankBy(catalog, recs?.listings, (l) => l.dbId ?? l.id);
  const [filter, setFilter] = useState<MarketFilter>(emptyMarketFilter);
  const shown = applyMarketFilter(ranked, filter);
  const active = filterCount(filter);
  const { signedIn } = useAuth();
  const loadMe = useServerFn(getMyProfile);
  const me = useQuery({ queryKey: ["profile", "me"], queryFn: () => loadMe(), enabled: signedIn });
  const myPin = (me.data as { pin_code?: string | null } | null | undefined)?.pin_code;
  const goods = shown.filter((l) => l.type === "product" || l.type === "rental");
  const inMyDistrict = myPin ? goods.filter((l) => samePinArea(l.pin, myPin)) : [];
  const nearby = inMyDistrict.length ? inMyDistrict : nearFirst(inCity(goods, city), myPin);
  const allForSale = shown.filter((l) => l.type === "product");
  const allForRent = shown.filter((l) => l.type === "rental");
  // With a filter on, Explore becomes one results grid too, so the count and the list agree.
  const grid =
    view === "Buy" ? allForSale : view === "Rent" ? allForRent : view === "Nearby" ? nearby : goods;
  const showGrid = view !== "Explore" || active > 0;
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
            <FilterButton count={active} onClick={() => setFilters(true)} />
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
        <div className="flex items-center gap-3 border-b border-border px-5">
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
          <span aria-hidden className="h-6 w-px shrink-0 bg-border" />
          <IconBtn label={`Location: ${city}`} onClick={() => setLocationOpen(true)}>
            <MapPin size={iconSize.md} />
          </IconBtn>
        </div>
      </header>

      <ActiveFilters
        value={filter}
        onChange={setFilter}
        {...(active
          ? {
              before: (
                <span className="shrink-0 text-1 font-semibold text-foreground">
                  {grid.length} result{grid.length === 1 ? "" : "s"}
                </span>
              ),
            }
          : {})}
      />

      {/* Categories: each opens its page; the last tile opens every category. */}
      <div className="rail mb-7 flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
        {popularCategories
          .map((slug) => taxonomy.categories.find((c) => c.slug === slug))
          .filter((c): c is NonNullable<typeof c> => Boolean(c))
          .map((c) => (
            <CategoryTile
              key={c.slug}
              slug={c.slug}
              label={c.label}
              onOpen={() => void navigate({ to: "/marketplace/c/$slug", params: { slug: c.slug } })}
            />
          ))}
        <CategoryTile
          slug="see-all"
          label="See all"
          icon={<ArrowRight size={iconSize.lg} strokeWidth={1.75} aria-hidden />}
          onOpen={() => setCategoriesOpen(true)}
        />
      </div>

      {showGrid ? (
        <section className="px-5 pb-6">
          {grid.length ? (
            <ListingGrid items={grid} />
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
      {!showGrid && forSale.length ? (
        <SectionRow title="For sale" to="/marketplace/search">
          <div className="rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
            {forSale.map((l) => (
              <ListingTile key={l.id} l={l} />
            ))}
          </div>
        </SectionRow>
      ) : null}

      {!showGrid && forRent.length ? (
        <SectionRow title="For rent" to="/marketplace/rent">
          <div className="rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
            {forRent.map((l) => (
              <ListingTile key={l.id} l={l} />
            ))}
          </div>
        </SectionRow>
      ) : null}

      {!showGrid && viewed.length ? (
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
        categories={taxonomy.categories}
      />
    </Screen>
  );
}
