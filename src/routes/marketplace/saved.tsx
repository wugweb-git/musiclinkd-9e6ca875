import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Screen, TopBar, Chip, BtnLink } from "@/components/ml/ui";
import { EmptyState, ListingRow } from "@/components/ml/market";
import { Loading } from "@/components/ml/kit";
import { sellers } from "@/data/market";
import { loadCatalogListings } from "@/lib/market-view";
import { listMySavedIds } from "@/lib/saved.functions";
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
    enabled: signedIn && tab === "Listings",
  });
  const savedListings = (allListings.data ?? []).filter((l) =>
    (savedIds.data ?? []).includes(l.id),
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
            savedListings.map((l) => <ListingRow key={l.id} l={l} />)
          ) : (
            <EmptyState
              emoji="🛍️"
              title="No saved listings yet"
              body="Tap the heart on a listing to keep it here."
              action={<BtnLink to="/marketplace">Explore Market</BtnLink>}
            />
          )
        ) : null}
        {tab === "Searches"
          ? ["condenser microphone · Mumbai", "sitar under ₹80,000", "jam room Bandra"].map((s) => (
              <article
                key={s}
                className="flex items-center justify-between rounded-lg bg-subtle p-4"
              >
                <div>
                  <p className="text-1 font-semibold">{s}</p>
                  <p className="text-1 text-muted-foreground">Alerts on · 4 new this week</p>
                </div>
                <Chip>View</Chip>
              </article>
            ))
          : null}
        {tab === "Sellers"
          ? sellers.slice(0, 3).map((s) => (
              <Link
                key={s.id}
                to="/marketplace/seller/$id"
                params={{ id: s.id }}
                className="flex items-center gap-3 rounded-lg bg-subtle p-4"
              >
                <img src={s.photo} alt={s.name} className="h-12 w-12 rounded-sm object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-1 font-semibold">{s.name}</p>
                  <p className="truncate text-1 text-muted-foreground">{s.role}</p>
                </div>
              </Link>
            ))
          : null}
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
