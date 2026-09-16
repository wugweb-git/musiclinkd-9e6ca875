import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar, Btn, Chip } from "@/components/ml/ui";
import { Card, Label, SwitchRow } from "@/components/ml/collab";
import { DeletedState } from "@/components/ml/collab-extra";
import { collabRoles, getProject } from "@/data/collab";
import { TextLink } from "@/components/ml/links";

export const Route = createFileRoute("/collab/$id/invite-link")({
  head: ({ params }) => {
    const p = getProject(params.id);
    const title = p ? `Invite link — ${p.name}` : "Project invite link";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content:
            "Create, share or disable a controlled invite link so a collaborator can join this MusicLinkd project.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        {
          property: "og:description",
          content: "Controlled invitations for a music collaboration.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: InviteLink,
});

function InviteLink() {
  const { id } = Route.useParams();
  const project = getProject(id);
  const [active, setActive] = useState(true);
  const [approve, setApprove] = useState(true);
  const [role, setRole] = useState<string>("Musician");

  if (!project) {
    return (
      <Screen>
        <TopBar title="Invite link" back="/collab" />
        <div className="px-5 pt-6">
          <DeletedState />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Invite collaborator" subtitle={project.name} back="/collab" />
      <main className="px-5 pt-5">
        <Card className="mb-5">
          <Label>Invite link</Label>
          <p
            className={`mb-3 break-all rounded-lg border border-border px-3 py-2 text-1 ${
              active ? "text-muted-foreground" : "text-muted-foreground line-through"
            }`}
          >
            musiclinkd.app/join/{project.id}-8f2c
          </p>
          <div className="flex gap-2">
            <Btn variant="outline" className="flex-1">
              Copy Link
            </Btn>
            <Btn className="flex-1">Share</Btn>
          </div>
        </Card>

        <Label>Role offered by this link</Label>
        <div className="mb-5 flex flex-wrap gap-2">
          {collabRoles.map((r) => (
            <Chip key={r} active={r === role} onClick={() => setRole(r)}>
              {r}
            </Chip>
          ))}
        </div>

        <div className="mb-5 divide-y divide-border rounded-lg border border-border bg-card">
          <SwitchRow label="Link is active" value={active} onChange={setActive} />
          <SwitchRow label="Owner approves each join" value={approve} onChange={setApprove} />
        </div>

        <p className="mb-5 text-1 text-muted-foreground">
          Invite links are not permanently open. Disable the link and anyone who hasn't already
          joined loses access immediately.
        </p>

        <Btn variant="outline" className="mb-5 w-full" onClick={() => setActive(false)}>
          Disable Link
        </Btn>

        <TextLink
          to="/collab/$id/participants"
          params={{ id: project.id }}
          className="mb-8 block text-center text-1"
        >
          Invite Someone from MusicLinkd Instead
        </TextLink>
      </main>
    </Screen>
  );
}
