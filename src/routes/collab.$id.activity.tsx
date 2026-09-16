import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/ml/ui";
import { WorkspaceShell } from "@/components/ml/collab-workspace";
import { ActivityItem, EmptyState, Label, PermissionState } from "@/components/ml/collab";
import { getProject } from "@/data/collab";

export const Route = createFileRoute("/collab/$id/activity")({
  head: ({ params }) => {
    const p = getProject(params.id);
    const title = p ? `${p.name} — project activity` : "Project activity";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content:
            "A chronological log of everything that happened inside a MusicLinkd collaboration.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        { property: "og:description", content: "See who did what, and when." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: Activity,
});

function Activity() {
  const { id } = Route.useParams();
  const project = getProject(id);

  if (!project) {
    return (
      <Screen>
        <TopBar title="Activity" back="/collab" />
        <div className="px-5 pt-6">
          <PermissionState />
        </div>
      </Screen>
    );
  }

  return (
    <WorkspaceShell project={project} tab="activity">
      {project.activity.length === 0 ? (
        <EmptyState
          title="No activity yet"
          body="Activity appears as people join, upload and complete work."
        />
      ) : (
        <>
          <Label>All activity</Label>
          <div className="mb-8 rounded-lg bg-subtle px-4 py-2">
            {project.activity.map((a) => (
              <ActivityItem key={a.id} a={a} />
            ))}
          </div>
        </>
      )}
    </WorkspaceShell>
  );
}
