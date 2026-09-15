import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { TopBar } from "@/components/ml/ui";
import { PortfolioSkeleton, StateCard } from "@/components/ml/portfolio";
import { WorkForm } from "@/components/ml/work-form";
import { getMyPortfolioItem } from "@/lib/portfolio.functions";
import type { PortfolioItem } from "@/data/portfolio";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/portfolio/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit work — MusicLinkd portfolio" },
      {
        name: "description",
        content:
          "Update the title, credits, media, metadata and visibility of this portfolio work.",
      },
      { property: "og:title", content: "Edit work — MusicLinkd portfolio" },
      { property: "og:description", content: "Update details, credits and visibility." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditWork,
});

function EditWork() {
  const { id } = Route.useParams();
  const { signedIn } = useAuth();
  const fetchItem = useServerFn(getMyPortfolioItem);
  const q = useQuery({
    queryKey: ["portfolio", "item", id],
    queryFn: () => fetchItem({ data: { id } }) as Promise<PortfolioItem | null>,
    enabled: signedIn,
  });

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-app bg-background pb-32">
      <TopBar title="Edit work" back="/portfolio" />
      <main className="px-5 pt-4">
        {q.isLoading ? <PortfolioSkeleton /> : null}
        {!q.isLoading && !q.data ? (
          <StateCard
            title="You can't edit this work"
            body="It may have been removed, or you don't have permission to edit it."
          />
        ) : null}
        {q.data ? <WorkForm kind={q.data.kind} initial={q.data} signedIn={signedIn} /> : null}
      </main>
    </div>
  );
}
