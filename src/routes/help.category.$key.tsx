import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { EmptyState, Row } from "@/components/ml/kit";
import { getHelpCentre, type HelpCentre } from "@/lib/help.functions";

export const Route = createFileRoute("/help/category/$key")({
  loader: () =>
    getHelpCentre().catch((): HelpCentre => ({ ready: false, categories: [], pages: [] })),
  head: ({ params, loaderData }) => {
    const cat = loaderData?.categories.find((c) => c.key === params.key);
    const title = cat ? `${cat.label} Guides | MusicLinkd` : "Topic not found | MusicLinkd";
    const description = cat?.blurb ?? "This MusicLinkd help topic is not available.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { key } = Route.useParams();
  const centre = Route.useLoaderData();
  const cat = centre.categories.find((c) => c.key === key);
  const pages = centre.pages.filter((p) => p.category === key);

  return (
    <Screen bottomNav={false}>
      <TopBar title={cat?.label ?? "Topic"} subtitle={cat?.blurb ?? ""} back="/help" />
      <div className="space-y-2 px-5 pt-4 pb-10">
        {pages.length ? (
          pages.map((p) => (
            <Row
              key={p.slug}
              title={p.title}
              subtitle={`${p.readTime} · ${p.summary}`}
              to="/help/$slug"
              params={{ slug: p.slug }}
            />
          ))
        ) : (
          <EmptyState title="Nothing here yet" body="We are still writing guides for this topic.">
            <BtnLink to="/help" className="w-full">
              Browse All Guides
            </BtnLink>
          </EmptyState>
        )}
      </div>
    </Screen>
  );
}
