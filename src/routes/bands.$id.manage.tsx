import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, Row, StatusPill, Dialog, EmptyState, Segmented } from "@/components/ml/kit";
import { bandRoleCopy, type BandRole } from "@/data/band";
import { useAuth } from "@/hooks/use-auth";
import { bandViewFromRow, loadBand } from "@/lib/band-view";

export const Route = createFileRoute("/bands/$id/manage")({
  loader: ({ params }) => loadBand(params.id),
  head: () => ({
    meta: [
      { title: "Manage Band | MusicLinkd" },
      {
        name: "description",
        content: "Manage band members, roles, invitations and band settings on MusicLinkd.",
      },
      { property: "og:title", content: "Manage Band | MusicLinkd" },
      { property: "og:description", content: "Members, roles, invitations and band settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManageBand,
});

const tabs = ["Members", "Invitations", "Settings"] as const;

function ManageBand() {
  const { band: row, labels } = Route.useLoaderData();
  const { user } = useAuth();
  const band = row ? bandViewFromRow(row, labels, user?.id ?? null) : undefined;
  const [tab, setTab] = useState<(typeof tabs)[number]>("Members");
  const [removing, setRemoving] = useState<string | null>(null);
  const [transfer, setTransfer] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!band) {
    return (
      <Screen bottomNav={false}>
        <TopBar title="Manage band" back="/bands" />
        <div className="px-5 pt-8">
          <EmptyState
            title="Band not found"
            body="This band was deleted or you no longer have access."
          />
        </div>
      </Screen>
    );
  }

  return (
    <Screen bottomNav={false}>
      <TopBar title="Manage band" subtitle={band.name} back="/bands" />
      <div className="space-y-4 px-5 pt-4 pb-8">
        <Segmented value={tab} options={tabs} onChange={setTab} />

        {tab === "Members" ? (
          <>
            <BtnLink to="/bands/$id/invite" params={{ id: band.id }} className="w-full">
              Invite a Member
            </BtnLink>
            {band.members.map((m) => (
              <Card key={m.key} className="space-y-3">
                <div className="flex items-center gap-3">
                  {m.photo ? (
                    <img
                      src={m.photo}
                      alt=""
                      loading="lazy"
                      className="h-11 w-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div aria-hidden className="h-11 w-11 shrink-0 rounded-full bg-background" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{m.name}</p>
                    {m.instrument ? (
                      <p className="truncate text-1 text-muted-foreground">{m.instrument}</p>
                    ) : null}
                  </div>
                  <StatusPill
                    label={bandRoleCopy[m.role].label}
                    tone={m.role === "owner" ? "brand" : "neutral"}
                  />
                </div>
                <p className="text-1 text-muted-foreground">{bandRoleCopy[m.role].blurb}</p>
                {m.role !== "owner" ? (
                  <div className="flex gap-2">
                    <Btn variant="outline" className="flex-1 text-1">
                      {m.role === "admin" ? "Make member" : "Make admin"}
                    </Btn>
                    <Btn
                      variant="ghost"
                      className="flex-1 text-1"
                      onClick={() => setRemoving(m.key)}
                    >
                      Remove
                    </Btn>
                  </div>
                ) : null}
              </Card>
            ))}
            <RolesCard />
          </>
        ) : null}

        {tab === "Invitations" ? (
          // Invitations are not stored yet.
          <EmptyState
            title="No invitations yet"
            body="Invite people you already play with — they keep their own profile."
          >
            <BtnLink to="/bands/$id/invite" params={{ id: band.id }} className="w-full">
              Invite a Member
            </BtnLink>
          </EmptyState>
        ) : null}

        {tab === "Settings" ? (
          <>
            <Row
              title="Edit band profile"
              subtitle="Name, bio, genres, photos"
              to="/bands/$id"
              params={{ id: band.id }}
            />
            <Row
              title="Band QR & share card"
              subtitle="Share the band anywhere"
              to="/identity/qr"
            />
            <Row
              title="Band verification"
              subtitle="Confirm the group is a real working act"
              to="/verification"
            />
            <Row
              title="Shows & availability"
              subtitle="Managed with Booking"
              to="/provider/availability"
            />
            <Card className="space-y-3">
              <h2 className="text-sm">Ownership</h2>
              <p className="text-1 text-muted-foreground">
                Only the owner can transfer ownership or delete the band.
              </p>
              <Btn variant="outline" className="w-full" onClick={() => setTransfer(true)}>
                Transfer Ownership
              </Btn>
              <Btn variant="ghost" className="w-full" onClick={() => setDeleting(true)}>
                Delete Band
              </Btn>
            </Card>
          </>
        ) : null}
      </div>

      <Dialog
        open={!!removing}
        title="Remove this member?"
        body="They stay on MusicLinkd with their own profile, but will no longer appear in this line-up."
        onClose={() => setRemoving(null)}
      >
        <Btn onClick={() => setRemoving(null)}>Remove Member</Btn>
        <Btn variant="outline" onClick={() => setRemoving(null)}>
          Keep Member
        </Btn>
      </Dialog>
      <Dialog
        open={transfer}
        title="Transfer ownership"
        body="Pick an admin to become the new owner. You stay in the band as an admin."
        onClose={() => setTransfer(false)}
      >
        <Btn onClick={() => setTransfer(false)}>Choose an Admin</Btn>
        <Btn variant="outline" onClick={() => setTransfer(false)}>
          Cancel
        </Btn>
      </Dialog>
      <Dialog
        open={deleting}
        title="Delete this band?"
        body="The band profile, shows and shared work links are removed. Individual member profiles are untouched."
        onClose={() => setDeleting(false)}
      >
        <Btn onClick={() => setDeleting(false)}>Delete Band</Btn>
        <Btn variant="outline" onClick={() => setDeleting(false)}>
          Cancel
        </Btn>
      </Dialog>
    </Screen>
  );
}

function RolesCard() {
  return (
    <Card>
      <h2 className="text-sm">Roles & permissions</h2>
      <div className="mt-3 space-y-3">
        {(Object.keys(bandRoleCopy) as BandRole[]).map((r) => (
          <div key={r}>
            <p className="text-1 font-semibold">{bandRoleCopy[r].label}</p>
            <p className="text-1 text-muted-foreground">{bandRoleCopy[r].blurb}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
