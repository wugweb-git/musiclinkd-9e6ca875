import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Screen, TopBar, Chip, BtnLink } from "@/components/ml/ui";
import { EmptyState, EquipmentGrid } from "@/components/ml/market";
import { Loading } from "@/components/ml/kit";
import { ProviderCard, providersOf, useSavedRentals } from "@/components/ml/rental";
import { SavedSearchRow } from "@/components/ml/saved-market";
import { loadCatalogRentals } from "@/lib/market-view";
import { readListingVisits } from "@/lib/device-history";
import { listMySavedIds } from "@/lib/saved.functions";
import { listMySavedSearches } from "@/lib/searches.functions";
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
  const savedRentals = useSavedRentals(tab === "Equipment");
  const savedEquipment = savedRentals.data ?? [];

  // A provider is a profile: saved as talent or business, and the owner of a live rental.
  const fetchIds = useServerFn(listMySavedIds);
  const savedPeople = useQuery({
    queryKey: ["rent", "saved-providers"],
    queryFn: async () => {
      const [talent, business] = await Promise.all([
        fetchIds({ data: { targetType: "talent" } }),
        fetchIds({ data: { targetType: "business" } }),
      ]);
      return [...talent, ...business];
    },
    enabled: signedIn && tab === "Providers",
  });
  const allRentals = useQuery({
    queryKey: ["rent", "catalog"],
    queryFn: loadCatalogRentals,
    enabled: tab === "Providers" || tab === "Recently viewed",
  });
  // Rentals opened on this device, newest first (the same history as Rent's rail).
  const viewedIds = tab === "Recently viewed" ? readListingVisits().map((v) => v.id) : [];
  const viewed = viewedIds.flatMap((id) => (allRentals.data ?? []).filter((e) => e.id === id));
  // Searches kept from rental search (saved_searches).
  const fetchSearches = useServerFn(listMySavedSearches);
  const savedSearches = useQuery({
    queryKey: ["saved-searches", "rent"],
    queryFn: () => fetchSearches({ data: { scope: "rent" } }),
    enabled: signedIn && tab === "Searches",
  });
  const savedProviders = providersOf(allRentals.data ?? []).filter((p) =>
    (savedPeople.data ?? []).includes(p.id),
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
          savedRentals.isLoading ? (
            <Loading rows={3} />
          ) : savedEquipment.length ? (
            <EquipmentGrid items={savedEquipment} />
          ) : (
            <EmptyState
              emoji="🎛️"
              title="No saved equipment yet"
              body="Tap the heart on a listing to keep it here."
              action={<BtnLink to="/marketplace/rent">Explore Rentals</BtnLink>}
            />
          )
        ) : null}

        {tab === "Providers" ? (
          savedPeople.isLoading || allRentals.isLoading ? (
            <Loading rows={3} />
          ) : savedProviders.length ? (
            savedProviders.map((p) => <ProviderCard key={p.id} p={p} />)
          ) : (
            <EmptyState
              emoji="🏪"
              title="No saved providers yet"
              body="Save a provider's profile to keep them here."
              action={<BtnLink to="/marketplace/rent/nearby">Find Providers</BtnLink>}
            />
          )
        ) : null}

        {tab === "Searches" ? (
          savedSearches.isLoading ? (
            <Loading rows={3} />
          ) : savedSearches.data?.length ? (
            savedSearches.data.map((s) => <SavedSearchRow key={s.id} search={s} />)
          ) : (
            <EmptyState
              emoji="🔍"
              title="No saved searches yet"
              body="Searches you save for rentals show up here."
              action={<BtnLink to="/marketplace/rent/search">Search Rentals</BtnLink>}
            />
          )
        ) : null}

        {tab === "Spaces" ? (
          <EmptyState
            emoji="🏢"
            title="No saved studios or spaces"
            body="Save rooms alongside equipment so you can line up a session and a backline in one go."
            action={<BtnLink to="/marketplace">Explore Market</BtnLink>}
          />
        ) : null}

        {tab === "Recently viewed" ? (
          allRentals.isLoading ? (
            <Loading rows={2} />
          ) : viewed.length ? (
            <EquipmentGrid items={viewed} />
          ) : (
            <EmptyState
              emoji="🕓"
              title="No view history yet"
              body="Rentals you open on this device show up here."
            />
          )
        ) : null}
      </div>
    </Screen>
  );
}
