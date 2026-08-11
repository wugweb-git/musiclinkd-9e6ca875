import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/ml/ui";
import { categories } from "@/data/discover";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Browse Categories | MusicLinkd" },
      {
        name: "description",
        content:
          "Browse singers, musicians, DJs, engineers, composers, bands, studios, labels, venues and music schools.",
      },
      { property: "og:title", content: "Browse Categories | MusicLinkd" },
      {
        property: "og:description",
        content: "Every corner of India's music industry, organised in one directory.",
      },
    ],
  }),
  component: Categories,
});

function Categories() {
  return (
    <Screen>
      <TopBar title="Browse categories" subtitle="72,963 verified professionals" back="/" />
      <div className="grid grid-cols-2 gap-3 px-5 py-5">
        {categories.map((c) => (
          <Link
            key={c.slug}
            to={c.slug === "singers" ? "/singers" : "/search"}
            className="rounded-3xl border border-border bg-card p-4"
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
              style={{ background: "var(--pink-container)" }}
            >
              {c.emoji}
            </span>
            <h3 className="mt-3 text-[14px]">{c.label}</h3>
            <p className="text-[11px] text-muted-foreground">{c.count} profiles</p>
          </Link>
        ))}
      </div>
    </Screen>
  );
}
