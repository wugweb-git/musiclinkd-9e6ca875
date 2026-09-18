import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MapPin, SlidersHorizontal, Plus } from "lucide-react";
import { Screen, SearchBar, Chip, BtnLink } from "@/components/ml/ui";
import {
  CategorySheet,
  CategoryTile,
  EmptyState,
  LocationSheet,
  EquipmentGrid,
  ProductCard,
  productFromRental,
  SectionRow,
  useMarketCity,
} from "@/components/ml/market";
import { RentalFilterSheet, RentalSkeleton, useSavedRentals } from "@/components/ml/rental";
import { rentalCategories, type RentalItem } from "@/data/rentals";
import { inCity, loadCatalogRentals, loadRentalBookingCounts } from "@/lib/market-view";
import { readListingVisits, readRecentSearches } from "@/lib/device-history";
import { listMyRentalBookings } from "@/lib/rentals.functions";
import { getMyProfile } from "@/lib/portfolio.functions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/marketplace/rent/")({
  // Live rentals (marketplace_listings, category gear_rental), newest first, and how often each
  // has been booked.
  loader: async () => {
    const [equipment, bookings] = await Promise.all([
      loadCatalogRentals(),
      loadRentalBookingCounts(),
    ]);
    return { equipment, bookings };
  },
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
  const [locationOpen, setLocationOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [city, setCity] = useMarketCity();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

  const { equipment: allEquipment, bookings } = Route.useLoaderData();
  // Rentals opened on this device, newest first. Read after mount: history lives in the browser.
  const [viewed, setViewed] = useState<RentalItem[]>([]);
  useEffect(() => {
    const byId = new Map(allEquipment.map((e) => [e.id, e]));
    setViewed(
      readListingVisits()
        .map((v) => byId.get(v.id))
        .filter((e): e is RentalItem => !!e),
    );
  }, [allEquipment]);
  const saved = useSavedRentals();
  // Listed in the Market city; everything when nothing is listed there yet.
  const nearby = inCity(allEquipment, city).slice(0, 5);
  // Most booked first; the catalogue is newest first, so a tie keeps the newer listing ahead.
  const booked = (e: RentalItem) => (e.dbId ? (bookings[e.dbId] ?? 0) : 0);
  const mostBooked = [...allEquipment].sort((a, b) => booked(b) - booked(a));
  const popular = mostBooked.slice(0, 5);
  // Picks from this person's own signals; with none yet, the most-booked rentals in their city.
  const personal = useRecommendedRentals(allEquipment, saved.data ?? [], city);
  const savedIds = new Set((saved.data ?? []).map((e) => e.id));
  const recommended = personal.length
    ? personal
    : inCity(mostBooked, city)
        .filter((e) => !savedIds.has(e.id))
        .slice(0, 4);

  return (
    <Screen>
      <header className="sticky top-0 z-bar bg-background/90 px-5 pb-3 pt-4 backdrop-blur">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-3 leading-tight">Rent Equipment</h1>
            <p className="mt-0.5 text-1 text-muted-foreground">
              Professional music equipment when you need it.
            </p>
            <button
              type="button"
              onClick={() => setLocationOpen(true)}
              className="mt-1 inline-flex items-center gap-1 text-1 font-semibold text-foreground"
            >
              <MapPin size={iconSize.xs} /> {city} · change
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/marketplace/rent/list"
              className="inline-flex h-10 items-center gap-1 rounded-full bg-ink px-3.5 text-1 font-semibold text-background"
            >
              <Plus size={iconSize.sm} /> Rent out
            </Link>
            <button
              aria-label="Filters"
              onClick={() => setFilters(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
            >
              <SlidersHorizontal size={iconSize.sm} />
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
        {["For You", "Available today", "Near me", "Delivery", "Under ₹1k per day"].map((c, i) => (
          <Chip key={c} active={i === 0}>
            {c}
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

      {/* With nothing listed at all, one empty state stands in for every rail below. */}
      {!loading && !allEquipment.length ? (
        <div className="px-5">
          <EmptyState
            emoji="🎛️"
            title="Nothing to rent yet"
            body={`Be the first to list gear in ${city}.`}
            action={<BtnLink to="/marketplace/rent/list">Rent Out Equipment</BtnLink>}
          />
        </div>
      ) : (
        <>
          <SectionRow
            title="Recommended for you"
            // Only claim what the picks are built from when they were built from it.
            {...(personal.length ? { hint: "From your instruments, saves and location" } : {})}
            to="/marketplace/rent/search"
          >
            <div className="px-5">
              {loading ? (
                [0, 1].map((i) => <RentalSkeleton key={i} />)
              ) : (
                <EquipmentGrid items={recommended} />
              )}
            </div>
          </SectionRow>

          <SectionRow title="Near you" to="/marketplace/rent/nearby">
            <RentalRail items={nearby} />
          </SectionRow>

          <SectionRow title="Popular rentals">
            <RentalRail items={popular} />
          </SectionRow>
        </>
      )}

      {/* Personal rails appear once there's something in them. */}
      {viewed.length ? (
        <SectionRow title="Recently viewed">
          <RentalRail items={viewed} />
        </SectionRow>
      ) : null}

      {saved.data?.length ? (
        <SectionRow title="Saved rentals" to="/marketplace/rent/saved">
          <RentalRail items={saved.data} />
        </SectionRow>
      ) : null}

      <div className="space-y-3 px-5 pb-4">
        <div className="rounded-lg bg-subtle p-5">
          <h2 className="text-2">Equipment sitting idle?</h2>
          <p className="mt-1 text-1 text-muted-foreground">
            Rent it out to 72,000+ verified music professionals. You set the dates, deposit and
            terms.
          </p>
          <BtnLink to="/marketplace/rent/list" className="mt-4 w-full">
            Rent Out Equipment
          </BtnLink>
          <div className="mt-2 flex justify-center gap-4 text-1 font-semibold text-foreground">
            <Link to="/marketplace/rent/mine">My rentals</Link>
            <Link to="/marketplace/rent/listings">My listings</Link>
          </div>
        </div>
      </div>

      <RentalFilterSheet
        open={filters}
        onClose={() => setFilters(false)}
        results={allEquipment.length}
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
        rental
      />
    </Screen>
  );
}

/** A horizontal rail of rental product cards — every rail on this screen. */
function RentalRail({ items }: { items: RentalItem[] }) {
  return (
    <div className="rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
      {items.map((e) => (
        <ProductCard key={e.id} item={productFromRental(e)} rail />
      ))}
    </div>
  );
}

/** Lowercase words worth matching in a listing's name: "bass_guitar" → ["bass", "guitar"]. */
const wordsOf = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3);

/**
 * Rentals like the ones this person saved or booked (same item category or sub-category), or
 * matching what they searched for on this device or the instruments on their profile. Ones they
 * already saved or booked are left out; the rest are ordered with their Market city first.
 */
function useRecommendedRentals(all: RentalItem[], saved: RentalItem[], city: string) {
  const { signedIn } = useAuth();
  const fetchBookings = useServerFn(listMyRentalBookings);
  const fetchProfile = useServerFn(getMyProfile);
  const bookings = useQuery({
    queryKey: ["rental-bookings", "mine"],
    queryFn: () => fetchBookings(),
    enabled: signedIn,
  });
  const profile = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => fetchProfile(),
    enabled: signedIn,
  });
  // Searches live in the browser, so they are read after mount.
  const [searched, setSearched] = useState<string[]>([]);
  useEffect(() => setSearched(readRecentSearches("rent").map((s) => s.query)), []);

  const bookedIds = new Set((bookings.data ?? []).map((b) => b.listingSlug).filter(Boolean));
  const had = [...saved, ...all.filter((e) => bookedIds.has(e.id))];
  const haveIds = new Set(had.map((e) => e.id));
  const itemCategories = new Set(had.map((e) => e.itemCategory).filter(Boolean));
  const subcategories = new Set(had.map((e) => e.subcategory).filter(Boolean));
  const instruments = ((profile.data as { instruments?: string[] | null } | null)?.instruments ??
    []) as string[];
  const words = new Set([...searched, ...instruments].flatMap(wordsOf));

  const picks = all.filter((e) => {
    if (haveIds.has(e.id)) return false;
    if (
      e.itemCategory &&
      (itemCategories.has(e.itemCategory) || instruments.includes(e.itemCategory))
    )
      return true;
    if (e.subcategory && subcategories.has(e.subcategory)) return true;
    const name = wordsOf(`${e.name} ${e.brand ?? ""} ${e.model ?? ""} ${e.subcategory ?? ""}`);
    return name.some((w) => words.has(w));
  });
  const here = new Set(inCity(picks, city));
  return here.size === picks.length
    ? picks
    : [...picks.filter((e) => here.has(e)), ...picks.filter((e) => !here.has(e))];
}
