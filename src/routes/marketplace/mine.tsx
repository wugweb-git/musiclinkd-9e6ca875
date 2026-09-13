import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Chip, Btn } from "@/components/ml/ui";
import { EmptyState, ListingRow } from "@/components/ml/market";
import { listings, offers } from "@/data/market";

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
  return (
    <Screen>
      <TopBar
        title="My Marketplace"
        subtitle="4 active · 2 pending review"
        back="/marketplace"
        right={
          <Link to="/marketplace/sell" className="text-xs font-semibold text-primary">
            New
          </Link>
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
        {tab === "Active"
          ? listings.slice(0, 3).map((l) => (
              <div key={l.id}>
                <ListingRow l={l} />
                <div className="mt-1.5 flex gap-2 px-1 text-[10px] font-semibold text-muted-foreground">
                  <span
                    className="rounded-full px-2 py-1"
                    style={{ background: "var(--success-container)", color: "var(--success)" }}
                  >
                    Published
                  </span>
                  <span className="rounded-full bg-subtle px-2 py-1">312 views · 41 saves</span>
                </div>
              </div>
            ))
          : null}

        {tab === "Drafts" ? (
          <EmptyState
            emoji="📝"
            title="No drafts"
            body="Start a listing and we'll keep it here until you publish."
            action={
              <Link to="/marketplace/sell">
                <Btn>Create a listing</Btn>
              </Link>
            }
          />
        ) : null}

        {tab === "Offers"
          ? offers.map((o) => (
              <article
                key={o.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">{o.listing}</p>
                  <p className="text-[11px] text-muted-foreground">Offer {o.amount}</p>
                </div>
                <span className="rounded-full bg-subtle px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {o.status}
                </span>
              </article>
            ))
          : null}
      </div>
    </Screen>
  );
}
