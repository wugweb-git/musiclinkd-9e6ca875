import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Btn, Screen, TopBar } from "@/components/ml/ui";
import { WorkspaceShell } from "@/components/ml/collab-workspace";
import { Card, EmptyState, Label, PermissionState, TextInput } from "@/components/ml/collab";
import { getProject } from "@/data/collab";

export const Route = createFileRoute("/collab/$id/notes")({
  head: ({ params }) => {
    const p = getProject(params.id);
    const title = p ? `${p.name} — shared notes` : "Shared notes";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content:
            "Shared creative notes, references and decisions kept alongside a MusicLinkd project.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        {
          property: "og:description",
          content: "Keep lyrics, arrangement ideas and decisions in one place.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: Notes,
});

function Notes() {
  const { id } = Route.useParams();
  const project = getProject(id);
  const [draft, setDraft] = useState("");

  if (!project) {
    return (
      <Screen>
        <TopBar title="Notes" back="/collab" />
        <div className="px-5 pt-6">
          <PermissionState />
        </div>
      </Screen>
    );
  }

  const sorted = [...project.notes].sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <WorkspaceShell project={project} tab="notes">
      {sorted.length === 0 ? (
        <EmptyState
          title="No notes yet"
          body="Write down the creative direction so nothing gets lost."
        />
      ) : (
        <>
          <Label>{sorted.length} notes</Label>
          {sorted.map((n) => (
            <Card key={n.id} className="mb-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold">{n.title}</p>
                {n.pinned ? (
                  <span
                    className="pill shrink-0 px-2.5 py-1 bg-subtle text-muted-foreground"
                    style={{ background: "var(--surface-subtle)", color: "var(--primary)" }}
                  >
                    Pinned
                  </span>
                ) : null}
              </div>
              <p className="text-1 leading-relaxed text-muted-foreground">{n.body}</p>
              <p className="mt-2 text-1 text-muted-foreground">
                {n.author} · updated {n.updated}
              </p>
            </Card>
          ))}
        </>
      )}

      <div className="mt-5 mb-8">
        <Label>New note</Label>
        <TextInput
          value={draft}
          onChange={setDraft}
          multiline
          placeholder="Arrangement idea, lyric line, reference..."
        />
        <Btn className="mt-3 w-full" onClick={() => setDraft("")}>
          Save note
        </Btn>
      </div>
    </WorkspaceShell>
  );
}
