import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar, Chip } from "@/components/ml/ui";
import { ListingGrid, useMarketCity } from "@/components/ml/market";
import { inCity, loadCatalogListings, nearFirst } from "@/lib/market-view";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile } from "@/lib/portfolio.functions";

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
  // Your PIN code is the radius: listings in your postal district come first. It is never shown.
  const { signedIn } = useAuth();
  const loadMe = useServerFn(getMyProfile);
  const me = useQuery({ queryKey: ["profile", "me"], queryFn: () => loadMe(), enabled: signedIn });
  const myPin = (me.data as { pin_code?: string | null } | null | undefined)?.pin_code;
  const catalog = nearFirst(inCity(Route.useLoaderData(), city), myPin);
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
