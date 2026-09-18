import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar, Chip } from "@/components/ml/ui";
import { ListingGrid, useMarketCity } from "@/components/ml/market";
import { inCity, loadCatalogListings } from "@/lib/market-view";

export const Route = createFileRoute("/marketplace/nearby")({
  // Database listings, same as search.tsx.
  loader: () => loadCatalogListings(),
  head: () => ({
    meta: [
      { title: "Nearby Listings | MusicLinkd Market" },
      {
        name: "description",
        content: "Gear, rentals, studios and services close to you in Mumbai.",
      },
      { property: "og:title", content: "Nearby Listings | MusicLinkd Market" },
      {
        property: "og:description",
        content: "Location-aware music marketplace discovery across India.",
      },
    ],
  }),
  component: Nearby,
});

function Nearby() {
  // Listed in the Market city; everything when nothing is listed there yet.
  const [city] = useMarketCity();
  const catalog = inCity(Route.useLoaderData(), city);
  return (
    <Screen>
      <TopBar title="Nearby" back="/marketplace" />
      <div className="rail flex gap-2 overflow-x-auto px-5 py-4 no-scrollbar">
        {["All", "5 km", "15 km", "50 km", "Studios", "Rentals"].map((c, i) => (
          <Chip key={c} active={i === 0}>
            {c}
          </Chip>
        ))}
      </div>
      <div className="px-5 pb-4">
        <ListingGrid items={catalog} />
      </div>
    </Screen>
  );
}
