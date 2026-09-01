import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar, Chip } from "@/components/ml/ui";
import { Card, Label, PermissionState, RowLink, SwitchRow } from "@/components/ml/collab";
import { getProject } from "@/data/collab";

export const Route = createFileRoute("/collab/$id/settings")({
  head: ({ params }) => {
    const p = getProject(params.id);
    const title = p ? `${p.name} — project settings` : "Project settings";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content: "Visibility, notifications, agreements and lifecycle controls for a MusicLinkd collaboration.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        { property: "og:description", content: "Control who sees the project and how it ends." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: Settings,
});

const visibilities: { key: string; label: string; hint: string }[] = [
  { key: "private", label: "Private", hint: "Only you can see this project." },
  { key: "participants", label: "Participants", hint: "Everyone invited can see it." },
  { key: "public", label: "Public", hint: "Visible on profiles and in discovery once completed." },
];

function Settings() {
  const { id } = Route.useParams();
  const project = getProject(id);
  const [visibility, setVisibility] = useState(project?.visibility ?? "participants");
  const [notifyFiles, setNotifyFiles] = useState(true);
  const [notifyMilestones, setNotifyMilestones] = useState(true);
  const [notifyDiscussion, setNotifyDiscussion] = useState(false);
  const [showCredits, setShowCredits] = useState(true);

  if (!project) {
    return (
      <Screen>
        <TopBar title="Settings" back="/collab" />
        <div className="px-5 pt-6">
          <PermissionState />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Project settings" subtitle={project.name} back="/collab" />
      <main className="px-5 pt-5">
        <Label>Visibility</Label>
        <div className="mb-2 flex flex-wrap gap-2">
          {visibilities.map((v) => (
            <Chip
              key={v.key}
              active={v.key === visibility}
              onClick={() => setVisibility(v.key as typeof visibility)}
            >
              {v.label}
            </Chip>
          ))}
        </div>
        <p className="mb-5 text-[11px] text-muted-foreground">
          {visibilities.find((v) => v.key === visibility)?.hint}
        </p>

        <Label>Notifications</Label>
        <div className="mb-5 divide-y divide-border rounded-3xl border border-border bg-card">
          <SwitchRow label="New files" value={notifyFiles} onChange={setNotifyFiles} />
          <SwitchRow label="Milestone updates" value={notifyMilestones} onChange={setNotifyMilestones} />
          <SwitchRow label="Every discussion post" value={notifyDiscussion} onChange={setNotifyDiscussion} />
        </div>

        <Label>Credits</Label>
        <div className="mb-5 divide-y divide-border rounded-3xl border border-border bg-card">
          <SwitchRow label="Show credits on my profile" value={showCredits} onChange={setShowCredits} />
          <RowLink title="Manage sharing link" to="/collab/$id/share" params={{ id: project.id }} />
        </div>

        {project.agreement ? (
          <>
            <Label>Agreement</Label>
            <Card className="mb-5">
              <p className="text-[13px] font-semibold">Scope</p>
              <p className="mb-3 text-[12px] text-muted-foreground">{project.agreement.scope}</p>
              <p className="text-[13px] font-semibold">Deliverables</p>
              <ul className="mb-3 list-disc pl-5 text-[12px] text-muted-foreground">
                {project.agreement.deliverables.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              <p className="text-[12px] text-muted-foreground">
                <span className="font-semibold text-foreground">Timeline:</span> {project.agreement.timeline}
              </p>
              <p className="text-[12px] text-muted-foreground">
                <span className="font-semibold text-foreground">Compensation:</span>{" "}
                {project.agreement.compensation}
              </p>
              <p className="text-[12px] text-muted-foreground">
                <span className="font-semibold text-foreground">Ownership:</span> {project.agreement.ownership}
              </p>
              <p className="text-[12px] text-muted-foreground">
                <span className="font-semibold text-foreground">Credit:</span> {project.agreement.credit}
              </p>
              <p className="mt-3 text-[11px] text-muted-foreground">
                This is a working agreement between collaborators, not a legal contract.
              </p>
            </Card>
          </>
        ) : null}

        <Label>Lifecycle</Label>
        <div className="mb-8 divide-y divide-border rounded-3xl border border-border bg-card">
          <RowLink
            title="Put project on hold"
            subtitle="Pause without losing anything"
            to="/collab/$id/lifecycle/$action"
            params={{ id: project.id, action: "hold" }}
          />
          <RowLink
            title="Mark as completed"
            subtitle="Locks the timeline and unlocks credits"
            to="/collab/$id/lifecycle/$action"
            params={{ id: project.id, action: "complete" }}
          />
          <RowLink
            title="Archive project"
            subtitle="Read-only, hidden from the active list"
            to="/collab/$id/lifecycle/$action"
            params={{ id: project.id, action: "archive" }}
          />
          <RowLink
            title="Leave project"
            danger
            to="/collab/$id/lifecycle/$action"
            params={{ id: project.id, action: "leave" }}
          />
          <RowLink
            title="Cancel project"
            danger
            to="/collab/$id/lifecycle/$action"
            params={{ id: project.id, action: "cancel" }}
          />
        </div>

        <Link
          to="/collab/$id"
          params={{ id: project.id }}
          className="mb-8 block text-center text-[12px] font-semibold text-primary"
        >
          Back to workspace
        </Link>
      </main>
    </Screen>
  );
}
