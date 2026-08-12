import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Chip, Btn } from "@/components/ml/ui";
import { EmptyState, ListingRow } from "@/components/ml/market";
import { listings, sellers } from "@/data/market";

export const Route = createFileRoute("/marketplace/saved")({
  head: () => ({
    meta: [
      { title: "Saved in Market | MusicLinkd" },
      { name: "description", content: "Your saved listings, searches, sellers, services and studios." },
      { property: "og:title", content: "Saved in Market | MusicLinkd" },
      { property: "og:description", content: "Come back to the gear and studios you shortlisted." },
    ],
  }),
  component: SavedMarket,
});

const tabs = ["Listings", "Searches", "Sellers", "Studios"];

function SavedMarket() {
  const [tab, setTab] = useState(tabs[0]!);
  return (
    <Screen>
      <TopBar title="Saved" subtitle="12 items · 3 searches" back="/marketplace" />
      <div className="flex gap-2 overflow-x-auto px-5 py-4 no-scrollbar">
        {tabs.map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>{t}</Chip>
        ))}
      </div>
      <div className="space-y-3 px-5">
        {tab === "Listings" ? listings.slice(0, 3).map((l) => <ListingRow key={l.id} l={l} />) : null}
        {tab === "Searches"
          ? ["condenser microphone · Mumbai", "sitar under ₹80,000", "jam room Bandra"].map((s) => (
              <article key={s} className="flex items-center justify-between rounded-3xl border border-border bg-card p-4">
                <div>
                  <p className="text-[13px] font-semibold">{s}</p>
                  <p className="text-[11px] text-muted-foreground">Alerts on · 4 new this week</p>
                </div>
                <Chip>View</Chip>
              </article>
            ))
          : null}
        {tab === "Sellers"
          ? sellers.slice(0, 3).map((s) => (
              <Link key={s.id} to="/marketplace/seller/$id" params={{ id: s.id }} className="flex items-center gap-3 rounded-3xl border border-border bg-card p-4">
                <img src={s.photo} alt={s.name} className="h-12 w-12 rounded-2xl object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">{s.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{s.role}</p>
                </div>
              </Link>
            ))
          : null}
        {tab === "Studios" ? (
          <EmptyState
            emoji="🏢"
            title="No saved studios yet"
            body="Save rooms you like and compare availability before you book."
            action={<Link to="/marketplace"><Btn>Explore Market</Btn></Link>}
          />
        ) : null}
      </div>
    </Screen>
  );
}
