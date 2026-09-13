import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { Card, Meter } from "@/components/ml/kit";
import { opportunityAnalytics, myOpportunities } from "@/data/opportunities";

export const Route = createFileRoute("/opportunities/$id/analytics")({
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
  const o = myOpportunities.find((x) => x.id === id);
  const a = opportunityAnalytics;
  const peak = Math.max(...a.daily);

  return (
    <Screen>
      <TopBar
        title="Performance"
        subtitle={o?.title ?? "Your opportunity"}
        back="/opportunities/mine"
      />
      <div className="space-y-4 px-5 pt-4 pb-6">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Views", value: a.views },
            { label: "Saves", value: a.saves },
            { label: "Applicants", value: a.applicants },
            { label: "View → apply", value: a.viewToApply },
          ].map((s) => (
            <Card key={s.label}>
              <p className="text-[12px] text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-[24px] font-bold leading-none">{s.value}</p>
            </Card>
          ))}
        </div>

        <Card className="space-y-3">
          <h2 className="text-[15px]">Views · last 7 days</h2>
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
          <h2 className="text-[15px]">Where views come from</h2>
          {a.sources.map((s) => (
            <Meter key={s.label} label={s.label} value={s.value} max={100} hint={`${s.value}%`} />
          ))}
        </Card>

        <Card className="space-y-1">
          <p className="text-[13px] font-semibold">Getting fewer applications than expected?</p>
          <p className="text-[12px] text-muted-foreground">
            Posts with a stated budget and 3 or fewer must-haves receive roughly three times more
            applications.
          </p>
          <BtnLink
            to="/opportunities/$id/manage"
            params={{ id }}
            variant="ghost"
            className="w-full"
          >
            Edit the post
          </BtnLink>
        </Card>
      </div>
    </Screen>
  );
}
