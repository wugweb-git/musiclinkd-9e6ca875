import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, Label, Tag } from "@/components/ml/collab";
import { DeletedState } from "@/components/ml/collab-extra";
import { getProject, milestoneMeta } from "@/data/collab";
import { TextLink } from "@/components/ml/links";

export const Route = createFileRoute("/collab/$id/milestones/$mid")({
  head: ({ params }) => {
    const p = getProject(params.id);
    const m = p?.milestones.find((x) => x.id === params.mid);
    const title = m ? `${m.name} — milestone` : "Milestone";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content: m
            ? `${m.description} Owned by ${m.owner}, due ${m.due}.`.slice(0, 155)
            : "A milestone on a MusicLinkd collaboration, with owner, deadline, status and notes.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        { property: "og:description", content: "Milestone detail for a music collaboration." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: MilestoneDetail,
});

function MilestoneDetail() {
  const { id, mid } = Route.useParams();
  const project = getProject(id);
  const milestone = project?.milestones.find((m) => m.id === mid);
  const [done, setDone] = useState(milestone?.status === "done");

  if (!project || !milestone) {
    return (
      <Screen>
        <TopBar title="Milestone" back="/collab" />
        <div className="px-5 pt-6">
          <DeletedState body="This milestone has been removed from the project." />
        </div>
      </Screen>
    );
  }

  const meta = milestoneMeta[milestone.status];

  return (
    <Screen>
      <TopBar title="Milestone" subtitle={project.name} back="/collab" />
      <main className="px-5 pt-5">
        <Card className="mb-5">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h1 className="text-2 font-semibold">{milestone.name}</h1>
            <Tag tone={done ? "ok" : meta.tone}>{done ? "Done" : meta.label}</Tag>
          </div>
          <p className="text-1 text-muted-foreground">{milestone.description}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <Label>Owner</Label>
              <p className="text-1">{milestone.owner}</p>
            </div>
            <div>
              <Label>Deadline</Label>
              <p className="text-1">{milestone.due}</p>
            </div>
          </div>
          {milestone.notes ? (
            <>
              <Label>Notes</Label>
              <p className="text-1 text-muted-foreground">{milestone.notes}</p>
            </>
          ) : null}
        </Card>

        <div className="mb-5 flex gap-3">
          <Btn variant="outline" className="flex-1" onClick={() => setDone(!done)}>
            {done ? "Reopen" : "Mark complete"}
          </Btn>
          <BtnLink
            to="/collab/$id/milestones/new"
            params={{ id: project.id }}
            className="flex-1 w-full"
          >
            Edit Milestone
          </BtnLink>
        </div>

        <p className="mb-5 text-0 text-muted-foreground">
          Only the project owner and the milestone owner can edit or complete this milestone.
        </p>

        <TextLink
          to="/collab/$id/timeline"
          params={{ id: project.id }}
          className="mb-8 block text-center text-1"
        >
          Back to Timeline
        </TextLink>
      </main>
    </Screen>
  );
}
