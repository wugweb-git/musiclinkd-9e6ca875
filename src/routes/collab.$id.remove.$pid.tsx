import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, StickyBar } from "@/components/ml/collab";
import { ConfirmPanel, DeletedState, OutcomePanel } from "@/components/ml/collab-extra";
import { getProject } from "@/data/collab";

export const Route = createFileRoute("/collab/$id/remove/$pid")({
  head: ({ params }) => {
    const p = getProject(params.id);
    const person = p?.participants.find((x) => x.id === params.pid);
    const title = person ? `Remove ${person.name}` : "Remove collaborator";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content:
            "Remove a collaborator from a MusicLinkd project, with a clear summary of what they keep and what they lose.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        { property: "og:description", content: "Only the project owner can remove collaborators." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: RemoveCollaborator,
});

function RemoveCollaborator() {
  const { id, pid } = Route.useParams();
  const project = getProject(id);
  const person = project?.participants.find((p) => p.id === pid);
  const [removed, setRemoved] = useState(false);

  if (!project || !person) {
    return (
      <Screen>
        <TopBar title="Remove collaborator" back="/collab" />
        <div className="px-5 pt-6">
          <DeletedState body="This collaborator is no longer on the project." />
        </div>
      </Screen>
    );
  }

  const canManage = person.status !== "owner";

  return (
    <Screen bottomNav={false}>
      <TopBar title="Remove collaborator" subtitle={project.name} back="/collab" />
      <main className="px-5 pt-5">
        <Card className="mb-5">
          <div className="flex items-center gap-3">
            <img src={person.photo} alt="" className="h-12 w-12 rounded-full object-cover" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold">{person.name}</p>
              <p className="truncate text-[12px] text-muted-foreground">
                {person.role} · {person.responsibility}
              </p>
            </div>
          </div>
        </Card>

        {!canManage ? (
          <Card className="mb-5">
            <p className="text-[13px] font-semibold">The project owner can't be removed</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Transfer ownership first if the owner needs to step away.
            </p>
            <BtnLink
              to="/collab/$id/transfer"
              params={{ id: project.id }}
              variant="outline"
              className="mt-3 w-full"
            >
              Transfer Ownership
            </BtnLink>
          </Card>
        ) : removed ? (
          <OutcomePanel
            tone="off"
            title="Collaborator removed"
            body={`${person.name} no longer has access to ${project.name}.`}
          >
            <BtnLink to="/collab/$id/participants" params={{ id: project.id }} className="w-full">
              Back to People
            </BtnLink>
          </OutcomePanel>
        ) : (
          <ConfirmPanel
            title={`Remove ${person.name}?`}
            body="Only the project owner and managers can remove a collaborator."
            consequences={[
              "They lose access to the workspace, files and discussion",
              "Their uploaded files and past contributions stay on the project",
              "Credits already agreed are kept in the project record",
              "They are notified that they were removed",
            ]}
          />
        )}
      </main>
      {canManage && !removed ? (
        <StickyBar>
          <div className="flex gap-3">
            <BtnLink
              to="/collab/$id/participants"
              params={{ id: project.id }}
              variant="outline"
              className="flex-1 w-full"
            >
              Cancel
            </BtnLink>
            <Btn className="flex-1" onClick={() => setRemoved(true)}>
              Remove
            </Btn>
          </div>
        </StickyBar>
      ) : null}
    </Screen>
  );
}
