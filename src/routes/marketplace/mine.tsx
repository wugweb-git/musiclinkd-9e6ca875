import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Screen, TopBar, Chip, BtnLink } from "@/components/ml/ui";
import { EmptyState, ListingRow } from "@/components/ml/market";
import { offers } from "@/data/market";
import { loadMyCatalogListings } from "@/lib/market-view";
import { useAuth } from "@/hooks/use-auth";
import { TextLink } from "@/components/ml/links";

export const Route = createFileRoute("/marketplace/mine")({
  head: () => ({
    meta: [
      { title: "My Marketplace | MusicLinkd" },
      {
        name: "description",
        content: "Manage your listings, offers, enquiries and marketplace performance.",
      },
      { property: "og:title", content: "My Marketplace | MusicLinkd" },
      {
        property: "og:description",
        content: "A lightweight seller workspace for MusicLinkd Market.",
      },
    ],
  }),
  component: Mine,
});

const tabs = ["Active", "Drafts", "Offers"];

function Mine() {
  const [tab, setTab] = useState(tabs[0]!);
  const { signedIn } = useAuth();
  const mine = useQuery({
    queryKey: ["marketplace", "mine"],
    queryFn: loadMyCatalogListings,
    enabled: signedIn,
  });
  const listings = mine.data ?? [];

  return (
    <Screen>
      <TopBar
        title="My Marketplace"
        {...(mine.isLoading
          ? {}
          : {
              subtitle: `${listings.length} active listing${listings.length === 1 ? "" : "s"}`,
            })}
        back="/marketplace"
        right={
          <TextLink to="/marketplace/sell" className="text-1">
            New
          </TextLink>
        }
      />
      <div className="rail flex gap-2 overflow-x-auto px-5 py-4 no-scrollbar">
        {tabs.map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}
          </Chip>
        ))}
      </div>

      <div className="space-y-3 px-5">
        {tab === "Active" ? (
          mine.isLoading ? (
            <div className="space-y-3" aria-busy>
              {[0, 1].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-lg bg-subtle" />
              ))}
            </div>
          ) : listings.length ? (
            listings.map((l) => <ListingRow key={l.id} l={l} />)
          ) : (
            <EmptyState
              emoji="🛍️"
              title="No listings yet"
              body="Everything you list on the marketplace shows up here."
              action={<BtnLink to="/marketplace/sell">Create a Listing</BtnLink>}
            />
          )
        ) : null}

        {tab === "Drafts" ? (
          <EmptyState
            emoji="📝"
            title="No drafts"
            body="Start a listing and we'll keep it here until you publish."
            action={<BtnLink to="/marketplace/sell">Create a Listing</BtnLink>}
          />
        ) : null}

        {tab === "Offers"
          ? offers.map((o) => (
              <article
                key={o.id}
                className="flex items-center justify-between rounded-lg bg-subtle p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-1 font-semibold">{o.listing}</p>
                  <p className="text-1 text-muted-foreground">Offer {o.amount}</p>
                </div>
                <span className="rounded-full bg-background pill text-muted-foreground">
                  {o.status}
                </span>
              </article>
            ))
          : null}
      </div>
    </Screen>
  );
}
