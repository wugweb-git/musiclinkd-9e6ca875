import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Screen, TopBar, Chip, BtnLink } from "@/components/ml/ui";
import { EmptyState, ListingGrid } from "@/components/ml/market";
import { Loading } from "@/components/ml/kit";
import { SavedSearchRow, SellerRow, sellersOf } from "@/components/ml/saved-market";
import { loadCatalogListings } from "@/lib/market-view";
import { listMySavedIds } from "@/lib/saved.functions";
import { listMySavedSearches } from "@/lib/searches.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/marketplace/saved")({
  head: () => ({
    meta: [
      { title: "Saved in Market | MusicLinkd" },
      {
        name: "description",
        content: "Your saved listings, searches, sellers, services and studios.",
      },
      { property: "og:title", content: "Saved in Market | MusicLinkd" },
      { property: "og:description", content: "Come back to the gear and studios you shortlisted." },
    ],
  }),
  component: SavedMarket,
});

const tabs = ["Listings", "Searches", "Sellers", "Studios"];

function SavedMarket() {
  const [tab, setTab] = useState(tabs[0]!);
  const { signedIn } = useAuth();
  const fetchIds = useServerFn(listMySavedIds);
  const savedIds = useQuery({
    queryKey: ["marketplace", "saved-ids"],
    queryFn: () => fetchIds({ data: { targetType: "listing" } }),
    enabled: signedIn && tab === "Listings",
  });
  const allListings = useQuery({
    queryKey: ["marketplace", "catalog"],
    queryFn: loadCatalogListings,
    enabled: signedIn && (tab === "Listings" || tab === "Sellers"),
  });
  const savedListings = (allListings.data ?? []).filter(
    (l) => l.dbId != null && (savedIds.data ?? []).includes(l.dbId),
  );

  // Searches kept from Market search (saved_searches).
  const fetchSearches = useServerFn(listMySavedSearches);
  const savedSearches = useQuery({
    queryKey: ["saved-searches", "market"],
    queryFn: () => fetchSearches({ data: { scope: "market" } }),
    enabled: signedIn && tab === "Searches",
  });

  // A seller is a profile: saved as talent or business, with at least one listing in Market.
  const savedPeople = useQuery({
    queryKey: ["marketplace", "saved-sellers"],
    queryFn: async () => {
      const [talent, business] = await Promise.all([
        fetchIds({ data: { targetType: "talent" } }),
        fetchIds({ data: { targetType: "business" } }),
      ]);
      return [...talent, ...business];
    },
    enabled: signedIn && tab === "Sellers",
  });
  const savedSellers = sellersOf(allListings.data ?? []).filter((p) =>
    (savedPeople.data ?? []).includes(p.id),
  );

  return (
    <Screen>
      <TopBar title="Saved" back="/marketplace" />
      <div className="rail flex gap-2 overflow-x-auto px-5 py-4 no-scrollbar">
        {tabs.map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}
          </Chip>
        ))}
      </div>
      <div className="space-y-3 px-5">
        {tab === "Listings" ? (
          savedIds.isLoading || allListings.isLoading ? (
            <Loading rows={3} />
          ) : savedListings.length ? (
            <ListingGrid items={savedListings} />
          ) : (
            <EmptyState
              emoji="🛍️"
              title="No saved listings yet"
              body="Tap the heart on a listing to keep it here."
              action={<BtnLink to="/marketplace">Explore Market</BtnLink>}
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
              body="Searches you save in Market show up here."
              action={<BtnLink to="/marketplace/search">Search Market</BtnLink>}
            />
          )
        ) : null}
        {tab === "Sellers" ? (
          savedPeople.isLoading || allListings.isLoading ? (
            <Loading rows={3} />
          ) : savedSellers.length ? (
            savedSellers.map((p) => <SellerRow key={p.id} seller={p} />)
          ) : (
            <EmptyState
              emoji="🏪"
              title="No saved sellers yet"
              body="Save a seller's profile to keep them here."
              action={<BtnLink to="/marketplace">Explore Market</BtnLink>}
            />
          )
        ) : null}
        {tab === "Studios" ? (
          <EmptyState
            emoji="🏢"
            title="No saved studios yet"
            body="Save rooms you like and compare availability before you book."
            action={<BtnLink to="/marketplace">Explore Market</BtnLink>}
          />
        ) : null}
      </div>
    </Screen>
  );
}
