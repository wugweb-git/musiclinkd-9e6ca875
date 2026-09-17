import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { Card, Meter } from "@/components/ml/kit";
import { opportunityAnalytics, myOpportunities, getOpportunity } from "@/data/opportunities";
import { loadDbOpportunity } from "@/lib/opportunity-view";
import { getOpportunityViewStats } from "@/lib/applications.functions";

export const Route = createFileRoute("/opportunities/$id/analytics")({
  // Ids that are not static opportunities are looked up as stored opportunity slugs.
  loader: async ({ params }) => ({
    db:
      myOpportunities.some((x) => x.id === params.id) || getOpportunity(params.id)
        ? null
        : await loadDbOpportunity(params.id),
  }),
  head: () => ({
    meta: [
      { title: "Opportunity performance | MusicLinkd" },
      {
        name: "description",
        content: "Views, saves, applications and where your opportunity is being seen.",
      },
      { property: "og:title", content: "Opportunity performance | MusicLinkd" },
      { property: "og:description", content: "How your posted requirement is performing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OpportunityAnalytics,
});

function OpportunityAnalytics() {
  const { id } = Route.useParams();
  const { db } = Route.useLoaderData();
  const posted = myOpportunities.find((x) => x.id === id);
  const o = posted ?? db ?? undefined;
  // A stored opportunity's views come from opportunity_views, a real table; the static demo
  // opportunities below keep their illustrative figures since they are not real posts.
  const stored = !posted && db != null;
  const a = opportunityAnalytics;
  const peak = Math.max(...a.daily);

  const readStats = useServerFn(getOpportunityViewStats);
  const stats = useQuery({
    queryKey: ["opportunity-views", id],
    queryFn: () => readStats({ data: { slug: id } }),
    enabled: stored,
  });
  const totalViews = stats.data?.totalViews ?? 0;
  const daily = stats.data?.daily ?? [0, 0, 0, 0, 0, 0, 0];
  const peakReal = Math.max(1, ...daily);
  const applicants = o?.applicants ?? 0;
  const viewToApply = totalViews > 0 ? `${Math.round((applicants / totalViews) * 100)}%` : "—";

  return (
    <Screen>
      <TopBar
        title="Performance"
        subtitle={o?.title ?? "Your opportunity"}
        back="/opportunities/mine"
      />
      <div className="space-y-4 px-5 pt-4 pb-6">
        <div className="grid grid-cols-2 gap-2">
          {(stored
            ? [
                { label: "Views", value: stats.isLoading ? "—" : totalViews },
                { label: "Applicants", value: applicants },
                { label: "View → apply", value: stats.isLoading ? "—" : viewToApply },
              ]
            : [
                { label: "Views", value: a.views },
                { label: "Saves", value: a.saves },
                { label: "Applicants", value: a.applicants },
                { label: "View → apply", value: a.viewToApply },
              ]
          ).map((s) => (
            <Card key={s.label}>
              <p className="text-1 text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-3 font-bold leading-none">{s.value}</p>
            </Card>
          ))}
        </div>

        {stored ? (
          <Card className="space-y-3">
            <h2 className="text-sm">Views · last 7 days</h2>
            <div className="flex h-28 items-end gap-2">
              {daily.map((d, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-lg bg-primary/80"
                  style={{ height: `${(d / peakReal) * 100}%` }}
                  aria-label={`${d} views`}
                />
              ))}
            </div>
          </Card>
        ) : (
          <>
            <Card className="space-y-3">
              <h2 className="text-sm">Views · last 7 days</h2>
              <div className="flex h-28 items-end gap-2">
                {a.daily.map((d, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-lg bg-primary/80"
                    style={{ height: `${(d / peak) * 100}%` }}
                    aria-label={`${d} views`}
                  />
                ))}
              </div>
            </Card>

            <Card className="space-y-3">
              <h2 className="text-sm">Where views come from</h2>
              {a.sources.map((s) => (
                <Meter
                  key={s.label}
                  label={s.label}
                  value={s.value}
                  max={100}
                  hint={`${s.value}%`}
                />
              ))}
            </Card>
          </>
        )}

        <Card className="space-y-1">
          <p className="text-1 font-semibold">Getting fewer applications than expected?</p>
          <p className="text-1 text-muted-foreground">
            Posts with a stated budget and 3 or fewer must-haves receive roughly three times more
            applications.
          </p>
          <BtnLink
            to="/opportunities/$id/manage"
            params={{ id }}
            variant="ghost"
            className="w-full"
          >
            Edit the Post
          </BtnLink>
        </Card>
      </div>
    </Screen>
  );
}
