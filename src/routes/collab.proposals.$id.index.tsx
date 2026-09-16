import { createFileRoute } from "@tanstack/react-router";
import { Btn, BtnLink, Screen, TopBar } from "@/components/ml/ui";
import { Card, PermissionState, ProposalSummary, StickyBar } from "@/components/ml/collab";
import { getProposal } from "@/data/collab";

export const Route = createFileRoute("/collab/proposals/$id/")({
  head: ({ params }) => {
    const p = getProposal(params.id);
    const title = p ? `Proposal — ${p.projectName}` : "Collaboration proposal";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content:
            "Review a collaboration proposal: scope, deliverables, timeline and compensation.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        {
          property: "og:description",
          content: "Agree the terms of a music collaboration before work starts.",
        },
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
          <p className="text-1 text-muted-foreground">
            A proposal records what will be delivered and on what terms. It's a shared understanding
            between collaborators, not a legal contract.
          </p>
        </Card>

        {sent ? (
          <Card className="mt-4">
            <p className="text-1 font-semibold">Awaiting response</p>
            <p className="mt-1 text-1 text-muted-foreground">
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
            <BtnLink
              to="/collab/proposals/$id/counter"
              params={{ id: p.id }}
              className="flex-[2] w-full"
            >
              Edit Proposal
            </BtnLink>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-3">
              <BtnLink
                to="/collab/proposals/declined/$id"
                params={{ id: p.id }}
                variant="outline"
                className="flex-1 w-full"
              >
                Decline
              </BtnLink>
              <BtnLink
                to="/collab/proposals/accepted/$id"
                params={{ id: p.id }}
                className="flex-[2] w-full"
              >
                Accept Terms
              </BtnLink>
            </div>
            <BtnLink
              to="/collab/proposals/$id/counter"
              params={{ id: p.id }}
              variant="ghost"
              className="w-full"
            >
              Counter with Different Terms
            </BtnLink>
          </div>
        )}
      </StickyBar>
    </Screen>
  );
}
