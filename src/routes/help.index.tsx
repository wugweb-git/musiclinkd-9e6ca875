import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarCheck, type LucideIcon, Rocket, Scale, ShieldCheck, Store } from "lucide-react";
import { Screen, TopBar, SearchBar } from "@/components/ml/ui";
import { EmptyState, Row } from "@/components/ml/kit";
import { ArticleGrid, TopicFilter, type Article } from "@/components/ml/marketing";
import { contentCategories, contentPages, popularSlugs, type ContentPage } from "@/data/cms";

export const Route = createFileRoute("/help/")({
  head: () => ({
    meta: [
      { title: "Help & Guides | MusicLinkd" },
      {
        name: "description",
        content:
          "Guides, policies and answers for profiles, bookings, marketplace, and verification on MusicLinkd.",
      },
      { property: "og:title", content: "Help & Guides | MusicLinkd" },
      {
        property: "og:description",
        content: "Guides, policies and answers for MusicLinkd professionals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HelpIndex,
});

/** One keyword per topic for the filter row; the category's full label stays on its own page. */
const topics: Record<string, { short: string; icon: LucideIcon }> = {
  "getting-started": { short: "Basics", icon: Rocket },
  bookings: { short: "Bookings", icon: CalendarCheck },
  marketplace: { short: "Marketplace", icon: Store },
  trust: { short: "Trust", icon: ShieldCheck },
  legal: { short: "Legal", icon: Scale },
};

const topicOf = (key: string) => topics[key]?.short ?? key;

/** Guides carry no pictures, so each card is a grey tile marked with its topic's icon. */
function toArticle(p: ContentPage): Article {
  const Icon = topics[p.category]?.icon ?? Rocket;
  return {
    id: p.slug,
    title: p.title,
    date: p.updated.replace(/^Updated /, ""),
    topic: topicOf(p.category),
    to: `/help/${p.slug}`,
    badge: { kind: "icon", icon: <Icon size={24} aria-hidden /> },
  };
}

// Popular guides lead "All"; the rest keep their written order.
const ordered = [
  ...popularSlugs.flatMap((slug) => contentPages.filter((p) => p.slug === slug)),
  ...contentPages.filter((p) => !popularSlugs.includes(p.slug)),
];

function HelpIndex() {
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("All");
  const results = q
    ? contentPages.filter((p) =>
        `${p.title} ${p.summary} ${p.category}`.toLowerCase().includes(q.toLowerCase()),
      )
    : [];
  const topicNames = ["All", ...contentCategories.map((c) => topicOf(c.key))];
  const shown = ordered.filter((p) => topic === "All" || topicOf(p.category) === topic);

  return (
    <Screen>
      <TopBar title="Help & guides" subtitle="Written for working musicians" back="/profile" />
      <div className="space-y-4 px-5 pt-4">
        <SearchBar value={q} onChange={setQ} placeholder="Search guides, policies and answers" />

        {q ? (
          results.length ? (
            <div className="space-y-2">
              {results.map((p) => (
                <Row
                  key={p.slug}
                  title={p.title}
                  subtitle={`${p.readTime} · ${p.summary}`}
                  to="/help/$slug"
                  params={{ slug: p.slug }}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="No results" body="Try a shorter search, or pick a topic below." />
          )
        ) : (
          <div className="pb-8">
            <TopicFilter
              topics={topicNames}
              value={topic}
              onChange={setTopic}
              className="-mx-5 px-5"
            />
            <div className="mt-6">
              <ArticleGrid articles={shown.map(toArticle)} />
            </div>
          </div>
        )}
      </div>
    </Screen>
  );
}
