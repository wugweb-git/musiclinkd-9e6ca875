import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Btn, BtnLink, Chip, Screen, Sheet, TopBar } from "@/components/ml/ui";
import { WorkspaceShell } from "@/components/ml/collab-workspace";
import { EmptyState, FileRow, Label, PermissionState, UploadPanel } from "@/components/ml/collab";
import { getProject } from "@/data/collab";

export const Route = createFileRoute("/collab/$id/files/")({
  head: ({ params }) => {
    const p = getProject(params.id);
    const title = p ? `${p.name} — project files` : "Project files";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content:
            "Stems, mixes, lyrics, references and contracts shared inside a MusicLinkd collaboration.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        { property: "og:description", content: "Every version of the work, in one place." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: Files,
});

const kinds = ["All", "Audio", "Video", "Image", "Document", "Lyrics", "Contract", "Reference"];

function Files() {
  const { id } = Route.useParams();
  const project = getProject(id);
  const [kind, setKind] = useState("All");
  const [upload, setUpload] = useState(false);
  const [state, setState] = useState<"idle" | "uploading" | "error" | "done">("idle");

  if (!project) {
    return (
      <Screen>
        <TopBar title="Files" back="/collab" />
        <div className="px-5 pt-6">
          <PermissionState />
        </div>
      </Screen>
    );
  }

  const list =
    kind === "All" ? project.files : project.files.filter((f) => f.kind === kind.toLowerCase());

  return (
    <WorkspaceShell project={project} tab="files">
      <div className="rail mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {kinds.map((k) => (
          <Chip key={k} active={k === kind} onClick={() => setKind(k)}>
            {k}
          </Chip>
        ))}
      </div>

      <div className="mb-4 flex gap-3">
        <Btn className="flex-1" onClick={() => setUpload(true)}>
          Upload
        </Btn>
        <BtnLink
          to="/collab/$id/media"
          params={{ id: project.id }}
          variant="outline"
          className="flex-1 w-full"
        >
          Media gallery
        </BtnLink>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="No files of this type yet"
          body="Upload stems, references, lyrics or a contract to keep the project self-contained."
        />
      ) : (
        <>
          <Label>{list.length} files</Label>
          <div className="mb-8 divide-y divide-border rounded-lg border border-border bg-card px-4">
            {list.map((f) => (
              <FileRow key={f.id} file={f} projectId={project.id} />
            ))}
          </div>
        </>
      )}

      <Sheet
        open={upload}
        onClose={() => {
          setUpload(false);
          setState("idle");
        }}
        title="Upload file"
      >
        <UploadPanel
          state={state}
          onStart={() => setState("uploading")}
          onCancel={() => setState("idle")}
          onRetry={() => setState("uploading")}
        />
        <div className="mt-4 flex gap-2">
          <Btn variant="outline" className="flex-1" onClick={() => setState("done")}>
            Simulate success
          </Btn>
          <Btn variant="ghost" className="flex-1" onClick={() => setState("error")}>
            Simulate failure
          </Btn>
        </div>
      </Sheet>
    </WorkspaceShell>
  );
}
