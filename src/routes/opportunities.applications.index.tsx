import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Segmented, EmptyState, Loading } from "@/components/ml/kit";
import { ApplicationCard } from "@/components/ml/opportunity";
import { myApplications, getOpportunity } from "@/data/opportunities";

export const Route = createFileRoute("/opportunities/applications/")({
  head: () => ({
    meta: [
      { title: "My applications | MusicLinkd" },
      {
        name: "description",
        content:
          "Track every opportunity you applied to — viewed, shortlisted, accepted or closed.",
      },
      { property: "og:title", content: "My applications | MusicLinkd" },
      {
        property: "og:description",
        content: "Application status across music-industry opportunities.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Applications,
});

const tabs = ["Active", "Shortlisted", "Closed"] as const;

function Applications() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Active");
  const [loading] = useState(false);

  const list = myApplications.filter((a) =>
    tab === "Active"
      ? ["submitted", "viewed", "shortlisted"].includes(a.status)
      : tab === "Shortlisted"
        ? a.status === "shortlisted"
        : ["rejected", "withdrawn", "accepted"].includes(a.status),
  );

  return (
    <Screen>
      <TopBar
        title="My applications"
        subtitle="Applications never expire silently"
        back="/opportunities"
      />
      <div className="space-y-4 px-5 pt-4">
        <Segmented value={tab} options={tabs} onChange={setTab} />
        {loading ? (
          <Loading rows={3} />
        ) : list.length === 0 ? (
          <EmptyState
            title="Nothing here"
            body="Apply to an opportunity and you'll be able to track it from this screen."
          >
            <Link to="/opportunities">
              <Btn className="w-full">Find opportunities</Btn>
            </Link>
          </EmptyState>
        ) : (
          <div className="space-y-3 pb-4">
            {list.map((a) => {
              const o = getOpportunity(a.opportunityId);
              return <ApplicationCard key={a.id} a={a} {...(o ? { o } : {})} />;
            })}
          </div>
        )}
      </div>
    </Screen>
  );
}
