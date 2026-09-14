import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Eye, Users, Bookmark } from "lucide-react";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { Card, StatusPill, EmptyState } from "@/components/ml/kit";
import { statusTone } from "@/components/ml/opportunity";
import { myOpportunities } from "@/data/opportunities";
import { useMyDbOpportunities } from "@/hooks/use-my-opportunities";

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
  // Signed in: the user's stored opportunities follow the static ones.
  const { items } = useMyDbOpportunities();
  const list = [...myOpportunities, ...items];
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
        {list.length === 0 ? (
          <EmptyState
            title="You haven't posted yet"
            body="Post a requirement and receive applications with portfolios attached."
          >
            <BtnLink to="/opportunities/new" search={{ step: "basics" }} className="w-full">
              Post an opportunity
            </BtnLink>
          </EmptyState>
        ) : (
          list.map((o) => (
            <Card key={o.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h2 className="min-w-0 flex-1 text-[16px] leading-snug">{o.title}</h2>
                <StatusPill label={o.status} tone={statusTone(o.status)} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
                {o.applicantSummary ? (
                  <span className="inline-flex items-center gap-1">
                    <Eye size={13} /> {o.views} views
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <Users size={13} /> {o.applicants} applicants
                </span>
                {o.applicantSummary ? (
                  <span className="inline-flex items-center gap-1">
                    <Bookmark size={13} /> {o.applicantSummary.shortlisted} shortlisted
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
                    Finish draft
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
