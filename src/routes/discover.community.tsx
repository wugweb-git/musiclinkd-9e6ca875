import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/ml/ui";
import { Card, EmptyState, Row } from "@/components/ml/kit";
import { bandViewFromRow, loadBands } from "@/lib/band-view";
import { listPublicBusinesses, type BusinessSummary } from "@/lib/profile-groups.functions";
import { joinParts } from "@/lib/utils";

export const Route = createFileRoute("/discover/community")({
  // Bands and business accounts from the database; none when it is unreachable.
  loader: async () => {
    const [{ bands, labels }, businesses] = await Promise.all([
      loadBands(),
      listPublicBusinesses().catch((): BusinessSummary[] => []),
    ]);
    return { bands, labels, businesses };
  },
  head: () => ({
    meta: [
      { title: "Discover the community | MusicLinkd" },
      {
        name: "description",
        content:
          "Bands, studios, labels and crews near you — the groups behind the individual profiles.",
      },
      { property: "og:title", content: "Discover the community | MusicLinkd" },
      { property: "og:description", content: "Bands, studios, labels and crews." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DiscoverCommunity,
});

function DiscoverCommunity() {
  const { bands: rows, labels, businesses } = Route.useLoaderData();
  const bands = rows.map((r) => bandViewFromRow(r, labels, null));
  return (
    <Screen>
      <TopBar title="Community" subtitle="Bands, studios and labels" back="/discover" />

      <div className="space-y-5 px-5 pt-4 pb-8">
        <section>
          <p className="mb-2 text-sm font-semibold">Bands and crews</p>
          {bands.length ? (
            <div className="space-y-3">
              {bands.map((b) => (
                <Link key={b.id} to="/bands/$id" params={{ id: b.id }} className="block">
                  <Card>
                    <div className="flex items-center gap-3">
                      {b.avatar ? (
                        <img
                          src={b.avatar}
                          alt=""
                          className="h-12 w-12 rounded-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div aria-hidden className="h-12 w-12 shrink-0 rounded-full bg-subtle" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{b.name}</p>
                        <p className="truncate text-1 text-muted-foreground">
                          {joinParts(b.genres.join(" · "), b.city)}
                        </p>
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
            {businesses.map((b) => (
              <Row
                key={b.username}
                title={b.display_name ?? b.username}
                subtitle={joinParts(b.city, b.headline)}
                to="/business/$id"
                params={{ id: b.username }}
              />
            ))}
          </div>
        </section>
      </div>
    </Screen>
  );
}
