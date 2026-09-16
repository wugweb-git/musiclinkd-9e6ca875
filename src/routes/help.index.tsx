import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Screen, TopBar, SearchBar } from "@/components/ml/ui";
import { Card, EmptyState, Row, StatusPill } from "@/components/ml/kit";
import { contentCategories, contentPages, popularSlugs, getPage } from "@/data/cms";

export const Route = createFileRoute("/help/")({
  head: () => ({
    meta: [
      { title: "Help & Guides | MusicLinkd" },
      {
        name: "description",
        content:
          "Guides, policies and answers for profiles, bookings, marketplace, verification and payouts on MusicLinkd.",
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

function HelpIndex() {
  const [q, setQ] = useState("");
  const results = q
    ? contentPages.filter((p) =>
        `${p.title} ${p.summary} ${p.category}`.toLowerCase().includes(q.toLowerCase()),
      )
    : [];

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
            <EmptyState
              title="No results"
              body="Try a shorter search, or browse the categories below."
            />
          )
        ) : (
          <>
            <section>
              <h2 className="text-sm">Popular right now</h2>
              <div className="mt-3 space-y-2">
                {popularSlugs.map((slug) => {
                  const p = getPage(slug);
                  if (!p) return null;
                  return (
                    <Link key={slug} to="/help/$slug" params={{ slug }} className="block">
                      <Card className="space-y-1.5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="min-w-0 flex-1 text-sm leading-tight">{p.title}</h3>
                          <StatusPill
                            label={p.kind}
                            tone={p.kind === "policy" ? "warn" : "brand"}
                          />
                        </div>
                        <p className="line-clamp-2 text-1 text-muted-foreground">{p.summary}</p>
                        <p className="text-1 text-muted-foreground">
                          {p.readTime} · {p.updated}
                        </p>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="pb-4">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-primary" aria-hidden />
                <h2 className="text-sm">Browse by topic</h2>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {contentCategories.map((c) => (
                  <Link
                    key={c.key}
                    to="/help/category/$key"
                    params={{ key: c.key }}
                    className="rounded-[20px] border border-border bg-card p-4"
                  >
                    <p className="truncate text-1 font-semibold">{c.label}</p>
                    <p className="mt-1 line-clamp-2 text-1 text-muted-foreground">{c.blurb}</p>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </Screen>
  );
}
