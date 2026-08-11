import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/ml/ui";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace | MusicLinkd" },
      {
        name: "description",
        content: "Gear, rentals and services marketplace for India's music professionals.",
      },
      { property: "og:title", content: "Marketplace | MusicLinkd" },
      { property: "og:description", content: "Buy, sell and rent music gear across India." },
    ],
  }),
  component: () => (
    <Screen>
      <TopBar title="Marketplace" subtitle="Gear, rentals & services" />
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Marketplace lives in Flow 4. Head back to discovery to browse talent.
        </p>
        <Link
          to="/"
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-navy px-6 text-sm font-semibold text-background"
        >
          Back to Discover
        </Link>
      </div>
    </Screen>
  ),
});
