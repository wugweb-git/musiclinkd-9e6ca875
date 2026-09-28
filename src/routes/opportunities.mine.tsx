import { createFileRoute } from "@tanstack/react-router";
import { Plus, Eye, Users, Bookmark } from "lucide-react";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { Card, StatusPill, EmptyState } from "@/components/ml/kit";
import { statusTone } from "@/components/ml/opportunity";
import { useMyDbOpportunities } from "@/hooks/use-my-opportunities";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/opportunities/mine")({
  head: () => ({
    meta: [
      { title: "My opportunities | MusicLinkd" },
      {
        name: "description",
        content: "Opportunities you posted — applicants, drafts, analytics and closing.",
      },
      { property: "og:title", content: "My opportunities | MusicLinkd" },
      { property: "og:description", content: "Manage the requirements you posted on MusicLinkd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyOpportunities,
});

function MyOpportunities() {
  // What this account posted, and nothing else.
  const { items: list } = useMyDbOpportunities();
  return (
    <Screen>
      <TopBar
        title="My opportunities"
        subtitle="Posted by you"
        back="/opportunities"
        right={
          <BtnLink
            to="/opportunities/new"
            search={{ step: "basics" }}
            variant="ink"
            className="min-h-10 px-4"
            icon={<Plus size={iconSize.sm} aria-hidden />}
          >
            New
          </BtnLink>
        }
      />
      <div className="space-y-3 px-5 pt-4 pb-4">
        {list.length === 0 ? (
          <EmptyState
            title="You haven't posted yet"
            body="Post a requirement and receive applications with portfolios attached."
          >
            <BtnLink to="/opportunities/new" search={{ step: "basics" }} className="w-full">
              Post an Opportunity
            </BtnLink>
          </EmptyState>
        ) : (
          list.map((o) => (
            <Card key={o.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h2 className="min-w-0 flex-1 text-2 leading-snug">{o.title}</h2>
                <StatusPill label={o.status} tone={statusTone(o.status)} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-1 text-muted-foreground">
                {o.applicantSummary ? (
                  <span className="inline-flex items-center gap-1">
                    <Eye size={iconSize.xs} /> {o.views} views
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <Users size={iconSize.xs} /> {o.applicants} applicants
                </span>
                {o.applicantSummary ? (
                  <span className="inline-flex items-center gap-1">
                    <Bookmark size={iconSize.xs} /> {o.applicantSummary.shortlisted} shortlisted
                  </span>
                ) : null}
              </div>
              <div className="flex gap-2">
                {o.status === "draft" ? (
                  <BtnLink
                    to="/opportunities/new"
                    search={{ step: "preview" }}
                    className="flex-1 w-full"
                  >
                    Finish Draft
                  </BtnLink>
                ) : (
                  <BtnLink
                    to="/opportunities/$id/applicants"
                    params={{ id: o.id }}
                    className="flex-1 w-full"
                  >
                    Applicants{o.applicantSummary?.new ? ` · ${o.applicantSummary.new} new` : ""}
                  </BtnLink>
                )}
                <BtnLink
                  to="/opportunities/$id/manage"
                  params={{ id: o.id }}
                  variant="outline"
                  className="flex-1 w-full"
                >
                  Manage
                </BtnLink>
              </div>
            </Card>
          ))
        )}
      </div>
    </Screen>
  );
}
