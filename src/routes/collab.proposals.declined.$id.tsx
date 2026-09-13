import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { DeletedState, OutcomePanel } from "@/components/ml/collab-extra";
import { getProposal } from "@/data/collab";

export const Route = createFileRoute("/collab/proposals/declined/$id")({
  head: ({ params }) => {
    const p = getProposal(params.id);
    const title = p ? `Proposal declined — ${p.projectName}` : "Proposal declined";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content:
            "This collaboration proposal was declined. You can still message, send a counter proposal or return to your collaborations.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        { property: "og:description", content: "Proposal closed on MusicLinkd." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: ProposalDeclined,
});

function ProposalDeclined() {
  const { id } = Route.useParams();
  const proposal = getProposal(id);

  if (!proposal) {
    return (
      <Screen>
        <TopBar title="Proposal" back="/collab" />
        <div className="px-5 pt-6">
          <DeletedState body="This proposal is no longer available." />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Proposal declined" subtitle={proposal.projectName} back="/collab" />
      <main className="px-5 pt-5">
        <OutcomePanel
          tone="off"
          title="Proposal declined"
          body={`No collaboration was created for ${proposal.projectName}. Nothing is shared and no one else is notified.`}
        />

        <div className="mb-8 flex gap-3">
          <BtnLink to="/messages" variant="outline" className="flex-1 w-full">
            Message {proposal.from.split(" ")[0]}
          </BtnLink>
          <BtnLink to="/collab" className="flex-1 w-full">
            Back to collaborations
          </BtnLink>
        </div>
      </main>
    </Screen>
  );
}
