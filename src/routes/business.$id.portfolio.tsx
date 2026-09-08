import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, EmptyState, Segmented, StatusPill } from "@/components/ml/kit";
import { getBusiness } from "@/data/business";

export const Route = createFileRoute("/business/$id/portfolio")({
  head: () => ({
    meta: [
      { title: "Business portfolio | MusicLinkd" },
      { name: "description", content: "Manage the credits, gallery and featured work shown on your business page." },
      { property: "og:title", content: "Business portfolio | MusicLinkd" },
      { property: "og:description", content: "Credits, gallery and featured work." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessPortfolio,
});

const tabs = ["Credits", "Gallery"] as const;

function BusinessPortfolio() {
  const { id } = Route.useParams();
  const b = getBusiness(id);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Credits");

  if (!b) {
    return (
      <Screen>
        <TopBar title="Portfolio" back="/business" />
        <div className="px-5 pt-6">
          <EmptyState title="Business not found" body="This business may have been removed or you no longer have access to it." />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Portfolio" subtitle={b.name} back={`/business/${b.id}`} />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Segmented value={tab} options={tabs} onChange={setTab} />

        {tab === "Credits" ? (
          b.credits.length ? (
            <div className="space-y-3">
              {b.credits.map((c) => (
                <Card key={c.title}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{c.title}</p>
                      <p className="mt-1 text-[13px] text-muted-foreground">{c.meta}</p>
                    </div>
                    <StatusPill label="Public" tone="good" />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Btn variant="outline" className="flex-1">Edit</Btn>
                    <Btn variant="ghost" className="flex-1">Hide</Btn>
                  </div>
                </Card>
              ))}
              <Btn variant="outline" className="w-full">Add a credit</Btn>
            </div>
          ) : (
            <EmptyState title="No credits yet" body="Add the records, films and sessions this space worked on.">
              <Btn>Add a credit</Btn>
            </EmptyState>
          )
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {b.gallery.map((g) => (
                <div key={g} className="overflow-hidden rounded-[16px] border border-border">
                  <img src={g} alt={`${b.name} space`} className="h-28 w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
            <p className="text-[12px] text-muted-foreground">
              The first photo is used as the cover on Discover. Drag to reorder once you have more than three.
            </p>
            <Btn variant="outline" className="w-full">Add photos</Btn>
          </div>
        )}
      </div>
    </Screen>
  );
}
