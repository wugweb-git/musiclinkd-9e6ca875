import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { EmptyState } from "@/components/ml/kit";
import { OpportunityCard, useSavedOpportunities } from "@/components/ml/opportunity";
import { opportunities } from "@/data/opportunities";

export const Route = createFileRoute("/opportunities/saved")({
  head: () => ({
    meta: [
      { title: "Saved opportunities | MusicLinkd" },
      { name: "description", content: "Your shortlist of music opportunities to apply to later." },
      { property: "og:title", content: "Saved opportunities | MusicLinkd" },
      { property: "og:description", content: "Opportunities you shortlisted on MusicLinkd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SavedOpportunities,
});

function SavedOpportunities() {
  const { ids, has, toggle } = useSavedOpportunities();
  const list = opportunities.filter((o) => ids.includes(o.id) || (o.saved && !ids.length));

  return (
    <Screen>
      <TopBar title="Saved" subtitle="Only you can see this list" back="/opportunities" />
      <div className="space-y-3 px-5 pt-4 pb-4">
        {list.length === 0 ? (
          <EmptyState
            title="No saved opportunities"
            body="Tap the bookmark on any opportunity to keep it here while you decide."
          >
            <Link to="/opportunities">
              <Btn className="w-full">Browse opportunities</Btn>
            </Link>
          </EmptyState>
        ) : (
          list.map((o) => (
            <OpportunityCard
              key={o.id}
              o={o}
              saved={has(o.id) || o.saved}
              onSave={() => toggle(o.id)}
            />
          ))
        )}
      </div>
    </Screen>
  );
}
