import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Btn } from "@/components/ml/ui";
import { Card, Label, Tag } from "@/components/ml/collab";
import type { CollabFile } from "@/data/collab";

/** COLLAB-62 — deleted / unavailable project. */
export function DeletedState({ body }: { body?: string }) {
  return (
    <Card className="text-center">
      <p className="mb-1 text-[15px] font-semibold">This collaboration is no longer available</p>
      <p className="mb-4 text-[12px] text-muted-foreground">
        {body ?? "It may have been deleted by the owner, or you no longer have access to it."}
      </p>
      <Link to="/collab">
        <Btn variant="outline">Back to collaborations</Btn>
      </Link>
    </Card>
  );
}

/** COLLAB-17 — shared media tile. */
export function MediaTile({ file, projectId }: { file: CollabFile; projectId: string }) {
  return (
    <Link
      to="/collab/$id/files/$fileId"
      params={{ id: projectId, fileId: file.id }}
      className="block overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="relative h-24 w-full bg-subtle">
        {file.cover ? (
          <img src={file.cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {file.kind}
          </span>
        )}
        {!file.available ? (
          <span className="absolute inset-0 flex items-center justify-center bg-background/80 text-[10px] font-semibold text-muted-foreground">
            Unavailable
          </span>
        ) : null}
      </div>
      <div className="px-3 py-2">
        <p className="truncate text-[12px] font-medium">{file.name}</p>
        <p className="truncate text-[10px] text-muted-foreground">
          {file.uploadedBy} · {file.date}
        </p>
      </div>
    </Link>
  );
}

/** Outcome screens (invitation / proposal accepted or declined). */
export function OutcomePanel({
  tone = "ok",
  title,
  body,
  children,
}: {
  tone?: "ok" | "off";
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <Card className="mb-5">
      <Tag tone={tone}>{tone === "ok" ? "Confirmed" : "Closed"}</Tag>
      <h2 className="mt-3 text-[18px] font-semibold">{title}</h2>
      <p className="mt-1 text-[13px] text-muted-foreground">{body}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </Card>
  );
}

/** Destructive / ownership confirmations. */
export function ConfirmPanel({
  title,
  body,
  consequences,
  children,
}: {
  title: string;
  body: string;
  consequences: string[];
  children?: ReactNode;
}) {
  return (
    <Card className="mb-5">
      <h2 className="text-[17px] font-semibold">{title}</h2>
      <p className="mt-1 text-[13px] text-muted-foreground">{body}</p>
      <Label>What happens</Label>
      <ul className="space-y-1.5">
        {consequences.map((c) => (
          <li key={c} className="text-[12px] text-muted-foreground">
            · {c}
          </li>
        ))}
      </ul>
      {children ? <div className="mt-4">{children}</div> : null}
    </Card>
  );
}
