import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Btn, Screen, TopBar, Chip } from "@/components/ml/ui";
import { Card, Label, PermissionState, SwitchRow } from "@/components/ml/collab";
import { getProject } from "@/data/collab";
import { TextLink } from "@/components/ml/links";

export const Route = createFileRoute("/collab/$id/share")({
  head: ({ params }) => {
    const p = getProject(params.id);
    const title = p ? `Share ${p.name}` : "Share collaboration";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content:
            "Share a MusicLinkd collaboration with a link, choose what's visible and revoke access anytime.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        { property: "og:description", content: "Controlled sharing for a music collaboration." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: Share,
});

function Share() {
  const { id } = Route.useParams();
  const project = getProject(id);
  const [enabled, setEnabled] = useState(true);
  const [showFiles, setShowFiles] = useState(false);
  const [showPeople, setShowPeople] = useState(true);
  const [access, setAccess] = useState("Anyone with the link");

  if (!project) {
    return (
      <Screen>
        <TopBar title="Share" back="/collab" />
        <div className="px-5 pt-6">
          <PermissionState />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Share project" subtitle={project.name} back="/collab" />
      <main className="px-5 pt-5">
        <Card className="mb-5">
          <Label>Share link</Label>
          <p className="mb-3 break-all rounded-lg border border-border px-3 py-2 text-[12px] text-muted-foreground">
            musiclinkd.app/c/{project.id}
          </p>
          <div className="flex gap-2">
            <Btn variant="outline" className="flex-1">
              Copy Link
            </Btn>
            <Btn className="flex-1">Share</Btn>
          </div>
        </Card>

        <Label>Who can open it</Label>
        <div className="mb-5 flex flex-wrap gap-2">
          {["Anyone with the link", "Participants only", "Request to view"].map((a) => (
            <Chip key={a} active={a === access} onClick={() => setAccess(a)}>
              {a}
            </Chip>
          ))}
        </div>

        <Label>What they see</Label>
        <div className="mb-5 divide-y divide-border rounded-lg border border-border bg-card">
          <SwitchRow label="Link is active" value={enabled} onChange={setEnabled} />
          <SwitchRow label="Show collaborators" value={showPeople} onChange={setShowPeople} />
          <SwitchRow label="Show files" value={showFiles} onChange={setShowFiles} />
        </div>

        <p className="mb-6 text-[11px] text-muted-foreground">
          Turning the link off immediately revokes access for anyone who hasn't been invited
          directly.
        </p>

        <TextLink
          to="/collab/$id"
          params={{ id: project.id }}
          className="mb-8 block text-center text-[12px]"
        >
          Back to Workspace
        </TextLink>
      </main>
    </Screen>
  );
}
