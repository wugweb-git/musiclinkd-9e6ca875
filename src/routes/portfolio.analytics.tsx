import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Btn, TopBar } from "@/components/ml/ui";
import { PortfolioSkeleton, StateCard, WorkAnalytics } from "@/components/ml/portfolio";
import { analyticsFor, demoPortfolio, portfolioTotals, type PortfolioItem } from "@/data/portfolio";
import { listMyPortfolio } from "@/lib/portfolio.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/portfolio/analytics")({
  head: () => ({
    meta: [
      { title: "Portfolio performance — MusicLinkd" },
      {
        name: "description",
        content:
          "See how your work performs: views, plays, saves, shares and the profile clicks it drives.",
      },
      { property: "og:title", content: "Portfolio performance — MusicLinkd" },
      {
        property: "og:description",
        content: "Views, plays, saves, shares and profile clicks across your published work.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PortfolioAnalytics,
});

function PortfolioAnalytics() {
  const { signedIn } = useAuth();
  const fetchItems = useServerFn(listMyPortfolio);
  const q = useQuery({
    queryKey: ["portfolio", "mine"],
    queryFn: () => fetchItems() as Promise<PortfolioItem[]>,
    enabled: signedIn,
  });
  const items: PortfolioItem[] = signedIn ? (q.data ?? []) : demoPortfolio;
  const totals = portfolioTotals(items.map((i) => i.id));

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-background pb-28">
      <TopBar title="Portfolio performance" subtitle="Last 30 days" back="/portfolio" />
      <main className="px-5 pt-4">
        {signedIn && q.isLoading ? <PortfolioSkeleton /> : null}

        {signedIn && q.isError ? (
          <StateCard
            tone="error"
            title="We couldn't load performance"
            body="Your work is safe — this is only the reporting view."
            action={<Btn onClick={() => q.refetch()}>Retry</Btn>}
          />
        ) : null}

        {!q.isLoading && !q.isError ? (
          <>
            <WorkAnalytics figures={totals} />

            <h2 className="mt-7 text-[17px]">By work</h2>
            <div className="mt-3 space-y-3">
              {items.length === 0 ? (
                <StateCard
                  title="Nothing to measure yet"
                  body="Publish your first work and performance data starts collecting."
                  action={
                    <Link to="/portfolio/new">
                      <Btn>Add work</Btn>
                    </Link>
                  }
                />
              ) : null}
              {items.map((item) => {
                const a = analyticsFor(item.id);
                return (
                  <Link
                    key={item.id}
                    to="/portfolio/$id"
                    params={{ id: item.id }}
                    className="block rounded-lg border border-border bg-card p-4"
                  >
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.views.toLocaleString("en-IN")} views · {a.plays.toLocaleString("en-IN")}{" "}
                      plays · {a.saves} saves · {a.profileClicks} profile clicks
                    </p>
                  </Link>
                );
              })}
            </div>
            <p className="mt-6 text-[11px] text-muted-foreground">
              Figures are canonical MusicLinkd analytics. This screen only reads them.
            </p>
          </>
        ) : null}
      </main>
    </div>
  );
}
