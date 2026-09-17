import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/ml/ui";
import { Card, EmptyState } from "@/components/ml/kit";
import { trending } from "@/data/discover";
import { workType } from "@/data/portfolio";
import { listTrendingWork, type TrendingItem } from "@/lib/trending.functions";
import { joinParts } from "@/lib/utils";

export const Route = createFileRoute("/discover/music")({
  head: () => ({
    meta: [
      { title: "Discover music | MusicLinkd" },
      {
        name: "description",
        content:
          "Hear new work from musicians, producers and studios across the Indian music scene.",
      },
      { property: "og:title", content: "Discover music | MusicLinkd" },
      { property: "og:description", content: "New releases and sessions from the community." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  // Same source discover.index.tsx already uses: real plays in the last 7 days, counted by the
  // database (trending_portfolio_items), not seed data. Without it the section is just empty.
  loader: async () => {
    const tracks = await listTrendingWork().catch((): TrendingItem[] => []);
    return { tracks };
  },
  component: DiscoverMusic,
});

function DiscoverMusic() {
  const { tracks } = Route.useLoaderData();

  return (
    <Screen>
      <TopBar title="Music" subtitle="New work from the community" back="/discover" />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card>
          <p className="text-sm font-semibold">Fresh this week</p>
          <p className="mt-1 text-1 text-muted-foreground">
            Work published by people you can actually hire, not a chart.
          </p>
        </Card>

        {tracks.length ? (
          <div className="space-y-3">
            {tracks.map((t) => (
              <Link key={t.id} to="/portfolio/$id" params={{ id: t.id }} className="block">
                <Card>
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-background text-2">
                      {workType(t.kind).emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{t.title}</p>
                      <p className="truncate text-1 text-muted-foreground">
                        {joinParts(
                          workType(t.kind).label,
                          t.display_name,
                          `${t.plays} ${t.plays === 1 ? "play" : "plays"}`,
                        )}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing published yet"
            body="As people add work to their portfolios it appears here."
          />
        )}

        <div>
          <p className="mb-2 text-sm font-semibold">Trending searches</p>
          <div className="flex flex-wrap gap-2">
            {trending.map((t) => (
              <span
                key={t.name}
                className="rounded-full bg-background px-3 py-1.5 text-1 font-semibold"
              >
                {t.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}
