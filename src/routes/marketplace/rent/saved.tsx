import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Chip, BtnLink } from "@/components/ml/ui";
import { EmptyState } from "@/components/ml/market";
import { EquipmentRow, ProviderCard } from "@/components/ml/rental";
import { equipment, providers, recentRentalSearches } from "@/data/rentals";

export const Route = createFileRoute("/marketplace/rent/saved")({
  head: () => ({
    meta: [
      { title: "Saved Rentals | MusicLinkd" },
      {
        name: "description",
        content: "Your saved rental equipment, providers, searches and recently viewed listings.",
      },
      { property: "og:title", content: "Saved Rentals | MusicLinkd" },
      {
        property: "og:description",
        content: "Come back to the gear you shortlisted, with live availability.",
      },
    ],
  }),
  component: SavedRentals,
});

const tabs = ["Equipment", "Providers", "Searches", "Spaces", "Recently viewed"];

function SavedRentals() {
  const [tab, setTab] = useState(tabs[0]!);

  return (
    <Screen>
      <TopBar title="Saved rentals" subtitle="6 items · 3 searches" back="/marketplace/rent" />
      <div className="rail flex gap-2 overflow-x-auto px-5 py-4 no-scrollbar">
        {tabs.map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}
          </Chip>
        ))}
      </div>

      <div className="space-y-3 px-5 pb-6">
        {tab === "Equipment"
          ? equipment.slice(0, 3).map((e) => <EquipmentRow key={e.id} e={e} />)
          : null}

        {tab === "Providers"
          ? providers.slice(0, 3).map((p) => <ProviderCard key={p.id} p={p} />)
          : null}

        {tab === "Searches"
          ? recentRentalSearches.map((s) => (
              <article
                key={s}
                className="flex items-center justify-between gap-3 rounded-lg bg-subtle p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-1 font-semibold">{s}</p>
                  <p className="text-1 text-muted-foreground">Alerts on · 4 new available</p>
                </div>
                <Link to="/marketplace/rent/search" className="shrink-0">
                  <Chip>View</Chip>
                </Link>
              </article>
            ))
          : null}

        {tab === "Spaces" ? (
          <EmptyState
            emoji="🏢"
            title="No saved studios or spaces"
            body="Save rooms alongside equipment so you can line up a session and a backline in one go."
            action={<BtnLink to="/marketplace">Explore Market</BtnLink>}
          />
        ) : null}

        {tab === "Recently viewed"
          ? equipment.slice(2, 6).map((e) => (
              <EquipmentRow
                key={e.id}
                e={e}
                action={
                  <div className="flex gap-2">
                    <Link to="/marketplace/rent/request/$id" params={{ id: e.id }}>
                      <Chip>Check dates</Chip>
                    </Link>
                    <Chip>Remove</Chip>
                  </div>
                }
              />
            ))
          : null}
      </div>
    </Screen>
  );
}
