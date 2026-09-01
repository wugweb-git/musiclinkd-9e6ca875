import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Btn, Screen, TopBar, VerifiedBadge } from "@/components/ml/ui";
import { Card, Field, Label, PermissionState, StickyBar, Tag, TextInput } from "@/components/ml/collab";
import { getInvitation } from "@/data/collab";

export const Route = createFileRoute("/collab/invites/$id")({
  head: ({ params }) => {
    const inv = getInvitation(params.id);
    const title = inv ? `Invitation — ${inv.projectName}` : "Collaboration invitation";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content: "Review a MusicLinkd collaboration invitation: role, scope, timeline and who's involved.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        { property: "og:description", content: "Accept, decline or ask a question before you commit." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: InviteDetail,
});

function InviteDetail() {
  const { id } = Route.useParams();
  const inv = getInvitation(id);
  const [question, setQuestion] = useState("");

  if (!inv) {
    return (
      <Screen>
        <TopBar title="Invitation" back="/collab" />
        <div className="px-5 pt-6">
          <PermissionState />
        </div>
      </Screen>
    );
  }

  if (outcome !== "none") {
    const accepted = outcome === "accepted";
    return (
      <Screen bottomNav={false}>
        <TopBar title={accepted ? "Invitation accepted" : "Invitation declined"} back="/collab" />
        <main className="px-5 pt-8 text-center">
          <span
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl"
            style={
              accepted
                ? { background: "var(--success-container)", color: "var(--success)" }
                : { background: "var(--surface-subtle)", color: "var(--text-2)" }
            }
          >
            {accepted ? "✓" : "—"}
          </span>
          <h2 className="text-[20px]">
            {accepted ? `You're in on ${inv.projectName}` : "Invitation declined"}
          </h2>
          <p className="mx-auto mt-2 mb-6 max-w-[280px] text-[13px] text-muted-foreground">
            {accepted
              ? `${inv.inviter} has been notified. You joined as ${inv.proposedRole}.`
              : `${inv.inviter} has been notified. You can still be invited to future projects.`}
          </p>
          {accepted ? (
            <Link to="/collab/$id" params={{ id: inv.projectId }}>
              <Btn className="w-full">Open the workspace</Btn>
            </Link>
          ) : (
            <Link to="/collab">
              <Btn variant="outline" className="w-full">
                Back to collaborations
              </Btn>
            </Link>
          )}
        </main>
      </Screen>
    );
  }

  return (
    <Screen bottomNav={false}>
      <TopBar title="Collaboration invitation" subtitle={`Sent ${inv.sentAt}`} back="/collab" />
      <main className="px-5 pt-5">
        <img src={inv.artwork} alt="" className="mb-4 h-40 w-full rounded-3xl object-cover" />
        <h2 className="text-[20px]">{inv.projectName}</h2>
        <div className="mt-3 mb-4 flex flex-wrap gap-2">
          <Tag>{inv.type}</Tag>
          <Tag tone="info">Role: {inv.proposedRole}</Tag>
          {inv.budget ? <Tag tone="ok">{inv.budget}</Tag> : null}
        </div>

        <p className="mb-5 text-[13px] leading-relaxed text-muted-foreground">{inv.description}</p>

        <Label>Who invited you</Label>
        <Card className="mb-5">
          <div className="flex items-center gap-3">
            <img src={inv.inviterPhoto} alt="" className="h-11 w-11 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[14px] font-semibold">{inv.inviter}</p>
                <VerifiedBadge size={14} />
              </div>
              <p className="truncate text-[11px] text-muted-foreground">{inv.inviterRole}</p>
            </div>
            <Link to="/messages" className="text-[11px] font-semibold text-primary">
              Message
            </Link>
          </div>
        </Card>

        <Label>What's expected</Label>
        <Card className="mb-5">
          <p className="text-[12px] text-muted-foreground">
            <span className="font-semibold text-foreground">Timeline:</span> {inv.timeline}
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            <span className="font-semibold text-foreground">Compensation:</span>{" "}
            {inv.budget ?? "To be agreed between collaborators"}
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            <span className="font-semibold text-foreground">Credit:</span> {inv.proposedRole} credit on release
          </p>
        </Card>

        <Field label="Ask a question first" optional>
          <TextInput
            value={question}
            onChange={setQuestion}
            multiline
            placeholder="Anything you want to clarify before accepting?"
          />
        </Field>
        <Link to="/messages">
          <Btn variant="ghost" className="mb-4 w-full">
            Send question in Connections
          </Btn>
        </Link>
      </main>

      <StickyBar>
        <div className="flex gap-3">
          <Btn variant="outline" className="flex-1" onClick={() => setOutcome("declined")}>
            Decline
          </Btn>
          <Btn className="flex-[2]" onClick={() => setOutcome("accepted")}>
            Accept as {inv.proposedRole}
          </Btn>
        </div>
      </StickyBar>
    </Screen>
  );
}
