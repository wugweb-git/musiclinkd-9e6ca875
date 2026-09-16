import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { Screen, TopBar, Chip, BtnLink } from "@/components/ml/ui";
import { EquipmentRow, ProviderCard } from "@/components/ml/rental";
import { equipment, providers, rentalCategories } from "@/data/rentals";

export const Route = createFileRoute("/marketplace/rent/nearby")({
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
  const [radius, setRadius] = useState("15 km");
  const [cat, setCat] = useState("All");
  const shown = cat === "All" ? equipment : equipment.filter((e) => e.category === cat);

  return (
    <Screen>
      <TopBar
        title="Near you"
        subtitle={`Dadar, Mumbai · within ${radius}`}
        back="/marketplace/rent"
      />

      <div className="px-5 pt-4">
        <div className="relative overflow-hidden rounded-lg border border-border bg-subtle">
          <div className="flex h-36 items-center justify-center">
            <div className="text-center">
              <MapPin size={20} className="mx-auto text-primary" />
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
          <Chip key={c.slug} active={cat === c.slug} onClick={() => setCat(c.slug)}>
            {c.emoji} {c.label}
          </Chip>
        ))}
      </div>

      <div className="space-y-3 px-5">
        {shown.map((e) => (
          <EquipmentRow key={e.id} e={e} />
        ))}
      </div>

      <section className="px-5 pt-6">
        <h2 className="text-2">Providers around you</h2>
        <p className="mt-0.5 text-1 text-muted-foreground">
          Verified rental partners within {radius}
        </p>
        <div className="mt-3 space-y-3">
          {providers.slice(0, 3).map((p) => (
            <ProviderCard key={p.id} p={p} />
          ))}
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
