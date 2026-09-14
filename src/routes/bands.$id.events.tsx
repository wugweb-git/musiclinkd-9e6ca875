import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, EmptyState, Segmented, StatusPill } from "@/components/ml/kit";
import { getBand } from "@/data/band";
import { bandViewFromRecord, bandViewFromStatic } from "@/lib/band-view";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { getPublicBand } from "@/lib/profile-groups.functions";
import { opportunities } from "@/data/opportunities";

export const Route = createFileRoute("/bands/$id/events")({
  // The demo band wins; otherwise the id is the username of a stored profile with a line-up or shows.
  loader: async ({ params }) => {
    if (getBand(params.id)) return { record: null, labels: {} as TaxonomyLabels };
    const [record, labels] = await Promise.all([
      getPublicBand({ data: { username: params.id } }).catch(() => null),
      getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
    ]);
    return { record, labels };
  },
  head: () => ({
    meta: [
      { title: "Band shows and opportunities | MusicLinkd" },
      {
        name: "description",
        content: "Upcoming shows for the band and the gigs it can apply to as a group.",
      },
      { property: "og:title", content: "Band shows and opportunities | MusicLinkd" },
      { property: "og:description", content: "Upcoming shows and gigs to apply for." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BandEvents,
});

const tabs = ["Shows", "Opportunities"] as const;

function BandEvents() {
  const { id } = Route.useParams();
  const { record, labels } = Route.useLoaderData();
  const demo = getBand(id);
  const band = demo
    ? bandViewFromStatic(demo)
    : record
      ? bandViewFromRecord(record, labels)
      : undefined;
  const [tab, setTab] = useState<(typeof tabs)[number]>("Shows");

  if (!band) {
    return (
      <Screen>
        <TopBar title="Shows" back="/bands" />
        <div className="px-5 pt-6">
          <EmptyState
            title="Band not found"
            body="This band may have been deleted or made private."
          />
        </div>
      </Screen>
    );
  }

  const gigs = opportunities.filter((o) => o.kind === "Gig").slice(0, 4);

  return (
    <Screen>
      <TopBar title="Shows" subtitle={band.name} back={`/bands/${band.id}`} />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Segmented value={tab} options={tabs} onChange={setTab} />

        {tab === "Shows" ? (
          band.events.length ? (
            <div className="space-y-3">
              {band.events.map((e) => (
                <Card key={e.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{e.title}</p>
                      {e.place ? (
                        <p className="mt-1 text-[13px] text-muted-foreground">{e.place}</p>
                      ) : null}
                      {e.date ? (
                        <p className="mt-1 text-[12px] text-muted-foreground">{e.date}</p>
                      ) : null}
                    </div>
                    {e.status ? (
                      <StatusPill
                        label={e.status}
                        tone={e.status === "confirmed" ? "good" : "warn"}
                      />
                    ) : null}
                  </div>
                </Card>
              ))}
              <Btn variant="outline" className="w-full">
                Add a show
              </Btn>
            </div>
          ) : (
            <EmptyState
              title="No shows booked"
              body="Add a date so members and followers know where to be."
            >
              <Btn>Add a show</Btn>
            </EmptyState>
          )
        ) : gigs.length ? (
          <div className="space-y-3">
            {gigs.map((o) => (
              <Link key={o.id} to="/opportunities/$id" params={{ id: o.id }} className="block">
                <Card>
                  <p className="text-sm font-semibold">{o.title}</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {o.city} · {o.workMode}
                  </p>
                  <p className="mt-2 text-[12px] text-muted-foreground">Apply as {band.name}</p>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing open right now"
            body="Live gigs looking for a full band will show up here."
          />
        )}
      </div>
    </Screen>
  );
}
