import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar, Btn, Chip } from "@/components/ml/ui";
import { Card, Label, StickyBar } from "@/components/ml/collab";
import { ConfirmPanel, DeletedState, OutcomePanel } from "@/components/ml/collab-extra";
import { getProject } from "@/data/collab";

export const Route = createFileRoute("/collab/$id/transfer")({
  head: ({ params }) => {
    const p = getProject(params.id);
    const title = p ? `Transfer ownership — ${p.name}` : "Transfer ownership";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content:
            "Hand ownership of a MusicLinkd collaboration to another participant, with a clear summary of what changes.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        { property: "og:description", content: "Change who owns and administers this music project." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: Transfer,
});

function Transfer() {
  const { id } = Route.useParams();
  const project = getProject(id);
  const eligible = project?.participants.filter((p) => p.status === "active") ?? [];
  const [next, setNext] = useState(eligible[0]?.name ?? "");
  const [done, setDone] = useState(false);

  if (!project) {
    return (
      <Screen>
        <TopBar title="Transfer ownership" back="/collab" />
        <div className="px-5 pt-6">
          <DeletedState />
        </div>
      </Screen>
    );
  }

  return (
    <Screen bottomNav={false}>
      <TopBar title="Transfer ownership" subtitle={project.name} back="/collab" />
      <main className="px-5 pt-5">
        {done ? (
          <OutcomePanel
            title="Ownership transferred"
            body={`${next} now owns ${project.name}. You stay on the project as a collaborator.`}
          >
            <Link to="/collab/$id" params={{ id: project.id }}>
              <Btn className="w-full">Open project</Btn>
            </Link>
          </OutcomePanel>
        ) : (
          <>
            <Card className="mb-5">
              <Label>Current owner</Label>
              <p className="text-[14px] font-semibold">{project.owner}</p>
            </Card>

            <Label>New owner</Label>
            {eligible.length === 0 ? (
              <Card className="mb-5">
                <p className="text-[12px] text-muted-foreground">
                  Ownership can only move to an active participant. Add someone to the project first.
                </p>
              </Card>
            ) : (
              <div className="mb-5 flex flex-wrap gap-2">
                {eligible.map((p) => (
                  <Chip key={p.id} active={p.name === next} onClick={() => setNext(p.name)}>
                    {p.name}
                  </Chip>
                ))}
              </div>
            )}

            <ConfirmPanel
              title="Transfer ownership?"
              body="Ownership controls settings, participants, agreements and the project lifecycle."
              consequences={[
                "The new owner can change settings, remove people and complete or cancel the project",
                "You keep your role, credits and files",
                "Everyone on the project is notified of the change",
              ]}
            />
          </>
        )}
      </main>
      {!done ? (
        <StickyBar>
          <div className="flex gap-3">
            <Link to="/collab/$id/settings" params={{ id: project.id }} className="flex-1">
              <Btn variant="outline" className="w-full">
                Cancel
              </Btn>
            </Link>
            <Btn className="flex-1" onClick={() => setDone(true)}>
              Transfer
            </Btn>
          </div>
        </StickyBar>
      ) : null}
    </Screen>
  );
}
