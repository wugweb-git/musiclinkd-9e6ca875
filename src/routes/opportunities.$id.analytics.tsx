import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Btn, Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { Card, LoadError, Meter } from "@/components/ml/kit";
import { loadDbOpportunity } from "@/lib/opportunity-view";
import {
  getOpportunitySaveCount,
  getOpportunityViewSources,
  getOpportunityViewStats,
} from "@/lib/applications.functions";

export const Route = createFileRoute("/opportunities/$id/analytics")({
  // The id is a stored opportunity slug.
  loader: async ({ params }) => ({ db: await loadDbOpportunity(params.id) }),
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

/** The screen a view came from, as the poster reads it. */
const SOURCE_LABEL: Record<string, string> = {
  discover: "Discover",
  search: "Search",
  profile: "Profile",
  opportunities: "Opportunities",
  direct: "Direct link",
  other: "Elsewhere",
};

function OpportunityAnalytics() {
  const { id } = Route.useParams();
  const { db } = Route.useLoaderData();
  const o = db ?? undefined;
  // Views come from opportunity_views; the stats read is empty for anyone but the poster.
  const stored = db != null;

  const readStats = useServerFn(getOpportunityViewStats);
  const stats = useQuery({
    queryKey: ["opportunity-views", id],
    queryFn: () => readStats({ data: { slug: id } }),
    enabled: stored,
  });
  const totalViews = stats.data?.totalViews ?? 0;
  const daily = stats.data?.daily ?? [0, 0, 0, 0, 0, 0, 0];
  const peakReal = Math.max(1, ...daily);
  // Saves are saved_items rows for this opportunity; sources are where each view was opened from
  // (opportunity_views.source). Both are read only for the poster.
  const readSaves = useServerFn(getOpportunitySaveCount);
  const saves = useQuery({
    queryKey: ["opportunity-saves", id],
    queryFn: () => readSaves({ data: { slug: id } }),
    enabled: stored,
  });
  const readSources = useServerFn(getOpportunityViewSources);
  const sources = useQuery({
    queryKey: ["opportunity-view-sources", id],
    queryFn: () => readSources({ data: { slug: id } }),
    enabled: stored,
  });
  const sourced = (sources.data ?? []).reduce((sum, s) => sum + s.views, 0);
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
        {/* A failed read is an error, never zero views (P0: no counts that aren't real). */}
        {stats.isError || saves.isError || sources.isError ? (
          <LoadError
            what="these numbers"
            action={
              <Btn
                variant="outline"
                onClick={() => {
                  void stats.refetch();
                  void saves.refetch();
                  void sources.refetch();
                }}
              >
                Try again
              </Btn>
            }
          />
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Views", value: stats.isLoading || stats.isError ? "—" : totalViews },
            { label: "Saves", value: saves.data ?? "—" },
            { label: "Applicants", value: applicants },
            {
              label: "View → apply",
              value: stats.isLoading || stats.isError ? "—" : viewToApply,
            },
          ].map((s) => (
            <Card key={s.label}>
              <p className="text-1 text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-3 font-bold leading-none">{s.value}</p>
            </Card>
          ))}
        </div>

        <Card className="space-y-3">
          <h2 className="text-sm">Views · last 7 days</h2>
          <div className="flex h-28 items-end gap-2">
            {daily.map((d, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-lg bg-ink/80"
                style={{ height: `${(d / peakReal) * 100}%` }}
                aria-label={`${d} views`}
              />
            ))}
          </div>
        </Card>

        {sourced ? (
          <Card className="space-y-3">
            <h2 className="text-sm">Where views come from</h2>
            {(sources.data ?? []).map((s) => {
              const share = Math.round((s.views / sourced) * 100);
              return (
                <Meter
                  key={s.source}
                  label={SOURCE_LABEL[s.source] ?? "Elsewhere"}
                  value={share}
                  max={100}
                  hint={`${share}%`}
                />
              );
            })}
          </Card>
        ) : null}

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
