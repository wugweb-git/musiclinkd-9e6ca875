import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { EmptyState, Row, StatusPill } from "@/components/ml/kit";
import { ContactSupport, ContentBlocks, HelpFeedback } from "@/components/ml/help";
import { getHelpArticle, getHelpCentre, type HelpCategory } from "@/lib/help.functions";

export const Route = createFileRoute("/help/$slug")({
  // The guide from cms_pages; anything unpublished, missing or unreadable is the "moved" page.
  loader: async ({ params }) => {
    const [article, centre] = await Promise.all([
      getHelpArticle({ data: { slug: params.slug } }).catch(() => null),
      getHelpCentre().catch(() => null),
    ]);
    return { article, categories: (centre?.categories ?? []) as HelpCategory[] };
  },
  head: ({ loaderData }) => {
    const page = loaderData?.article?.page;
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
  const { article, categories } = Route.useLoaderData();
  const page = article?.page;

  if (!article || !page) {
    return (
      <Screen bottomNav={false}>
        <TopBar title="Not found" back="/help" />
        <div className="px-5 pt-6">
          <EmptyState
            title="This page has moved"
            body="The guide you followed is no longer published. Search the help centre for the current version."
          >
            <BtnLink to="/help" className="w-full">
              Back to Help
            </BtnLink>
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
          <h1 className="text-3 font-bold leading-tight">{page.title}</h1>
          <p className="text-1 text-muted-foreground">{page.summary}</p>
          <p className="text-1 text-muted-foreground">
            {page.readTime} · {page.updated}
          </p>
        </header>

        <ContentBlocks blocks={page.blocks} />

        {article.related.length ? (
          <section className="pt-2">
            <h2 className="text-sm">Related</h2>
            <div className="mt-3 space-y-2">
              {article.related.map((rel) => (
                <Row
                  key={rel.slug}
                  title={rel.title}
                  subtitle={rel.readTime}
                  to="/help/$slug"
                  params={{ slug: rel.slug }}
                />
              ))}
            </div>
          </section>
        ) : null}

        <HelpFeedback slug={page.slug} />

        <ContactSupport categories={categories} pageSlug={page.slug} defaultTopic={page.category} />
      </article>
    </Screen>
  );
}
