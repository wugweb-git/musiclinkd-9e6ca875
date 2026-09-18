import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { Screen, TopBar, Chip, BtnLink } from "@/components/ml/ui";
import { ProviderCard, providersOf } from "@/components/ml/rental";
import { rentalCategories } from "@/data/rentals";
import { inCity, loadCatalogRentals } from "@/lib/market-view";
import { iconSize } from "@/lib/tokens";
import {
  EmptyState,
  EquipmentGrid,
  MarketCategoryIcon,
  useMarketCity,
} from "@/components/ml/market";

export const Route = createFileRoute("/marketplace/rent/nearby")({
  // Live rentals; the providers are the owners of those listings.
  loader: () => loadCatalogRentals(),
  head: () => ({
    meta: [
      { title: "Rentals Near You | MusicLinkd" },
      {
        name: "description",
        content:
          "Instruments, audio, DJ and live equipment available for rent close to you in Mumbai.",
      },
      { property: "og:title", content: "Rentals Near You | MusicLinkd" },
      {
        property: "og:description",
        content: "Location-first rental discovery with same-day pickup options.",
      },
    ],
  }),
  component: NearbyRentals,
});

const radii = ["5 km", "15 km", "25 km", "50 km"];

function NearbyRentals() {
  // Listed in the Market city; everything when nothing is listed there yet.
  const [city] = useMarketCity();
  const allEquipment = inCity(Route.useLoaderData(), city);
  const providers = providersOf(allEquipment);
  const [radius, setRadius] = useState("15 km");
  const [cat, setCat] = useState("All");
  const shown = cat === "All" ? allEquipment : allEquipment.filter((e) => e.category === cat);

  return (
    <Screen>
      <TopBar title="Near you" back="/marketplace/rent" />

      <div className="px-5 pt-4">
        <div className="relative overflow-hidden rounded-lg border border-border bg-subtle">
          <div className="flex h-36 items-center justify-center">
            <div className="text-center">
              <MapPin size={iconSize.md} className="mx-auto text-primary" />
              <p className="mt-1.5 text-1 font-semibold">{shown.length} rentals on the map</p>
              <p className="text-1 text-muted-foreground">Tap to open map view</p>
            </div>
          </div>
        </div>
        <button className="mt-2 w-full text-center text-1 font-semibold text-foreground">
          Use my current location
        </button>
      </div>

      <div className="rail flex gap-2 overflow-x-auto px-5 py-3 no-scrollbar">
        {radii.map((r) => (
          <Chip key={r} active={radius === r} onClick={() => setRadius(r)}>
            {r}
          </Chip>
        ))}
      </div>

      <div className="rail flex gap-2 overflow-x-auto px-5 pb-3 no-scrollbar">
        <Chip active={cat === "All"} onClick={() => setCat("All")}>
          All
        </Chip>
        {rentalCategories.map((c) => (
          <Chip
            key={c.slug}
            active={cat === c.slug}
            media={<MarketCategoryIcon slug={c.slug} size={iconSize.sm} />}
            onClick={() => setCat(c.slug)}
          >
            {c.label}
          </Chip>
        ))}
      </div>

      <div className="space-y-3 px-5">
        {shown.length ? (
          <EquipmentGrid items={shown} />
        ) : (
          <EmptyState
            emoji="📦"
            title="Nothing listed here yet"
            body="No providers have listed this category near you yet."
            action={<BtnLink to="/marketplace/rent/search">Search All Rentals</BtnLink>}
          />
        )}
      </div>

      <section className="px-5 pt-6">
        <h2 className="text-2">Providers around you</h2>
        <div className="mt-3 space-y-3">
          {providers.length ? (
            providers.slice(0, 3).map((p) => <ProviderCard key={p.id} p={p} />)
          ) : (
            <EmptyState
              emoji="🏪"
              title="No providers nearby yet"
              body="People renting out equipment in your area show up here."
            />
          )}
        </div>
      </section>

      <div className="px-5 pb-4 pt-6">
        <div className="rounded-lg bg-subtle p-5">
          <h2 className="text-2">Have gear in your area?</h2>
          <p className="mt-1 text-1 text-muted-foreground">
            Renters nearby are searching for backline and mics every week.
          </p>
          <BtnLink to="/marketplace/rent/list" className="mt-4 w-full">
            Rent Out Equipment
          </BtnLink>
        </div>
      </div>
    </Screen>
  );
}
