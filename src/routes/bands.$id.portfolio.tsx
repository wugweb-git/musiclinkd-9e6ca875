import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, EmptyState, Segmented } from "@/components/ml/kit";
import { getBand } from "@/data/band";

export const Route = createFileRoute("/bands/$id/portfolio")({
  head: () => ({
    meta: [
      { title: "Band portfolio | MusicLinkd" },
      {
        name: "description",
        content:
          "Releases, recordings and live work credited to the band rather than to one member.",
      },
      { property: "og:title", content: "Band portfolio | MusicLinkd" },
      { property: "og:description", content: "Releases and recordings credited to the band." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BandPortfolio,
});

const tabs = ["Discography", "Live"] as const;

function BandPortfolio() {
  const { id } = Route.useParams();
  const band = getBand(id);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Discography");

  if (!band) {
    return (
      <Screen>
        <TopBar title="Portfolio" back="/bands" />
        <div className="px-5 pt-6">
          <EmptyState
            title="Band not found"
            body="This band may have been deleted or made private."
          />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Portfolio" subtitle={band.name} back={`/bands/${band.id}`} />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Segmented value={tab} options={tabs} onChange={setTab} />

        {tab === "Discography" ? (
          band.releases.length ? (
            <div className="space-y-3">
              {band.releases.map((r) => (
                <Card key={r.title}>
                  <div className="flex items-center gap-3">
                    <img
                      src={r.cover}
                      alt=""
                      className="h-14 w-14 rounded-[12px] object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.title}</p>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {r.kind} · {r.year}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
              <Btn variant="outline" className="w-full">
                Add a release
              </Btn>
            </div>
          ) : (
            <EmptyState
              title="No releases yet"
              body="Add the band's EPs, singles and albums so bookers can hear you."
            >
              <Btn>Add a release</Btn>
            </EmptyState>
          )
        ) : (
          <div className="space-y-3">
            <Card>
              <p className="text-sm font-semibold">Live recordings and sets</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                A single well-shot live video does more for a booking than five studio demos. Add
                one set video and a photo from the room.
              </p>
              <Btn variant="outline" className="mt-3 w-full">
                Add live work
              </Btn>
            </Card>
            <EmptyState
              title="Nothing live yet"
              body="Upload a set video or link one from YouTube."
            />
          </div>
        )}
      </div>
    </Screen>
  );
}
