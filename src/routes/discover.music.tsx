import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/ml/ui";
import { Card, EmptyState } from "@/components/ml/kit";
import { trending } from "@/data/discover";
import { demoPortfolio, workType } from "@/data/portfolio";

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
  component: DiscoverMusic,
});

function DiscoverMusic() {
  const tracks = demoPortfolio.filter((p) => p.kind === "audio" || p.kind === "video");

  return (
    <Screen>
      <TopBar title="Music" subtitle="New work from the community" back="/" />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card>
          <p className="text-sm font-semibold">Fresh this week</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Work published by people you can actually hire, not a chart.
          </p>
        </Card>

        {tracks.length ? (
          <div className="space-y-3">
            {tracks.map((t) => (
              <Link key={t.id} to="/portfolio/$id" params={{ id: t.id }} className="block">
                <Card>
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-subtle text-lg">
                      {workType(t.kind).emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{t.title}</p>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {workType(t.kind).label} · {t.release_year}
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
                className="rounded-full bg-subtle px-3 py-1.5 text-[12px] font-semibold"
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
