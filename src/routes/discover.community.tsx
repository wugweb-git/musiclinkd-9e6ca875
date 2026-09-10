import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/ml/ui";
import { Card, EmptyState, Row } from "@/components/ml/kit";
import { bands } from "@/data/band";
import { myBusinesses } from "@/data/business";

export const Route = createFileRoute("/discover/community")({
  head: () => ({
    meta: [
      { title: "Discover the community | MusicLinkd" },
      { name: "description", content: "Bands, studios, labels and crews near you — the groups behind the individual profiles." },
      { property: "og:title", content: "Discover the community | MusicLinkd" },
      { property: "og:description", content: "Bands, studios, labels and crews." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DiscoverCommunity,
});

function DiscoverCommunity() {
  return (
    <Screen>
      <TopBar title="Community" subtitle="Bands, studios and labels" back="/" />

      <div className="space-y-5 px-5 pt-4 pb-8">
        <section>
          <p className="mb-2 text-sm font-semibold">Bands and crews</p>
          {bands.length ? (
            <div className="space-y-3">
              {bands.map((b) => (
                <Link key={b.id} to="/bands/$id" params={{ id: b.id }} className="block">
                  <Card>
                    <div className="flex items-center gap-3">
                      <img src={b.avatar} alt="" className="h-12 w-12 rounded-full object-cover" loading="lazy" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{b.name}</p>
                        <p className="truncate text-[12px] text-muted-foreground">{b.genres.join(" · ")} · {b.city}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No bands yet" body="Bands you follow or discover appear here." />
          )}
        </section>

        <section>
          <p className="mb-2 text-sm font-semibold">Studios and labels</p>
          <div className="space-y-2">
            {myBusinesses.map((b) => (
              <Row key={b.id} title={b.name} subtitle={`${b.city} · ${b.tagline}`} to={`/business/${b.id}`} />
            ))}
          </div>
        </section>
      </div>
    </Screen>
  );
}
