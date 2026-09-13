import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { DeletedState, OutcomePanel } from "@/components/ml/collab-extra";
import { getInvitation } from "@/data/collab";

export const Route = createFileRoute("/collab/invites/declined/$id")({
  head: ({ params }) => {
    const inv = getInvitation(params.id);
    const title = inv ? `Declined — ${inv.projectName}` : "Invitation declined";
    return {
      meta: [
        { title: `${title} | MusicLinkd` },
        {
          name: "description",
          content:
            "You declined this collaboration invitation. Nothing is shared with you and you can still message the person who invited you.",
        },
        { property: "og:title", content: `${title} | MusicLinkd` },
        { property: "og:description", content: "Invitation closed on MusicLinkd." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: InvitationDeclined,
});

function InvitationDeclined() {
  const { id } = Route.useParams();
  const inv = getInvitation(id);

  if (!inv) {
    return (
      <Screen>
        <TopBar title="Invitation" back="/collab" />
        <div className="px-5 pt-6">
          <DeletedState body="This invitation is no longer available." />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Invitation declined" subtitle={inv.projectName} back="/collab" />
      <main className="px-5 pt-5">
        <OutcomePanel
          tone="off"
          title="Invitation declined"
          body={`You won't be added to ${inv.projectName}. ${inv.inviter} can invite you again later.`}
        />

        <div className="mb-8 flex gap-3">
          <BtnLink to="/messages" variant="outline" className="flex-1 w-full">
            Message {inv.inviter.split(" ")[0]}
          </BtnLink>
          <BtnLink to="/collab" className="flex-1 w-full">
            Back to collaborations
          </BtnLink>
        </div>
      </main>
    </Screen>
  );
}
