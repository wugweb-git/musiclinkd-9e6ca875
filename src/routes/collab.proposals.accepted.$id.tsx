import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { Card, Label, ProposalSummary } from "@/components/ml/collab";
import { DeletedState, OutcomePanel } from "@/components/ml/collab-extra";
import { getProject, getProposal } from "@/data/collab";

export const Route = createFileRoute("/collab/proposals/accepted/$id")({
  head: ({ params }) => {
    const p = getProposal(params.id);
    const title = p ? `Proposal accepted — ${p.projectName}` : "Proposal accepted";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content:
            "The collaboration is confirmed: role, timeline, compensation and participants are agreed and the project workspace is open.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        { property: "og:description", content: "Collaboration confirmed on MusicLinkd." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: ProposalAccepted,
});

function ProposalAccepted() {
  const { id } = Route.useParams();
  const proposal = getProposal(id);
  const project = proposal ? getProject(proposal.projectId) : undefined;

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
      <TopBar title="Collaboration confirmed" subtitle={proposal.projectName} back="/collab" />
      <main className="px-5 pt-5">
        <OutcomePanel
          title="Collaboration confirmed"
          body={`You and ${proposal.from} are now working together on ${proposal.projectName}.`}
        />

        <Card className="mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Role</Label>
              <p className="text-[13px]">{proposal.role}</p>
            </div>
            <div>
              <Label>Timeline</Label>
              <p className="text-[13px]">{proposal.timeline}</p>
            </div>
            <div>
              <Label>Compensation</Label>
              <p className="text-[13px]">{proposal.compensation}</p>
            </div>
            <div>
              <Label>Participants</Label>
              <p className="text-[13px]">
                {project ? `${project.participants.length} people` : "2 people"}
              </p>
            </div>
          </div>
        </Card>

        <Label>What was agreed</Label>
        <div className="mb-5">
          <ProposalSummary p={proposal} />
        </div>

        <div className="mb-8 flex gap-3">
          <BtnLink to="/messages" variant="outline" className="flex-1 w-full">
            Message
          </BtnLink>
          {project ? (
            <BtnLink to="/collab/$id" params={{ id: project.id }} className="flex-1 w-full">
              Open project
            </BtnLink>
          ) : (
            <BtnLink to="/collab" className="flex-1 w-full">
              Open collaborations
            </BtnLink>
          )}
        </div>
      </main>
    </Screen>
  );
}
