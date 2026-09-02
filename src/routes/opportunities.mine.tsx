import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Eye, Users, Bookmark } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, StatusPill, EmptyState } from "@/components/ml/kit";
import { statusTone } from "@/components/ml/opportunity";
import { myOpportunities } from "@/data/opportunities";

export const Route = createFileRoute("/opportunities/mine")({
  head: () => ({
    meta: [
      { title: "My opportunities | MusicLinkd" },
      { name: "description", content: "Opportunities you posted — applicants, drafts, analytics and closing." },
      { property: "og:title", content: "My opportunities | MusicLinkd" },
      { property: "og:description", content: "Manage the requirements you posted on MusicLinkd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyOpportunities,
});

function MyOpportunities() {
  return (
    <Screen>
      <TopBar
        title="My opportunities"
        subtitle="Posted by you"
        back="/opportunities"
        right={
          <Link
            to="/opportunities/new"
            search={{ step: "basics" }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-label="New opportunity"
          >
            <Plus size={18} />
          </Link>
        }
      />
      <div className="space-y-3 px-5 pt-4 pb-4">
        {myOpportunities.length === 0 ? (
          <EmptyState title="You haven't posted yet" body="Post a requirement and receive applications with portfolios attached.">
            <Link to="/opportunities/new" search={{ step: "basics" }}>
              <Btn className="w-full">Post an opportunity</Btn>
            </Link>
          </EmptyState>
        ) : (
          myOpportunities.map((o) => (
            <Card key={o.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h2 className="min-w-0 flex-1 text-[16px] leading-snug">{o.title}</h2>
                <StatusPill label={o.status} tone={statusTone(o.status)} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Eye size={13} /> {o.views} views
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users size={13} /> {o.applicants} applicants
                </span>
                <span className="inline-flex items-center gap-1">
                  <Bookmark size={13} /> {o.applicantSummary.shortlisted} shortlisted
                </span>
              </div>
              <div className="flex gap-2">
                {o.status === "draft" ? (
                  <Link to="/opportunities/new" search={{ step: "preview" }} className="flex-1">
                    <Btn className="w-full">Finish draft</Btn>
                  </Link>
                ) : (
                  <Link to="/opportunities/$id/applicants" params={{ id: o.id }} className="flex-1">
                    <Btn className="w-full">
                      Applicants{o.applicantSummary.new ? ` · ${o.applicantSummary.new} new` : ""}
                    </Btn>
                  </Link>
                )}
                <Link to="/opportunities/$id/manage" params={{ id: o.id }} className="flex-1">
                  <Btn variant="outline" className="w-full">
                    Manage
                  </Btn>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </Screen>
  );
}
