import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Btn, TopBar } from "@/components/ml/ui";
import {
  PortfolioSkeleton,
  SignedOutCard,
  StateCard,
  WorkCard,
} from "@/components/ml/portfolio";
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

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-background pb-32">
      <TopBar
        title="Your portfolio"
        subtitle="Show the work you're proud of"
        back="/me"
        right={
          <Link to="/portfolio/settings" aria-label="Portfolio settings" className="text-xl">
            ⚙︎
          </Link>
        }
      />

      <main className="px-5 pt-4">
        <section className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[28px] leading-none tabular-nums">{items.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {published.length} published · {items.length - published.length} draft
              </p>
            </div>
            <Link to="/portfolio/new">
              <Btn>Add work</Btn>
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/portfolio/reorder">
              <Btn variant="outline">Reorder</Btn>
            </Link>
            <Link to="/me">
              <Btn variant="outline">Preview on profile</Btn>
            </Link>
          </div>
        </section>

        {!signedIn && !authLoading ? (
          <div className="mt-5">
            <SignedOutCard />
          </div>
        ) : null}

        <h2 className="mt-7 text-[17px]">Work</h2>
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

          {!q.isLoading && !q.isError && items.length === 0 ? (
            <StateCard
              title="Your work belongs here"
              body={roleSuggestions["default"]!}
              action={
                <Link to="/portfolio/new">
                  <Btn>Add work</Btn>
                </Link>
              }
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
