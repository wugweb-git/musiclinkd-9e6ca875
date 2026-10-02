import { StateCard } from "@/components/ml/kit";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Btn, BtnLink, Screen, TopBar } from "@/components/ml/ui";
import { PortfolioSkeleton, WorkAnalytics } from "@/components/ml/portfolio";
import {
  analyticsFor,
  demoPortfolio,
  portfolioTotals,
  portfolioTrend,
  type PortfolioItem,
} from "@/data/portfolio";
import { SignalLine } from "@/components/charts/recharts/line-signal";
import { listMyPortfolio, myPortfolioPlays } from "@/lib/portfolio.functions";
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

/** A number that is counted, or an em-dash for one that is not. */
const show = (n: number | null) => (n === null ? "—" : n.toLocaleString("en-IN"));

function PortfolioAnalytics() {
  const { signedIn } = useAuth();
  const fetchItems = useServerFn(listMyPortfolio);
  const q = useQuery({
    queryKey: ["portfolio", "mine"],
    queryFn: () => fetchItems() as Promise<PortfolioItem[]>,
    enabled: signedIn,
  });
  const items: PortfolioItem[] = signedIn ? (q.data ?? []) : demoPortfolio;

  // Plays are counted in the database, over the same 30 days the screen is titled with.
  const fetchPlays = useServerFn(myPortfolioPlays);
  const plays = useQuery({
    queryKey: ["portfolio", "plays", 30],
    queryFn: () => fetchPlays({ data: { days: 30 } }),
    enabled: signedIn,
  });
  const playsFor = (id: string) => (signedIn ? (plays.data?.[id] ?? null) : analyticsFor(id).plays);

  const totals = signedIn
    ? {
        views: null,
        plays: plays.data ? items.reduce((n, i) => n + (plays.data?.[i.id] ?? 0), 0) : null,
        shares: null,
        saves: null,
        profileClicks: null,
        linkClicks: null,
      }
    : portfolioTotals(items.map((i) => i.id));

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
            {signedIn ? null : (
              /*
               * Signed out, every figure and every work on this screen is made up (demoPortfolio,
               * analyticsFor, portfolioTrend). The signed-in view has always said its numbers are
               * untracked; this one said nothing at all, so a visitor had no way to tell they were
               * looking at an example rather than somebody's real performance.
               */
              <p className="mb-3 rounded-lg bg-warn-container px-3 py-2 text-1 text-warn-strong">
                An example, not real data. Sign in to see how your own work is doing.
              </p>
            )}
            <WorkAnalytics figures={totals} playsNote={signedIn} />

            {/* The same 30 days as the totals above, drawn. */}
            <section className="mt-6">
              <h2 className="text-2">Views over time</h2>
              <div className="mt-3 rounded-lg bg-subtle p-3">
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
                  action={
                    <BtnLink to="/portfolio" search={{ add: "1" }}>
                      Add Work
                    </BtnLink>
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
                    className="block rounded-lg bg-subtle p-4"
                  >
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-1 text-muted-foreground">
                      {show(signedIn ? null : a.views)} views · {show(playsFor(item.id))} plays ·{" "}
                      {show(signedIn ? null : a.saves)} saves ·{" "}
                      {show(signedIn ? null : a.profileClicks)} profile clicks
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
