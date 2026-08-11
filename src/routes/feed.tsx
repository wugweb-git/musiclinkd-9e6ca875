import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/ml/ui";
import { trending } from "@/data/discover";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Home Feed | MusicLinkd" },
      {
        name: "description",
        content: "Industry updates, releases and opportunities from your MusicLinkd network.",
      },
      { property: "og:title", content: "Home Feed | MusicLinkd" },
      { property: "og:description", content: "What's moving in India's music industry today." },
    ],
  }),
  component: Feed,
});

function Feed() {
  return (
    <Screen>
      <TopBar title="Home" subtitle="From your network" />
      <div className="space-y-3 px-5 py-5">
        {trending.map((t) => (
          <article key={t.name} className="overflow-hidden rounded-3xl border border-border bg-card">
            <img src={t.photo} alt={t.name} className="h-40 w-full object-cover" />
            <div className="p-4">
              <h3 className="text-[15px]">{t.name}</h3>
              <p className="text-[11px] text-muted-foreground">{t.meta}</p>
            </div>
          </article>
        ))}
        <Link
          to="/"
          className="flex min-h-12 items-center justify-center rounded-full bg-navy text-sm font-semibold text-background"
        >
          Go to Discover
        </Link>
      </div>
    </Screen>
  );
}
