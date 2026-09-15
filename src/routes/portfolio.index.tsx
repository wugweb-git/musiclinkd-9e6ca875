import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Settings } from "lucide-react";
import { Btn, BtnLink, IconBtnLink, TopBar } from "@/components/ml/ui";
import { PortfolioHeader, PortfolioSkeleton, StateCard, WorkCard } from "@/components/ml/portfolio";
import { demoPortfolio, roleSuggestions, type PortfolioItem } from "@/data/portfolio";
import { listMyPortfolio } from "@/lib/portfolio.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/portfolio/")({
  head: () => ({
    meta: [
      { title: "Your portfolio — MusicLinkd" },
      {
        name: "description",
        content:
          "Publish the tracks, projects, performances and credits that prove what you've done in music.",
      },
      { property: "og:title", content: "Your portfolio — MusicLinkd" },
      {
        property: "og:description",
        content: "Show the work you're proud of — tracks, projects, performances and credits.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PortfolioOverview,
});

function PortfolioOverview() {
  const { signedIn, loading: authLoading } = useAuth();
  const fetchItems = useServerFn(listMyPortfolio);
  const q = useQuery({
    queryKey: ["portfolio", "mine"],
    queryFn: () => fetchItems() as Promise<PortfolioItem[]>,
    enabled: signedIn,
  });

  const items: PortfolioItem[] = signedIn ? (q.data ?? []) : demoPortfolio;
  const published = items.filter((i) => i.published);
  const featured = items.slice(0, 3);
  // Nothing to manage yet: the empty state's Add work is the one action.
  const empty = signedIn && !q.isLoading && !q.isError && items.length === 0;
  // Counts and tools wait for the list, so a new user never sees a row of zeros flash first.
  const showTools = !empty && !(signedIn && (q.isLoading || authLoading));

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-app bg-background pb-32">
      <TopBar
        title="Your portfolio"
        subtitle="Show the work you're proud of"
        back="/me"
        right={
          <IconBtnLink to="/portfolio/settings" label="Portfolio settings" variant="plain">
            <Settings size={20} aria-hidden />
          </IconBtnLink>
        }
      />

      <main className="px-5 pt-4">
        {showTools ? (
          <>
            <PortfolioHeader
              total={items.length}
              published={published.length}
              drafts={items.length - published.length}
              featured={featured.length}
            />

            <div className="mt-4 flex flex-wrap gap-2">
              <BtnLink to="/portfolio/new">Add work</BtnLink>
              <BtnLink to="/portfolio/reorder" variant="outline">
                Reorder
              </BtnLink>
              <BtnLink to="/portfolio/analytics" variant="outline">
                Performance
              </BtnLink>
              <BtnLink to="/portfolio/select" variant="outline">
                Share work
              </BtnLink>
              <BtnLink to="/me" variant="outline">
                Preview on profile
              </BtnLink>
            </div>
          </>
        ) : null}

        {items.length > featured.length ? (
          <>
            <h2 className="mt-7 text-2">Featured</h2>
            <div className="mt-3 space-y-3">
              {featured.map((item) => (
                <WorkCard key={`f-${item.id}`} item={item} />
              ))}
            </div>
          </>
        ) : null}

        {empty ? null : <h2 className="mt-7 text-2">All work</h2>}
        <div className="mt-3 space-y-3">
          {signedIn && (q.isLoading || authLoading) ? <PortfolioSkeleton /> : null}

          {signedIn && q.isError ? (
            <StateCard
              tone="error"
              title="We couldn't load your portfolio"
              body="Something went wrong on our side. Your work is safe."
              action={<Btn onClick={() => q.refetch()}>Retry</Btn>}
            />
          ) : null}

          {empty ? (
            <StateCard
              title="Your work belongs here"
              body={roleSuggestions["default"]!}
              action={<BtnLink to="/portfolio/new">Add work</BtnLink>}
            />
          ) : null}

          {items.map((item) => (
            <WorkCard key={item.id} item={item} />
          ))}
        </div>
      </main>
    </div>
  );
}
