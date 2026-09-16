import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BtnLink, Screen, TopBar, VerifiedBadge } from "@/components/ml/ui";
import {
  Card,
  Field,
  Label,
  PermissionState,
  StickyBar,
  Tag,
  TextInput,
} from "@/components/ml/collab";
import { getInvitation } from "@/data/collab";
import { TextLink } from "@/components/ml/links";

export const Route = createFileRoute("/collab/invites/$id")({
  head: ({ params }) => {
    const inv = getInvitation(params.id);
    const title = inv ? `Invitation — ${inv.projectName}` : "Collaboration invitation";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content:
            "Review a MusicLinkd collaboration invitation: role, scope, timeline and who's involved.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        {
          property: "og:description",
          content: "Accept, decline or ask a question before you commit.",
        },
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

  return (
    <Screen bottomNav={false}>
      <TopBar title="Collaboration invitation" subtitle={`Sent ${inv.sentAt}`} back="/collab" />
      <main className="px-5 pt-5">
        <img src={inv.artwork} alt="" className="mb-4 h-40 w-full rounded-lg object-cover" />
        <h2 className="text-2.5">{inv.projectName}</h2>
        <div className="mt-3 mb-4 flex flex-wrap gap-2">
          <Tag>{inv.type}</Tag>
          <Tag tone="info">Role: {inv.proposedRole}</Tag>
          {inv.budget ? <Tag tone="ok">{inv.budget}</Tag> : null}
        </div>

        <p className="mb-5 text-1 leading-relaxed text-muted-foreground">{inv.description}</p>

        <Label>Who invited you</Label>
        <Card className="mb-5">
          <div className="flex items-center gap-3">
            <img src={inv.inviterPhoto} alt="" className="h-11 w-11 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-semibold">{inv.inviter}</p>
                <VerifiedBadge size={14} />
              </div>
              <p className="truncate text-0 text-muted-foreground">{inv.inviterRole}</p>
            </div>
            <TextLink to="/messages" className="text-0">
              Message
            </TextLink>
          </div>
        </Card>

        <Label>What's expected</Label>
        <Card className="mb-5">
          <p className="text-1 text-muted-foreground">
            <span className="font-semibold text-foreground">Timeline:</span> {inv.timeline}
          </p>
          <p className="mt-1 text-1 text-muted-foreground">
            <span className="font-semibold text-foreground">Compensation:</span>{" "}
            {inv.budget ?? "To be agreed between collaborators"}
          </p>
          <p className="mt-1 text-1 text-muted-foreground">
            <span className="font-semibold text-foreground">Credit:</span> {inv.proposedRole} credit
            on release
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
        <BtnLink to="/messages" variant="ghost" className="mb-4 w-full">
          Send Question in Connections
        </BtnLink>
      </main>

      <StickyBar>
        <div className="flex gap-3">
          <BtnLink
            to="/collab/invites/declined/$id"
            params={{ id: inv.id }}
            variant="outline"
            className="flex-1 w-full"
          >
            Decline
          </BtnLink>
          <BtnLink
            to="/collab/invites/accepted/$id"
            params={{ id: inv.id }}
            className="flex-[2] w-full"
          >
            Accept as {inv.proposedRole}
          </BtnLink>
        </div>
      </StickyBar>
    </Screen>
  );
}
