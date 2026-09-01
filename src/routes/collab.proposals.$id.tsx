import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Btn, Screen, TopBar } from "@/components/ml/ui";
import { Card, PermissionState, ProposalSummary, StickyBar } from "@/components/ml/collab";
import { getProposal } from "@/data/collab";

export const Route = createFileRoute("/collab/proposals/$id")({
  head: ({ params }) => {
    const p = getProposal(params.id);
    const title = p ? `Proposal — ${p.projectName}` : "Collaboration proposal";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content: "Review a collaboration proposal: scope, deliverables, timeline and compensation.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        { property: "og:description", content: "Agree the terms of a music collaboration before work starts." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: ProposalDetail,
});

function ProposalDetail() {
  const { id } = Route.useParams();
  const p = getProposal(id);
  

  if (!p) {
    return (
      <Screen>
        <TopBar title="Proposal" back="/collab" />
        <div className="px-5 pt-6">
          <PermissionState />
        </div>
      </Screen>
    );
  }

  const sent = p.status === "sent";

  if (outcome !== "none") {
    const accepted = outcome === "accepted";
    return (
      <Screen bottomNav={false}>
        <TopBar title={accepted ? "Proposal accepted" : "Proposal declined"} back="/collab" />
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
            {accepted ? "Terms agreed" : "Proposal declined"}
          </h2>
          <p className="mx-auto mt-2 mb-6 max-w-[280px] text-[13px] text-muted-foreground">
            {accepted
              ? `${p.from} joins ${p.projectName} as ${p.role}. The agreed terms are saved in project settings.`
              : `${p.from} has been notified. You can counter with different terms at any time.`}
          </p>
          <Link to="/collab/$id" params={{ id: p.projectId }}>
            <Btn className="w-full">Open project</Btn>
          </Link>
        </main>
      </Screen>
    );
  }

  return (
    <Screen bottomNav={false}>
      <TopBar
        title={sent ? "Proposal you sent" : "Proposal received"}
        subtitle={`${p.projectName} · ${p.sentAt}`}
        back="/collab"
      />
      <main className="px-5 pt-5">
        <ProposalSummary p={p} />

        <Card className="mt-5">
          <p className="text-[12px] text-muted-foreground">
            A proposal records what will be delivered and on what terms. It's a shared understanding
            between collaborators, not a legal contract.
          </p>
        </Card>

        {sent ? (
          <Card className="mt-4">
            <p className="text-[13px] font-semibold">Awaiting response</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              You can withdraw or edit this proposal until it's accepted.
            </p>
          </Card>
        ) : null}
      </main>

      <StickyBar>
        {sent ? (
          <div className="flex gap-3">
            <Btn variant="outline" className="flex-1">
              Withdraw
            </Btn>
            <Link to="/collab/proposals/$id/counter" params={{ id: p.id }} className="flex-[2]">
              <Btn className="w-full">Edit proposal</Btn>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-3">
              <Btn variant="outline" className="flex-1" onClick={() => setOutcome("declined")}>
                Decline
              </Btn>
              <Btn className="flex-[2]" onClick={() => setOutcome("accepted")}>
                Accept terms
              </Btn>
            </div>
            <Link to="/collab/proposals/$id/counter" params={{ id: p.id }}>
              <Btn variant="ghost" className="w-full">
                Counter with different terms
              </Btn>
            </Link>
          </div>
        )}
      </StickyBar>
    </Screen>
  );
}
