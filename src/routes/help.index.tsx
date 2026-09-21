import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarCheck, type LucideIcon, Rocket, Scale, ShieldCheck, Store } from "lucide-react";
import { Screen, TopBar, SearchBar } from "@/components/ml/ui";
import { EmptyState, Row } from "@/components/ml/kit";
import { ArticleGrid, TopicFilter, type Article } from "@/components/ml/marketing";
import { ContactSupport } from "@/components/ml/help";
import { TextLink } from "@/components/ml/links";
import { getHelpCentre, searchHelp, type HelpCentre, type HelpPage } from "@/lib/help.functions";

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
  // Topics and guides come from cms_categories / cms_pages; before the help migration the centre
  // is empty and says so.
  loader: () =>
    getHelpCentre().catch((): HelpCentre => ({ ready: false, categories: [], pages: [] })),
  component: HelpIndex,
});

/** The site pages from cms_pages, linked under the help centre. */
const sitePages = [
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/legal/privacy", label: "Privacy" },
  { to: "/legal/terms", label: "Terms" },
  { to: "/legal/cookies", label: "Cookies" },
] as const;

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
function toArticle(p: HelpPage): Article {
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

/** Popular guides lead "All" in their rank order; the rest keep their written order. */
function popularFirst(pages: HelpPage[]) {
  const popular = pages
    .filter((p) => p.popularRank != null)
    .sort((a, b) => (a.popularRank ?? 0) - (b.popularRank ?? 0));
  return [...popular, ...pages.filter((p) => p.popularRank == null)];
}

function HelpIndex() {
  const centre = Route.useLoaderData();
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("All");
  const results = q.trim() ? searchHelp(centre, q) : [];
  const ordered = popularFirst(centre.pages);
  const topicNames = ["All", ...centre.categories.map((c) => topicOf(c.key))];
  const shown = ordered.filter((p) => topic === "All" || topicOf(p.category) === topic);

  return (
    <Screen>
      <TopBar title="Help & guides" subtitle="Written for working musicians" back="/profile" />
      <div className="space-y-4 px-5 pt-4">
        <SearchBar value={q} onChange={setQ} placeholder="Search guides, policies and answers" />

        {!centre.ready ? (
          <EmptyState
            title="Help isn't available yet"
            body="Guides and answers will show here once the help centre is published."
          />
        ) : q.trim() ? (
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

        {centre.ready ? <ContactSupport categories={centre.categories} /> : null}

        <footer className="flex flex-wrap justify-center gap-x-5 gap-y-2 pb-8 pt-2">
          {sitePages.map((p) => (
            <TextLink key={p.to} to={p.to} className="text-1 text-muted-foreground">
              {p.label}
            </TextLink>
          ))}
        </footer>
      </div>
    </Screen>
  );
}
