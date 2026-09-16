import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { WorkspaceShell } from "@/components/ml/collab-workspace";
import { Card, Label } from "@/components/ml/collab";
import { DeletedState } from "@/components/ml/collab-extra";
import { getProject } from "@/data/collab";

export const Route = createFileRoute("/collab/$id/agreement")({
  head: ({ params }) => {
    const p = getProject(params.id);
    const title = p ? `Working agreement — ${p.name}` : "Working agreement";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content:
            "Scope, roles, timeline, compensation, ownership and credit for a MusicLinkd collaboration, agreed between collaborators.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        { property: "og:description", content: "What everyone agreed before the work started." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: AgreementScreen,
});

function AgreementScreen() {
  const { id } = Route.useParams();
  const project = getProject(id);

  if (!project) {
    return (
      <Screen>
        <TopBar title="Agreement" back="/collab" />
        <div className="px-5 pt-6">
          <DeletedState />
        </div>
      </Screen>
    );
  }

  const a = project.agreement;

  return (
    <WorkspaceShell project={project} tab="overview">
      <Label>Working agreement</Label>
      {!a ? (
        <Card className="mb-5 text-center">
          <p className="text-[13px] font-semibold">No agreement recorded yet</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Capture scope, timeline, compensation and credit so everyone is working from the same
            understanding.
          </p>
        </Card>
      ) : (
        <>
          <Card className="mb-4">
            <Label>Scope</Label>
            <p className="mb-4 text-[13px]">{a.scope}</p>
            <Label>Deliverables</Label>
            <ul className="mb-4 space-y-1.5">
              {a.deliverables.map((d) => (
                <li key={d} className="text-[13px]">
                  · {d}
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Timeline</Label>
                <p className="text-[13px]">{a.timeline}</p>
              </div>
              <div>
                <Label>Compensation</Label>
                <p className="text-[13px]">{a.compensation}</p>
              </div>
              <div>
                <Label>Ownership</Label>
                <p className="text-[13px]">{a.ownership}</p>
              </div>
              <div>
                <Label>Credit</Label>
                <p className="text-[13px]">{a.credit}</p>
              </div>
            </div>
          </Card>

          <Card className="mb-5">
            <Label>Roles covered</Label>
            {project.participants.map((p) => (
              <p key={p.id} className="text-[12px] text-muted-foreground">
                {p.role} — {p.name}
              </p>
            ))}
          </Card>
        </>
      )}

      <p className="mb-6 text-[11px] text-muted-foreground">
        This is a working agreement between collaborators on MusicLinkd, not a legal contract.
      </p>

      <div className="mb-8 flex gap-3">
        <BtnLink
          to="/collab/$id/roles"
          params={{ id: project.id }}
          variant="outline"
          className="flex-1 w-full"
        >
          View Roles
        </BtnLink>
        <BtnLink to="/collab/$id/settings" params={{ id: project.id }} className="flex-1 w-full">
          Project Settings
        </BtnLink>
      </div>
    </WorkspaceShell>
  );
}
