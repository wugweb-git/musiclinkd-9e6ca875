import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar, Chip, Btn } from "@/components/ml/ui";
import { WorkspaceShell } from "@/components/ml/collab-workspace";
import { EmptyState, Label } from "@/components/ml/collab";
import { DeletedState, MediaTile } from "@/components/ml/collab-extra";
import { getProject, type CollabFileKind } from "@/data/collab";

export const Route = createFileRoute("/collab/$id/media")({
  head: ({ params }) => {
    const p = getProject(params.id);
    const title = p ? `Shared media — ${p.name}` : "Shared media";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content:
            "Every audio, video, image and document shared on this MusicLinkd collaboration, in one filterable gallery.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        { property: "og:description", content: "Project media in one place — audio, video, images, documents." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: Media,
});

const filters: { key: string; label: string; kinds: CollabFileKind[] }[] = [
  { key: "all", label: "All", kinds: [] },
  { key: "audio", label: "Audio", kinds: ["audio"] },
  { key: "video", label: "Video", kinds: ["video"] },
  { key: "images", label: "Images", kinds: ["image"] },
  { key: "documents", label: "Documents", kinds: ["document", "lyrics", "contract", "reference"] },
];

function Media() {
  const { id } = Route.useParams();
  const project = getProject(id);
  const [filter, setFilter] = useState("all");

  const list = useMemo(() => {
    if (!project) return [];
    const f = filters.find((x) => x.key === filter);
    if (!f || f.kinds.length === 0) return project.files;
    return project.files.filter((x) => f.kinds.includes(x.kind));
  }, [project, filter]);

  if (!project) {
    return (
      <Screen>
        <TopBar title="Shared media" back="/collab" />
        <div className="px-5 pt-6">
          <DeletedState />
        </div>
      </Screen>
    );
  }

  return (
    <WorkspaceShell project={project} tab="files">
      <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {filters.map((f) => (
          <Chip key={f.key} active={f.key === filter} onClick={() => setFilter(f.key)}>
            {f.label}
          </Chip>
        ))}
      </div>

      <Label>Shared media</Label>
      {list.length === 0 ? (
        <EmptyState
          title="Nothing shared here yet"
          body="Upload the first reference, stem or document and everyone on the project can see it."
          action={
            <Link to="/collab/$id/files" params={{ id: project.id }}>
              <Btn>Go to files</Btn>
            </Link>
          }
        />
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-3">
          {list.map((f) => (
            <MediaTile key={f.id} file={f} projectId={project.id} />
          ))}
        </div>
      )}

      <Link
        to="/collab/$id/files"
        params={{ id: project.id }}
        className="mb-8 block text-center text-[12px] font-semibold text-primary"
      >
        Open file list
      </Link>
    </WorkspaceShell>
  );
}
