import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Segmented, EmptyState, Loading } from "@/components/ml/kit";
import { ApplicantCard } from "@/components/ml/opportunity";
import { applicants, myOpportunities } from "@/data/opportunities";

export const Route = createFileRoute("/opportunities/$id/applicants/")({
  head: () => ({
    meta: [
      { title: "Applicants | MusicLinkd Opportunities" },
      {
        name: "description",
        content: "Review applicants with portfolios, fit scores and verification, then shortlist.",
      },
      { property: "og:title", content: "Applicants | MusicLinkd Opportunities" },
      {
        property: "og:description",
        content: "Shortlist music professionals who applied to your opportunity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Applicants,
});

const tabs = ["All", "Shortlisted", "New"] as const;

function Applicants() {
  const { id } = Route.useParams();
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [loading] = useState(false);
  const o = myOpportunities.find((x) => x.id === id);
  const all = applicants.filter((a) => a.opportunityId === id);
  const list = all.filter((a) =>
    tab === "All"
      ? true
      : tab === "Shortlisted"
        ? a.status === "shortlisted"
        : a.status === "submitted",
  );

  return (
    <Screen>
      <TopBar
        title="Applicants"
        subtitle={o?.title ?? "Your opportunity"}
        back="/opportunities/mine"
      />
      <div className="space-y-4 px-5 pt-4 pb-4">
        <Segmented value={tab} options={tabs} onChange={setTab} />
        {loading ? (
          <Loading rows={3} />
        ) : list.length === 0 ? (
          <EmptyState
            title="No applicants here yet"
            body="Sharing your opportunity in a conversation or on your profile usually doubles applications."
          >
            <Link to="/opportunities/$id/analytics" params={{ id }}>
              <Btn variant="outline" className="w-full">
                See performance
              </Btn>
            </Link>
          </EmptyState>
        ) : (
          list.map((a) => <ApplicantCard key={a.id} a={a} />)
        )}
      </div>
    </Screen>
  );
}
