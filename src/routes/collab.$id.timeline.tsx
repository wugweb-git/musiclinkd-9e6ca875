import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Btn, Chip, Screen, TopBar } from "@/components/ml/ui";
import { WorkspaceShell } from "@/components/ml/collab-workspace";
import { Card, EmptyState, Label, MilestoneRow, PermissionState } from "@/components/ml/collab";
import { getProject } from "@/data/collab";

export const Route = createFileRoute("/collab/$id/timeline")({
  head: ({ params }) => {
    const p = getProject(params.id);
    const title = p ? `${p.name} — timeline & milestones` : "Timeline & milestones";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content: "Milestones, tasks and delivery dates for a MusicLinkd music collaboration.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        { property: "og:description", content: "Know what's due, who owns it and when it ships." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: Timeline,
});

function Timeline() {
  const { id } = Route.useParams();
  const project = getProject(id);
  const [view, setView] = useState("Milestones");
  const [done, setDone] = useState<string[]>([]);

  if (!project) {
    return (
      <Screen>
        <TopBar title="Timeline" back="/collab" />
        <div className="px-5 pt-6">
          <PermissionState />
        </div>
      </Screen>
    );
  }

  return (
    <WorkspaceShell project={project} tab="timeline">
      <Card className="mb-4">
        <p className="text-[12px] text-muted-foreground">Project window</p>
        <p className="text-[15px] font-semibold">
          {project.startDate} → {project.targetDate}
        </p>
      </Card>

      <div className="mb-4 flex gap-2">
        {["Milestones", "Tasks"].map((v) => (
          <Chip key={v} active={v === view} onClick={() => setView(v)}>
            {v}
          </Chip>
        ))}
      </div>

      {view === "Milestones" ? (
        project.milestones.length === 0 ? (
          <EmptyState
            title="No milestones yet"
            body="Break the project into stages so everyone can see progress."
            action={
              <Link to="/collab/$id/milestones/new" params={{ id: project.id }}>
                <Btn>Add milestone</Btn>
              </Link>
            }
          />
        ) : (
          <>
            <Label>{project.milestones.length} milestones</Label>
            <div className="mb-5 divide-y divide-border rounded-3xl border border-border bg-card px-4">
              {project.milestones.map((m) => (
                <MilestoneRow key={m.id} m={m} projectId={project.id} />
              ))}
            </div>
          </>
        )
      ) : (
        <>
          {project.tasks.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              body="Tasks are deliberately light here — use them only for the small things a milestone depends on."
            />
          ) : null}
          <Label>{project.tasks.length} tasks</Label>
          <div className="mb-5 divide-y divide-border rounded-3xl border border-border bg-card px-4">
            {project.tasks.map((t) => {
              const checked = t.done || done.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setDone((s) => (s.includes(t.id) ? s.filter((x) => x !== t.id) : [...s, t.id]))
                  }
                  className="flex w-full items-center gap-3 py-4 text-left"
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-[11px] text-background"
                    style={
                      checked
                        ? { background: "var(--success)", borderColor: "transparent" }
                        : undefined
                    }
                  >
                    {checked ? "✓" : ""}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-[14px] ${checked ? "text-muted-foreground line-through" : ""}`}
                    >
                      {t.name}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {t.owner} · due {t.due}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <Link to="/collab/$id/milestones/new" params={{ id: project.id }}>
        <Btn className="mb-8 w-full">Add milestone</Btn>
      </Link>
    </WorkspaceShell>
  );
}
