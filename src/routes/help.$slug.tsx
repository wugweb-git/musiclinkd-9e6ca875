import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, EmptyState, Row, StatusPill } from "@/components/ml/kit";
import { getPage } from "@/data/cms";

export const Route = createFileRoute("/help/$slug")({
  head: ({ params }) => {
    const page = getPage(params.slug);
    const title = page ? `${page.title} | MusicLinkd` : "Guide not found | MusicLinkd";
    const description = page?.summary ?? "This MusicLinkd guide is no longer available.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(page ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  component: HelpPage,
});

function HelpPage() {
  const { slug } = Route.useParams();
  const page = getPage(slug);

  if (!page) {
    return (
      <Screen bottomNav={false}>
        <TopBar title="Not found" back="/help" />
        <div className="px-5 pt-6">
          <EmptyState
            title="This page has moved"
            body="The guide you followed is no longer published. Search the help centre for the current version."
          >
            <Link to="/help">
              <Btn className="w-full">Back to help</Btn>
            </Link>
          </EmptyState>
        </div>
      </Screen>
    );
  }

  return (
    <Screen bottomNav={false}>
      <TopBar title={page.category.replace("-", " ")} back="/help" />
      <article className="space-y-4 px-5 pt-4 pb-10">
        <header className="space-y-2">
          <StatusPill label={page.kind} tone={page.kind === "policy" ? "warn" : "brand"} />
          <h1 className="text-[26px] font-bold leading-tight">{page.title}</h1>
          <p className="text-[13px] text-muted-foreground">{page.summary}</p>
          <p className="text-[11px] text-muted-foreground">
            {page.readTime} · {page.updated}
          </p>
        </header>

        <div className="space-y-4">
          {page.blocks.map((b, i) => {
            if (b.type === "heading")
              return (
                <h2 key={i} className="pt-1 text-[17px]">
                  {b.text}
                </h2>
              );
            if (b.type === "para")
              return (
                <p key={i} className="text-[14px] leading-relaxed text-muted-foreground">
                  {b.text}
                </p>
              );
            if (b.type === "list")
              return (
                <ul key={i} className="space-y-2">
                  {b.items.map((it) => (
                    <li
                      key={it}
                      className="flex gap-2.5 text-[14px] leading-relaxed text-muted-foreground"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span className="min-w-0">{it}</span>
                    </li>
                  ))}
                </ul>
              );
            if (b.type === "callout")
              return (
                <Card key={i} className="bg-subtle">
                  <p className="text-[13px] leading-relaxed">{b.text}</p>
                </Card>
              );
            return (
              <Link key={i} {...b.link} className="block">
                <Btn className="w-full">{b.label}</Btn>
              </Link>
            );
          })}
        </div>

        {page.related.length ? (
          <section className="pt-2">
            <h2 className="text-[15px]">Related</h2>
            <div className="mt-3 space-y-2">
              {page.related.map((r) => {
                const rel = getPage(r);
                if (!rel) return null;
                return (
                  <Row
                    key={r}
                    title={rel.title}
                    subtitle={rel.readTime}
                    to="/help/$slug"
                    params={{ slug: r }}
                  />
                );
              })}
            </div>
          </section>
        ) : null}
      </article>
    </Screen>
  );
}
