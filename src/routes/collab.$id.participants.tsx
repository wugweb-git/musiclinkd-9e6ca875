import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BtnLink, Screen, Sheet, Chip, TopBar } from "@/components/ml/ui";
import { WorkspaceShell } from "@/components/ml/collab-workspace";
import { Card, Label, ParticipantRow, PermissionState } from "@/components/ml/collab";
import { collabRoles, getProject } from "@/data/collab";
import { TextLink } from "@/components/ml/links";

export const Route = createFileRoute("/collab/$id/participants")({
  head: ({ params }) => {
    const p = getProject(params.id);
    const title = p ? `${p.name} — collaborators & roles` : "Collaborators & roles";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content:
            "Who is on the project, what each person is responsible for, and their credit role.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        {
          property: "og:description",
          content: "Clear roles and responsibilities for every collaborator.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: Participants,
});

function Participants() {
  const { id } = Route.useParams();
  const project = getProject(id);
  const [roleSheet, setRoleSheet] = useState(false);
  const navigate = useNavigate();

  if (!project) {
    return (
      <Screen>
        <TopBar title="People" back="/collab" />
        <div className="px-5 pt-6">
          <PermissionState />
        </div>
      </Screen>
    );
  }

  const canManage = project.myRole === "Composer" || project.owner === "You";
  const active = project.participants.filter((p) => p.status === "owner" || p.status === "active");
  const pending = project.participants.filter((p) => p.status === "invited");
  const past = project.participants.filter((p) => p.status === "declined" || p.status === "left");

  return (
    <WorkspaceShell project={project} tab="participants">
      <Label>On the project · {active.length}</Label>
      {active.length === 0 ? (
        <Card className="mb-5 text-center">
          <p className="text-1 font-semibold">No collaborators yet</p>
          <p className="mt-1 text-1 text-muted-foreground">
            Add collaborators to get the project moving.
          </p>
          <BtnLink to="/collab/new/collaborators" className="mt-3 w-full">
            Add Collaborators
          </BtnLink>
        </Card>
      ) : (
        <div className="mb-5 divide-y divide-border rounded-lg border border-border bg-card px-4">
          {active.map((p) => (
            <ParticipantRow
              key={p.id}
              p={p}
              projectId={project.id}
              canManage={canManage}
              onRemove={() =>
                navigate({ to: "/collab/$id/remove/$pid", params: { id: project.id, pid: p.id } })
              }
            />
          ))}
        </div>
      )}

      {pending.length ? (
        <>
          <Label>Invited · awaiting response</Label>
          <div className="mb-5 divide-y divide-border rounded-lg border border-border bg-card px-4">
            {pending.map((p) => (
              <ParticipantRow
                key={p.id}
                p={p}
                projectId={project.id}
                canManage={canManage}
                onRemove={() =>
                  navigate({ to: "/collab/$id/remove/$pid", params: { id: project.id, pid: p.id } })
                }
              />
            ))}
          </div>
        </>
      ) : null}

      {past.length ? (
        <>
          <Label>Declined or left</Label>
          <div className="mb-5 divide-y divide-border rounded-lg border border-border bg-card px-4">
            {past.map((p) => (
              <ParticipantRow key={p.id} p={p} projectId={project.id} />
            ))}
          </div>
        </>
      ) : null}

      <Card className="mb-5">
        <p className="text-1 font-semibold">Roles and permissions</p>
        <p className="mt-1 text-1 text-muted-foreground">
          Owners manage everything. Collaborators upload and comment. Viewers can only read the
          project.
        </p>
        <button
          type="button"
          onClick={() => setRoleSheet(true)}
          className="mt-2 text-1 font-semibold text-foreground"
        >
          See the role taxonomy
        </button>
        <TextLink to="/collab/$id/roles" params={{ id: project.id }} className="mt-2 block text-1">
          Open Project Roles
        </TextLink>
      </Card>

      <TextLink
        to="/collab/$id/invite-link"
        params={{ id: project.id }}
        className="mb-5 block text-center text-1"
      >
        Invite with a Link Instead
      </TextLink>

      <div className="mb-8 flex gap-3">
        <BtnLink to="/collab/new/collaborators" className="flex-1 w-full">
          Invite More People
        </BtnLink>
        <BtnLink
          to="/collab/$id/share"
          params={{ id: project.id }}
          variant="outline"
          className="flex-1 w-full"
        >
          Share Link
        </BtnLink>
      </div>

      <Sheet open={roleSheet} onClose={() => setRoleSheet(false)} title="MusicLinkd role taxonomy">
        <div className="flex flex-wrap gap-2 pb-3">
          {collabRoles.map((r) => (
            <Chip key={r}>{r}</Chip>
          ))}
        </div>
        <p className="pb-2 text-1 text-muted-foreground">
          Roles are shared across profiles, credits and discovery so your work is searchable
          everywhere.
        </p>
      </Sheet>
    </WorkspaceShell>
  );
}
