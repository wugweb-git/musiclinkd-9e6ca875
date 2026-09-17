import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar, Chip } from "@/components/ml/ui";
import { ListingRow } from "@/components/ml/market";
import { listings } from "@/data/market";
import { loadCatalogListings } from "@/lib/market-view";

export const Route = createFileRoute("/marketplace/nearby")({
  // Database listings follow the static ones, same as marketplace/index.tsx and search.tsx.
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
  const catalog = Route.useLoaderData();
  const all = [...listings, ...catalog];
  return (
    <Screen>
      <TopBar title="Nearby" subtitle="Dadar, Mumbai · within 15 km" back="/marketplace" />
      <div className="rail flex gap-2 overflow-x-auto px-5 py-4 no-scrollbar">
        {["All", "5 km", "15 km", "50 km", "Studios", "Rentals"].map((c, i) => (
          <Chip key={c} active={i === 0}>
            {c}
          </Chip>
        ))}
      </div>
      <div className="space-y-3 px-5">
        {all.map((l) => (
          <ListingRow key={l.id} l={l} />
        ))}
      </div>
    </Screen>
  );
}
