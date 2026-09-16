import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BtnLink, Screen, TopBar } from "@/components/ml/ui";
import { SegmentedField } from "@/components/ml/kit";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/kibo-ui/kanban";
import { WorkspaceShell } from "@/components/ml/collab-workspace";
import { Card, EmptyState, Label, MilestoneRow, PermissionState } from "@/components/ml/collab";
import { getProject, type Milestone } from "@/data/collab";

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
        <p className="text-1 text-muted-foreground">Project window</p>
        <p className="text-sm font-semibold">
          {project.startDate} → {project.targetDate}
        </p>
      </Card>

      <div className="mb-4">
        <SegmentedField
          label="What to show"
          value={view}
          options={["Milestones", "Board", "Tasks"]}
          onChange={setView}
        />
      </div>

      {view === "Board" ? <MilestoneBoard milestones={project.milestones} /> : null}

      {view === "Milestones" ? (
        project.milestones.length === 0 ? (
          <EmptyState
            title="No milestones yet"
            body="Break the project into stages so everyone can see progress."
            action={
              <BtnLink to="/collab/$id/milestones/new" params={{ id: project.id }}>
                Add Milestone
              </BtnLink>
            }
          />
        ) : (
          <>
            <Label>{project.milestones.length} milestones</Label>
            <div className="mb-5 divide-y divide-border rounded-lg border border-border bg-card px-4">
              {project.milestones.map((m) => (
                <MilestoneRow key={m.id} m={m} projectId={project.id} />
              ))}
            </div>
          </>
        )
      ) : view === "Tasks" ? (
        <>
          {project.tasks.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              body="Tasks are deliberately light here — use them only for the small things a milestone depends on."
            />
          ) : null}
          <Label>{project.tasks.length} tasks</Label>
          <div className="mb-5 divide-y divide-border rounded-lg border border-border bg-card px-4">
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
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-1 text-background"
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
                      className={`block truncate text-sm ${checked ? "text-muted-foreground line-through" : ""}`}
                    >
                      {t.name}
                    </span>
                    <span className="block text-1 text-muted-foreground">
                      {t.owner} · due {t.due}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      <BtnLink to="/collab/$id/milestones/new" params={{ id: project.id }} className="mb-8 w-full">
        Add Milestone
      </BtnLink>
    </WorkspaceShell>
  );
}

/** The four states a milestone can be in, as the board's columns. */
const milestoneStages = [
  { id: "todo", name: "To do" },
  { id: "inProgress", name: "In progress" },
  { id: "overdue", name: "Overdue" },
  { id: "done", name: "Done" },
];

type MilestoneCard = { id: string; name: string; column: string; milestone: Milestone };

/**
 * Milestones as a board rather than a list. Dragging one to another column moves it here only —
 * there is no milestone_status write behind this yet, so it reflects how you are reading the
 * project, not a change the other participants see.
 */
function MilestoneBoard({ milestones }: { milestones: Milestone[] }) {
  const [cards, setCards] = useState<MilestoneCard[]>(() =>
    milestones.map((m) => ({ id: m.id, name: m.name, column: m.status, milestone: m })),
  );

  if (!milestones.length) {
    return (
      <EmptyState
        title="No milestones to sort yet"
        body="Break the project into stages, and they appear on the board."
      />
    );
  }

  return (
    <div className="rail -mx-5 mb-5 overflow-x-auto px-5 pb-1 no-scrollbar">
      <KanbanProvider
        columns={milestoneStages}
        data={cards}
        onDataChange={setCards}
        className="min-w-[680px] gap-3"
      >
        {(stage) => (
          <KanbanBoard key={stage.id} id={stage.id} className="bg-subtle">
            <KanbanHeader className="flex items-center justify-between text-2">
              {stage.name}
              <span className="pill bg-card text-muted-foreground">
                {cards.filter((c) => c.column === stage.id).length}
              </span>
            </KanbanHeader>
            <KanbanCards id={stage.id}>
              {(card: MilestoneCard) => (
                <KanbanCard key={card.id} {...card}>
                  <span className="block text-1 font-semibold">{card.name}</span>
                  <span className="mt-0.5 block truncate text-1 text-muted-foreground">
                    {card.milestone.owner} · due {card.milestone.due}
                  </span>
                </KanbanCard>
              )}
            </KanbanCards>
          </KanbanBoard>
        )}
      </KanbanProvider>
    </div>
  );
}
