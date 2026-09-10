import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Btn, Chip, Screen, TopBar } from "@/components/ml/ui";
import { WorkspaceShell } from "@/components/ml/collab-workspace";
import { Card, EmptyState, PermissionState, PinnedNote, TextInput } from "@/components/ml/collab";
import { getProject } from "@/data/collab";

export const Route = createFileRoute("/collab/$id/discussion")({
  head: ({ params }) => {
    const p = getProject(params.id);
    const title = p ? `${p.name} — project discussion` : "Project discussion";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content:
            "Project-scoped discussion for a MusicLinkd collaboration: updates, decisions and pinned notes.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        {
          property: "og:description",
          content: "Keep creative decisions attached to the project, not lost in chat.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: Discussion,
});

const filters = ["All", "Decisions", "Pinned", "Files"];

function Discussion() {
  const { id } = Route.useParams();
  const project = getProject(id);
  const [filter, setFilter] = useState("All");
  const [draft, setDraft] = useState("");

  if (!project) {
    return (
      <Screen>
        <TopBar title="Discussion" back="/collab" />
        <div className="px-5 pt-6">
          <PermissionState />
        </div>
      </Screen>
    );
  }

  const entries = project.discussion.filter((d) => {
    if (filter === "Decisions") return d.decision;
    if (filter === "Pinned") return d.pinned;
    if (filter === "Files") return Boolean(d.attachment);
    return true;
  });

  return (
    <WorkspaceShell project={project} tab="discussion">
      <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {filters.map((f) => (
          <Chip key={f} active={f === filter} onClick={() => setFilter(f)}>
            {f}
          </Chip>
        ))}
      </div>

      <PinnedNote>
        This thread is scoped to the project. Direct chat still lives in Connections.
      </PinnedNote>

      {entries.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          body="Post the first update so everyone knows where the project stands."
        />
      ) : (
        entries.map((d) => (
          <Card key={d.id} className="mb-3">
            <div className="mb-2 flex items-center gap-2">
              <img src={d.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">{d.author}</p>
                <p className="text-[10px] text-muted-foreground">{d.time}</p>
              </div>
              {d.decision ? (
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
                  style={{ background: "var(--success-container)", color: "var(--success)" }}
                >
                  Decision
                </span>
              ) : null}
              {d.pinned ? (
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
                  style={{ background: "var(--pink-container)", color: "var(--primary)" }}
                >
                  Pinned
                </span>
              ) : null}
            </div>
            <p className="text-[13px] leading-relaxed">{d.body}</p>
            {d.attachment ? (
              <p className="mt-2 rounded-2xl border border-border px-3 py-2 text-[11px] text-muted-foreground">
                Attached · {d.attachment}
              </p>
            ) : null}
            {d.replies?.length ? (
              <div className="mt-3 space-y-2 border-l border-border pl-3">
                {d.replies.map((r) => (
                  <div key={`${r.author}-${r.time}`}>
                    <p className="text-[11px] font-semibold">
                      {r.author}{" "}
                      <span className="font-normal text-muted-foreground">· {r.time}</span>
                    </p>
                    <p className="text-[12px] text-muted-foreground">{r.body}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
        ))
      )}

      <div className="mt-5 mb-8">
        <TextInput
          value={draft}
          onChange={setDraft}
          multiline
          placeholder="Share an update, ask a question or record a decision..."
        />
        <div className="mt-3 flex gap-3">
          <Btn variant="outline" className="flex-1">
            Attach file
          </Btn>
          <Btn className="flex-1" onClick={() => setDraft("")}>
            Post update
          </Btn>
        </div>
      </div>
    </WorkspaceShell>
  );
}
