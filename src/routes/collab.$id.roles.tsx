import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { WorkspaceShell } from "@/components/ml/collab-workspace";
import { Card, Label, Tag } from "@/components/ml/collab";
import { DeletedState } from "@/components/ml/collab-extra";
import { getProject } from "@/data/collab";

export const Route = createFileRoute("/collab/$id/roles")({
  head: ({ params }) => {
    const p = getProject(params.id);
    const title = p ? `Roles on ${p.name}` : "Project roles";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content:
            "Who holds which role on this MusicLinkd collaboration, what they're responsible for and where each role stands.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        {
          property: "og:description",
          content:
            "Canonical music roles — composer, vocalist, producer, mixing and mastering engineer.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: Roles,
});

function Roles() {
  const { id } = Route.useParams();
  const project = getProject(id);

  if (!project) {
    return (
      <Screen>
        <TopBar title="Roles" back="/collab" />
        <div className="px-5 pt-6">
          <DeletedState />
        </div>
      </Screen>
    );
  }

  return (
    <WorkspaceShell project={project} tab="participants">
      <Label>Roles on this project</Label>
      {project.participants.length === 0 ? (
        <Card className="mb-5 text-center">
          <p className="text-1 font-semibold">No roles assigned yet</p>
          <p className="mt-1 text-1 text-muted-foreground">
            Add collaborators and give each of them a role so credits stay accurate.
          </p>
        </Card>
      ) : (
        <div className="mb-5 divide-y divide-border rounded-lg bg-subtle px-4">
          {project.participants.map((p) => (
            <div key={p.id} className="flex items-start gap-3 py-4">
              <img src={p.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{p.role}</p>
                  <Tag
                    tone={
                      p.status === "invited"
                        ? "warn"
                        : p.status === "owner"
                          ? "info"
                          : p.status === "active"
                            ? "ok"
                            : "off"
                    }
                  >
                    {p.status === "owner" ? "Owner" : p.status === "invited" ? "Invited" : "Active"}
                  </Tag>
                </div>
                <p className="text-1 text-muted-foreground">{p.name}</p>
                <p className="mt-1 text-1 text-muted-foreground">{p.responsibility}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mb-5 text-1 text-muted-foreground">
        Roles come from the shared MusicLinkd taxonomy, so completed work carries the same credit
        across profiles, portfolios and search.
      </p>

      <div className="mb-8 flex gap-3">
        <BtnLink
          to="/collab/$id/participants"
          params={{ id: project.id }}
          variant="outline"
          className="flex-1 w-full"
        >
          Manage People
        </BtnLink>
        <BtnLink to="/collab/$id/agreement" params={{ id: project.id }} className="flex-1 w-full">
          View Agreement
        </BtnLink>
      </div>
    </WorkspaceShell>
  );
}
