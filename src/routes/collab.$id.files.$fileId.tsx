import { createFileRoute, Link } from "@tanstack/react-router";
import { Btn, Screen, TopBar } from "@/components/ml/ui";
import { AudioPlayer, Card, Label, PermissionState, RowLink, Tag } from "@/components/ml/collab";
import { fileKindMeta, getFile, getProject } from "@/data/collab";

export const Route = createFileRoute("/collab/$id/files/$fileId")({
  head: ({ params }) => {
    const f = getFile(params.id, params.fileId);
    const title = f ? `${f.name} — file detail` : "File detail";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content:
            "Version history, access and notes for a file shared inside a MusicLinkd collaboration.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        { property: "og:description", content: "Track every version of a collaboration file." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: FileDetail,
});

function FileDetail() {
  const { id, fileId } = Route.useParams();
  const project = getProject(id);
  const file = getFile(id, fileId);

  if (!project || !file) {
    return (
      <Screen>
        <TopBar title="File" back="/collab" />
        <div className="px-5 pt-6">
          <PermissionState />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar
        title={file.name}
        subtitle={`${fileKindMeta[file.kind].label} · ${file.size}`}
        back="/collab"
      />
      <main className="px-5 pt-5">
        {!file.available ? (
          <div
            className="mb-4 rounded-lg px-4 py-3 text-[12px] font-semibold"
            style={{ background: "var(--warn-container)", color: "var(--warn)" }}
          >
            This file is unavailable — it was removed by the uploader.
          </div>
        ) : null}

        {file.cover ? (
          <img src={file.cover} alt="" className="mb-4 h-44 w-full rounded-lg object-cover" />
        ) : null}

        {file.kind === "audio" ? (
          <div className="mb-5">
            <AudioPlayer title={file.name} meta={`Latest version · ${file.duration ?? "—"}`} />
          </div>
        ) : null}

        <div className="mb-5 flex flex-wrap gap-2">
          <Tag>{fileKindMeta[file.kind].label}</Tag>
          <Tag>{file.size}</Tag>
          <Tag tone={file.access === "All participants" ? "ok" : "warn"}>{file.access}</Tag>
        </div>

        <Card className="mb-5">
          <p className="text-[12px] text-muted-foreground">
            Uploaded by <span className="font-semibold text-foreground">{file.uploadedBy}</span> ·{" "}
            {file.date}
          </p>
        </Card>

        {file.versions?.length ? (
          <>
            <Label>Version history</Label>
            <div className="mb-5 divide-y divide-border rounded-lg border border-border bg-card px-4">
              {file.versions.map((v, i) => (
                <div key={v.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold">
                      {v.label} {i === 0 ? "· latest" : ""}
                    </p>
                    <span className="text-[11px] text-muted-foreground">{v.duration}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {v.createdBy} · {v.date}
                  </p>
                  <p className="mt-1 text-[12px]">{v.notes}</p>
                  {i !== 0 ? (
                    <button type="button" className="mt-2 text-[11px] font-semibold text-primary">
                      Compare with latest
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        ) : null}

        <Label>Actions</Label>
        <div className="mb-8 divide-y divide-border rounded-lg border border-border bg-card">
          <RowLink title="Upload a new version" subtitle="Keeps the history intact" />
          <RowLink title="Change access" subtitle={file.access} />
          <RowLink title="Add to portfolio" subtitle="Hands off to your portfolio flow" />
          <RowLink title="Remove file" danger />
        </div>

        <Link to="/collab/$id/files" params={{ id: project.id }}>
          <Btn variant="outline" className="mb-8 w-full">
            Back to files
          </Btn>
        </Link>
      </main>
    </Screen>
  );
}
