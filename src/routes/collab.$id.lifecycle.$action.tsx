import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Btn, BtnLink, Screen, TopBar } from "@/components/ml/ui";
import { Card, Field, PermissionState, StickyBar, TextInput } from "@/components/ml/collab";
import { getProject } from "@/data/collab";

export const Route = createFileRoute("/collab/$id/lifecycle/$action")({
  head: () => ({
    meta: [
      { title: "Change project status | MusicLinkd" },
      {
        name: "description",
        content:
          "Put a MusicLinkd collaboration on hold, complete it, archive it, leave it or cancel it.",
      },
      { property: "og:title", content: "Change project status | MusicLinkd" },
      {
        property: "og:description",
        content: "Every collaboration has a clear, reversible lifecycle.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Lifecycle,
});

const copy: Record<
  string,
  { title: string; body: string; cta: string; danger?: boolean; ask: string }
> = {
  hold: {
    title: "Put this project on hold",
    body: "The workspace stays intact and everyone keeps access. Milestones stop counting as overdue.",
    cta: "Put on hold",
    ask: "Reason (shown to collaborators)",
  },
  resume: {
    title: "Resume this project",
    body: "Milestones start tracking again and collaborators are notified.",
    cta: "Resume project",
    ask: "Note (optional)",
  },
  complete: {
    title: "Mark this project as completed",
    body: "The timeline locks, credits become shareable, and everyone can request a review of the collaboration.",
    cta: "Mark completed",
    ask: "Completion note (optional)",
  },
  archive: {
    title: "Archive this project",
    body: "Archived projects become read-only and move out of your active list. You can restore them anytime.",
    cta: "Archive project",
    ask: "Note (optional)",
  },
  leave: {
    title: "Leave this project",
    body: "You'll lose access to files and discussion. Your existing credits stay on completed work.",
    cta: "Leave project",
    danger: true,
    ask: "Reason (optional)",
  },
  cancel: {
    title: "Cancel this project",
    body: "This ends the collaboration for everyone. Files remain visible to participants for 30 days.",
    cta: "Cancel project",
    danger: true,
    ask: "Reason (shown to collaborators)",
  },
};

function Lifecycle() {
  const { id, action } = Route.useParams();
  const project = getProject(id);
  const c = copy[action];
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  if (!project || !c) {
    return (
      <Screen>
        <TopBar title="Project status" back="/collab" />
        <div className="px-5 pt-6">
          <PermissionState />
        </div>
      </Screen>
    );
  }

  if (confirmed) {
    return (
      <Screen bottomNav={false}>
        <TopBar title="Done" back="/collab" />
        <main className="px-5 pt-8 text-center">
          <span
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl"
            style={{ background: "var(--success-container)", color: "var(--success)" }}
          >
            ✓
          </span>
          <h2 className="text-[20px]">{c.cta} — done</h2>
          <p className="mx-auto mt-2 mb-6 max-w-[280px] text-[13px] text-muted-foreground">
            {project.name} has been updated and collaborators have been notified.
          </p>
          {action === "complete" ? (
            <Card className="mb-4 text-left">
              <p className="text-[13px] font-semibold">What's next</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Add this work to your portfolio, publish the credits, or leave a review for your
                collaborators.
              </p>
            </Card>
          ) : null}
          <BtnLink to="/collab" className="w-full">
            Back to Collaborations
          </BtnLink>
        </main>
      </Screen>
    );
  }

  return (
    <Screen bottomNav={false}>
      <TopBar title="Change status" subtitle={project.name} back="/collab" />
      <main className="px-5 pt-6">
        <h2 className="text-[20px]">{c.title}</h2>
        <p className="mt-2 mb-5 text-[13px] leading-relaxed text-muted-foreground">{c.body}</p>

        <Field label={c.ask} optional>
          <TextInput
            value={reason}
            onChange={setReason}
            multiline
            placeholder="Add context for the team..."
          />
        </Field>

        <Card>
          <p className="text-[12px] text-muted-foreground">
            You can change the project status again later — nothing is deleted.
          </p>
        </Card>
      </main>

      <StickyBar>
        <div className="flex gap-3">
          <BtnLink
            to="/collab/$id/settings"
            params={{ id: project.id }}
            variant="outline"
            className="flex-1 w-full"
          >
            Keep As Is
          </BtnLink>
          <Btn
            variant={c.danger ? "ink" : "primary"}
            className="flex-[2]"
            onClick={() => setConfirmed(true)}
          >
            {c.cta}
          </Btn>
        </div>
      </StickyBar>
    </Screen>
  );
}
