import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Btn, BtnLink, Screen, TopBar } from "@/components/ml/ui";
import { PortfolioSkeleton, StateCard, WorkAnalytics } from "@/components/ml/portfolio";
import {
  analyticsFor,
  demoPortfolio,
  portfolioTotals,
  portfolioTrend,
  type PortfolioItem,
} from "@/data/portfolio";
import { SignalLine } from "@/components/charts/recharts/line-signal";
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
    <Screen bottomNav={false} className="pb-28">
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

            {/* The same 30 days as the totals above, drawn. */}
            <section className="mt-6">
              <h2 className="text-2">Views over time</h2>
              <div className="mt-3 rounded-lg border border-border bg-card p-3">
                <SignalLine
                  /* Sample series, so it belongs to the signed-out demo only. A real account
                     shows the chart's own empty state until there is an analytics table. */
                  data={signedIn ? [] : portfolioTrend}
                  xKey="day"
                  seriesKey="views"
                  series={{ key: "views", label: "Work views" }}
                  height={200}
                  color="var(--color-ink)"
                  title="Work views over the last 30 days"
                  emptyContent={
                    <div className="flex h-[200px] items-center justify-center text-center text-1 text-muted-foreground">
                      Views appear here once your published work starts collecting them.
                    </div>
                  }
                />
              </div>
            </section>

            <h2 className="mt-7 text-2">By work</h2>
            <div className="mt-3 space-y-3">
              {items.length === 0 ? (
                <StateCard
                  title="Nothing to measure yet"
                  body="Publish your first work and performance data starts collecting."
                  action={<BtnLink to="/portfolio/new">Add Work</BtnLink>}
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
                    <p className="mt-1 text-1 text-muted-foreground">
                      {a.views.toLocaleString("en-IN")} views · {a.plays.toLocaleString("en-IN")}{" "}
                      plays · {a.saves} saves · {a.profileClicks} profile clicks
                    </p>
                  </Link>
                );
              })}
            </div>
            <p className="mt-6 text-1 text-muted-foreground">
              Figures are canonical MusicLinkd analytics. This screen only reads them.
            </p>
          </>
        ) : null}
      </main>
    </Screen>
  );
}
