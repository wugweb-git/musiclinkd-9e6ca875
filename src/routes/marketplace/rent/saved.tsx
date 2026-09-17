import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Screen, TopBar, Chip, BtnLink } from "@/components/ml/ui";
import { EmptyState } from "@/components/ml/market";
import { Loading } from "@/components/ml/kit";
import { EquipmentRow, ProviderCard } from "@/components/ml/rental";
import { providers, recentRentalSearches } from "@/data/rentals";
import { loadCatalogRentals } from "@/lib/market-view";
import { listMySavedIds } from "@/lib/saved.functions";
import { useAuth } from "@/hooks/use-auth";

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
  const { signedIn } = useAuth();
  const fetchIds = useServerFn(listMySavedIds);
  const savedIds = useQuery({
    queryKey: ["rent", "saved-ids"],
    queryFn: () => fetchIds({ data: { targetType: "listing" } }),
    enabled: signedIn && tab === "Equipment",
  });
  const allRentals = useQuery({
    queryKey: ["rent", "catalog"],
    queryFn: loadCatalogRentals,
    enabled: signedIn && tab === "Equipment",
  });
  const savedEquipment = (allRentals.data ?? []).filter((e) =>
    (savedIds.data ?? []).includes(e.id),
  );

  return (
    <Screen>
      <TopBar title="Saved rentals" back="/marketplace/rent" />
      <div className="rail flex gap-2 overflow-x-auto px-5 py-4 no-scrollbar">
        {tabs.map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}
          </Chip>
        ))}
      </div>

      <div className="space-y-3 px-5 pb-6">
        {tab === "Equipment" ? (
          savedIds.isLoading || allRentals.isLoading ? (
            <Loading rows={3} />
          ) : savedEquipment.length ? (
            savedEquipment.map((e) => <EquipmentRow key={e.id} e={e} />)
          ) : (
            <EmptyState
              emoji="🎛️"
              title="No saved equipment yet"
              body="Tap the heart on a listing to keep it here."
              action={<BtnLink to="/marketplace/rent">Explore Rentals</BtnLink>}
            />
          )
        ) : null}

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

        {tab === "Recently viewed" ? (
          <EmptyState
            emoji="🕓"
            title="No view history yet"
            body="MusicLinkd doesn't track browsing history yet — coming soon."
          />
        ) : null}
      </div>
    </Screen>
  );
}
