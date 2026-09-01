import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, Label, ParticipantStack } from "@/components/ml/collab";
import { DeletedState, OutcomePanel } from "@/components/ml/collab-extra";
import { getInvitation, getProject } from "@/data/collab";

export const Route = createFileRoute("/collab/invites/accepted/$id")({
  head: ({ params }) => {
    const inv = getInvitation(params.id);
    const title = inv ? `You joined ${inv.projectName}` : "Invitation accepted";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content:
            "You've accepted a collaboration invitation. See your role, the other participants and open the project workspace.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        { property: "og:description", content: "You're now collaborating on MusicLinkd." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: InvitationAccepted,
});

function InvitationAccepted() {
  const { id } = Route.useParams();
  const inv = getInvitation(id);
  const project = inv ? getProject(inv.projectId) : undefined;

  if (!inv) {
    return (
      <Screen>
        <TopBar title="Invitation" back="/collab" />
        <div className="px-5 pt-6">
          <DeletedState body="This invitation is no longer available." />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Invitation accepted" subtitle={inv.projectName} back="/collab" />
      <main className="px-5 pt-5">
        <img src={inv.artwork} alt="" className="mb-4 h-36 w-full rounded-3xl object-cover" />
        <OutcomePanel
          title={`You're now collaborating on ${inv.projectName}`}
          body={`${inv.inviter} has been told you're in. Your role is ${inv.proposedRole}.`}
        />

        <Card className="mb-5">
          <Label>Your role</Label>
          <p className="mb-3 text-[13px]">{inv.proposedRole}</p>
          <Label>Timeline</Label>
          <p className="mb-3 text-[13px]">{inv.timeline}</p>
          <Label>Participants</Label>
          {project ? (
            <div className="flex items-center justify-between">
              <ParticipantStack people={project.participants} />
              <span className="text-[11px] font-semibold text-primary">
                {project.participants.length} collaborators
              </span>
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground">You and {inv.inviter}</p>
          )}
        </Card>

        <div className="mb-8 flex gap-3">
          <Link to="/messages" className="flex-1">
            <Btn variant="outline" className="w-full">
              Message
            </Btn>
          </Link>
          {project ? (
            <Link to="/collab/$id" params={{ id: project.id }} className="flex-1">
              <Btn className="w-full">Open project</Btn>
            </Link>
          ) : (
            <Link to="/collab" className="flex-1">
              <Btn className="w-full">Open collaborations</Btn>
            </Link>
          )}
        </div>
      </main>
    </Screen>
  );
}
