import { createFileRoute, Link } from "@tanstack/react-router";
import { BtnLink } from "@/components/ml/ui";
import { WorkspaceShell } from "@/components/ml/collab-workspace";
import {
  Card,
  Label,
  PermissionState,
  PinnedNote,
  ParticipantStack,
  MilestoneRow,
  FileRow,
  ActivityItem,
  Tag,
} from "@/components/ml/collab";
import { getProject } from "@/data/collab";
import { Screen, TopBar } from "@/components/ml/ui";

export const Route = createFileRoute("/collab/$id/")({
  head: ({ params }) => {
    const p = getProject(params.id);
    const title = p ? `${p.name} — collaboration workspace` : "Collaboration workspace";
    const description = p
      ? `${p.type} collaboration with ${p.participants.length} people. ${p.description}`
      : "A MusicLinkd collaboration workspace.";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        { name: "description", content: description.slice(0, 155) },
        { property: "og:title", content: `${title} | MusicLinkd` },
        { property: "og:description", content: description.slice(0, 155) },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: Overview,
});

function Overview() {
  const { id } = Route.useParams();
  const project = getProject(id);

  if (!project) {
    return (
      <Screen>
        <TopBar title="Collaboration" back="/collab" />
        <div className="px-5 pt-6">
          <PermissionState />
        </div>
      </Screen>
    );
  }

  const pinned = project.notes.find((n) => n.pinned);
  const nextMilestone = project.milestones.find((m) => m.status !== "done");

  return (
    <WorkspaceShell project={project} tab="overview">
      {project.status === "onHold" && project.holdReason ? (
        <div
          className="mb-4 rounded-lg px-4 py-3 text-1 font-semibold"
          style={{ background: "var(--warn-container)", color: "var(--warn)" }}
        >
          On hold — {project.holdReason}
        </div>
      ) : null}
      {project.status === "cancelled" && project.cancelledReason ? (
        <div className="mb-4 rounded-lg border border-border px-4 py-3 text-1 text-muted-foreground">
          Cancelled — {project.cancelledReason}
        </div>
      ) : null}
      {project.status === "completed" && project.completedOn ? (
        <div
          className="mb-4 rounded-lg px-4 py-3 text-1 font-semibold"
          style={{ background: "var(--success-container)", color: "var(--success)" }}
        >
          Completed on {project.completedOn}
        </div>
      ) : null}

      <img src={project.artwork} alt="" className="mb-4 h-40 w-full rounded-lg object-cover" />

      <div className="mb-4 flex flex-wrap gap-2">
        <Tag>{project.type}</Tag>
        <Tag>{project.mode}</Tag>
        <Tag>{project.location}</Tag>
        {project.budget ? <Tag tone="ok">{project.budget}</Tag> : null}
      </div>

      <p className="mb-5 text-1 leading-relaxed text-muted-foreground">{project.description}</p>

      {pinned ? (
        <PinnedNote>
          {pinned.title} — {pinned.body}
        </PinnedNote>
      ) : null}

      <Card className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-1 font-semibold">Progress</p>
          <span className="text-1 font-bold text-foreground">{project.progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <p className="mt-2 text-0 text-muted-foreground">
          {nextMilestone
            ? `Next: ${nextMilestone.name} · due ${nextMilestone.due}`
            : "All milestones done"}
        </p>
      </Card>

      <Label>People</Label>
      <Link to="/collab/$id/participants" params={{ id: project.id }}>
        <Card className="mb-5">
          <div className="flex items-center justify-between">
            <ParticipantStack people={project.participants} />
            <span className="text-0 font-semibold text-foreground">
              {project.participants.length} collaborators
            </span>
          </div>
        </Card>
      </Link>

      <Label>Milestones</Label>
      <div className="mb-5 divide-y divide-border rounded-lg border border-border bg-card px-4">
        {project.milestones.slice(0, 3).map((m) => (
          <MilestoneRow key={m.id} m={m} projectId={project.id} />
        ))}
      </div>

      <Label>Recent files</Label>
      <div className="mb-5 divide-y divide-border rounded-lg border border-border bg-card px-4">
        {project.files.slice(0, 3).map((f) => (
          <FileRow key={f.id} file={f} projectId={project.id} />
        ))}
      </div>

      <Label>Latest activity</Label>
      <div className="mb-6 rounded-lg border border-border bg-card px-4 py-2">
        {project.activity.slice(0, 4).map((a) => (
          <ActivityItem key={a.id} a={a} />
        ))}
      </div>

      <div className="mb-8 flex gap-3">
        <BtnLink to="/messages" variant="outline" className="flex-1 w-full">
          Open Messages
        </BtnLink>
        <BtnLink to="/collab/$id/discussion" params={{ id: project.id }} className="flex-1 w-full">
          Post an Update
        </BtnLink>
      </div>
    </WorkspaceShell>
  );
}
